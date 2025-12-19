/**
 * Bulk Complete Tasks API
 *
 * POST /api/tasks/bulk/complete - Complete multiple tasks at once
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { BulkCompleteTasksSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { canTransitionToCompleted } from "@/lib/tasks/completion";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

interface BulkResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/tasks/bulk/complete
 * Complete multiple tasks at once.
 *
 * Restrictions:
 * - Only tasks that can transition to completed (pending/in_progress)
 * - Tasks requiring evidence cannot be bulk completed
 * - Tasks requiring approval cannot be bulk completed
 *
 * Each task is processed individually - failures don't affect other tasks.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { user }) => {
      const body = await request.json();
      const data = BulkCompleteTasksSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get all requested tasks
        const requestedTasks = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.firmId, firmId), inArray(tasks.id, data.ids)));

        if (requestedTasks.length === 0) {
          throw new NotFoundError("No tasks found");
        }

        const results: BulkResult[] = [];
        const tasksToComplete: string[] = [];
        const now = new Date();

        // Validate each task
        for (const taskId of data.ids) {
          const task = requestedTasks.find((t) => t.id === taskId);

          if (!task) {
            results.push({ id: taskId, success: false, error: "Task not found" });
            continue;
          }

          // Check if task can transition to completed
          if (!canTransitionToCompleted(task.status)) {
            results.push({
              id: taskId,
              success: false,
              error: `Cannot complete task with status '${task.status}'`,
            });
            continue;
          }

          // Check for evidence requirement
          if (task.requiresEvidence) {
            results.push({
              id: taskId,
              success: false,
              error: "Task requires evidence - cannot bulk complete",
            });
            continue;
          }

          // Check for approval requirement
          if (task.requiresApproval && task.approvalStatus !== "approved") {
            results.push({
              id: taskId,
              success: false,
              error: "Task requires approval - cannot bulk complete",
            });
            continue;
          }

          tasksToComplete.push(taskId);
          results.push({ id: taskId, success: true });
        }

        // Complete eligible tasks
        if (tasksToComplete.length > 0) {
          await tx
            .update(tasks)
            .set({
              status: "completed",
              completedAt: now,
              updatedAt: now,
            })
            .where(and(eq(tasks.firmId, firmId), inArray(tasks.id, tasksToComplete)));

          // Create timeline events for completed tasks
          for (const taskId of tasksToComplete) {
            const task = requestedTasks.find((t) => t.id === taskId);
            if (task) {
              await createTimelineEvent(tx, {
                firmId,
                matterId: task.matterId,
                type: "task_completed",
                title: "Task completed",
                description: data.notes
                  ? `Task "${task.title}" was completed (bulk). Notes: ${data.notes}`
                  : `Task "${task.title}" was completed (bulk)`,
                actorType: "user",
                actorId: user.user.id,
                entityType: "task",
                entityId: taskId,
                occurredAt: now,
                metadata: { bulk: true },
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
