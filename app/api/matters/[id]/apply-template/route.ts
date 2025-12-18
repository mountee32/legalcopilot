/**
 * Apply Template to Matter API
 *
 * POST /api/matters/:id/apply-template - Apply template and create tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, isNull, asc } from "drizzle-orm";
import {
  matters,
  tasks,
  taskTemplates,
  taskTemplateItems,
  matterTemplateApplications,
  users,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ApplyTemplateSchema } from "@/lib/api/schemas/task-templates";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import type { TemplateItemApplication } from "@/lib/db/schema/task-templates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { id: matterId } = await rest.params;

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = ApplyTemplateSchema.parse(body);

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

        // Verify template exists and is accessible
        const [template] = await tx
          .select()
          .from(taskTemplates)
          .where(
            and(
              eq(taskTemplates.id, data.templateId),
              or(eq(taskTemplates.firmId, firmId), isNull(taskTemplates.firmId))
            )
          )
          .limit(1);

        if (!template) {
          throw new NotFoundError("Task template not found");
        }

        // Get template items
        const items = await tx
          .select()
          .from(taskTemplateItems)
          .where(eq(taskTemplateItems.templateId, data.templateId))
          .orderBy(asc(taskTemplateItems.sortOrder));

        // Build modifications map
        const modificationsMap = new Map(
          (data.modifications ?? []).map((m) => [m.templateItemId, m])
        );

        // Determine which items to create
        const selectedIds = new Set(data.selectedItemIds ?? items.map((i) => i.id));

        // Get fee earner and supervisor for role resolution
        const feeEarner = matter.feeEarnerId
          ? await tx.select().from(users).where(eq(users.id, matter.feeEarnerId)).limit(1)
          : [];
        const supervisor = matter.supervisorId
          ? await tx.select().from(users).where(eq(users.id, matter.supervisorId)).limit(1)
          : [];

        const roleToUserId: Record<string, string | null> = {
          fee_earner: matter.feeEarnerId,
          supervisor: matter.supervisorId,
          paralegal: null, // Would need team member lookup
          secretary: null,
        };

        // Create tasks and track applications
        const createdTasks: { id: string; title: string; templateItemId: string | null }[] = [];
        const itemsApplied: TemplateItemApplication[] = [];

        for (const item of items) {
          const isSelected = selectedIds.has(item.id);
          const isMandatory = item.mandatory;
          const shouldCreate = isMandatory || isSelected;

          if (!shouldCreate) {
            itemsApplied.push({
              templateItemId: item.id,
              taskId: undefined,
              wasModified: false,
              wasSkipped: true,
            });
            continue;
          }

          const modification = modificationsMap.get(item.id);
          const wasModified = !!modification;

          // Calculate due date
          let dueDate: Date | null = null;
          if (modification?.dueDate) {
            dueDate = new Date(modification.dueDate);
          } else if (item.relativeDueDays !== null && item.dueDateAnchor) {
            const anchorDate =
              item.dueDateAnchor === "matter_opened"
                ? (matter.openedAt ?? matter.createdAt)
                : item.dueDateAnchor === "key_deadline"
                  ? matter.keyDeadline
                  : null;
            if (anchorDate) {
              dueDate = new Date(anchorDate);
              dueDate.setDate(dueDate.getDate() + item.relativeDueDays);
            }
          }

          // Resolve assignee
          const assigneeId =
            modification?.assigneeId ??
            (item.assigneeRole ? roleToUserId[item.assigneeRole] : null);

          // Create task
          const [task] = await tx
            .insert(tasks)
            .values({
              firmId,
              matterId,
              title: modification?.title ?? item.title,
              description: modification?.description ?? item.description,
              priority: modification?.priority ?? item.defaultPriority,
              status: "pending",
              assigneeId,
              createdById: user.user.id,
              dueDate,
              checklistItems: item.checklistItems,
              templateItemId: item.id,
            })
            .returning();

          createdTasks.push({
            id: task.id,
            title: task.title,
            templateItemId: item.id,
          });

          itemsApplied.push({
            templateItemId: item.id,
            taskId: task.id,
            wasModified,
            wasSkipped: false,
          });
        }

        // Record application
        const [application] = await tx
          .insert(matterTemplateApplications)
          .values({
            matterId,
            templateId: data.templateId,
            appliedById: user.user.id,
            itemsApplied,
          })
          .returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId,
          type: "template_applied",
          title: `Template applied: ${template.name}`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "task_template",
          entityId: template.id,
          occurredAt: new Date(),
          metadata: {
            templateName: template.name,
            tasksCreated: createdTasks.length,
            tasksSkipped: itemsApplied.filter((i) => i.wasSkipped).length,
          },
        });

        return {
          applicationId: application.id,
          tasksCreated: createdTasks.length,
          tasksSkipped: itemsApplied.filter((i) => i.wasSkipped).length,
          tasks: createdTasks,
        };
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
