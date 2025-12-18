/**
 * Task Template Detail API
 *
 * GET    /api/task-templates/:id - Get template with items
 * PUT    /api/task-templates/:id - Update template
 * DELETE /api/task-templates/:id - Delete firm template
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, or, isNull, asc } from "drizzle-orm";
import { taskTemplates, taskTemplateItems } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaskTemplateSchema } from "@/lib/api/schemas/task-templates";
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

      const result = await withFirmDb(firmId, async (tx) => {
        // Get template (must be firm's or system template)
        const [template] = await tx
          .select()
          .from(taskTemplates)
          .where(
            and(
              eq(taskTemplates.id, id),
              or(eq(taskTemplates.firmId, firmId), isNull(taskTemplates.firmId))
            )
          )
          .limit(1);

        if (!template) {
          throw new NotFoundError("Task template not found");
        }

        // Get items
        const items = await tx
          .select()
          .from(taskTemplateItems)
          .where(eq(taskTemplateItems.templateId, id))
          .orderBy(asc(taskTemplateItems.sortOrder));

        return { ...template, items };
      });

      return NextResponse.json(result);
    })
  )
);

export const PUT = withErrorHandler(
  withAuth(
    withPermission("settings:write")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateTaskTemplateSchema.parse(body);

      const template = await withFirmDb(firmId, async (tx) => {
        // Get existing template
        const [existing] = await tx
          .select()
          .from(taskTemplates)
          .where(eq(taskTemplates.id, id))
          .limit(1);

        if (!existing) {
          throw new NotFoundError("Task template not found");
        }

        // Cannot modify system templates
        if (existing.firmId === null) {
          throw new ForbiddenError("Cannot modify system templates");
        }

        // Must be firm's own template
        if (existing.firmId !== firmId) {
          throw new NotFoundError("Task template not found");
        }

        // Update template
        const [updated] = await tx
          .update(taskTemplates)
          .set({
            name: data.name ?? existing.name,
            description: data.description !== undefined ? data.description : existing.description,
            isDefault: data.isDefault ?? existing.isDefault,
            isActive: data.isActive ?? existing.isActive,
            updatedAt: new Date(),
          })
          .where(eq(taskTemplates.id, id))
          .returning();

        return updated;
      });

      return NextResponse.json(template);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("settings:write")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        // Get existing template
        const [existing] = await tx
          .select()
          .from(taskTemplates)
          .where(eq(taskTemplates.id, id))
          .limit(1);

        if (!existing) {
          throw new NotFoundError("Task template not found");
        }

        // Cannot delete system templates
        if (existing.firmId === null) {
          throw new ForbiddenError("Cannot delete system templates");
        }

        // Must be firm's own template
        if (existing.firmId !== firmId) {
          throw new NotFoundError("Task template not found");
        }

        // Delete template (items cascade)
        await tx.delete(taskTemplates).where(eq(taskTemplates.id, id));
      });

      return NextResponse.json({ success: true });
    })
  )
);
