/**
 * Task Template Item Detail API
 *
 * PUT    /api/task-templates/:id/items/:itemId - Update item
 * DELETE /api/task-templates/:id/items/:itemId - Delete item
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { taskTemplates, taskTemplateItems } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaskTemplateItemSchema } from "@/lib/api/schemas/task-templates";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ForbiddenError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

export const PUT = withErrorHandler(
  withAuth(
    withPermission("settings:write")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id: templateId, itemId } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateTaskTemplateItemSchema.parse(body);

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

        // Get existing item
        const [existing] = await tx
          .select()
          .from(taskTemplateItems)
          .where(
            and(eq(taskTemplateItems.id, itemId), eq(taskTemplateItems.templateId, templateId))
          )
          .limit(1);

        if (!existing) {
          throw new NotFoundError("Template item not found");
        }

        // Update item
        const [updated] = await tx
          .update(taskTemplateItems)
          .set({
            title: data.title ?? existing.title,
            description: data.description !== undefined ? data.description : existing.description,
            mandatory: data.mandatory ?? existing.mandatory,
            category: data.category ?? existing.category,
            defaultPriority: data.defaultPriority ?? existing.defaultPriority,
            relativeDueDays:
              data.relativeDueDays !== undefined ? data.relativeDueDays : existing.relativeDueDays,
            dueDateAnchor:
              data.dueDateAnchor !== undefined ? data.dueDateAnchor : existing.dueDateAnchor,
            assigneeRole:
              data.assigneeRole !== undefined ? data.assigneeRole : existing.assigneeRole,
            checklistItems:
              data.checklistItems !== undefined ? data.checklistItems : existing.checklistItems,
            sortOrder: data.sortOrder ?? existing.sortOrder,
          })
          .where(eq(taskTemplateItems.id, itemId))
          .returning();

        return updated;
      });

      return NextResponse.json(item);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("settings:write")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id: templateId, itemId } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
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

        // Verify item exists
        const [existing] = await tx
          .select({ id: taskTemplateItems.id })
          .from(taskTemplateItems)
          .where(
            and(eq(taskTemplateItems.id, itemId), eq(taskTemplateItems.templateId, templateId))
          )
          .limit(1);

        if (!existing) {
          throw new NotFoundError("Template item not found");
        }

        // Delete item
        await tx.delete(taskTemplateItems).where(eq(taskTemplateItems.id, itemId));
      });

      return NextResponse.json({ success: true });
    })
  )
);
