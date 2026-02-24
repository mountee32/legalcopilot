/**
 * Pipeline Stage 6 — Action Generation Worker
 *
 * Evaluates deterministic action triggers from the taxonomy pack and generates
 * AI recommendations based on findings. Creates tasks, deadlines, notifications,
 * and risk flags as pipeline actions.
 *
 * This is the final pipeline stage — marks the run as completed.
 */

import { Worker, Job } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  pipelineRuns,
  pipelineFindings,
  pipelineActions,
  type TaxonomyActionTrigger,
} from "@/lib/db/schema";
import { loadPackById } from "@/lib/pipeline/taxonomy-loader";
import type { PipelineJobData } from "../pipeline";
import { STAGE_CONFIG } from "../pipeline";
import {
  markStageRunning,
  markStageCompleted,
  markPipelineCompleted,
  markPipelineFailed,
} from "./pipeline-helpers";

// ---------------------------------------------------------------------------
// Trigger evaluation
// ---------------------------------------------------------------------------

interface TriggerCondition {
  fieldKey: string;
  categoryKey?: string;
  operator: "exists" | "equals" | "contains" | "gt" | "lt" | "date_within_days";
  value?: string | number;
}

interface ActionTemplate {
  actionType: string;
  title: string;
  description?: string;
  priority?: number;
  payload?: Record<string, unknown>;
}

/**
 * Evaluate a trigger condition against available findings.
 */
export function evaluateTrigger(
  condition: TriggerCondition,
  findingsMap: Map<string, { value: string; confidence: number }[]>
): { matched: boolean; matchedFinding?: { value: string; confidence: number } } {
  const key = condition.categoryKey
    ? `${condition.categoryKey}:${condition.fieldKey}`
    : condition.fieldKey;

  // Try full key first, then just fieldKey
  const findings = findingsMap.get(key) || findingsMap.get(condition.fieldKey) || [];

  if (findings.length === 0) {
    return { matched: false };
  }

  for (const finding of findings) {
    switch (condition.operator) {
      case "exists":
        return { matched: true, matchedFinding: finding };

      case "equals":
        if (finding.value === String(condition.value)) {
          return { matched: true, matchedFinding: finding };
        }
        break;

      case "contains":
        if (finding.value.toLowerCase().includes(String(condition.value ?? "").toLowerCase())) {
          return { matched: true, matchedFinding: finding };
        }
        break;

      case "gt": {
        const numVal = parseFloat(finding.value.replace(/[,$%]/g, ""));
        if (!isNaN(numVal) && numVal > Number(condition.value)) {
          return { matched: true, matchedFinding: finding };
        }
        break;
      }

      case "lt": {
        const numVal = parseFloat(finding.value.replace(/[,$%]/g, ""));
        if (!isNaN(numVal) && numVal < Number(condition.value)) {
          return { matched: true, matchedFinding: finding };
        }
        break;
      }

      case "date_within_days": {
        const date = new Date(finding.value);
        if (isNaN(date.getTime())) break;
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= Number(condition.value)) {
          return { matched: true, matchedFinding: finding };
        }
        break;
      }
    }
  }

  return { matched: false };
}

/**
 * Process deterministic action triggers from the taxonomy pack.
 */
export function processTriggers(
  triggers: TaxonomyActionTrigger[],
  findingsMap: Map<string, { value: string; confidence: number }[]>
): Array<{
  trigger: TaxonomyActionTrigger;
  matchedFinding?: { value: string; confidence: number };
}> {
  const matched: Array<{
    trigger: TaxonomyActionTrigger;
    matchedFinding?: { value: string; confidence: number };
  }> = [];

  for (const trigger of triggers) {
    const condition = trigger.triggerCondition as TriggerCondition;
    if (!condition?.fieldKey) continue;

    const result = evaluateTrigger(condition, findingsMap);
    if (result.matched) {
      matched.push({ trigger, matchedFinding: result.matchedFinding });
    }
  }

  return matched;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const actionsWorker = new Worker<PipelineJobData>(
  "pipeline:actions",
  async (job: Job<PipelineJobData>) => {
    const { pipelineRunId, firmId, matterId } = job.data;

    await markStageRunning(pipelineRunId, "actions");

    // 1. Load pipeline run
    const [run] = await db
      .select({ taxonomyPackId: pipelineRuns.taxonomyPackId })
      .from(pipelineRuns)
      .where(eq(pipelineRuns.id, pipelineRunId));

    if (!run) {
      await markPipelineFailed(pipelineRunId, "actions", "Pipeline run not found");
      return;
    }

    // 2. Load findings for this run
    const findings = await db
      .select()
      .from(pipelineFindings)
      .where(eq(pipelineFindings.pipelineRunId, pipelineRunId));

    // 3. Build findings map for trigger evaluation
    const findingsMap = new Map<string, { value: string; confidence: number }[]>();
    for (const f of findings) {
      const fullKey = `${f.categoryKey}:${f.fieldKey}`;
      const entry = { value: f.value || "", confidence: parseFloat(f.confidence) };

      // Index by both full key and fieldKey alone
      for (const key of [fullKey, f.fieldKey]) {
        const bucket = findingsMap.get(key) || [];
        bucket.push(entry);
        findingsMap.set(key, bucket);
      }
    }

    const actionRows: Array<{
      firmId: string;
      pipelineRunId: string;
      matterId: string;
      actionType:
        | "create_task"
        | "create_deadline"
        | "update_field"
        | "send_notification"
        | "flag_risk"
        | "request_review"
        | "ai_recommendation";
      title: string;
      description: string | null;
      priority: number;
      isDeterministic: string;
      actionPayload: Record<string, unknown> | null;
      triggerFindingId: string | null;
      triggerRuleId: string | null;
    }> = [];

    // 4. Evaluate deterministic triggers from taxonomy pack
    if (run.taxonomyPackId) {
      const loaded = await loadPackById(run.taxonomyPackId);
      if (loaded && loaded.actionTriggers.length > 0) {
        const matchedTriggers = processTriggers(loaded.actionTriggers, findingsMap);

        for (const { trigger, matchedFinding } of matchedTriggers) {
          const template = trigger.actionTemplate as ActionTemplate;
          const actionType = (template.actionType ||
            "ai_recommendation") as (typeof actionRows)[number]["actionType"];

          // Find the finding that matched for linking
          let triggerFindingId: string | null = null;
          if (matchedFinding) {
            const matchedDbFinding = findings.find(
              (f) =>
                f.value === matchedFinding.value &&
                parseFloat(f.confidence) === matchedFinding.confidence
            );
            if (matchedDbFinding) triggerFindingId = matchedDbFinding.id;
          }

          actionRows.push({
            firmId,
            pipelineRunId,
            matterId,
            actionType,
            title: template.title || trigger.name,
            description: template.description || trigger.description || null,
            priority: template.priority ?? 0,
            isDeterministic: "true",
            actionPayload: template.payload || null,
            triggerFindingId,
            triggerRuleId: trigger.id,
          });
        }
      }
    }

    // 5. Generate automatic risk flags for high-impact conflicts
    const conflictFindings = findings.filter((f) => f.status === "conflict");
    for (const cf of conflictFindings) {
      actionRows.push({
        firmId,
        pipelineRunId,
        matterId,
        actionType: "flag_risk",
        title: `Data conflict: ${cf.label}`,
        description: `Extracted "${cf.value}" conflicts with existing value "${cf.existingValue}". Review required.`,
        priority: cf.impact === "critical" ? 0 : cf.impact === "high" ? 1 : 2,
        isDeterministic: "true",
        actionPayload: {
          findingId: cf.id,
          fieldKey: cf.fieldKey,
          categoryKey: cf.categoryKey,
          newValue: cf.value,
          existingValue: cf.existingValue,
        },
        triggerFindingId: cf.id,
        triggerRuleId: null,
      });
    }

    // 6. Generate review request for critical pending findings
    const criticalPending = findings.filter(
      (f) => f.status === "pending" && f.impact === "critical"
    );
    if (criticalPending.length > 0) {
      actionRows.push({
        firmId,
        pipelineRunId,
        matterId,
        actionType: "request_review",
        title: `${criticalPending.length} critical finding(s) need review`,
        description: `Critical findings extracted: ${criticalPending.map((f) => f.label).join(", ")}. Manual review recommended.`,
        priority: 0,
        isDeterministic: "true",
        actionPayload: {
          findingIds: criticalPending.map((f) => f.id),
        },
        triggerFindingId: criticalPending[0].id,
        triggerRuleId: null,
      });
    }

    // 7. Store actions
    if (actionRows.length > 0) {
      await db.insert(pipelineActions).values(actionRows);
    }

    // 8. Complete actions stage and mark pipeline as completed
    await markStageCompleted(pipelineRunId, "actions", {
      actionsCount: actionRows.length,
    });

    // This is the final stage — mark the entire pipeline run as completed
    await markPipelineCompleted(pipelineRunId);
  },
  {
    connection,
    concurrency: STAGE_CONFIG.actions.concurrency,
  }
);

actionsWorker.on("completed", (job) => {
  console.log(`Pipeline actions completed: ${job.id}`);
});

actionsWorker.on("failed", (job, err) => {
  console.error(`Pipeline actions failed: ${job?.id}`, err);
});
