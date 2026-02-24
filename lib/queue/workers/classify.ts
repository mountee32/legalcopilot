/**
 * Pipeline Stage 3 — Classification Worker
 *
 * Loads the matter's taxonomy pack, builds a classification prompt from
 * taxonomy document types and prompt templates, calls the LLM to classify
 * the document, and stores the result on the pipeline run.
 *
 * Low-confidence classifications are flagged for human review.
 */

import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, tasks } from "@/lib/db/schema";
import { loadPackForMatter } from "@/lib/pipeline/taxonomy-loader";
import { buildClassificationPrompt } from "@/lib/pipeline/prompts";
import { callAi, AiClientError } from "@/lib/pipeline/ai-client";
import type { PipelineJobData } from "../pipeline";
import { advanceToNextStage, STAGE_CONFIG } from "../pipeline";
import { markStageRunning, markStageCompleted, markPipelineFailed } from "./pipeline-helpers";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const LOW_CONFIDENCE_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const classifyWorker = new Worker<PipelineJobData>(
  "pipeline:classify",
  async (job: Job<PipelineJobData>) => {
    const { pipelineRunId, firmId, matterId, documentId } = job.data;

    await markStageRunning(pipelineRunId, "classify");

    // 1. Load document text
    const [doc] = await db
      .select({
        extractedText: documents.extractedText,
        mimeType: documents.mimeType,
        filename: documents.filename,
      })
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!doc?.extractedText) {
      await markPipelineFailed(pipelineRunId, "classify", "No extracted text available");
      return;
    }

    // 2. Load taxonomy pack for this matter
    const loaded = await loadPackForMatter(firmId, matterId);

    if (!loaded || loaded.documentTypes.length === 0) {
      // No taxonomy pack — skip classification, still advance
      await markStageCompleted(pipelineRunId, "classify");
      await advanceToNextStage("classify", job.data);
      return;
    }

    // 3. Find the classification prompt template
    const classificationTemplate =
      loaded.promptTemplates.find((t) => t.templateType === "classification") || null;

    // 4. Build prompt
    const prompt = buildClassificationPrompt({
      documentTypes: loaded.documentTypes,
      template: classificationTemplate,
      textSample: doc.extractedText,
      mimeType: doc.mimeType || undefined,
      filename: doc.filename || undefined,
    });

    // 5. Call LLM with centralized AI client (timeout, retry, rate limit)
    let classifiedDocType: string | null = null;
    let confidence = 0;
    let tokensUsed = 0;

    try {
      const result = await callAi({
        model: prompt.model,
        messages: [
          { role: "system", content: prompt.systemPrompt },
          { role: "user", content: prompt.userPrompt },
        ],
        temperature: prompt.temperature,
        maxTokens: prompt.maxTokens,
        responseFormat: { type: "json_object" },
        timeoutMs: STAGE_CONFIG.classify.timeoutMs,
      });

      tokensUsed = result.tokensUsed;
      const parsed = JSON.parse(result.content);
      classifiedDocType = parsed.documentType || null;
      confidence = parsed.confidence || 0;
    } catch (err) {
      // Graceful degradation: if AI fails, skip classification and continue pipeline
      if (err instanceof AiClientError && err.isRetryable) {
        console.warn(
          `[classify] AI call failed (retryable), skipping classification: ${err.message}`
        );
        await markStageCompleted(pipelineRunId, "classify");
        await advanceToNextStage("classify", job.data);
        return;
      }
      const message = err instanceof Error ? err.message : "Classification failed";
      await markPipelineFailed(pipelineRunId, "classify", message);
      return;
    }

    // 6. Low-confidence fallback: create a task for human review
    if (classifiedDocType && confidence < LOW_CONFIDENCE_THRESHOLD) {
      try {
        await db.insert(tasks).values({
          firmId,
          matterId,
          title: `Review document classification (confidence: ${(confidence * 100).toFixed(0)}%)`,
          description: `The pipeline classified a document as "${classifiedDocType}" with low confidence (${(confidence * 100).toFixed(1)}%). Please review and correct if needed.`,
          status: "pending",
          priority: "high",
        });
      } catch {
        // Non-critical — don't fail the pipeline for task creation issues
      }
    }

    // 7. Complete classification stage
    await markStageCompleted(pipelineRunId, "classify", {
      classifiedDocType: classifiedDocType || undefined,
      classificationConfidence: confidence ? confidence.toFixed(3) : undefined,
      taxonomyPackId: loaded.pack.id,
      totalTokensUsed: tokensUsed,
    });

    // 8. Advance to extraction
    await advanceToNextStage("classify", job.data);
  },
  {
    connection,
    concurrency: STAGE_CONFIG.classify.concurrency,
  }
);

classifyWorker.on("completed", (job) => {
  console.log(`Pipeline classify completed: ${job.id}`);
});

classifyWorker.on("failed", (job, err) => {
  console.error(`Pipeline classify failed: ${job?.id}`, err);
});
