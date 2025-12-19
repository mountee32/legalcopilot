/**
 * Task Completion Predicate Logic
 *
 * Implements the completion predicate for evidence-backed compliance workflows:
 *   isComplete = status == 'completed'
 *     AND (if requiresEvidence -> verifiedEvidenceCount >= 1)
 *     AND (if requiresApproval -> approvalStatus == 'approved')
 *     AND completedAt IS NOT NULL
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { evidenceItems } from "@/lib/db/schema";

export interface TaskForCompletion {
  id: string;
  status: string;
  completedAt: Date | null;
  requiresEvidence: boolean;
  requiresVerifiedEvidence: boolean;
  requiresApproval: boolean;
  approvalStatus: string | null;
}

export interface CompletionCheckResult {
  isComplete: boolean;
  canComplete: boolean;
  blockers: string[];
}

/**
 * Check if a task meets all completion requirements.
 *
 * A task is "complete" when:
 * 1. status = 'completed'
 * 2. If requiresEvidence: at least one evidence item exists
 * 3. If requiresEvidence AND requiresVerifiedEvidence: at least one verified evidence exists
 * 4. If requiresApproval: approvalStatus = 'approved'
 * 5. completedAt is set
 */
export async function checkTaskCompletion(
  tx: PostgresJsDatabase<Record<string, never>>,
  task: TaskForCompletion,
  firmId: string
): Promise<CompletionCheckResult> {
  const blockers: string[] = [];

  // Check evidence requirements
  if (task.requiresEvidence) {
    const evidenceQuery = tx
      .select({ count: sql<number>`count(*)` })
      .from(evidenceItems)
      .where(and(eq(evidenceItems.taskId, task.id), eq(evidenceItems.firmId, firmId)));

    if (task.requiresVerifiedEvidence) {
      // Need at least one verified evidence item
      const [verifiedCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(evidenceItems)
        .where(
          and(
            eq(evidenceItems.taskId, task.id),
            eq(evidenceItems.firmId, firmId),
            isNotNull(evidenceItems.verifiedAt)
          )
        );

      if (Number(verifiedCount?.count ?? 0) === 0) {
        blockers.push("Task requires verified evidence but none exists");
      }
    } else {
      // Just need at least one evidence item (verified or not)
      const [evidenceCount] = await evidenceQuery;

      if (Number(evidenceCount?.count ?? 0) === 0) {
        blockers.push("Task requires evidence but none attached");
      }
    }
  }

  // Check approval requirements
  if (task.requiresApproval && task.approvalStatus !== "approved") {
    if (!task.approvalStatus) {
      blockers.push("Task requires approval but no approval has been requested");
    } else if (task.approvalStatus === "pending") {
      blockers.push("Task requires approval but approval is still pending");
    } else if (task.approvalStatus === "rejected") {
      blockers.push("Task requires approval but approval was rejected");
    } else {
      blockers.push("Task requires approval");
    }
  }

  // Determine if task is currently complete
  const isComplete =
    task.status === "completed" && task.completedAt !== null && blockers.length === 0;

  // Determine if task can be completed (all requirements met)
  const canComplete = blockers.length === 0;

  return {
    isComplete,
    canComplete,
    blockers,
  };
}

/**
 * Check if a task can be marked as complete.
 * This is a convenience wrapper that returns only the blockers.
 */
export async function getCompletionBlockers(
  tx: PostgresJsDatabase<Record<string, never>>,
  task: TaskForCompletion,
  firmId: string
): Promise<string[]> {
  const result = await checkTaskCompletion(tx, task, firmId);
  return result.blockers;
}

/**
 * Type guard to check if a task status allows completion actions.
 * Tasks can only be completed from 'pending' or 'in_progress' states.
 */
export function canTransitionToCompleted(currentStatus: string): boolean {
  return currentStatus === "pending" || currentStatus === "in_progress";
}

/**
 * Type guard to check if a task status allows skip/not_applicable actions.
 * These actions can only be taken on tasks that aren't already resolved.
 */
export function canSkipOrMarkNotApplicable(currentStatus: string): boolean {
  return (
    currentStatus === "pending" || currentStatus === "in_progress" || currentStatus === "completed"
  );
}

/**
 * Check if a task status is "resolved" for stage completion purposes.
 * Resolved statuses count toward mandatory task completion for stages.
 */
export function isTaskResolved(status: string): boolean {
  return status === "completed" || status === "skipped" || status === "not_applicable";
}
