/**
 * Pipeline Stage 4 — Extraction Worker
 *
 * Chunks the document text with overlapping windows, builds extraction prompts
 * from the taxonomy pack's activated fields for the classified document type,
 * calls the LLM per chunk, deduplicates findings, scores confidence,
 * classifies impact, and stores everything in pipeline_findings.
 */

import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, pipelineRuns, pipelineFindings } from "@/lib/db/schema";
import { chunkTextOverlapping } from "@/lib/documents/chunking";
import { loadPackById } from "@/lib/pipeline/taxonomy-loader";
import { buildExtractionPrompt } from "@/lib/pipeline/prompts";
import { deduplicateFindings, classifyImpact, type RawFinding } from "@/lib/pipeline/findings";
import { callAi, AiClientError } from "@/lib/pipeline/ai-client";
import type { PipelineJobData } from "../pipeline";
import { advanceToNextStage, STAGE_CONFIG } from "../pipeline";
import { markStageRunning, markStageCompleted, markPipelineFailed } from "./pipeline-helpers";

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const extractWorker = new Worker<PipelineJobData>(
  "pipeline:extract",
  async (job: Job<PipelineJobData>) => {
    const { pipelineRunId, firmId, matterId, documentId } = job.data;

    await markStageRunning(pipelineRunId, "extract");

    // 1. Load pipeline run to get taxonomy pack and classified doc type
    const [run] = await db
      .select({
        taxonomyPackId: pipelineRuns.taxonomyPackId,
        classifiedDocType: pipelineRuns.classifiedDocType,
      })
      .from(pipelineRuns)
      .where(eq(pipelineRuns.id, pipelineRunId));

    if (!run) {
      await markPipelineFailed(pipelineRunId, "extract", "Pipeline run not found");
      return;
    }

    // 2. Load document text
    const [doc] = await db
      .select({ extractedText: documents.extractedText })
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!doc?.extractedText) {
      await markPipelineFailed(pipelineRunId, "extract", "No extracted text available");
      return;
    }

    // 3. Load taxonomy pack
    if (!run.taxonomyPackId) {
      // No taxonomy pack — skip extraction, advance
      await markStageCompleted(pipelineRunId, "extract");
      await advanceToNextStage("extract", job.data);
      return;
    }

    const loaded = await loadPackById(run.taxonomyPackId);
    if (!loaded) {
      await markPipelineFailed(pipelineRunId, "extract", "Taxonomy pack not found");
      return;
    }

    // 4. Filter categories to only those activated for this document type
    let activeCategories = loaded.categories;
    if (run.classifiedDocType) {
      const docType = loaded.documentTypes.find((dt) => dt.key === run.classifiedDocType);
      if (docType && Array.isArray(docType.activatedCategories)) {
        const activatedKeys = new Set(docType.activatedCategories as string[]);
        activeCategories = loaded.categories.filter((cat) => activatedKeys.has(cat.key));
      }
    }

    if (activeCategories.length === 0 || activeCategories.every((c) => c.fields.length === 0)) {
      // No fields to extract
      await markStageCompleted(pipelineRunId, "extract");
      await advanceToNextStage("extract", job.data);
      return;
    }

    // 5. Chunk with overlap
    const chunks = chunkTextOverlapping(doc.extractedText, 2000, 400);

    // 6. Find extraction prompt template
    const extractionTemplate =
      loaded.promptTemplates.find((t) => t.templateType === "extraction") || null;

    // 7. Extract from each chunk (with centralized AI client + graceful degradation)
    const allRawFindings: (RawFinding & { chunkIndex: number })[] = [];
    let totalTokensUsed = 0;
    let failedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const prompt = buildExtractionPrompt({
        categories: activeCategories,
        template: extractionTemplate,
        chunkText: chunk.text,
        chunkIndex: i,
        totalChunks: chunks.length,
        documentType: run.classifiedDocType || "unknown",
      });

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
          timeoutMs: STAGE_CONFIG.extract.timeoutMs,
          // Per-chunk: fewer retries, rely on chunk-level graceful degradation
          maxRetries: 1,
        });

        totalTokensUsed += result.tokensUsed;

        let parsed: unknown;
        try {
          parsed = JSON.parse(result.content);
        } catch {
          failedChunks++;
          continue; // Skip malformed responses
        }

        // Handle both array and object-with-findings-key formats
        const findings: unknown[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray((parsed as Record<string, unknown>)?.findings)
            ? (parsed as Record<string, unknown[]>).findings
            : [];

        for (const f of findings) {
          if (
            typeof f === "object" &&
            f !== null &&
            "fieldKey" in f &&
            "value" in f &&
            "confidence" in f
          ) {
            const finding = f as Record<string, unknown>;
            allRawFindings.push({
              categoryKey: String(finding.categoryKey || ""),
              fieldKey: String(finding.fieldKey || ""),
              value: String(finding.value || ""),
              sourceQuote: finding.sourceQuote ? String(finding.sourceQuote) : undefined,
              confidence: Number(finding.confidence) || 0,
              chunkIndex: i,
            });
          }
        }
      } catch (err) {
        // Graceful degradation: continue with remaining chunks
        failedChunks++;
        console.warn(
          `[extract] Chunk ${i + 1}/${chunks.length} failed: ${err instanceof Error ? err.message : "unknown"}`
        );
        continue;
      }
    }

    // If ALL chunks failed, mark pipeline as failed
    if (failedChunks === chunks.length && chunks.length > 0) {
      await markPipelineFailed(
        pipelineRunId,
        "extract",
        `All ${chunks.length} chunks failed extraction`
      );
      return;
    }

    // 8. Deduplicate across chunks
    const deduped = deduplicateFindings(allRawFindings);

    // 9. Store findings
    if (deduped.length > 0) {
      const findingRows = deduped.map((finding) => {
        const field = loaded.fieldMap.get(`${finding.categoryKey}:${finding.fieldKey}`);
        const chunkFinding = allRawFindings.find(
          (rf) =>
            rf.categoryKey === finding.categoryKey &&
            rf.fieldKey === finding.fieldKey &&
            rf.value === finding.value
        );
        const chunk = chunkFinding ? chunks[chunkFinding.chunkIndex] : undefined;

        return {
          firmId,
          pipelineRunId,
          matterId,
          documentId,
          categoryKey: finding.categoryKey,
          fieldKey: finding.fieldKey,
          label: field?.label || finding.fieldKey,
          value: finding.value,
          sourceQuote: finding.sourceQuote || null,
          charStart: chunk?.charStart ?? null,
          charEnd: chunk?.charEnd ?? null,
          confidence: finding.confidence.toFixed(3),
          impact: classifyImpact(finding, field),
          status: "pending" as const,
        };
      });

      await db.insert(pipelineFindings).values(findingRows);
    }

    // 10. Complete extraction stage
    await markStageCompleted(pipelineRunId, "extract", {
      findingsCount: deduped.length,
      totalTokensUsed,
    });

    // 11. Advance to reconcile
    await advanceToNextStage("extract", job.data);
  },
  {
    connection,
    concurrency: STAGE_CONFIG.extract.concurrency,
  }
);

extractWorker.on("completed", (job) => {
  console.log(`Pipeline extract completed: ${job.id}`);
});

extractWorker.on("failed", (job, err) => {
  console.error(`Pipeline extract failed: ${job?.id}`, err);
});
