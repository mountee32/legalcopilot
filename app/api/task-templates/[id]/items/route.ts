/**
 * Task Template Items API
 *
 * GET  /api/task-templates/:id/items - List template items
 * POST /api/task-templates/:id/items - Add item to template
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, asc, sql } from "drizzle-orm";
import { taskTemplates, taskTemplateItems } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTaskTemplateItemSchema } from "@/lib/api/schemas/task-templates";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ForbiddenError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const items = await withFirmDb(firmId, async (tx) => {
        // Verify template exists and is accessible
        const [template] = await tx
          .select({ id: taskTemplates.id, firmId: taskTemplates.firmId })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, id))
          .limit(1);

        if (!template) {
          throw new NotFoundError("Task template not found");
        }

        // Must be system template or firm's template
        if (template.firmId !== null && template.firmId !== firmId) {
          throw new NotFoundError("Task template not found");
        }

        return tx
          .select()
          .from(taskTemplateItems)
          .where(eq(taskTemplateItems.templateId, id))
          .orderBy(asc(taskTemplateItems.sortOrder));
      });

      return NextResponse.json({ items });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("settings:write")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id: templateId } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaskTemplateItemSchema.parse(body);

      const item = await withFirmDb(firmId, async (tx) => {
        // Verify template exists and is editable
        const [template] = await tx
          .select({ id: taskTemplates.id, firmId: taskTemplates.firmId })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, templateId))
          .limit(1);

        if (!template) {
          throw new NotFoundError("Task template not found");
        }

        if (template.firmId === null) {
          throw new ForbiddenError("Cannot modify system templates");
        }

        if (template.firmId !== firmId) {
          throw new NotFoundError("Task template not found");
        }

        // Get max sort order if not provided
        let sortOrder = data.sortOrder;
        if (sortOrder === undefined) {
          const [maxOrder] = await tx
            .select({ max: sql<number>`COALESCE(MAX(sort_order), -1)` })
            .from(taskTemplateItems)
            .where(eq(taskTemplateItems.templateId, templateId));
          sortOrder = (maxOrder?.max ?? -1) + 1;
        }

        // Create item
        const [item] = await tx
          .insert(taskTemplateItems)
          .values({
            templateId,
            title: data.title,
            description: data.description ?? null,
            mandatory: data.mandatory ?? false,
            category: data.category,
            defaultPriority: data.defaultPriority ?? "medium",
            relativeDueDays: data.relativeDueDays ?? null,
            dueDateAnchor: data.dueDateAnchor ?? null,
            assigneeRole: data.assigneeRole ?? null,
            checklistItems: data.checklistItems ?? null,
            sortOrder,
          })
          .returning();

        return item;
      });

      return NextResponse.json(item, { status: 201 });
    })
  )
);
