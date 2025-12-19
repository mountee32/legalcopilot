/**
 * Matter Workflow API
 *
 * GET  /api/matters/[id]/workflow - Get the workflow for a matter
 * POST /api/matters/[id]/workflow - Activate a workflow on a matter
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import {
  matters,
  matterWorkflows,
  matterStages,
  workflowTemplates,
  workflowStages,
  tasks,
  evidenceItems,
  taskNotes,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ActivateWorkflowSchema } from "@/lib/api/schemas";
import { activateWorkflow } from "@/lib/workflows";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { sql } from "drizzle-orm";

/**
 * GET /api/matters/[id]/workflow
 * Get the active workflow for a matter with stages and task counts.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        // Get the workflow for this matter
        const [workflow] = await tx
          .select()
          .from(matterWorkflows)
          .where(eq(matterWorkflows.matterId, matterId))
          .limit(1);

        if (!workflow) {
          return null;
        }

        // Get the template info
        const [template] = await tx
          .select({
            key: workflowTemplates.key,
            name: workflowTemplates.name,
            practiceArea: workflowTemplates.practiceArea,
          })
          .from(workflowTemplates)
          .where(eq(workflowTemplates.id, workflow.workflowTemplateId))
          .limit(1);

        // Get stages with task counts
        const stages = await tx
          .select()
          .from(matterStages)
          .where(eq(matterStages.matterWorkflowId, workflow.id))
          .orderBy(asc(matterStages.sortOrder));

        // Get the template stages with gate types
        const templateStages = await tx
          .select({
            id: workflowStages.id,
            gateType: workflowStages.gateType,
            completionCriteria: workflowStages.completionCriteria,
          })
          .from(workflowStages)
          .where(eq(workflowStages.workflowTemplateId, workflow.workflowTemplateId));

        const templateStageMap = new Map(templateStages.map((s) => [s.id, s]));

        const stagesWithCounts = await Promise.all(
          stages.map(async (stage) => {
            // Get task counts for this stage
            const [taskCounts] = await tx
              .select({
                total: sql<number>`count(*)`,
                completed: sql<number>`count(*) filter (where status in ('completed', 'skipped', 'not_applicable'))`,
                mandatory: sql<number>`count(*) filter (where is_mandatory = true)`,
                completedMandatory: sql<number>`count(*) filter (where is_mandatory = true and status in ('completed', 'skipped', 'not_applicable'))`,
              })
              .from(tasks)
              .where(eq(tasks.matterStageId, stage.id));

            // Get full task details for this stage
            const stageTasks = await tx
              .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                status: tasks.status,
                priority: tasks.priority,
                dueDate: tasks.dueDate,
                completedAt: tasks.completedAt,
                isMandatory: tasks.isMandatory,
                requiresEvidence: tasks.requiresEvidence,
                requiresVerifiedEvidence: tasks.requiresVerifiedEvidence,
                requiredEvidenceTypes: tasks.requiredEvidenceTypes,
                requiresApproval: tasks.requiresApproval,
                approvalStatus: tasks.approvalStatus,
                assigneeId: tasks.assigneeId,
              })
              .from(tasks)
              .where(eq(tasks.matterStageId, stage.id))
              .orderBy(asc(tasks.createdAt));

            // Get evidence and notes for each task
            const tasksWithDetails = await Promise.all(
              stageTasks.map(async (task) => {
                // Get evidence counts
                const [evidenceCounts] = await tx
                  .select({
                    total: sql<number>`count(*)`,
                    verified: sql<number>`count(*) filter (where verified_at is not null)`,
                  })
                  .from(evidenceItems)
                  .where(eq(evidenceItems.taskId, task.id));

                // Get latest note for blocking context
                const [latestNote] = await tx
                  .select({
                    content: taskNotes.content,
                    createdAt: taskNotes.createdAt,
                  })
                  .from(taskNotes)
                  .where(and(eq(taskNotes.taskId, task.id), eq(taskNotes.isCurrent, true)))
                  .orderBy(sql`${taskNotes.createdAt} desc`)
                  .limit(1);

                // Compute blocking status
                const hasEvidence = Number(evidenceCounts?.total ?? 0) > 0;
                const hasVerifiedEvidence = Number(evidenceCounts?.verified ?? 0) > 0;
                const isBlocked =
                  (task.requiresEvidence && !hasEvidence) ||
                  (task.requiresVerifiedEvidence && !hasVerifiedEvidence) ||
                  (task.requiresApproval && task.approvalStatus === "pending");

                // Compute blocking reasons
                const blockingReasons: string[] = [];
                if (task.requiresEvidence && !hasEvidence) {
                  blockingReasons.push("Awaiting evidence");
                } else if (task.requiresVerifiedEvidence && !hasVerifiedEvidence) {
                  blockingReasons.push("Evidence requires verification");
                }
                if (task.requiresApproval && task.approvalStatus === "pending") {
                  blockingReasons.push("Pending approval");
                }

                return {
                  ...task,
                  evidenceCount: Number(evidenceCounts?.total ?? 0),
                  verifiedEvidenceCount: Number(evidenceCounts?.verified ?? 0),
                  latestNote: latestNote?.content ?? null,
                  isBlocked,
                  blockingReasons,
                };
              })
            );

            // Get template stage info for gate type
            const templateStage = templateStageMap.get(stage.workflowStageId);

            return {
              ...stage,
              gateType: templateStage?.gateType ?? "none",
              completionCriteria: templateStage?.completionCriteria ?? "all_mandatory_tasks",
              totalTasks: Number(taskCounts?.total ?? 0),
              completedTasks: Number(taskCounts?.completed ?? 0),
              mandatoryTasks: Number(taskCounts?.mandatory ?? 0),
              completedMandatoryTasks: Number(taskCounts?.completedMandatory ?? 0),
              tasks: tasksWithDetails,
            };
          })
        );

        return {
          ...workflow,
          template,
          stages: stagesWithCounts,
        };
      });

      if (!result) {
        return NextResponse.json({ workflow: null });
      }

      return NextResponse.json({ workflow: result });
    })
  )
);

/**
 * POST /api/matters/[id]/workflow
 * Activate a workflow on a matter.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = ActivateWorkflowSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        // Check if matter already has a workflow
        const [existingWorkflow] = await tx
          .select({ id: matterWorkflows.id })
          .from(matterWorkflows)
          .where(eq(matterWorkflows.matterId, matterId))
          .limit(1);

        if (existingWorkflow) {
          throw new ValidationError("Matter already has an active workflow");
        }

        // Activate the workflow
        const activationResult = await activateWorkflow(tx, {
          firmId,
          matterId,
          workflowTemplateId: data.workflowTemplateId,
          activatedById: user.user.id,
          conditions: data.conditions,
        });

        return activationResult;
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
