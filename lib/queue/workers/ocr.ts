/**
 * Pipeline Stage 2 — OCR Worker
 *
 * Extracts text from the document. For text-based formats (PDF, DOCX, plain text)
 * uses the existing extraction.ts. For images (TIFF, PNG, JPEG), applies OCR.
 * Stores extracted text on the document record.
 */

import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { downloadFile } from "@/lib/storage/minio";
import { extractTextFromBuffer } from "@/lib/documents/extraction";
import { callAi } from "@/lib/pipeline/ai-client";
import type { PipelineJobData } from "../pipeline";
import { advanceToNextStage, STAGE_CONFIG } from "../pipeline";
import { markStageRunning, markStageCompleted, markPipelineFailed } from "./pipeline-helpers";

// ---------------------------------------------------------------------------
// Image MIME types that require OCR
// ---------------------------------------------------------------------------

const IMAGE_MIME_TYPES = new Set(["image/tiff", "image/png", "image/jpeg"]);

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const ocrWorker = new Worker<PipelineJobData>(
  "pipeline:ocr",
  async (job: Job<PipelineJobData>) => {
    const { pipelineRunId, documentId } = job.data;

    await markStageRunning(pipelineRunId, "ocr");

    // 1. Load document
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));

    if (!doc) {
      await markPipelineFailed(pipelineRunId, "ocr", "Document not found");
      return;
    }

    // 2. If text already extracted, skip OCR
    if (doc.extractedText && doc.extractedText.trim().length > 0) {
      await markStageCompleted(pipelineRunId, "ocr");
      await advanceToNextStage("ocr", job.data);
      return;
    }

    // 3. Download file
    let fileBuffer: Buffer;
    try {
      const bucket = "uploads";
      const path = doc.uploadId || doc.filename || doc.id;
      fileBuffer = await downloadFile(bucket, path);
    } catch {
      await markPipelineFailed(pipelineRunId, "ocr", "Failed to download document from storage");
      return;
    }

    // 4. Extract text
    const mimeType = doc.mimeType || "application/octet-stream";
    let extractedText: string;

    try {
      if (IMAGE_MIME_TYPES.has(mimeType)) {
        // For images, attempt OCR via AI vision model
        extractedText = await ocrImage(fileBuffer, mimeType);
      } else {
        // For text-based formats, use existing extraction
        extractedText = await extractTextFromBuffer({
          buffer: fileBuffer,
          mimeType,
          filename: doc.filename,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown extraction error";
      await markPipelineFailed(pipelineRunId, "ocr", `Text extraction failed: ${message}`);
      return;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      await markPipelineFailed(pipelineRunId, "ocr", "No text could be extracted from document");
      return;
    }

    // 5. Store extracted text on document
    await db
      .update(documents)
      .set({ extractedText, updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    // 6. Complete OCR stage
    await markStageCompleted(pipelineRunId, "ocr");

    // 7. Advance to classify
    await advanceToNextStage("ocr", job.data);
  },
  {
    connection,
    concurrency: STAGE_CONFIG.ocr.concurrency,
  }
);

// ---------------------------------------------------------------------------
// OCR via AI vision — uses centralized AI client with timeout + retry
// ---------------------------------------------------------------------------

async function ocrImage(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await callAi({
    model: process.env.OCR_MODEL || "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUri },
          },
          {
            type: "text",
            text: "Extract all text from this document image. Preserve the original structure, paragraphs, and formatting as closely as possible. Return only the extracted text, nothing else.",
          },
        ],
      },
    ],
    maxTokens: 4096,
    timeoutMs: STAGE_CONFIG.ocr.timeoutMs,
  });

  return result.content;
}

ocrWorker.on("completed", (job) => {
  console.log(`Pipeline OCR completed: ${job.id}`);
});

ocrWorker.on("failed", (job, err) => {
  console.error(`Pipeline OCR failed: ${job?.id}`, err);
});
