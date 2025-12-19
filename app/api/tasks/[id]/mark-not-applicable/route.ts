/**
 * Mark Task Not Applicable API
 *
 * POST /api/tasks/[id]/mark-not-applicable - Mark a task as not applicable
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { MarkNotApplicableSchema } from "@/lib/api/schemas";
import { logTaskNotApplicable } from "@/lib/tasks/exceptions";
import { canSkipOrMarkNotApplicable } from "@/lib/tasks/completion";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/tasks/[id]/mark-not-applicable
 * Mark a task as not applicable to this matter.
 * Creates an exception log entry for audit trail.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = MarkNotApplicableSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get the task
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Check if task can be marked not applicable
        if (!canSkipOrMarkNotApplicable(task.status)) {
          throw new ValidationError(
            `Cannot mark task as not applicable with status '${task.status}'. Task must be pending, in_progress, or completed.`
          );
        }

        const originalStatus = task.status;

        // Update task status
        const [updated] = await tx
          .update(tasks)
          .set({
            status: "not_applicable",
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        // Log exception for audit trail
        await logTaskNotApplicable(tx, {
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
          type: "task_not_applicable",
          title: `Task marked not applicable: ${task.title}`,
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
