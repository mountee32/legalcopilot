import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { tasks, taskNotes, evidenceItems } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaskSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) return null;

        // Get notes count (current versions only)
        const [notesCountRow] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(taskNotes)
          .where(
            and(
              eq(taskNotes.taskId, id),
              eq(taskNotes.firmId, firmId),
              eq(taskNotes.isCurrent, true)
            )
          );

        // Get evidence count
        const [evidenceCountRow] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(evidenceItems)
          .where(and(eq(evidenceItems.taskId, id), eq(evidenceItems.firmId, firmId)));

        return {
          ...task,
          notesCount: Number(notesCountRow?.count ?? 0),
          evidenceCount: Number(evidenceCountRow?.count ?? 0),
        };
      });

      if (!result) throw new NotFoundError("Task not found");
      return NextResponse.json(result);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();

      // isMandatory is immutable after creation - reject any attempt to change it
      if ("isMandatory" in body) {
        throw new ValidationError("The isMandatory field cannot be changed after task creation");
      }

      const data = UpdateTaskSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ id: tasks.id, matterId: tasks.matterId, status: tasks.status })
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);
        if (!current) throw new NotFoundError("Task not found");

        const nextStatus = data.status ?? current.status;
        const completedAt =
          nextStatus === "completed" ? new Date() : nextStatus !== "completed" ? null : undefined;

        const [row] = await tx
          .update(tasks)
          .set({
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            assigneeId: data.assigneeId ?? undefined,
            priority: data.priority ?? undefined,
            status: data.status ?? undefined,
            dueDate:
              data.dueDate === undefined
                ? undefined
                : data.dueDate === null
                  ? null
                  : new Date(data.dueDate),
            checklistItems: data.checklistItems ?? undefined,
            tags: data.tags ?? undefined,
            completedAt,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .returning();

        if (row && current.status !== "completed" && row.status === "completed") {
          await createTimelineEvent(tx, {
            firmId,
            matterId: row.matterId,
            type: "task_completed",
            title: "Task completed",
            actorType: "user",
            actorId: user.user.id,
            entityType: "task",
            entityId: row.id,
            occurredAt: new Date(),
          });
        }

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Task not found");
      return NextResponse.json(updated);
    })
  )
);
