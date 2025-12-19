/**
 * Matter Stages API
 *
 * GET /api/matters/[id]/stages - List stages for a matter's workflow
 */

import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { matters, matterWorkflows, matterStages, tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { sql } from "drizzle-orm";

/**
 * GET /api/matters/[id]/stages
 * List all stages for a matter's workflow with task counts and progress.
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
          .select({ id: matterWorkflows.id, currentStageId: matterWorkflows.currentStageId })
          .from(matterWorkflows)
          .where(eq(matterWorkflows.matterId, matterId))
          .limit(1);

        if (!workflow) {
          return { stages: [], currentStageId: null };
        }

        // Get stages with task counts
        const stages = await tx
          .select()
          .from(matterStages)
          .where(eq(matterStages.matterWorkflowId, workflow.id))
          .orderBy(asc(matterStages.sortOrder));

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

            const totalTasks = Number(taskCounts?.total ?? 0);
            const completedTasks = Number(taskCounts?.completed ?? 0);

            return {
              ...stage,
              totalTasks,
              completedTasks,
              mandatoryTasks: Number(taskCounts?.mandatory ?? 0),
              completedMandatoryTasks: Number(taskCounts?.completedMandatory ?? 0),
              progressPercent:
                totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100),
              isCurrent: stage.id === workflow.currentStageId,
            };
          })
        );

        return {
          stages: stagesWithCounts,
          currentStageId: workflow.currentStageId,
        };
      });

      return NextResponse.json(result);
    })
  )
);
