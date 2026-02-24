/**
 * Email Poll Worker
 *
 * Runs on the email:poll queue, processes one connected email account per job.
 * For each new message:
 *   1. Dedup by externalMessageId
 *   2. Match to matter via matter-matcher
 *   3. Create emails record (AI Inbox)
 *   4. If matched + has attachments: upload to MinIO, create documents, start pipeline
 *   5. Create email_imports audit record
 *   6. Create timeline event + notification
 *   7. Update account.lastSyncAt
 */

import { Worker } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  emailAccounts,
  emails,
  emailImports,
  documents,
  pipelineRuns,
  timelineEvents,
  notifications,
} from "@/lib/db/schema";
import {
  fetchNewMessages,
  fetchAttachments,
  markAsRead,
  AuthError,
} from "@/lib/email/graph-client";
import { matchEmailToMatter } from "@/lib/email/matter-matcher";
import { startPipeline } from "@/lib/queue/pipeline";
import { uploadFile } from "@/lib/storage/minio";
import type { EmailPollJobData } from "@/lib/queue/email-poll";
import type { GraphMessage, GraphAttachment } from "@/lib/email/graph-client";

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const emailPollWorker = new Worker<EmailPollJobData>(
  "email:poll",
  async (job) => {
    const { emailAccountId, firmId } = job.data;

    // Load account
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, emailAccountId), eq(emailAccounts.firmId, firmId)))
      .limit(1);

    if (!account || account.status !== "connected") {
      return { skipped: true, reason: "Account not found or not connected" };
    }

    // Determine sync window
    const since = account.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch messages from Graph API
    let messages: GraphMessage[];
    try {
      messages = await fetchNewMessages(account, since);
    } catch (err) {
      if (err instanceof AuthError) {
        // Account already marked as error by graph-client
        return { error: "auth_failure", message: (err as Error).message };
      }
      throw err;
    }

    let processed = 0;
    let matched = 0;
    let errors = 0;

    // Process each message with per-message error isolation
    for (const message of messages) {
      try {
        await processMessage(firmId, account.id, account.userId, message, db);
        processed++;

        // Check if it was matched
        // (we increment matched inside processMessage logic indirectly — just count non-errors)
      } catch (err) {
        errors++;
        console.error(
          `[email:poll] Error processing message ${message.internetMessageId}:`,
          (err as Error).message
        );
      }
    }

    // Update lastSyncAt
    await db
      .update(emailAccounts)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(emailAccounts.id, emailAccountId));

    return { processed, errors, total: messages.length };
  },
  {
    connection,
    concurrency: 3,
  }
);

// ---------------------------------------------------------------------------
// Per-message processing
// ---------------------------------------------------------------------------

async function processMessage(
  firmId: string,
  emailAccountId: string,
  accountUserId: string,
  message: GraphMessage,
  tx: any
): Promise<void> {
  const externalMessageId = message.internetMessageId || message.id;

  // 1. Dedup: skip if already imported
  const [existing] = await tx
    .select({ id: emailImports.id })
    .from(emailImports)
    .where(
      and(eq(emailImports.firmId, firmId), eq(emailImports.externalMessageId, externalMessageId))
    )
    .limit(1);

  if (existing) return;

  // 2. Match to matter
  const fromAddr = message.from?.emailAddress?.address || "";
  const matchResult = await matchEmailToMatter(
    firmId,
    {
      fromAddress: fromAddr,
      subject: message.subject,
      bodyText: message.bodyPreview,
    },
    tx
  );

  const matterId = matchResult?.matterId || null;
  const matchMethod = matchResult?.method || null;
  const matchConfidence = matchResult?.confidence ?? null;

  // 3. Create emails record (AI Inbox)
  const [emailRecord] = await tx
    .insert(emails)
    .values({
      firmId,
      matterId,
      direction: "inbound",
      fromAddress: { name: message.from?.emailAddress?.name || "", address: fromAddr },
      toAddresses: [],
      subject: message.subject,
      bodyText: message.body?.content || message.bodyPreview || "",
      messageId: message.internetMessageId,
      threadId: message.conversationId,
      hasAttachments: message.hasAttachments,
      status: "received",
      receivedAt: new Date(message.receivedDateTime),
    })
    .returning();

  // 4. Handle attachments if matched
  const documentIds: string[] = [];
  const pipelineRunIds: string[] = [];

  if (matterId && message.hasAttachments) {
    try {
      const account = await tx
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, emailAccountId))
        .limit(1)
        .then((r: any[]) => r[0]);

      const attachments = await fetchAttachments(account, message.id);

      for (const att of attachments) {
        // Upload to MinIO
        const buffer = Buffer.from(att.contentBytes, "base64");
        const storagePath = `${firmId}/${matterId}/email-attachments/${Date.now()}-${att.name}`;
        await uploadFile("uploads", storagePath, buffer, att.contentType);

        // Create document record
        const [doc] = await tx
          .insert(documents)
          .values({
            firmId,
            matterId,
            title: att.name,
            fileName: att.name,
            mimeType: att.contentType,
            fileSizeBytes: att.size,
            storagePath,
            status: "pending_review",
            uploadedBy: accountUserId,
          })
          .returning();

        documentIds.push(doc.id);

        // Create pipeline run
        const [run] = await tx
          .insert(pipelineRuns)
          .values({
            firmId,
            matterId,
            documentId: doc.id,
            status: "queued",
            currentStage: "intake",
            stageStatuses: {},
            findingsCount: 0,
            actionsCount: 0,
            totalTokensUsed: 0,
            triggeredBy: accountUserId,
          })
          .returning();

        pipelineRunIds.push(run.id);

        // Start pipeline
        await startPipeline({
          pipelineRunId: run.id,
          firmId,
          matterId,
          documentId: doc.id,
          triggeredBy: accountUserId,
        });
      }
    } catch (err) {
      console.error(`[email:poll] Attachment processing error:`, (err as Error).message);
    }
  }

  // 5. Determine status
  let status: "completed" | "matched" | "unmatched" | "failed";
  if (matterId && documentIds.length > 0) {
    status = "completed";
  } else if (matterId) {
    status = "matched";
  } else {
    status = "unmatched";
  }

  // 6. Create email_imports audit record
  await tx.insert(emailImports).values({
    firmId,
    emailAccountId,
    externalMessageId,
    externalThreadId: message.conversationId,
    fromAddress: fromAddr,
    subject: message.subject,
    receivedAt: new Date(message.receivedDateTime),
    matterId,
    matchMethod,
    matchConfidence: matchConfidence !== null ? String(matchConfidence) : null,
    status,
    attachmentCount: message.hasAttachments ? documentIds.length : 0,
    documentsCreated: documentIds.length > 0 ? documentIds : null,
    pipelineRunIds: pipelineRunIds.length > 0 ? pipelineRunIds : null,
    emailId: emailRecord.id,
    processedAt: new Date(),
  });

  // 7. Timeline event (only if matched to a matter)
  if (matterId) {
    const eventType =
      status === "completed" || status === "matched"
        ? "email_import_completed"
        : "email_import_failed";

    await tx.insert(timelineEvents).values({
      firmId,
      matterId,
      type: eventType,
      title: `Email imported: ${message.subject}`,
      description: `From: ${fromAddr}. ${documentIds.length} attachments processed.`,
      actorType: "system",
      entityType: "email_import",
      entityId: emailRecord.id,
      occurredAt: new Date(),
    });

    // 8. Notification for the matter's fee earner
    await tx.insert(notifications).values({
      firmId,
      userId: accountUserId,
      type: "email_received",
      title: `New email on matter`,
      message: `Email from ${fromAddr}: ${message.subject}`,
      metadata: { matterId, emailId: emailRecord.id },
    });
  }

  // Mark as read in Graph
  try {
    const account = await tx
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, emailAccountId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (account) {
      await markAsRead(account, message.id);
    }
  } catch {
    // Non-critical — don't fail the import
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

emailPollWorker.on("completed", (job) => {
  console.log(`[email:poll] Completed account ${job.data.emailAccountId}:`, job.returnvalue);
});

emailPollWorker.on("failed", (job, err) => {
  console.error(`[email:poll] Failed account ${job?.data?.emailAccountId}:`, err.message);
});
