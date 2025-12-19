/**
 * Complete Task API
 *
 * POST /api/tasks/[id]/complete - Complete a task
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CompleteTaskSchema } from "@/lib/api/schemas";
import { getCompletionBlockers, canTransitionToCompleted } from "@/lib/tasks/completion";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/tasks/[id]/complete
 * Complete a task, checking all completion requirements.
 *
 * Completion predicate:
 * - Task must be in pending or in_progress status
 * - If requiresEvidence: at least one evidence item must exist
 * - If requiresVerifiedEvidence: at least one verified evidence must exist
 * - If requiresApproval: approvalStatus must be 'approved'
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json().catch(() => ({}));
      const data = CompleteTaskSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get the task with all required fields for completion check
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Check if task can transition to completed
        if (!canTransitionToCompleted(task.status)) {
          if (task.status === "completed") {
            throw new ValidationError("Task is already completed");
          }
          throw new ValidationError(
            `Cannot complete task with status '${task.status}'. Task must be pending or in_progress.`
          );
        }

        // Check completion requirements (evidence, approval)
        const blockers = await getCompletionBlockers(
          tx,
          {
            id: task.id,
            status: task.status,
            completedAt: task.completedAt,
            requiresEvidence: task.requiresEvidence,
            requiresVerifiedEvidence: task.requiresVerifiedEvidence,
            requiresApproval: task.requiresApproval,
            approvalStatus: task.approvalStatus,
          },
          firmId
        );

        if (blockers.length > 0) {
          throw new ValidationError(`Cannot complete task: ${blockers.join("; ")}`);
        }

        // Update task status
        const now = new Date();
        const [updated] = await tx
          .update(tasks)
          .set({
            status: "completed",
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(tasks.id, id))
          .returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "task_completed",
          title: "Task completed",
          description: data.notes
            ? `Task "${task.title}" was completed. Notes: ${data.notes}`
            : `Task "${task.title}" was completed`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "task",
          entityId: id,
          occurredAt: now,
          metadata: {
            notes: data.notes,
            requiresEvidence: task.requiresEvidence,
            requiresApproval: task.requiresApproval,
          },
        });

        return updated;
      });

      return NextResponse.json(result);
    })
  )
);
