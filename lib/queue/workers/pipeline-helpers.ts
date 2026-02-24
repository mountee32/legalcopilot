/**
 * Pipeline Worker Helpers
 *
 * Shared utilities for updating pipeline run state from within workers.
 */

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { pipelineRuns, pipelineFindings, matters } from "@/lib/db/schema";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { calculateRiskScore } from "@/lib/pipeline/risk-score";
import type { PipelineStageName } from "../pipeline";

/**
 * Mark a stage as running in the pipeline run.
 */
export async function markStageRunning(runId: string, stage: PipelineStageName) {
  const [run] = await db
    .select({ stageStatuses: pipelineRuns.stageStatuses, firmId: pipelineRuns.firmId })
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, runId));

  if (!run) throw new Error(`Pipeline run ${runId} not found`);

  const statuses = { ...(run.stageStatuses as Record<string, unknown>) };
  statuses[stage] = {
    status: "running",
    startedAt: new Date().toISOString(),
  };

  await db
    .update(pipelineRuns)
    .set({
      currentStage: stage,
      status: "running",
      stageStatuses: statuses,
      startedAt: stage === "intake" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(pipelineRuns.id, runId));
}

/**
 * Mark a stage as completed in the pipeline run.
 */
export async function markStageCompleted(
  runId: string,
  stage: PipelineStageName,
  extra?: Partial<{
    classifiedDocType: string;
    classificationConfidence: string;
    documentHash: string;
    taxonomyPackId: string;
    findingsCount: number;
    actionsCount: number;
    totalTokensUsed: number;
  }>
) {
  const [run] = await db
    .select({
      stageStatuses: pipelineRuns.stageStatuses,
      firmId: pipelineRuns.firmId,
      matterId: pipelineRuns.matterId,
      findingsCount: pipelineRuns.findingsCount,
      actionsCount: pipelineRuns.actionsCount,
      totalTokensUsed: pipelineRuns.totalTokensUsed,
    })
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, runId));

  if (!run) throw new Error(`Pipeline run ${runId} not found`);

  const statuses = { ...(run.stageStatuses as Record<string, unknown>) };
  statuses[stage] = {
    ...(statuses[stage] as Record<string, unknown> | undefined),
    status: "completed",
    completedAt: new Date().toISOString(),
  };

  const updateData: Record<string, unknown> = {
    stageStatuses: statuses,
    updatedAt: new Date(),
  };

  if (extra?.classifiedDocType) updateData.classifiedDocType = extra.classifiedDocType;
  if (extra?.classificationConfidence)
    updateData.classificationConfidence = extra.classificationConfidence;
  if (extra?.documentHash) updateData.documentHash = extra.documentHash;
  if (extra?.taxonomyPackId) updateData.taxonomyPackId = extra.taxonomyPackId;
  if (extra?.findingsCount != null)
    updateData.findingsCount = run.findingsCount + extra.findingsCount;
  if (extra?.actionsCount != null) updateData.actionsCount = run.actionsCount + extra.actionsCount;
  if (extra?.totalTokensUsed != null)
    updateData.totalTokensUsed = run.totalTokensUsed + extra.totalTokensUsed;

  await db.update(pipelineRuns).set(updateData).where(eq(pipelineRuns.id, runId));

  // Timeline event
  await createTimelineEvent(db, {
    firmId: run.firmId,
    matterId: run.matterId,
    type: "pipeline_stage_completed",
    title: `Pipeline stage completed: ${stage}`,
    actorType: "system",
    entityType: "pipeline_run",
    entityId: runId,
    occurredAt: new Date(),
    metadata: { stage, runId },
  });
}

/**
 * Mark the pipeline run as fully completed.
 */
export async function markPipelineCompleted(runId: string) {
  const [run] = await db
    .select({ firmId: pipelineRuns.firmId, matterId: pipelineRuns.matterId })
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, runId));

  await db
    .update(pipelineRuns)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(pipelineRuns.id, runId));

  if (run) {
    await createTimelineEvent(db, {
      firmId: run.firmId,
      matterId: run.matterId,
      type: "pipeline_completed",
      title: "Document pipeline completed",
      actorType: "system",
      entityType: "pipeline_run",
      entityId: runId,
      occurredAt: new Date(),
      metadata: { runId },
    });

    // Auto-recalculate risk score — non-fatal on error
    try {
      await recalculateMatterRisk(run.matterId, run.firmId);
    } catch (err) {
      console.error(
        `[pipeline-helpers] Risk recalculation failed for matter ${run.matterId}:`,
        err
      );
    }
  }
}

/**
 * Recalculate and persist the risk score for a matter from its findings.
 */
export async function recalculateMatterRisk(matterId: string, firmId: string) {
  const allFindings = await db
    .select({
      status: pipelineFindings.status,
      impact: pipelineFindings.impact,
      confidence: pipelineFindings.confidence,
    })
    .from(pipelineFindings)
    .where(and(eq(pipelineFindings.matterId, matterId), eq(pipelineFindings.firmId, firmId)));

  const { score, factors } = calculateRiskScore(allFindings);

  await db
    .update(matters)
    .set({
      riskScore: score,
      riskFactors: factors,
      riskAssessedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matters.id, matterId));

  return { score, factors };
}

/**
 * Mark the pipeline run as failed at a specific stage.
 */
export async function markPipelineFailed(runId: string, stage: PipelineStageName, error: string) {
  const [run] = await db
    .select({
      stageStatuses: pipelineRuns.stageStatuses,
      firmId: pipelineRuns.firmId,
      matterId: pipelineRuns.matterId,
    })
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, runId));

  const statuses = run ? { ...(run.stageStatuses as Record<string, unknown>) } : {};
  statuses[stage] = {
    ...(statuses[stage] as Record<string, unknown> | undefined),
    status: "failed",
    error,
  };

  await db
    .update(pipelineRuns)
    .set({
      status: "failed",
      error,
      stageStatuses: statuses,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pipelineRuns.id, runId));

  if (run) {
    await createTimelineEvent(db, {
      firmId: run.firmId,
      matterId: run.matterId,
      type: "pipeline_failed",
      title: `Pipeline failed at stage: ${stage}`,
      actorType: "system",
      entityType: "pipeline_run",
      entityId: runId,
      occurredAt: new Date(),
      metadata: { stage, error, runId },
    });
  }
}
