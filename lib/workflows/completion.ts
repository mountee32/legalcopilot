/**
 * Stage Completion Predicates
 *
 * Determines when a stage is complete based on its completion criteria.
 *
 * Completion criteria:
 * - "all_mandatory_tasks": All mandatory tasks must be resolved
 * - "all_tasks": All tasks must be resolved
 * - "custom": Treated as all_mandatory_tasks for Phase 1
 *
 * A task is "resolved" when its status is:
 * - completed
 * - skipped (with logged exception)
 * - not_applicable (with logged exception)
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { and, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { tasks, matterStages, workflowStages } from "@/lib/db/schema";
import { isTaskResolved } from "@/lib/tasks/completion";

export type CompletionCriteria = "all_mandatory_tasks" | "all_tasks" | "custom";

export interface StageCompletionStatus {
  isComplete: boolean;
  totalTasks: number;
  resolvedTasks: number;
  mandatoryTasks: number;
  resolvedMandatoryTasks: number;
  pendingTasks: Array<{
    id: string;
    title: string;
    status: string;
    isMandatory: boolean;
  }>;
}

/**
 * Check if a stage is complete based on its completion criteria.
 */
export async function checkStageCompletion(
  tx: PostgresJsDatabase<Record<string, never>>,
  matterStageId: string
): Promise<StageCompletionStatus> {
  // Get the stage and its completion criteria
  const [stage] = await tx
    .select({
      id: matterStages.id,
      workflowStageId: matterStages.workflowStageId,
      status: matterStages.status,
    })
    .from(matterStages)
    .where(eq(matterStages.id, matterStageId))
    .limit(1);

  if (!stage) {
    throw new Error("Stage not found");
  }

  // Get the completion criteria from the workflow stage template
  const [workflowStage] = await tx
    .select({
      completionCriteria: workflowStages.completionCriteria,
    })
    .from(workflowStages)
    .where(eq(workflowStages.id, stage.workflowStageId))
    .limit(1);

  const completionCriteria = (workflowStage?.completionCriteria ??
    "all_mandatory_tasks") as CompletionCriteria;

  // Get all tasks for this stage
  const stageTasks = await tx
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      isMandatory: tasks.isMandatory,
    })
    .from(tasks)
    .where(eq(tasks.matterStageId, matterStageId));

  const totalTasks = stageTasks.length;
  const mandatoryTasks = stageTasks.filter((t) => t.isMandatory).length;

  const resolvedTasks = stageTasks.filter((t) => isTaskResolved(t.status)).length;
  const resolvedMandatoryTasks = stageTasks.filter(
    (t) => t.isMandatory && isTaskResolved(t.status)
  ).length;

  const pendingTasks = stageTasks
    .filter((t) => !isTaskResolved(t.status))
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      isMandatory: t.isMandatory,
    }));

  // Determine completion based on criteria
  let isComplete: boolean;

  switch (completionCriteria) {
    case "all_tasks":
      isComplete = resolvedTasks === totalTasks;
      break;

    case "all_mandatory_tasks":
    case "custom": // Treat custom as all_mandatory_tasks for Phase 1
    default:
      isComplete = resolvedMandatoryTasks === mandatoryTasks;
      break;
  }

  return {
    isComplete,
    totalTasks,
    resolvedTasks,
    mandatoryTasks,
    resolvedMandatoryTasks,
    pendingTasks,
  };
}

/**
 * Get completion status for multiple stages at once.
 * Useful for displaying workflow progress.
 */
export async function getWorkflowCompletionStatus(
  tx: PostgresJsDatabase<Record<string, never>>,
  matterWorkflowId: string
): Promise<Map<string, StageCompletionStatus>> {
  // Get all stages for this workflow
  const stages = await tx
    .select({
      id: matterStages.id,
    })
    .from(matterStages)
    .where(eq(matterStages.matterWorkflowId, matterWorkflowId));

  const statusMap = new Map<string, StageCompletionStatus>();

  for (const stage of stages) {
    const status = await checkStageCompletion(tx, stage.id);
    statusMap.set(stage.id, status);
  }

  return statusMap;
}

/**
 * Calculate overall workflow progress as a percentage.
 */
export async function calculateWorkflowProgress(
  tx: PostgresJsDatabase<Record<string, never>>,
  matterWorkflowId: string
): Promise<{
  totalMandatoryTasks: number;
  resolvedMandatoryTasks: number;
  progressPercent: number;
}> {
  // Get all non-skipped stages
  const stages = await tx
    .select({ id: matterStages.id })
    .from(matterStages)
    .where(
      and(
        eq(matterStages.matterWorkflowId, matterWorkflowId),
        // Only count non-skipped stages
        inArray(matterStages.status, ["pending", "in_progress", "completed"])
      )
    );

  let totalMandatoryTasks = 0;
  let resolvedMandatoryTasks = 0;

  for (const stage of stages) {
    const status = await checkStageCompletion(tx, stage.id);
    totalMandatoryTasks += status.mandatoryTasks;
    resolvedMandatoryTasks += status.resolvedMandatoryTasks;
  }

  const progressPercent =
    totalMandatoryTasks === 0
      ? 100
      : Math.round((resolvedMandatoryTasks / totalMandatoryTasks) * 100);

  return {
    totalMandatoryTasks,
    resolvedMandatoryTasks,
    progressPercent,
  };
}
