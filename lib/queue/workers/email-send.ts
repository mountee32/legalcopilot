/**
 * Email Send Worker
 *
 * Processes email:send jobs — delivers outbound emails via Microsoft Graph API.
 * Enqueued by the approval executor after email.send approval is granted.
 *
 * Flow:
 *  1. Load email + validate status
 *  2. Resolve email account for sender
 *  3. Build Graph message
 *  4. Send via Graph API
 *  5. Update status → delivered (or failed on error)
 */

import { Worker, type Job } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emails, emailAccounts, approvalRequests } from "@/lib/db/schema";
import { sendEmail, AuthError, type GraphSendMessage } from "@/lib/email/graph-client";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import type { EmailSendJobData } from "@/lib/queue/email-send";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export async function processEmailSend(job: Job<EmailSendJobData>): Promise<void> {
  const { emailId, firmId, approvalRequestId } = job.data;

  // 1. Load email
  const [email] = await db
    .select()
    .from(emails)
    .where(and(eq(emails.id, emailId), eq(emails.firmId, firmId)))
    .limit(1);

  if (!email) {
    throw new Error(`Email ${emailId} not found for firm ${firmId}`);
  }

  // Skip if already delivered
  if (email.status === "delivered") {
    return;
  }

  if (email.status !== "sent") {
    throw new Error(`Email ${emailId} has unexpected status: ${email.status}`);
  }

  // 2. Resolve email account for sender
  const [account] = await db
    .select()
    .from(emailAccounts)
    .where(
      and(
        eq(emailAccounts.firmId, firmId),
        eq(emailAccounts.userId, email.createdBy!),
        eq(emailAccounts.status, "connected")
      )
    )
    .limit(1);

  if (!account) {
    await markEmailFailed(emailId, firmId, approvalRequestId, "No connected email account found");
    return;
  }

  // 3. Build Graph message
  const toAddresses = (email.toAddresses as Array<{ email: string; name?: string }>) || [];
  const ccAddresses = (email.ccAddresses as Array<{ email: string; name?: string }>) || [];
  const bccAddresses = (email.bccAddresses as Array<{ email: string; name?: string }>) || [];

  const graphMessage: GraphSendMessage = {
    subject: email.subject,
    body: {
      contentType: email.bodyHtml ? "HTML" : "Text",
      content: email.bodyHtml || email.bodyText || "",
    },
    toRecipients: toAddresses.map((a) => ({
      emailAddress: { name: a.name, address: a.email },
    })),
    ccRecipients: ccAddresses.map((a) => ({
      emailAddress: { name: a.name, address: a.email },
    })),
    bccRecipients: bccAddresses.map((a) => ({
      emailAddress: { name: a.name, address: a.email },
    })),
  };

  // For replies, include original messageId for threading
  if (email.inReplyTo) {
    graphMessage.internetMessageId = email.inReplyTo;
  }

  // 4. Send via Graph API
  try {
    await sendEmail(account, graphMessage);
  } catch (err) {
    if (err instanceof AuthError) {
      await markEmailFailed(emailId, firmId, approvalRequestId, err.message);
      return; // Don't retry auth errors
    }
    // Let BullMQ retry transient errors
    throw err;
  }

  // 5. Update status → delivered
  const messageId = `<${randomUUID()}@${account.emailAddress.split("@")[1] || "legalcopilot.app"}>`;

  await db
    .update(emails)
    .set({
      status: "delivered",
      messageId,
      updatedAt: new Date(),
    })
    .where(and(eq(emails.id, emailId), eq(emails.firmId, firmId)));

  // 6. Create timeline event if linked to a matter
  if (email.matterId) {
    await createTimelineEvent(db, {
      firmId,
      matterId: email.matterId,
      type: "email_sent",
      title: "Email delivered",
      actorType: "system",
      actorId: null,
      entityType: "email",
      entityId: emailId,
      occurredAt: new Date(),
      metadata: { approvalRequestId, messageId },
    });
  }
}

async function markEmailFailed(
  emailId: string,
  firmId: string,
  approvalRequestId: string,
  error: string
): Promise<void> {
  await db
    .update(emails)
    .set({ status: "failed", updatedAt: new Date() })
    .where(and(eq(emails.id, emailId), eq(emails.firmId, firmId)));

  await db
    .update(approvalRequests)
    .set({ executionStatus: "failed", executionError: error, updatedAt: new Date() })
    .where(eq(approvalRequests.id, approvalRequestId));
}

// ---------------------------------------------------------------------------
// Start worker (when imported as a standalone process)
// ---------------------------------------------------------------------------

export const emailSendWorker = new Worker<EmailSendJobData>("email:send", processEmailSend, {
  connection,
  concurrency: 2,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 30000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});
