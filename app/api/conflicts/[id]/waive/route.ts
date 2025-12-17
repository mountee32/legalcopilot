import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, conflictChecks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ConflictDecisionRequestSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("conflicts:write")(async (request: NextRequest, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Conflict check not found");

      const body = await request.json().catch(() => ({}));
      const data = ConflictDecisionRequestSchema.parse(body);

      if (!data.waiverReason) throw new ValidationError("waiverReason is required");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [check] = await tx
          .select({ id: conflictChecks.id })
          .from(conflictChecks)
          .where(and(eq(conflictChecks.id, id), eq(conflictChecks.firmId, firmId)))
          .limit(1);

        if (!check) throw new NotFoundError("Conflict check not found");

        const [existing] = await tx
          .select({ id: approvalRequests.id })
          .from(approvalRequests)
          .where(
            and(
              eq(approvalRequests.firmId, firmId),
              eq(approvalRequests.status, "pending"),
              eq(approvalRequests.action, "conflict_check.waive"),
              eq(approvalRequests.entityType, "conflict_check"),
              eq(approvalRequests.entityId, id)
            )
          )
          .limit(1);

        if (existing)
          throw new ValidationError("An approval request already exists for this conflict check");

        const [row] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "user",
            sourceId: user.user.id,
            action: "conflict_check.waive",
            summary: "Waive conflict check",
            proposedPayload: { conflictCheckId: id, waiverReason: data.waiverReason },
            entityType: "conflict_check",
            entityId: id,
            updatedAt: new Date(),
          })
          .returning();

        if (!row) throw new ValidationError("Failed to create approval request");

        if (data.decisionReason) {
          await tx
            .update(approvalRequests)
            .set({ decisionReason: data.decisionReason, updatedAt: new Date() })
            .where(and(eq(approvalRequests.id, row.id), eq(approvalRequests.firmId, firmId)));
        }

        return row;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
