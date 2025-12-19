/**
 * Workflow Activation
 *
 * Activates a workflow template on a matter:
 * 1. Creates matterWorkflow record (pins to version)
 * 2. Evaluates applicability conditions for each stage
 * 3. Creates matterStage records (skips inapplicable stages)
 * 4. Creates task instances from task templates
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { eq, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  workflowTemplates,
  workflowStages,
  workflowTaskTemplates,
  matterWorkflows,
  matterStages,
  tasks,
  taskExceptions,
} from "@/lib/db/schema";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { calculateDueDate } from "./due-dates";
import type { ApplicabilityConditions } from "@/lib/db/schema/workflows";

export interface ActivateWorkflowParams {
  firmId: string;
  matterId: string;
  workflowTemplateId: string;
  activatedById: string;
  /** Matter conditions for evaluating stage applicability */
  conditions?: Record<string, boolean | string | number>;
}

export interface ActivateWorkflowResult {
  matterWorkflow: typeof matterWorkflows.$inferSelect;
  stages: Array<typeof matterStages.$inferSelect>;
  tasks: Array<typeof tasks.$inferSelect>;
  skippedStages: Array<{
    stageId: string;
    name: string;
    reason: string;
  }>;
}

/**
 * Activate a workflow on a matter.
 *
 * This is the main entry point for workflow activation. It:
 * 1. Validates the workflow template exists and is active
 * 2. Creates the matterWorkflow record
 * 3. Creates stage instances, evaluating applicability conditions
 * 4. Creates task instances from templates
 * 5. Logs timeline events and exceptions for skipped stages
 */
export async function activateWorkflow(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: ActivateWorkflowParams
): Promise<ActivateWorkflowResult> {
  const { firmId, matterId, workflowTemplateId, activatedById, conditions = {} } = params;

  // Get the workflow template
  const [template] = await tx
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.id, workflowTemplateId))
    .limit(1);

  if (!template) {
    throw new Error("Workflow template not found");
  }

  if (!template.isActive) {
    throw new Error("Workflow template is not active");
  }

  // Create matter workflow (pins to this version)
  const [matterWorkflow] = await tx
    .insert(matterWorkflows)
    .values({
      matterId,
      firmId,
      workflowTemplateId,
      workflowVersion: template.version,
      activatedById,
    })
    .returning();

  // Get all stages for this template, ordered
  const templateStages = await tx
    .select()
    .from(workflowStages)
    .where(eq(workflowStages.workflowTemplateId, workflowTemplateId))
    .orderBy(asc(workflowStages.sortOrder));

  const createdStages: Array<typeof matterStages.$inferSelect> = [];
  const createdTasks: Array<typeof tasks.$inferSelect> = [];
  const skippedStages: Array<{ stageId: string; name: string; reason: string }> = [];

  let firstApplicableStageId: string | null = null;

  // Process each stage
  for (const stage of templateStages) {
    const isApplicable = evaluateApplicabilityConditions(
      stage.applicabilityConditions as ApplicabilityConditions | null,
      conditions
    );

    if (isApplicable) {
      // Create stage instance
      const [matterStage] = await tx
        .insert(matterStages)
        .values({
          matterWorkflowId: matterWorkflow.id,
          workflowStageId: stage.id,
          name: stage.name,
          sortOrder: stage.sortOrder,
          status: "pending",
        })
        .returning();

      createdStages.push(matterStage);

      // Track first applicable stage
      if (!firstApplicableStageId) {
        firstApplicableStageId = matterStage.id;
      }

      // Create tasks for this stage
      const stageTasks = await createTasksForStage(tx, {
        firmId,
        matterId,
        matterStageId: matterStage.id,
        workflowStageId: stage.id,
        activatedById,
      });

      createdTasks.push(...stageTasks);
    } else {
      // Create skipped stage instance
      const skipReason = buildSkipReason(
        stage.applicabilityConditions as ApplicabilityConditions | null,
        conditions
      );

      const [matterStage] = await tx
        .insert(matterStages)
        .values({
          matterWorkflowId: matterWorkflow.id,
          workflowStageId: stage.id,
          name: stage.name,
          sortOrder: stage.sortOrder,
          status: "skipped",
          skippedReason: skipReason,
        })
        .returning();

      createdStages.push(matterStage);
      skippedStages.push({
        stageId: matterStage.id,
        name: stage.name,
        reason: skipReason,
      });

      // Log exception for skipped stage
      await tx.insert(taskExceptions).values({
        firmId,
        objectType: "stage",
        objectId: matterStage.id,
        exceptionType: "not_applicable",
        reason: skipReason,
        decisionSource: "system",
        approvedById: activatedById,
      });

      // Create timeline event for skipped stage
      await createTimelineEvent(tx, {
        firmId,
        matterId,
        type: "stage_skipped",
        title: `Stage skipped: ${stage.name}`,
        description: skipReason,
        actorType: "system",
        actorId: activatedById,
        entityType: "matter_stage",
        entityId: matterStage.id,
        metadata: {
          workflowStageId: stage.id,
          conditions,
        },
        occurredAt: new Date(),
      });
    }
  }

  // Update workflow with current stage
  if (firstApplicableStageId) {
    await tx
      .update(matterWorkflows)
      .set({ currentStageId: firstApplicableStageId })
      .where(eq(matterWorkflows.id, matterWorkflow.id));

    matterWorkflow.currentStageId = firstApplicableStageId;
  }

  // Create timeline event for workflow activation
  await createTimelineEvent(tx, {
    firmId,
    matterId,
    type: "workflow_activated",
    title: `Workflow activated: ${template.name}`,
    description: `Version ${template.version}`,
    actorType: "user",
    actorId: activatedById,
    entityType: "matter_workflow",
    entityId: matterWorkflow.id,
    metadata: {
      templateKey: template.key,
      version: template.version,
      totalStages: templateStages.length,
      skippedStages: skippedStages.length,
      totalTasks: createdTasks.length,
    },
    occurredAt: new Date(),
  });

  return {
    matterWorkflow,
    stages: createdStages,
    tasks: createdTasks,
    skippedStages,
  };
}

/**
 * Create tasks for a stage from workflow task templates.
 */
async function createTasksForStage(
  tx: PostgresJsDatabase<Record<string, never>>,
  params: {
    firmId: string;
    matterId: string;
    matterStageId: string;
    workflowStageId: string;
    activatedById: string;
  }
): Promise<Array<typeof tasks.$inferSelect>> {
  const { firmId, matterId, matterStageId, workflowStageId, activatedById } = params;

  // Get task templates for this stage
  const taskTemplates = await tx
    .select()
    .from(workflowTaskTemplates)
    .where(eq(workflowTaskTemplates.stageId, workflowStageId))
    .orderBy(asc(workflowTaskTemplates.sortOrder));

  const createdTasks: Array<typeof tasks.$inferSelect> = [];

  for (const template of taskTemplates) {
    // Calculate due date if relative due days specified
    const dueDate = template.relativeDueDays
      ? calculateDueDate({
          relativeDays: template.relativeDueDays,
          relativeTo: template.dueDateRelativeTo ?? "task_created",
          referenceDate: new Date(),
        })
      : null;

    const [task] = await tx
      .insert(tasks)
      .values({
        firmId,
        matterId,
        matterStageId,
        workflowTaskTemplateId: template.id,
        title: template.title,
        description: template.description,
        source: "workflow",
        isMandatory: template.isMandatory,
        requiresEvidence: template.requiresEvidence,
        requiredEvidenceTypes: template.requiredEvidenceTypes,
        requiresVerifiedEvidence: template.requiresVerifiedEvidence,
        requiresApproval: template.requiresApproval,
        requiredApproverRole: template.requiredApproverRole,
        priority: template.defaultPriority,
        clientVisible: template.clientVisible,
        regulatoryBasis: template.regulatoryBasis,
        dueDate,
        createdById: activatedById,
      })
      .returning();

    createdTasks.push(task);
  }

  return createdTasks;
}

/**
 * Evaluate applicability conditions against matter conditions.
 *
 * Returns true if:
 * - No applicability conditions defined (null/empty)
 * - All conditions are satisfied
 *
 * Conditions are AND-ed together.
 */
export function evaluateApplicabilityConditions(
  applicabilityConditions: ApplicabilityConditions | null,
  matterConditions: Record<string, boolean | string | number>
): boolean {
  if (!applicabilityConditions || Object.keys(applicabilityConditions).length === 0) {
    return true;
  }

  for (const [key, requiredValue] of Object.entries(applicabilityConditions)) {
    const actualValue = matterConditions[key];

    // If condition key is not in matter conditions, treat as false
    if (actualValue === undefined) {
      return false;
    }

    // Compare values
    if (actualValue !== requiredValue) {
      return false;
    }
  }

  return true;
}

/**
 * Build a human-readable reason for why a stage was skipped.
 */
function buildSkipReason(
  applicabilityConditions: ApplicabilityConditions | null,
  matterConditions: Record<string, boolean | string | number>
): string {
  if (!applicabilityConditions) {
    return "Stage applicability conditions not met";
  }

  const unmetConditions: string[] = [];

  for (const [key, requiredValue] of Object.entries(applicabilityConditions)) {
    const actualValue = matterConditions[key];

    if (actualValue === undefined) {
      unmetConditions.push(`${key} is not defined (required: ${requiredValue})`);
    } else if (actualValue !== requiredValue) {
      unmetConditions.push(`${key} = ${actualValue} (required: ${requiredValue})`);
    }
  }

  if (unmetConditions.length === 0) {
    return "Stage applicability conditions not met";
  }

  return `Applicability conditions not met: ${unmetConditions.join(", ")}`;
}
