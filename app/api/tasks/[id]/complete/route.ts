import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const CompleteTaskSchema = z.object({
  completionNotes: z.string().max(10_000).optional(),
});

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json().catch(() => ({}));
      const data = CompleteTaskSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({
            id: tasks.id,
            status: tasks.status,
            matterId: tasks.matterId,
            title: tasks.title,
          })
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Task not found");

        if (current.status === "completed") {
          throw new ValidationError("Task is already completed");
        }

        const now = new Date();
        const [row] = await tx
          .update(tasks)
          .set({ status: "completed", completedAt: now, updatedAt: now })
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .returning();

        if (!row) throw new NotFoundError("Task not found");

        await createTimelineEvent(tx, {
          firmId,
          matterId: row.matterId,
          type: "task_completed",
          title: "Task completed",
          description: data.completionNotes
            ? `Task "${current.title}" was completed. Notes: ${data.completionNotes}`
            : `Task "${current.title}" was completed`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "task",
          entityId: row.id,
          occurredAt: now,
          metadata: data.completionNotes ? { completionNotes: data.completionNotes } : undefined,
        });

        return row;
      });

      return NextResponse.json(updated);
    })
  )
);
