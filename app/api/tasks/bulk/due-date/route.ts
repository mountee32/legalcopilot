/**
 * Bulk Set Due Date API
 *
 * POST /api/tasks/bulk/due-date - Set due date for multiple tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { BulkSetDueDateSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

interface BulkResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/tasks/bulk/due-date
 * Set or clear the due date for multiple tasks.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { user }) => {
      const body = await request.json();
      const data = BulkSetDueDateSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get all requested tasks
        const requestedTasks = await tx
          .select({
            id: tasks.id,
            title: tasks.title,
            matterId: tasks.matterId,
            status: tasks.status,
            dueDate: tasks.dueDate,
          })
          .from(tasks)
          .where(and(eq(tasks.firmId, firmId), inArray(tasks.id, data.ids)));

        if (requestedTasks.length === 0) {
          throw new NotFoundError("No tasks found");
        }

        const results: BulkResult[] = [];
        const tasksToUpdate: string[] = [];
        const now = new Date();
        const newDueDate = data.dueDate ? new Date(data.dueDate) : null;

        // Validate each task
        for (const taskId of data.ids) {
          const task = requestedTasks.find((t) => t.id === taskId);

          if (!task) {
            results.push({ id: taskId, success: false, error: "Task not found" });
            continue;
          }

          // Can't modify completed/cancelled tasks
          if (task.status === "completed" || task.status === "cancelled") {
            results.push({
              id: taskId,
              success: false,
              error: `Cannot modify task with status '${task.status}'`,
            });
            continue;
          }

          tasksToUpdate.push(taskId);
          results.push({ id: taskId, success: true });
        }

        // Update eligible tasks
        if (tasksToUpdate.length > 0) {
          await tx
            .update(tasks)
            .set({
              dueDate: newDueDate,
              updatedAt: now,
            })
            .where(and(eq(tasks.firmId, firmId), inArray(tasks.id, tasksToUpdate)));

          // Create timeline events for updated tasks
          for (const taskId of tasksToUpdate) {
            const task = requestedTasks.find((t) => t.id === taskId);
            if (task) {
              const description = newDueDate
                ? `Due date set to ${newDueDate.toISOString().split("T")[0]}`
                : "Due date cleared";

              await createTimelineEvent(tx, {
                firmId,
                matterId: task.matterId,
                type: "task_updated",
                title: "Task due date updated",
                description: `Task "${task.title}": ${description} (bulk)`,
                actorType: "user",
                actorId: user.user.id,
                entityType: "task",
                entityId: taskId,
                occurredAt: now,
                metadata: {
                  bulk: true,
                  dueDate: newDueDate?.toISOString() ?? null,
                  previousDueDate: task.dueDate?.toISOString() ?? null,
                },
              });
            }
          }
        }

        return results;
      });

      const processed = result.filter((r) => r.success).length;
      const failed = result.filter((r) => !r.success).length;

      return NextResponse.json({
        success: failed === 0,
        processed,
        failed,
        results: result,
      });
    })
  )
);
