import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, jobs } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { summarizeDocument } from "@/lib/documents/summarize";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export const POST = withErrorHandler(
  withAuth(
    withPermission("documents:write")(
      withPermission("ai:use")(async (request, { params, user }) => {
        const id = params ? (await params).id : undefined;
        if (!id) throw new NotFoundError("Document not found");

        if (!process.env.OPENROUTER_API_KEY) {
          throw new ValidationError("OPENROUTER_API_KEY is not configured");
        }

        const url = new URL(request.url);
        const async = url.searchParams.get("async") === "true";

        const firmId = await getOrCreateFirmIdForUser(user.user.id);

        if (async) {
          const jobId = await withFirmDb(firmId, async (tx) => {
            const [job] = await tx
              .insert(jobs)
              .values({
                name: "document:summarize",
                data: { firmId, documentId: id, requestedBy: user.user.id },
                status: "pending",
                updatedAt: new Date(),
              })
              .returning({ id: jobs.id });

            if (!job) throw new ValidationError("Failed to create job");

            const { addGenericJob } = await import("@/lib/queue");
            await addGenericJob("document:summarize", {
              type: "document:summarize",
              data: { firmId, documentId: id, jobId: job.id },
            });

            return job.id;
          });

          return NextResponse.json({ accepted: true, jobId }, { status: 202 });
        }

        const result = await withFirmDb(firmId, async (tx) => {
          const [doc] = await tx
            .select({
              matterId: documents.matterId,
              type: documents.type,
              extractedText: documents.extractedText,
            })
            .from(documents)
            .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
            .limit(1);

          if (!doc) throw new NotFoundError("Document not found");
          if (!doc.extractedText)
            throw new ValidationError("Document has no extracted text to summarize");

          const summary = await summarizeDocument({
            extractedText: doc.extractedText,
            documentType: doc.type,
          });

          await tx
            .update(documents)
            .set({ aiSummary: summary.summary, updatedAt: new Date() })
            .where(and(eq(documents.id, id), eq(documents.firmId, firmId)));

          await createTimelineEvent(tx, {
            firmId,
            matterId: doc.matterId,
            type: "document_summarized",
            title: "Document summarized",
            actorType: "ai",
            actorId: null,
            entityType: "document",
            entityId: id,
            occurredAt: new Date(),
            metadata: { triggeredBy: user.user.id, keyPointsCount: summary.keyPoints?.length ?? 0 },
          });

          return summary;
        });

        return NextResponse.json({
          success: true,
          summary: result.summary,
          keyPoints: result.keyPoints ?? [],
        });
      })
    )
  )
);
