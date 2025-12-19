/**
 * Stage Gate Checking
 *
 * Checks if a stage's gate blocks progression to the next stage.
 *
 * Gate types:
 * - "hard": Cannot proceed until stage is complete
 * - "soft": Warning shown, but can override and proceed
 * - "none": No gating, informational only
 *
 * Skipped stages are treated as "completed" for gating purposes.
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { and, eq, lt, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { matterStages, workflowStages, taskExceptions } from "@/lib/db/schema";
import { checkStageCompletion } from "./completion";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export type GateType = "hard" | "soft" | "none";

export interface GateCheckResult {
  canProceed: boolean;
  gateType: GateType;
  isBlocked: boolean;
  blockedBy?: {
    stageId: string;
    stageName: string;
    reason: string;
  };
  warnings: string[];
}

export interface GateOverrideParams {
  firmId: string;
  matterId: string;
  stageId: string;
  reason: string;
  overriddenById: string;
}

/**
 * Check if progression to a stage is blocked by a gate.
 *
 * This checks if any previous stage with a hard or soft gate
 * is incomplete and would block progression.
 */
export async function checkGate(
  tx: PostgresJsDatabase<Record<string, never>>,
  targetStageId: string
): Promise<GateCheckResult> {
  // Get the target stage
  const [targetStage] = await tx
    .select({
      id: matterStages.id,
      matterWorkflowId: matterStages.matterWorkflowId,
      sortOrder: matterStages.sortOrder,
    })
    .from(matterStages)
    .where(eq(matterStages.id, targetStageId))
    .limit(1);

  if (!targetStage) {
    throw new Error("Stage not found");
  }

  // Get all previous stages (lower sort order) that aren't skipped
  const previousStages = await tx
    .select({
      id: matterStages.id,
      name: matterStages.name,
      status: matterStages.status,
      workflowStageId: matterStages.workflowStageId,
      sortOrder: matterStages.sortOrder,
    })
    .from(matterStages)
    .where(
      and(
        eq(matterStages.matterWorkflowId, targetStage.matterWorkflowId),
        lt(matterStages.sortOrder, targetStage.sortOrder)
      )
    )
    .orderBy(asc(matterStages.sortOrder));

  const warnings: string[] = [];

  // Check each previous stage
  for (const stage of previousStages) {
    // Skipped stages don't block
    if (stage.status === "skipped") {
      continue;
    }

    // Completed stages don't block
    if (stage.status === "completed") {
      continue;
    }

    // Get the gate type from the workflow stage template
    const [workflowStage] = await tx
      .select({
        gateType: workflowStages.gateType,
      })
      .from(workflowStages)
      .where(eq(workflowStages.id, stage.workflowStageId))
      .limit(1);

    const gateType = (workflowStage?.gateType ?? "none") as GateType;

    // No gate - doesn't block
    if (gateType === "none") {
      continue;
    }

    // Check if stage is complete
    const completion = await checkStageCompletion(tx, stage.id);

    if (!completion.isComplete) {
      const pendingMandatory = completion.pendingTasks.filter((t) => t.isMandatory);

      if (gateType === "hard") {
        return {
          canProceed: false,
          gateType: "hard",
          isBlocked: true,
          blockedBy: {
            stageId: stage.id,
            stageName: stage.name,
            reason: `${pendingMandatory.length} mandatory task(s) incomplete`,
          },
          warnings,
        };
      }

      if (gateType === "soft") {
        warnings.push(
          `Stage "${stage.name}" has ${pendingMandatory.length} incomplete mandatory task(s)`
        );
      }
    }
  }

  return {
    canProceed: true,
    gateType: warnings.length > 0 ? "soft" : "none",
    isBlocked: false,
    warnings,
  };
}

/**
 * Override a gate to allow progression despite incomplete tasks.
 * Creates an exception log for audit trail.
 */
export async function overrideGate(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: GateOverrideParams
): Promise<void> {
  const { firmId, matterId, stageId, reason, overriddenById } = params;

  // Get stage info
  const [stage] = await tx
    .select({
      id: matterStages.id,
      name: matterStages.name,
      workflowStageId: matterStages.workflowStageId,
    })
    .from(matterStages)
    .where(eq(matterStages.id, stageId))
    .limit(1);

  if (!stage) {
    throw new Error("Stage not found");
  }

  // Get gate type
  const [workflowStage] = await tx
    .select({
      gateType: workflowStages.gateType,
    })
    .from(workflowStages)
    .where(eq(workflowStages.id, stage.workflowStageId))
    .limit(1);

  const gateType = workflowStage?.gateType ?? "none";

  // Get pending tasks for metadata
  const completion = await checkStageCompletion(tx, stageId);
  const blockedTaskIds = completion.pendingTasks.filter((t) => t.isMandatory).map((t) => t.id);

  // Log exception
  await tx.insert(taskExceptions).values({
    firmId,
    objectType: "stage",
    objectId: stageId,
    exceptionType: "gate_override",
    reason,
    decisionSource: "user",
    approvedById: overriddenById,
    metadata: {
      gateType,
      blockedTasks: blockedTaskIds,
      pendingMandatoryCount: blockedTaskIds.length,
    },
  });

  // Create timeline event
  await createTimelineEvent(tx, {
    firmId,
    matterId,
    type: "stage_gate_overridden",
    title: `Gate overridden: ${stage.name}`,
    description: reason,
    actorType: "user",
    actorId: overriddenById,
    entityType: "matter_stage",
    entityId: stageId,
    metadata: {
      gateType,
      blockedTaskIds,
    },
    occurredAt: new Date(),
  });
}

/**
 * Check if a specific stage has any gating.
 */
export async function getStageGateType(
  tx: PostgresJsDatabase<Record<string, never>>,
  matterStageId: string
): Promise<GateType> {
  const [stage] = await tx
    .select({
      workflowStageId: matterStages.workflowStageId,
    })
    .from(matterStages)
    .where(eq(matterStages.id, matterStageId))
    .limit(1);

  if (!stage) {
    return "none";
  }

  const [workflowStage] = await tx
    .select({
      gateType: workflowStages.gateType,
    })
    .from(workflowStages)
    .where(eq(workflowStages.id, stage.workflowStageId))
    .limit(1);

  return (workflowStage?.gateType ?? "none") as GateType;
}
