import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { approvalRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { BulkApproveRequestSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (request, { user }) => {
    const body = await request.json();
    const { ids, decisionReason } = BulkApproveRequestSchema.parse(body);

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const updated = await withFirmDb(firmId, async (tx) => {
      const pending = await tx
        .select({ id: approvalRequests.id })
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.firmId, firmId),
            inArray(approvalRequests.id, ids),
            eq(approvalRequests.status, "pending")
          )
        );

      if (pending.length !== ids.length) {
        throw new ValidationError("All approval IDs must exist and be pending");
      }

      return tx
        .update(approvalRequests)
        .set({
          status: "approved",
          decidedBy: user.user.id,
          decidedAt: new Date(),
          decisionReason: decisionReason ?? null,
          updatedAt: new Date(),
        })
        .where(and(eq(approvalRequests.firmId, firmId), inArray(approvalRequests.id, ids)))
        .returning();
    });

    return NextResponse.json({ approvals: updated });
  })
);
