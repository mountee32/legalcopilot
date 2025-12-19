/**
 * Stage Progression Logic
 *
 * Handles automatic stage transitions and state management:
 * - Auto-start stage when first task moves to in_progress
 * - Auto-complete stage when completion criteria met
 * - Auto-start next stage when previous completes
 * - Update currentStageId on workflow
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { and, eq, gt, asc, ne } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { matterStages, matterWorkflows } from "@/lib/db/schema";
import { checkStageCompletion } from "./completion";
import { checkGate } from "./gating";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export interface StageProgressionResult {
  stageStarted: boolean;
  stageCompleted: boolean;
  nextStageStarted: boolean;
  currentStageId: string | null;
}

/**
 * Handle task status change and update stage progression accordingly.
 *
 * Call this when a task's status changes. It will:
 * 1. Start the stage if this is the first task to start
 * 2. Check if the stage is now complete
 * 3. If complete, start the next stage
 */
export async function handleTaskStatusChange(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    matterId: string;
    matterStageId: string;
    taskStatus: string;
    userId: string;
  }
): Promise<StageProgressionResult> {
  const { firmId, matterId, matterStageId, taskStatus, userId } = params;

  const result: StageProgressionResult = {
    stageStarted: false,
    stageCompleted: false,
    nextStageStarted: false,
    currentStageId: null,
  };

  // Get the current stage
  const [stage] = await tx
    .select()
    .from(matterStages)
    .where(eq(matterStages.id, matterStageId))
    .limit(1);

  if (!stage || stage.status === "skipped") {
    return result;
  }

  // Start stage if task is now in_progress and stage hasn't started
  if (taskStatus === "in_progress" && stage.status === "pending") {
    await startStage(tx, { firmId, matterId, stageId: matterStageId, userId });
    result.stageStarted = true;
  }

  // Check if stage is now complete
  const completion = await checkStageCompletion(tx, matterStageId);

  if (completion.isComplete && stage.status !== "completed") {
    await completeStage(tx, { firmId, matterId, stageId: matterStageId, userId });
    result.stageCompleted = true;

    // Try to start next stage
    const nextResult = await tryStartNextStage(tx, {
      firmId,
      matterId,
      matterWorkflowId: stage.matterWorkflowId,
      completedStageId: matterStageId,
      userId,
    });

    result.nextStageStarted = nextResult.started;
    result.currentStageId = nextResult.currentStageId;
  } else {
    // Update current stage ID
    result.currentStageId = await getCurrentStageId(tx, stage.matterWorkflowId);
  }

  return result;
}

/**
 * Start a stage (set status to in_progress, set startedAt).
 */
export async function startStage(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    matterId: string;
    stageId: string;
    userId: string;
  }
): Promise<void> {
  const { firmId, matterId, stageId, userId } = params;

  const [stage] = await tx.select().from(matterStages).where(eq(matterStages.id, stageId)).limit(1);

  if (!stage) return;

  await tx
    .update(matterStages)
    .set({
      status: "in_progress",
      startedAt: new Date(),
    })
    .where(eq(matterStages.id, stageId));

  // Update workflow currentStageId
  await tx
    .update(matterWorkflows)
    .set({ currentStageId: stageId })
    .where(eq(matterWorkflows.id, stage.matterWorkflowId));

  // Create timeline event
  await createTimelineEvent(tx, {
    firmId,
    matterId,
    type: "stage_started",
    title: `Stage started: ${stage.name}`,
    actorType: "system",
    actorId: userId,
    entityType: "matter_stage",
    entityId: stageId,
    occurredAt: new Date(),
  });
}

/**
 * Complete a stage (set status to completed, set completedAt).
 */
export async function completeStage(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    matterId: string;
    stageId: string;
    userId: string;
  }
): Promise<void> {
  const { firmId, matterId, stageId, userId } = params;

  const [stage] = await tx.select().from(matterStages).where(eq(matterStages.id, stageId)).limit(1);

  if (!stage) return;

  await tx
    .update(matterStages)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(matterStages.id, stageId));

  // Create timeline event
  await createTimelineEvent(tx, {
    firmId,
    matterId,
    type: "stage_completed",
    title: `Stage completed: ${stage.name}`,
    actorType: "system",
    actorId: userId,
    entityType: "matter_stage",
    entityId: stageId,
    occurredAt: new Date(),
  });
}

/**
 * Try to start the next stage after one completes.
 * Checks gate conditions before starting.
 */
async function tryStartNextStage(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    matterId: string;
    matterWorkflowId: string;
    completedStageId: string;
    userId: string;
  }
): Promise<{ started: boolean; currentStageId: string | null }> {
  const { firmId, matterId, matterWorkflowId, completedStageId, userId } = params;

  // Get the completed stage's sort order
  const [completedStage] = await tx
    .select({ sortOrder: matterStages.sortOrder })
    .from(matterStages)
    .where(eq(matterStages.id, completedStageId))
    .limit(1);

  if (!completedStage) {
    return { started: false, currentStageId: null };
  }

  // Get the next non-skipped stage
  const [nextStage] = await tx
    .select()
    .from(matterStages)
    .where(
      and(
        eq(matterStages.matterWorkflowId, matterWorkflowId),
        gt(matterStages.sortOrder, completedStage.sortOrder),
        ne(matterStages.status, "skipped")
      )
    )
    .orderBy(asc(matterStages.sortOrder))
    .limit(1);

  if (!nextStage) {
    // No more stages - workflow complete
    const currentStageId = await getCurrentStageId(tx, matterWorkflowId);
    return { started: false, currentStageId };
  }

  // Check if we can proceed (gate check)
  const gateResult = await checkGate(tx, nextStage.id);

  if (!gateResult.canProceed) {
    // Can't proceed due to hard gate
    const currentStageId = await getCurrentStageId(tx, matterWorkflowId);
    return { started: false, currentStageId };
  }

  // Start the next stage
  if (nextStage.status === "pending") {
    await startStage(tx, {
      firmId,
      matterId,
      stageId: nextStage.id,
      userId,
    });
    return { started: true, currentStageId: nextStage.id };
  }

  const currentStageId = await getCurrentStageId(tx, matterWorkflowId);
  return { started: false, currentStageId };
}

/**
 * Get the current stage ID for a workflow.
 * Current stage is the first non-completed, non-skipped stage.
 */
async function getCurrentStageId(
  tx: PostgresJsDatabase<Record<string, never>>,
  matterWorkflowId: string
): Promise<string | null> {
  const [currentStage] = await tx
    .select({ id: matterStages.id })
    .from(matterStages)
    .where(
      and(
        eq(matterStages.matterWorkflowId, matterWorkflowId),
        ne(matterStages.status, "completed"),
        ne(matterStages.status, "skipped")
      )
    )
    .orderBy(asc(matterStages.sortOrder))
    .limit(1);

  if (currentStage) {
    // Update the workflow
    await tx
      .update(matterWorkflows)
      .set({ currentStageId: currentStage.id })
      .where(eq(matterWorkflows.id, matterWorkflowId));

    return currentStage.id;
  }

  // All stages complete or skipped
  await tx
    .update(matterWorkflows)
    .set({ currentStageId: null })
    .where(eq(matterWorkflows.id, matterWorkflowId));

  return null;
}

/**
 * Manually advance to the next stage, with optional gate override.
 */
export async function advanceToNextStage(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    matterId: string;
    matterWorkflowId: string;
    userId: string;
    overrideReason?: string;
  }
): Promise<{ success: boolean; newStageId: string | null; error?: string }> {
  const { firmId, matterId, matterWorkflowId, userId } = params;

  // Get current stage
  const [workflow] = await tx
    .select({ currentStageId: matterWorkflows.currentStageId })
    .from(matterWorkflows)
    .where(eq(matterWorkflows.id, matterWorkflowId))
    .limit(1);

  if (!workflow?.currentStageId) {
    return { success: false, newStageId: null, error: "No current stage" };
  }

  // Get current stage's sort order
  const [currentStage] = await tx
    .select({ sortOrder: matterStages.sortOrder })
    .from(matterStages)
    .where(eq(matterStages.id, workflow.currentStageId))
    .limit(1);

  if (!currentStage) {
    return { success: false, newStageId: null, error: "Current stage not found" };
  }

  // Get next stage
  const [nextStage] = await tx
    .select()
    .from(matterStages)
    .where(
      and(
        eq(matterStages.matterWorkflowId, matterWorkflowId),
        gt(matterStages.sortOrder, currentStage.sortOrder),
        ne(matterStages.status, "skipped")
      )
    )
    .orderBy(asc(matterStages.sortOrder))
    .limit(1);

  if (!nextStage) {
    return { success: false, newStageId: null, error: "No next stage available" };
  }

  // Check gate
  const gateResult = await checkGate(tx, nextStage.id);

  if (!gateResult.canProceed && !params.overrideReason) {
    return {
      success: false,
      newStageId: null,
      error: `Blocked by ${gateResult.blockedBy?.stageName}: ${gateResult.blockedBy?.reason}`,
    };
  }

  // Start next stage
  if (nextStage.status === "pending") {
    await startStage(tx, {
      firmId,
      matterId,
      stageId: nextStage.id,
      userId,
    });
  }

  return { success: true, newStageId: nextStage.id };
}
