/**
 * Workflow Templates API
 *
 * GET /api/workflows - List available workflow templates
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql, asc } from "drizzle-orm";
import { workflowTemplates, workflowStages, workflowTaskTemplates } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { WorkflowQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/workflows
 * List available workflow templates with optional practice area filter.
 * Returns templates with stage counts.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest) => {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = WorkflowQuerySchema.parse(searchParams);

      // Build where conditions
      const conditions = [];

      if (query.practiceArea) {
        conditions.push(eq(workflowTemplates.practiceArea, query.practiceArea));
      }

      if (query.isActive !== undefined) {
        conditions.push(eq(workflowTemplates.isActive, query.isActive));
      } else {
        // Default to active only
        conditions.push(eq(workflowTemplates.isActive, true));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countRow] = await db
        .select({ total: sql<number>`count(*)` })
        .from(workflowTemplates)
        .where(where);

      const total = Number(countRow?.total ?? 0);
      const offset = (query.page - 1) * query.limit;

      // Get workflows with stage counts
      const workflows = await db
        .select({
          id: workflowTemplates.id,
          key: workflowTemplates.key,
          version: workflowTemplates.version,
          name: workflowTemplates.name,
          description: workflowTemplates.description,
          practiceArea: workflowTemplates.practiceArea,
          subTypes: workflowTemplates.subTypes,
          isDefault: workflowTemplates.isDefault,
          isActive: workflowTemplates.isActive,
          releasedAt: workflowTemplates.releasedAt,
          createdAt: workflowTemplates.createdAt,
        })
        .from(workflowTemplates)
        .where(where)
        .orderBy(asc(workflowTemplates.name))
        .limit(query.limit)
        .offset(offset);

      // Get stage and task counts for each workflow
      const workflowsWithCounts = await Promise.all(
        workflows.map(async (workflow) => {
          // Count stages
          const [stageCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(workflowStages)
            .where(eq(workflowStages.workflowTemplateId, workflow.id));

          // Count tasks across all stages
          const [taskCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(workflowTaskTemplates)
            .innerJoin(workflowStages, eq(workflowTaskTemplates.stageId, workflowStages.id))
            .where(eq(workflowStages.workflowTemplateId, workflow.id));

          return {
            ...workflow,
            stageCount: Number(stageCount?.count ?? 0),
            taskCount: Number(taskCount?.count ?? 0),
          };
        })
      );

      const totalPages = Math.ceil(total / query.limit);

      return NextResponse.json({
        workflows: workflowsWithCounts,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);
