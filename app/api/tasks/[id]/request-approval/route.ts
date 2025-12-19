/**
 * Request Task Approval API
 *
 * POST /api/tasks/[id]/request-approval - Request approval for a task
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { RequestApprovalSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/tasks/[id]/request-approval
 * Request approval for a task that requires it.
 * Sets approvalStatus to 'pending'.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = RequestApprovalSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get the task
        const [task] = await tx
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Check if task requires approval
        if (!task.requiresApproval) {
          throw new ValidationError("This task does not require approval");
        }

        // Check current approval status
        if (task.approvalStatus === "approved") {
          throw new ValidationError("Task is already approved");
        }

        if (task.approvalStatus === "pending") {
          throw new ValidationError("Approval is already pending for this task");
        }

        // Update task with pending approval
        const [updated] = await tx
          .update(tasks)
          .set({
            approvalStatus: "pending",
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "task_approval_requested",
          title: `Approval requested: ${task.title}`,
          description: data.notes ?? undefined,
          actorType: "user",
          actorId: user.user.id,
          entityType: "task",
          entityId: id,
          metadata: {
            requiredApproverRole: task.requiredApproverRole,
          },
          occurredAt: new Date(),
        });

        // TODO: Create notification for approvers

        return updated;
      });

      return NextResponse.json(result);
    })
  )
);
