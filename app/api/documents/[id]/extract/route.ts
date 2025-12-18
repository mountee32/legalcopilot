import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, jobs, uploads } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ExtractDocumentRequestSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { downloadFile } from "@/lib/storage/minio";
import { extractTextFromBuffer } from "@/lib/documents/extraction";
import { rechunkDocumentTx } from "@/lib/documents/rechunk";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export const POST = withErrorHandler(
  withAuth(
    withPermission("documents:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Document not found");

      const body = await request.json().catch(() => ({}));
      const data = ExtractDocumentRequestSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      if (data.async) {
        const jobId = await withFirmDb(firmId, async (tx) => {
          const [job] = await tx
            .insert(jobs)
            .values({
              name: "document:extract",
              data: {
                firmId,
                documentId: id,
                requestedBy: user.user.id,
                autoChunk: data.autoChunk,
              },
              status: "pending",
              updatedAt: new Date(),
            })
            .returning({ id: jobs.id });

          if (!job) throw new ValidationError("Failed to create job");

          const { addGenericJob } = await import("@/lib/queue");
          await addGenericJob("document:extract", {
            type: "document:extract",
            data: {
              firmId,
              documentId: id,
              jobId: job.id,
              autoChunk: data.autoChunk,
              maxChars: data.maxChars,
            },
          });

          return job.id;
        });

        return NextResponse.json({ accepted: true, jobId }, { status: 202 });
      }

      const result = await withFirmDb(firmId, async (tx) => {
        const [doc] = await tx
          .select({
            id: documents.id,
            matterId: documents.matterId,
            extractedText: documents.extractedText,
            uploadId: documents.uploadId,
            filename: documents.filename,
            mimeType: documents.mimeType,
          })
          .from(documents)
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
          .limit(1);

        if (!doc) throw new NotFoundError("Document not found");

        if (doc.extractedText && !data.force) {
          return { extractedText: doc.extractedText, chunkCount: null as number | null };
        }

        if (!doc.uploadId) {
          throw new ValidationError("Document has no upload to extract from");
        }

        const [upload] = await tx
          .select({
            id: uploads.id,
            bucket: uploads.bucket,
            path: uploads.path,
            mimeType: uploads.mimeType,
            originalName: uploads.originalName,
          })
          .from(uploads)
          .where(eq(uploads.id, doc.uploadId))
          .limit(1);

        if (!upload) {
          throw new ValidationError("Upload not found for document");
        }

        const buffer = await downloadFile(upload.bucket, upload.path);
        const extractedText = await extractTextFromBuffer({
          buffer,
          mimeType: upload.mimeType ?? doc.mimeType,
          filename: upload.originalName ?? doc.filename,
        });

        if (!extractedText) throw new ValidationError("No text extracted");

        await tx
          .update(documents)
          .set({ extractedText, updatedAt: new Date() })
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)));

        await createTimelineEvent(tx, {
          firmId,
          matterId: doc.matterId,
          type: "document_extracted",
          title: "Document text extracted",
          actorType: "system",
          actorId: null,
          entityType: "document",
          entityId: id,
          occurredAt: new Date(),
          metadata: { triggeredBy: user.user.id },
        });

        let chunkCount: number | null = null;
        const autoChunk = data.autoChunk ?? true;
        if (autoChunk) {
          chunkCount = await rechunkDocumentTx(tx, {
            firmId,
            documentId: id,
            matterId: doc.matterId,
            extractedText,
            maxChars: data.maxChars ?? 1200,
          });
        }

        return { extractedText, chunkCount };
      });

      return NextResponse.json({
        success: true,
        extractedText: result.extractedText,
        length: result.extractedText.length,
        chunkCount: result.chunkCount,
      });
    })
  )
);
