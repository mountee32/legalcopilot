/**
 * Workflow Template Detail API
 *
 * GET /api/workflows/[id] - Get a workflow template with stages and tasks
 */

import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { workflowTemplates, workflowStages, workflowTaskTemplates } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/workflows/[id]
 * Get a workflow template with all stages and task templates.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Workflow not found");

      // Get the workflow template
      const [workflow] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, id))
        .limit(1);

      if (!workflow) throw new NotFoundError("Workflow not found");

      // Get all stages
      const stages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowTemplateId, id))
        .orderBy(asc(workflowStages.sortOrder));

      // Get task templates for each stage
      const stagesWithTasks = await Promise.all(
        stages.map(async (stage) => {
          const tasks = await db
            .select()
            .from(workflowTaskTemplates)
            .where(eq(workflowTaskTemplates.stageId, stage.id))
            .orderBy(asc(workflowTaskTemplates.sortOrder));

          return {
            ...stage,
            tasks,
          };
        })
      );

      return NextResponse.json({
        workflow: {
          ...workflow,
          stages: stagesWithTasks,
        },
      });
    })
  )
);
