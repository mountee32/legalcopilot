import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, matters, pipelineRuns } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateDocumentSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { startPipeline } from "@/lib/queue/pipeline";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { user }) => {
    const url = new URL(request.url);
    const matterId = url.searchParams.get("matterId");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const where = matterId
      ? and(eq(documents.firmId, firmId), eq(documents.matterId, matterId))
      : eq(documents.firmId, firmId);

    const rows = await withFirmDb(firmId, (tx) =>
      tx.select().from(documents).where(where).orderBy(documents.createdAt)
    );
    return NextResponse.json({ documents: rows });
  })
);

export const POST = withErrorHandler(
  withAuth(async (request, { user }) => {
    const body = await request.json();
    const data = CreateDocumentSchema.parse(body);

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const doc = await withFirmDb(firmId, async (tx) => {
      // Only validate matter exists if matterId is provided
      if (data.matterId) {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");
      }

      const [doc] = await tx
        .insert(documents)
        .values({
          firmId,
          matterId: data.matterId ?? null,
          title: data.title,
          type: data.type,
          status: "draft",
          uploadId: data.uploadId ?? null,
          filename: data.filename ?? null,
          mimeType: data.mimeType ?? null,
          fileSize: data.fileSize ?? null,
          createdBy: user.user.id,
          documentDate: data.documentDate ? new Date(data.documentDate) : null,
          recipient: data.recipient ?? null,
          sender: data.sender ?? null,
          extractedText: data.extractedText ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      // Only create timeline event if document is assigned to a matter
      if (doc.matterId) {
        await createTimelineEvent(tx, {
          firmId,
          matterId: doc.matterId,
          type: "document_uploaded",
          title: "Document uploaded",
          actorType: "user",
          actorId: user.user.id,
          entityType: "document",
          entityId: doc.id,
          occurredAt: new Date(),
          metadata: { title: doc.title, mimeType: doc.mimeType, filename: doc.filename },
        });
      }

      // Trigger document processing pipeline if document has a matter
      if (doc.matterId) {
        const [run] = await tx
          .insert(pipelineRuns)
          .values({
            firmId,
            matterId: doc.matterId,
            documentId: doc.id,
            status: "queued",
            triggeredBy: user.user.id,
          })
          .returning();

        await createTimelineEvent(tx, {
          firmId,
          matterId: doc.matterId,
          type: "pipeline_started",
          title: "Document pipeline started",
          actorType: "system",
          entityType: "pipeline_run",
          entityId: run.id,
          occurredAt: new Date(),
          metadata: { documentId: doc.id, documentTitle: doc.title },
        });

        // Enqueue outside the transaction to avoid holding it open
        // The pipeline run exists in DB so even if enqueue fails the run is retryable
        startPipeline({
          pipelineRunId: run.id,
          firmId,
          matterId: doc.matterId,
          documentId: doc.id,
          triggeredBy: user.user.id,
        }).catch((err) => {
          console.error("Failed to enqueue pipeline job:", err);
        });
      }

      return doc;
    });

    return NextResponse.json(doc, { status: 201 });
  })
);
