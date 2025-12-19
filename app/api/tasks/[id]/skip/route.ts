/**
 * Skip Task API
 *
 * POST /api/tasks/[id]/skip - Skip a task with justification
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { SkipTaskSchema } from "@/lib/api/schemas";
import { logTaskSkipped } from "@/lib/tasks/exceptions";
import { canSkipOrMarkNotApplicable } from "@/lib/tasks/completion";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/tasks/[id]/skip
 * Skip a task with justification.
 * Mandatory tasks require supervisor approval (TODO: implement role check).
 * Creates an exception log entry for audit trail.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = SkipTaskSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get the task
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Check if task can be skipped
        if (!canSkipOrMarkNotApplicable(task.status)) {
          throw new ValidationError(
            `Cannot skip task with status '${task.status}'. Task must be pending, in_progress, or completed.`
          );
        }

        // For mandatory tasks, would check for supervisor role here
        // TODO: Implement role-based approval for mandatory task skips
        // For MVP, allow skipping with justification logged

        const originalStatus = task.status;

        // Update task status
        const [updated] = await tx
          .update(tasks)
          .set({
            status: "skipped",
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        // Log exception for audit trail
        await logTaskSkipped(tx, {
          firmId,
          taskId: id,
          reason: data.reason,
          approvedById: user.user.id,
          originalStatus,
        });

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "task_skipped",
          title: `Task skipped: ${task.title}`,
          description: data.reason,
          actorType: "user",
          actorId: user.user.id,
          entityType: "task",
          entityId: id,
          metadata: {
            originalStatus,
            isMandatory: task.isMandatory,
          },
          occurredAt: new Date(),
        });

        return updated;
      });

      return NextResponse.json(result);
    })
  )
);
