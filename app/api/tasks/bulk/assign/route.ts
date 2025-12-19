/**
 * Bulk Assign Tasks API
 *
 * POST /api/tasks/bulk/assign - Assign multiple tasks to a user
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { tasks, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { BulkAssignTasksSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

interface BulkResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/tasks/bulk/assign
 * Assign multiple tasks to a user (or unassign by passing null).
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { user }) => {
      const body = await request.json();
      const data = BulkAssignTasksSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Validate assignee exists if provided
        let assigneeName: string | null = null;
        if (data.assigneeId) {
          const [assignee] = await tx
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.id, data.assigneeId))
            .limit(1);

          if (!assignee) {
            throw new ValidationError("Assignee not found");
          }
          assigneeName = assignee.name;
        }

        // Get all requested tasks
        const requestedTasks = await tx
          .select({
            id: tasks.id,
            title: tasks.title,
            matterId: tasks.matterId,
            status: tasks.status,
            assigneeId: tasks.assigneeId,
          })
          .from(tasks)
          .where(and(eq(tasks.firmId, firmId), inArray(tasks.id, data.ids)));

        if (requestedTasks.length === 0) {
          throw new NotFoundError("No tasks found");
        }

        const results: BulkResult[] = [];
        const tasksToAssign: string[] = [];
        const now = new Date();

        // Validate each task
        for (const taskId of data.ids) {
          const task = requestedTasks.find((t) => t.id === taskId);

          if (!task) {
            results.push({ id: taskId, success: false, error: "Task not found" });
            continue;
          }

          // Can't assign completed/cancelled tasks
          if (task.status === "completed" || task.status === "cancelled") {
            results.push({
              id: taskId,
              success: false,
              error: `Cannot assign task with status '${task.status}'`,
            });
            continue;
          }

          // Skip if already assigned to the same person
          if (task.assigneeId === data.assigneeId) {
            results.push({ id: taskId, success: true }); // Count as success, just no change
            continue;
          }

          tasksToAssign.push(taskId);
          results.push({ id: taskId, success: true });
        }

        // Assign eligible tasks
        if (tasksToAssign.length > 0) {
          await tx
            .update(tasks)
            .set({
              assigneeId: data.assigneeId,
              updatedAt: now,
            })
            .where(and(eq(tasks.firmId, firmId), inArray(tasks.id, tasksToAssign)));

          // Create timeline events for assigned tasks
          for (const taskId of tasksToAssign) {
            const task = requestedTasks.find((t) => t.id === taskId);
            if (task) {
              await createTimelineEvent(tx, {
                firmId,
                matterId: task.matterId,
                type: "task_updated",
                title: data.assigneeId ? `Task assigned to ${assigneeName}` : "Task unassigned",
                description: `Task "${task.title}" was ${data.assigneeId ? "assigned" : "unassigned"} (bulk)`,
                actorType: "user",
                actorId: user.user.id,
                entityType: "task",
                entityId: taskId,
                occurredAt: now,
                metadata: {
                  bulk: true,
                  assigneeId: data.assigneeId,
                  assigneeName,
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
