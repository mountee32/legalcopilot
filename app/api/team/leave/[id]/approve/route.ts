import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { leaveRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { LeaveDecisionSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/team/leave/[id]/approve
 *
 * Approve a leave request.
 * Requires leave:approve permission.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("leave:approve")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Leave request not found");

      const body = await request.json().catch(() => ({}));
      const { decisionReason } = LeaveDecisionSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Fetch current state
        const [current] = await tx
          .select()
          .from(leaveRequests)
          .where(and(eq(leaveRequests.id, id), eq(leaveRequests.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Leave request not found");

        // Only pending requests can be approved
        if (current.status !== "pending") {
          throw new ValidationError("Only pending leave requests can be approved");
        }

        // Update to approved
        const [updated] = await tx
          .update(leaveRequests)
          .set({
            status: "approved",
            decidedBy: user.user.id,
            decidedAt: new Date(),
            decisionReason: decisionReason ?? null,
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
