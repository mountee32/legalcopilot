import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { signatureRequests, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Signature request not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [sigRequest] = await tx
          .select({
            id: signatureRequests.id,
            status: signatureRequests.status,
            documentId: signatureRequests.documentId,
            externalId: signatureRequests.externalId,
          })
          .from(signatureRequests)
          .where(and(eq(signatureRequests.id, id), eq(signatureRequests.firmId, firmId)))
          .limit(1);

        if (!sigRequest) throw new NotFoundError("Signature request not found");
        if (sigRequest.status === "completed")
          throw new ValidationError("Cannot void a completed signature request");
        if (sigRequest.status === "voided")
          throw new ValidationError("Signature request is already voided");

        const [row] = await tx
          .update(signatureRequests)
          .set({ status: "voided", updatedAt: new Date() })
          .where(and(eq(signatureRequests.id, id), eq(signatureRequests.firmId, firmId)))
          .returning();

        // Get matter ID from document for timeline event
        const [doc] = await tx
          .select({ matterId: documents.matterId })
          .from(documents)
          .where(eq(documents.id, sigRequest.documentId))
          .limit(1);

        if (doc?.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: doc.matterId,
            type: "signature_request_voided",
            title: "Signature request voided",
            actorType: "user",
            actorId: user.user.id,
            entityType: "signature_request",
            entityId: id,
            occurredAt: new Date(),
            metadata: { externalId: sigRequest.externalId },
          });
        }

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Signature request not found");
      return NextResponse.json(updated);
    })
  )
);
