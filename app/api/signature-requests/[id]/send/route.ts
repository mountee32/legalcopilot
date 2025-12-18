import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, signatureRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Signature request not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [sigRequest] = await tx
          .select({
            id: signatureRequests.id,
            status: signatureRequests.status,
            documentId: signatureRequests.documentId,
            provider: signatureRequests.provider,
          })
          .from(signatureRequests)
          .where(and(eq(signatureRequests.id, id), eq(signatureRequests.firmId, firmId)))
          .limit(1);

        if (!sigRequest) throw new NotFoundError("Signature request not found");
        if (sigRequest.status !== "draft" && sigRequest.status !== "pending_approval")
          throw new ValidationError(
            "Only draft or pending approval signature requests can be sent"
          );

        const [existing] = await tx
          .select({ id: approvalRequests.id })
          .from(approvalRequests)
          .where(
            and(
              eq(approvalRequests.firmId, firmId),
              eq(approvalRequests.status, "pending"),
              eq(approvalRequests.action, "signature_request.send"),
              eq(approvalRequests.entityType, "signature_request"),
              eq(approvalRequests.entityId, id)
            )
          )
          .limit(1);

        if (existing)
          throw new ValidationError(
            "An approval request already exists for this signature request"
          );

        const [row] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "user",
            sourceId: user.user.id,
            action: "signature_request.send",
            summary: `Send signature request for document ${sigRequest.documentId}`,
            proposedPayload: {
              signatureRequestId: sigRequest.id,
              documentId: sigRequest.documentId,
              provider: sigRequest.provider,
            },
            entityType: "signature_request",
            entityId: sigRequest.id,
            updatedAt: new Date(),
          })
          .returning();

        if (!row) throw new ValidationError("Failed to create approval request");
        return row;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
