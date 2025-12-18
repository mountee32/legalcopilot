import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { leaveRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/team/leave/[id]
 *
 * Get a single leave request by ID.
 * Requires leave:read permission.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("leave:read")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Leave request not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const leaveRequest = await withFirmDb(firmId, async (tx) => {
        const [row] = await tx
          .select()
          .from(leaveRequests)
          .where(and(eq(leaveRequests.id, id), eq(leaveRequests.firmId, firmId)))
          .limit(1);

        return row ?? null;
      });

      if (!leaveRequest) throw new NotFoundError("Leave request not found");

      return NextResponse.json(leaveRequest);
    })
  )
);

/**
 * DELETE /api/team/leave/[id]
 *
 * Cancel a leave request.
 * Only the requester can cancel their own pending requests.
 * Requires leave:request permission.
 */
export const DELETE = withErrorHandler(
  withAuth(
    withPermission("leave:request")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Leave request not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Fetch current state
        const [current] = await tx
          .select()
          .from(leaveRequests)
          .where(and(eq(leaveRequests.id, id), eq(leaveRequests.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Leave request not found");

        // Only allow users to cancel their own requests
        if (current.userId !== user.user.id) {
          throw new ValidationError("You can only cancel your own leave requests");
        }

        // Only pending requests can be cancelled
        if (current.status !== "pending") {
          throw new ValidationError("Only pending leave requests can be cancelled");
        }

        // Mark as cancelled
        const [updated] = await tx
          .update(leaveRequests)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(and(eq(leaveRequests.id, id), eq(leaveRequests.firmId, firmId)))
          .returning();

        return updated;
      });

      return NextResponse.json(result);
    })
  )
);
