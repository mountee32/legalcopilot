/**
 * Pipeline Stage 1 — Intake Worker
 *
 * Validates uploaded document, computes SHA-256 for dedup,
 * checks MIME type support, and attempts sender matching.
 */

import { Worker, Job } from "bullmq";
import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, pipelineRuns } from "@/lib/db/schema";
import { downloadFile } from "@/lib/storage/minio";
import type { PipelineJobData } from "../pipeline";
import { advanceToNextStage, STAGE_CONFIG } from "../pipeline";
import { markStageRunning, markStageCompleted, markPipelineFailed } from "./pipeline-helpers";

// ---------------------------------------------------------------------------
// Supported MIME types for pipeline processing
// ---------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/html",
  "text/csv",
  "application/json",
  "application/xml",
  "image/tiff",
  "image/png",
  "image/jpeg",
]);

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const intakeWorker = new Worker<PipelineJobData>(
  "pipeline:intake",
  async (job: Job<PipelineJobData>) => {
    const { pipelineRunId, documentId } = job.data;

    await markStageRunning(pipelineRunId, "intake");

    // 1. Load document metadata
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));

    if (!doc) {
      await markPipelineFailed(pipelineRunId, "intake", "Document not found");
      return;
    }

    // 2. MIME type validation
    const mimeType = doc.mimeType || "application/octet-stream";
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      await markPipelineFailed(pipelineRunId, "intake", `Unsupported MIME type: ${mimeType}`);
      return;
    }

    // 3. Download file and compute SHA-256
    let fileBuffer: Buffer;
    try {
      const bucket = "uploads";
      const path = doc.uploadId || doc.filename || doc.id;
      fileBuffer = await downloadFile(bucket, path);
    } catch {
      await markPipelineFailed(pipelineRunId, "intake", "Failed to download document from storage");
      return;
    }

    const hash = createHash("sha256").update(fileBuffer).digest("hex");

    // 4. Dedup: check if another completed run exists for same hash + matter
    const [existing] = await db
      .select({ id: pipelineRuns.id })
      .from(pipelineRuns)
      .where(
        and(
          eq(pipelineRuns.matterId, doc.matterId!),
          eq(pipelineRuns.documentHash, hash),
          eq(pipelineRuns.status, "completed")
        )
      )
      .limit(1);

    if (existing && existing.id !== pipelineRunId) {
      await markPipelineFailed(
        pipelineRunId,
        "intake",
        `Duplicate document detected (matches run ${existing.id})`
      );
      return;
    }

    // 5. Complete intake stage
    await markStageCompleted(pipelineRunId, "intake", {
      documentHash: hash,
    });

    // 6. Advance to OCR
    await advanceToNextStage("intake", job.data);
  },
  {
    connection,
    concurrency: STAGE_CONFIG.intake.concurrency,
  }
);

intakeWorker.on("completed", (job) => {
  console.log(`Pipeline intake completed: ${job.id}`);
});

intakeWorker.on("failed", (job, err) => {
  console.error(`Pipeline intake failed: ${job?.id}`, err);
});
