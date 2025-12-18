/**
 * Document Analysis API Endpoint
 *
 * Uses Gemini Flash to analyze PDF documents and extract:
 * - Document type classification
 * - Parties involved
 * - Key dates
 * - Summary
 *
 * POST /api/documents/[id]/analyze
 * POST /api/documents/[id]/analyze?async=true (background processing)
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, uploads, jobs } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { analyzeDocument } from "@/lib/documents/analyze";
import { downloadFile } from "@/lib/storage/minio";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { AnalyzeDocumentRequestSchema } from "@/lib/api/schemas";

export const POST = withErrorHandler(
  withAuth(
    withPermission("documents:write")(
      withPermission("ai:use")(async (request, { params, user }) => {
        const id = params ? (await params).id : undefined;
        if (!id) throw new NotFoundError("Document not found");

        if (!process.env.OPENROUTER_API_KEY) {
          throw new ValidationError("OPENROUTER_API_KEY is not configured");
        }

        // Parse request body
        const body = await request.json().catch(() => ({}));
        const data = AnalyzeDocumentRequestSchema.parse(body);

        const url = new URL(request.url);
        const async = url.searchParams.get("async") === "true";

        const firmId = await getOrCreateFirmIdForUser(user.user.id);

        // Async mode - queue job for background processing
        if (async) {
          const jobId = await withFirmDb(firmId, async (tx) => {
            const [job] = await tx
              .insert(jobs)
              .values({
                name: "document:analyze",
                data: { firmId, documentId: id, requestedBy: user.user.id, force: data.force },
                status: "pending",
                updatedAt: new Date(),
              })
              .returning({ id: jobs.id });

            if (!job) throw new ValidationError("Failed to create job");

            const { addGenericJob } = await import("@/lib/queue");
            await addGenericJob("document:analyze", {
              type: "document:analyze",
              data: { firmId, documentId: id, jobId: job.id, force: data.force },
            });

            return job.id;
          });

          return NextResponse.json({ accepted: true, jobId }, { status: 202 });
        }

        // Synchronous mode - analyze immediately
        const result = await withFirmDb(firmId, async (tx) => {
          // Fetch document with upload info
          const [doc] = await tx
            .select({
              id: documents.id,
              matterId: documents.matterId,
              uploadId: documents.uploadId,
              analyzedAt: documents.analyzedAt,
            })
            .from(documents)
            .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
            .limit(1);

          if (!doc) throw new NotFoundError("Document not found");

          // Return cached result if already analyzed (unless force=true)
          if (doc.analyzedAt && !data.force) {
            const [cachedDoc] = await tx
              .select({
                title: documents.title,
                type: documents.type,
                documentDate: documents.documentDate,
                aiSummary: documents.aiSummary,
                aiConfidence: documents.aiConfidence,
                extractedParties: documents.extractedParties,
                extractedDates: documents.extractedDates,
                aiTokensUsed: documents.aiTokensUsed,
                aiModel: documents.aiModel,
              })
              .from(documents)
              .where(eq(documents.id, id))
              .limit(1);

            if (cachedDoc) {
              const confidence = cachedDoc.aiConfidence ?? 0;
              const confidenceLevel =
                confidence >= 80 ? "green" : confidence >= 50 ? "amber" : "red";

              return {
                analysis: {
                  suggestedTitle: cachedDoc.title,
                  documentType: cachedDoc.type ?? "other",
                  documentDate: cachedDoc.documentDate?.toISOString().split("T")[0] ?? null,
                  parties:
                    (cachedDoc.extractedParties as Array<{ name: string; role: string }>) ?? [],
                  keyDates:
                    (cachedDoc.extractedDates as Array<{ label: string; date: string }>) ?? [],
                  summary: cachedDoc.aiSummary ?? "",
                  confidence,
                  confidenceLevel,
                },
                usage: {
                  tokensUsed: cachedDoc.aiTokensUsed ?? 0,
                  model: cachedDoc.aiModel ?? "unknown",
                },
                cached: true,
              };
            }
          }

          if (!doc.uploadId) {
            throw new ValidationError("Document has no uploaded file to analyze");
          }

          // Get upload record for file path
          const [upload] = await tx
            .select({
              bucket: uploads.bucket,
              path: uploads.path,
            })
            .from(uploads)
            .where(eq(uploads.id, doc.uploadId))
            .limit(1);

          if (!upload) {
            throw new ValidationError("Upload record not found");
          }

          // Download PDF from MinIO
          const pdfBuffer = await downloadFile(upload.bucket, upload.path);

          // Analyze with Gemini Flash
          const analysis = await analyzeDocument(pdfBuffer);

          // Save results to document
          await tx
            .update(documents)
            .set({
              title: analysis.suggestedTitle,
              type: analysis.documentType,
              documentDate: analysis.documentDate ? new Date(analysis.documentDate) : null,
              aiSummary: analysis.summary,
              aiConfidence: analysis.confidence,
              extractedParties: analysis.parties,
              extractedDates: analysis.keyDates,
              analyzedAt: new Date(),
              aiTokensUsed: analysis.tokensUsed,
              aiModel: analysis.model,
              updatedAt: new Date(),
            })
            .where(and(eq(documents.id, id), eq(documents.firmId, firmId)));

          // Create timeline event (only if document has a matter)
          if (doc.matterId) {
            await createTimelineEvent(tx, {
              firmId,
              matterId: doc.matterId,
              type: "document_analyzed",
              title: "Document analyzed by AI",
              actorType: "ai",
              actorId: null,
              entityType: "document",
              entityId: id,
              occurredAt: new Date(),
              metadata: {
                triggeredBy: user.user.id,
                confidence: analysis.confidence,
                confidenceLevel: analysis.confidenceLevel,
                documentType: analysis.documentType,
                partiesCount: analysis.parties.length,
                keyDatesCount: analysis.keyDates.length,
              },
            });
          }

          return {
            analysis: {
              suggestedTitle: analysis.suggestedTitle,
              documentType: analysis.documentType,
              documentDate: analysis.documentDate,
              parties: analysis.parties,
              keyDates: analysis.keyDates,
              summary: analysis.summary,
              confidence: analysis.confidence,
              confidenceLevel: analysis.confidenceLevel,
            },
            usage: {
              tokensUsed: analysis.tokensUsed,
              model: analysis.model,
            },
            cached: false,
          };
        });

        return NextResponse.json({
          success: true,
          ...result,
        });
      })
    )
  )
);
