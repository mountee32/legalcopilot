/**
 * Matter Stage Detail API
 *
 * GET /api/matters/[id]/stages/[stageId] - Get a stage with tasks
 */

import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import {
  matters,
  matterWorkflows,
  matterStages,
  tasks,
  users,
  workflowStages,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { checkGate, getStageGateType } from "@/lib/workflows";
import { sql } from "drizzle-orm";

/**
 * GET /api/matters/[id]/stages/[stageId]
 * Get a stage with its tasks and gate status.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const matterId = resolvedParams.id;
      const stageId = resolvedParams.stageId;

      if (!matterId) throw new NotFoundError("Matter not found");
      if (!stageId) throw new NotFoundError("Stage not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        // Get the stage
        const [stage] = await tx
          .select()
          .from(matterStages)
          .where(eq(matterStages.id, stageId))
          .limit(1);

        if (!stage) throw new NotFoundError("Stage not found");

        // Verify stage belongs to this matter's workflow
        const [workflow] = await tx
          .select({ id: matterWorkflows.id, matterId: matterWorkflows.matterId })
          .from(matterWorkflows)
          .where(eq(matterWorkflows.id, stage.matterWorkflowId))
          .limit(1);

        if (!workflow || workflow.matterId !== matterId) {
          throw new NotFoundError("Stage not found");
        }

        // Get the workflow stage template for gate info
        const [workflowStage] = await tx
          .select({
            gateType: workflowStages.gateType,
            completionCriteria: workflowStages.completionCriteria,
            description: workflowStages.description,
          })
          .from(workflowStages)
          .where(eq(workflowStages.id, stage.workflowStageId))
          .limit(1);

        // Get tasks for this stage with assignee info
        const stageTasks = await tx
          .select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
            status: tasks.status,
            priority: tasks.priority,
            isMandatory: tasks.isMandatory,
            requiresEvidence: tasks.requiresEvidence,
            requiresApproval: tasks.requiresApproval,
            approvalStatus: tasks.approvalStatus,
            dueDate: tasks.dueDate,
            completedAt: tasks.completedAt,
            assigneeId: tasks.assigneeId,
            assigneeName: users.name,
            createdAt: tasks.createdAt,
          })
          .from(tasks)
          .leftJoin(users, eq(tasks.assigneeId, users.id))
          .where(eq(tasks.matterStageId, stageId))
          .orderBy(asc(tasks.createdAt));

        // Get task counts
        const [taskCounts] = await tx
          .select({
            total: sql<number>`count(*)`,
            completed: sql<number>`count(*) filter (where status in ('completed', 'skipped', 'not_applicable'))`,
            mandatory: sql<number>`count(*) filter (where is_mandatory = true)`,
            completedMandatory: sql<number>`count(*) filter (where is_mandatory = true and status in ('completed', 'skipped', 'not_applicable'))`,
          })
          .from(tasks)
          .where(eq(tasks.matterStageId, stageId));

        // Check gate status
        const gateCheck = await checkGate(tx, stageId);
        const gateType = await getStageGateType(tx, stageId);

        const totalTasks = Number(taskCounts?.total ?? 0);
        const completedTasks = Number(taskCounts?.completed ?? 0);

        return {
          ...stage,
          description: workflowStage?.description ?? null,
          gateType,
          completionCriteria: workflowStage?.completionCriteria ?? "all_mandatory_tasks",
          tasks: stageTasks,
          totalTasks,
          completedTasks,
          mandatoryTasks: Number(taskCounts?.mandatory ?? 0),
          completedMandatoryTasks: Number(taskCounts?.completedMandatory ?? 0),
          progressPercent: totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100),
          gate: {
            type: gateType,
            canProceed: gateCheck.canProceed,
            isBlocked: gateCheck.isBlocked,
            blockedBy: gateCheck.blockedBy,
            warnings: gateCheck.warnings,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);
