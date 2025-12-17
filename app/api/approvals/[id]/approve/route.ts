import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ApproveRequestSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { executeApprovalIfSupported } from "@/lib/approvals/execute";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params?.id;
    if (!id) throw new NotFoundError("Approval request not found");

    const body = await request.json().catch(() => ({}));
    const { decisionReason } = ApproveRequestSchema.parse(body);

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const updated = await withFirmDb(firmId, async (tx) => {
      const [current] = await tx
        .select({ status: approvalRequests.status })
        .from(approvalRequests)
        .where(and(eq(approvalRequests.id, id), eq(approvalRequests.firmId, firmId)))
        .limit(1);

      if (!current) throw new NotFoundError("Approval request not found");
      if (current.status !== "pending") {
        throw new ValidationError("Only pending approvals can be approved");
      }

      const [updated] = await tx
        .update(approvalRequests)
        .set({
          status: "approved",
          decidedBy: user.user.id,
          decidedAt: new Date(),
          decisionReason: decisionReason ?? null,
          updatedAt: new Date(),
        })
        .where(and(eq(approvalRequests.id, id), eq(approvalRequests.firmId, firmId)))
        .returning();

      const entityType = updated?.entityType ?? null;
      const entityId = updated?.entityId ?? null;
      if (entityType && entityId) {
        let matterId: string | null = null;
        if (entityType === "matter") {
          matterId = entityId;
        } else if (entityType === "document") {
          const [doc] = await tx
            .select({ matterId: documents.matterId })
            .from(documents)
            .where(and(eq(documents.id, entityId), eq(documents.firmId, firmId)))
            .limit(1);
          matterId = doc?.matterId ?? null;
        }

        if (matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId,
            type: "approval_decided",
            title: "Approval approved",
            actorType: "user",
            actorId: user.user.id,
            entityType,
            entityId,
            occurredAt: new Date(),
            metadata: { approvalRequestId: updated.id, status: updated.status },
          });
        }
      }

      if (updated) {
        const execution = await executeApprovalIfSupported(tx, {
          id: updated.id,
          firmId: updated.firmId,
          action: updated.action,
          proposedPayload: updated.proposedPayload,
          entityType: updated.entityType ?? null,
          entityId: updated.entityId ?? null,
        });

        if (execution.executionStatus === "failed") {
          await tx
            .update(approvalRequests)
            .set({
              executedAt: new Date(),
              executionStatus: "failed",
              executionError: execution.executionError ?? "Execution failed",
              updatedAt: new Date(),
            })
            .where(and(eq(approvalRequests.id, updated.id), eq(approvalRequests.firmId, firmId)));
        }
      }

      return updated;
    });

    const refreshed = await withFirmDb(firmId, async (tx) => {
      const [row] = await tx
        .select()
        .from(approvalRequests)
        .where(and(eq(approvalRequests.id, id), eq(approvalRequests.firmId, firmId)))
        .limit(1);
      return row ?? null;
    });

    if (!refreshed) throw new NotFoundError("Approval request not found");
    return NextResponse.json(refreshed);
  })
);
