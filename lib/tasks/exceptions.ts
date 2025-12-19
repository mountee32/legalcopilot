/**
 * Task Exception Logging Helper
 *
 * Records when tasks are skipped, marked not applicable, or gates are overridden.
 * Critical for audit trail and regulatory compliance.
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { taskExceptions } from "@/lib/db/schema";

export type ExceptionType = "skipped" | "not_applicable" | "gate_override";
export type DecisionSource = "user" | "system";
export type ObjectType = "task" | "stage";

export interface LogExceptionParams {
  firmId: string;
  objectType: ObjectType;
  objectId: string;
  exceptionType: ExceptionType;
  reason: string;
  decisionSource?: DecisionSource;
  approvedById: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an exception/override for audit trail.
 *
 * This should be called whenever:
 * - A task is skipped
 * - A task is marked as not applicable
 * - A stage gate is overridden
 *
 * @returns The created exception record
 */
export async function logException(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: LogExceptionParams
) {
  const [exception] = await tx
    .insert(taskExceptions)
    .values({
      firmId: params.firmId,
      objectType: params.objectType,
      objectId: params.objectId,
      exceptionType: params.exceptionType,
      reason: params.reason,
      decisionSource: params.decisionSource ?? "user",
      approvedById: params.approvedById,
      approvedAt: new Date(),
      metadata: params.metadata ?? null,
    })
    .returning();

  return exception;
}

/**
 * Log a task skip exception.
 * Convenience wrapper for skipping tasks.
 */
export async function logTaskSkipped(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    taskId: string;
    reason: string;
    approvedById: string;
    originalStatus?: string;
  }
) {
  return logException(tx, {
    firmId: params.firmId,
    objectType: "task",
    objectId: params.taskId,
    exceptionType: "skipped",
    reason: params.reason,
    decisionSource: "user",
    approvedById: params.approvedById,
    metadata: params.originalStatus ? { originalStatus: params.originalStatus } : undefined,
  });
}

/**
 * Log a task not_applicable exception.
 * Convenience wrapper for marking tasks as not applicable.
 */
export async function logTaskNotApplicable(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    taskId: string;
    reason: string;
    approvedById: string;
    originalStatus?: string;
    decisionSource?: DecisionSource;
  }
) {
  return logException(tx, {
    firmId: params.firmId,
    objectType: "task",
    objectId: params.taskId,
    exceptionType: "not_applicable",
    reason: params.reason,
    decisionSource: params.decisionSource ?? "user",
    approvedById: params.approvedById,
    metadata: params.originalStatus ? { originalStatus: params.originalStatus } : undefined,
  });
}

/**
 * Log a stage gate override exception.
 * Convenience wrapper for stage gate overrides.
 */
export async function logGateOverride(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    stageId: string;
    reason: string;
    approvedById: string;
    gateType?: string;
    blockedTasks?: string[];
  }
) {
  return logException(tx, {
    firmId: params.firmId,
    objectType: "stage",
    objectId: params.stageId,
    exceptionType: "gate_override",
    reason: params.reason,
    decisionSource: "user",
    approvedById: params.approvedById,
    metadata: {
      gateType: params.gateType,
      blockedTasks: params.blockedTasks,
    },
  });
}
