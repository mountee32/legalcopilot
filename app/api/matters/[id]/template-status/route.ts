/**
 * Matter Template Status API
 *
 * GET /api/matters/:id/template-status - Get applied templates and skipped items
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, isNull, asc, desc, inArray } from "drizzle-orm";
import {
  matters,
  taskTemplates,
  taskTemplateItems,
  matterTemplateApplications,
  users,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import type { TemplateItemApplication } from "@/lib/db/schema/task-templates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id: matterId } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) {
          throw new NotFoundError("Matter not found");
        }

        // Get all template applications for this matter
        const applications = await tx
          .select({
            id: matterTemplateApplications.id,
            templateId: matterTemplateApplications.templateId,
            appliedAt: matterTemplateApplications.appliedAt,
            appliedById: matterTemplateApplications.appliedById,
            itemsApplied: matterTemplateApplications.itemsApplied,
          })
          .from(matterTemplateApplications)
          .where(eq(matterTemplateApplications.matterId, matterId))
          .orderBy(desc(matterTemplateApplications.appliedAt));

        // Enrich applications with template names and user names
        const enrichedApplications = await Promise.all(
          applications.map(async (app) => {
            const [template] = await tx
              .select({ name: taskTemplates.name })
              .from(taskTemplates)
              .where(eq(taskTemplates.id, app.templateId))
              .limit(1);

            let appliedByName: string | null = null;
            if (app.appliedById) {
              const [applier] = await tx
                .select({ name: users.name })
                .from(users)
                .where(eq(users.id, app.appliedById))
                .limit(1);
              appliedByName = applier?.name ?? null;
            }

            return {
              id: app.id,
              templateId: app.templateId,
              templateName: template?.name ?? "Unknown Template",
              appliedAt: app.appliedAt.toISOString(),
              appliedById: app.appliedById,
              appliedByName,
              itemsApplied: app.itemsApplied as TemplateItemApplication[],
            };
          })
        );

        // Collect all skipped item IDs across all applications
        const skippedItemIds = enrichedApplications.flatMap((app) =>
          app.itemsApplied.filter((i) => i.wasSkipped).map((i) => i.templateItemId)
        );

        // Get skipped items
        const skippedItems =
          skippedItemIds.length > 0
            ? await tx
                .select()
                .from(taskTemplateItems)
                .where(inArray(taskTemplateItems.id, skippedItemIds))
                .orderBy(asc(taskTemplateItems.sortOrder))
            : [];

        // Get available templates for this matter's practice area
        const availableTemplates = await tx
          .select()
          .from(taskTemplates)
          .where(
            and(
              eq(taskTemplates.practiceArea, matter.practiceArea),
              eq(taskTemplates.isActive, true),
              or(eq(taskTemplates.firmId, firmId), isNull(taskTemplates.firmId))
            )
          )
          .orderBy(desc(taskTemplates.isDefault), taskTemplates.name);

        return {
          applications: enrichedApplications,
          skippedItems,
          availableTemplates,
        };
      });

      return NextResponse.json(result);
    })
  )
);
