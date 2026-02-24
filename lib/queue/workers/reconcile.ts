/**
 * Pipeline Stage 5 — Reconciliation Worker
 *
 * Compares extracted findings against existing matter data,
 * detects NEW/CONFIRMED/CONFLICT status using reconciliation rules,
 * and auto-applies findings that exceed the confidence threshold.
 */

import { Worker, Job } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pipelineRuns, pipelineFindings } from "@/lib/db/schema";
import { loadPackById } from "@/lib/pipeline/taxonomy-loader";
import type { TaxonomyReconciliationRule } from "@/lib/db/schema";
import type { PipelineJobData } from "../pipeline";
import { advanceToNextStage, STAGE_CONFIG } from "../pipeline";
import { markStageRunning, markStageCompleted, markPipelineFailed } from "./pipeline-helpers";

// ---------------------------------------------------------------------------
// Fuzzy matching utilities
// ---------------------------------------------------------------------------

/**
 * Normalize text for comparison: lowercase, strip punctuation, collapse whitespace.
 */
function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?'"()\-\/\\]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Check if two values match given a conflict detection mode.
 */
export function valuesMatch(
  newValue: string,
  existingValue: string,
  mode: TaxonomyReconciliationRule["conflictDetectionMode"]
): boolean {
  switch (mode) {
    case "exact":
      return newValue.trim() === existingValue.trim();

    case "fuzzy_text":
      return normalizeText(newValue) === normalizeText(existingValue);

    case "fuzzy_number": {
      const a = parseFloat(newValue.replace(/[,$%]/g, ""));
      const b = parseFloat(existingValue.replace(/[,$%]/g, ""));
      if (isNaN(a) || isNaN(b)) return false;
      // Within 1% tolerance
      return Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * 0.01;
    }

    case "date_range": {
      const dateA = new Date(newValue);
      const dateB = new Date(existingValue);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return false;
      // Same calendar day
      return dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10);
    }

    case "semantic":
      // Semantic matching would use embeddings — fallback to fuzzy_text for now
      return normalizeText(newValue) === normalizeText(existingValue);

    default:
      return newValue.trim() === existingValue.trim();
  }
}

/**
 * Determine reconciliation status for a finding given the existing value and rule.
 */
export function reconcileFinding(
  findingValue: string,
  existingValue: string | null | undefined,
  confidence: number,
  rule: TaxonomyReconciliationRule | undefined
): { status: "pending" | "auto_applied" | "conflict"; existingValue: string | null } {
  // No existing value → new finding
  if (!existingValue) {
    const threshold = rule ? parseFloat(rule.autoApplyThreshold) : 0.85;
    const requiresReview = rule?.requiresHumanReview ?? false;

    if (!requiresReview && confidence >= threshold) {
      return { status: "auto_applied", existingValue: null };
    }
    return { status: "pending", existingValue: null };
  }

  // Has existing value — check for match
  const mode = rule?.conflictDetectionMode ?? "fuzzy_text";
  const matched = valuesMatch(findingValue, existingValue, mode);

  if (matched) {
    // Confirmed — same value, auto-apply
    return { status: "auto_applied", existingValue };
  }

  // Different value — conflict
  return { status: "conflict", existingValue };
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const reconcileWorker = new Worker<PipelineJobData>(
  "pipeline:reconcile",
  async (job: Job<PipelineJobData>) => {
    const { pipelineRunId, firmId, matterId } = job.data;

    await markStageRunning(pipelineRunId, "reconcile");

    // 1. Load pipeline run to get taxonomy pack
    const [run] = await db
      .select({ taxonomyPackId: pipelineRuns.taxonomyPackId })
      .from(pipelineRuns)
      .where(eq(pipelineRuns.id, pipelineRunId));

    if (!run) {
      await markPipelineFailed(pipelineRunId, "reconcile", "Pipeline run not found");
      return;
    }

    // 2. Load taxonomy pack with reconciliation rules
    let ruleMap = new Map<string, TaxonomyReconciliationRule>();
    if (run.taxonomyPackId) {
      const loaded = await loadPackById(run.taxonomyPackId);
      if (loaded) {
        ruleMap = loaded.reconciliationRuleMap;
      }
    }

    // 3. Load all pending findings for this run
    const findings = await db
      .select()
      .from(pipelineFindings)
      .where(
        and(
          eq(pipelineFindings.pipelineRunId, pipelineRunId),
          eq(pipelineFindings.status, "pending")
        )
      );

    if (findings.length === 0) {
      await markStageCompleted(pipelineRunId, "reconcile");
      await advanceToNextStage("reconcile", job.data);
      return;
    }

    // 4. Load existing findings for this matter to compare against
    // Group by fieldKey to find the latest accepted/auto-applied value
    const existingFindings = await db
      .select({
        categoryKey: pipelineFindings.categoryKey,
        fieldKey: pipelineFindings.fieldKey,
        value: pipelineFindings.value,
        status: pipelineFindings.status,
      })
      .from(pipelineFindings)
      .where(and(eq(pipelineFindings.matterId, matterId), eq(pipelineFindings.firmId, firmId)));

    // Build map of field → latest accepted/auto-applied value
    const existingValueMap = new Map<string, string>();
    for (const ef of existingFindings) {
      if (
        ef.value &&
        ef.status &&
        (ef.status === "accepted" || ef.status === "auto_applied") &&
        // Don't compare against findings from the current run
        !findings.some((f) => f.id === (ef as unknown as { id: string }).id)
      ) {
        const key = `${ef.categoryKey}:${ef.fieldKey}`;
        existingValueMap.set(key, ef.value);
      }
    }

    // 5. Reconcile each finding
    let autoAppliedCount = 0;
    let conflictCount = 0;

    for (const finding of findings) {
      const fieldKey = `${finding.categoryKey}:${finding.fieldKey}`;
      const existing = existingValueMap.get(fieldKey);
      const rule = ruleMap.get(finding.fieldKey);
      const confidence = parseFloat(finding.confidence);

      const result = reconcileFinding(finding.value || "", existing, confidence, rule);

      if (result.status !== "pending") {
        await db
          .update(pipelineFindings)
          .set({
            status: result.status,
            existingValue: result.existingValue,
            ...(result.status === "auto_applied" ? { resolvedAt: new Date() } : {}),
          })
          .where(eq(pipelineFindings.id, finding.id));

        if (result.status === "auto_applied") autoAppliedCount++;
        if (result.status === "conflict") conflictCount++;
      } else if (result.existingValue) {
        // Update existing value for reference even if still pending
        await db
          .update(pipelineFindings)
          .set({ existingValue: result.existingValue })
          .where(eq(pipelineFindings.id, finding.id));
      }
    }

    // 6. Complete reconciliation stage
    await markStageCompleted(pipelineRunId, "reconcile");
    await advanceToNextStage("reconcile", job.data);
  },
  {
    connection,
    concurrency: STAGE_CONFIG.reconcile.concurrency,
  }
);

reconcileWorker.on("completed", (job) => {
  console.log(`Pipeline reconcile completed: ${job.id}`);
});

reconcileWorker.on("failed", (job, err) => {
  console.error(`Pipeline reconcile failed: ${job?.id}`, err);
});
