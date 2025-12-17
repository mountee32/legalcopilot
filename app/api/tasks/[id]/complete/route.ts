import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ id: tasks.id, status: tasks.status, matterId: tasks.matterId })
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Task not found");

        if (current.status === "completed") {
          const [row] = await tx
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
            .limit(1);
          return row ?? null;
        }

        const [row] = await tx
          .update(tasks)
          .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .returning();

        if (row) {
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
