import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("approvals:view")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Approval request not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [approval] = await tx
          .select()
          .from(approvalRequests)
          .where(and(eq(approvalRequests.id, id), eq(approvalRequests.firmId, firmId)))
          .limit(1);
        return approval ?? null;
      });

      if (!approval) throw new NotFoundError("Approval request not found");
      return NextResponse.json(approval);
    })
  )
);
