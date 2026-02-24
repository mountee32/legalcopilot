/**
 * GET /api/email-imports/[id]  — single import detail
 * PATCH /api/email-imports/[id] — manually route an unmatched import
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
  emailImports,
  emailAccounts,
  emails,
  documents,
  pipelineRuns,
  timelineEvents,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";
import { RouteEmailImportSchema } from "@/lib/api/schemas/email-imports";
import { fetchAttachments } from "@/lib/email/graph-client";
import { uploadFile } from "@/lib/storage/minio";
import { startPipeline } from "@/lib/queue/pipeline";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Email import ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const result = await withFirmDb(firmId, async (tx) => {
      const [record] = await tx
        .select()
        .from(emailImports)
        .where(and(eq(emailImports.id, id), eq(emailImports.firmId, firmId)))
        .limit(1);

      if (!record) throw new NotFoundError("Email import not found");
      return record;
    });

    return NextResponse.json(result);
  })
);

export const PATCH = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Email import ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = await request.json();
    const { matterId } = RouteEmailImportSchema.parse(body);

    const result = await withFirmDb(firmId, async (tx) => {
      const [record] = await tx
        .select()
        .from(emailImports)
        .where(and(eq(emailImports.id, id), eq(emailImports.firmId, firmId)))
        .limit(1);

      if (!record) throw new NotFoundError("Email import not found");

      if (record.status !== "unmatched") {
        throw new ValidationError("Only unmatched imports can be manually routed");
      }

      // Process attachments if the original email had any
      const documentIds: string[] = [];
      const pipelineRunIds: string[] = [];

      if (record.attachmentCount > 0 && record.emailId) {
        try {
          const [account] = await tx
            .select()
            .from(emailAccounts)
            .where(eq(emailAccounts.id, record.emailAccountId))
            .limit(1);

          if (account) {
            const attachments = await fetchAttachments(account, record.externalMessageId);

            for (const att of attachments) {
              const buffer = Buffer.from(att.contentBytes, "base64");
              const storagePath = `${firmId}/${matterId}/email-attachments/${Date.now()}-${att.name}`;
              await uploadFile("uploads", storagePath, buffer, att.contentType);

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
                  uploadedBy: user.user.id,
                })
                .returning();

              documentIds.push(doc.id);

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
                  triggeredBy: user.user.id,
                })
                .returning();

              pipelineRunIds.push(run.id);

              await startPipeline({
                pipelineRunId: run.id,
                firmId,
                matterId,
                documentId: doc.id,
                triggeredBy: user.user.id,
              });
            }
          }
        } catch (err) {
          console.error("[email-imports] Attachment processing on route:", (err as Error).message);
        }
      }

      // Update email record with matter link
      if (record.emailId) {
        await tx
          .update(emails)
          .set({ matterId, updatedAt: new Date() })
          .where(eq(emails.id, record.emailId));
      }

      // Update import record
      const [updated] = await tx
        .update(emailImports)
        .set({
          matterId,
          matchMethod: "manual",
          matchConfidence: "100",
          status: documentIds.length > 0 ? "completed" : "matched",
          documentsCreated: documentIds.length > 0 ? documentIds : null,
          pipelineRunIds: pipelineRunIds.length > 0 ? pipelineRunIds : null,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailImports.id, id))
        .returning();

      // Timeline event
      await tx.insert(timelineEvents).values({
        firmId,
        matterId,
        type: "email_import_completed",
        title: `Email manually routed: ${record.subject}`,
        description: `From: ${record.fromAddress}. Manually routed by ${user.user.name || user.user.email}.`,
        actorType: "user",
        actorId: user.user.id,
        entityType: "email_import",
        entityId: id,
        occurredAt: new Date(),
      });

      return updated;
    });

    return NextResponse.json(result);
  })
);
