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

      const sigRequest = await withFirmDb(firmId, async (tx) => {
        const [row] = await tx
          .select({
            id: signatureRequests.id,
            status: signatureRequests.status,
            documentId: signatureRequests.documentId,
            externalId: signatureRequests.externalId,
            sentAt: signatureRequests.sentAt,
          })
          .from(signatureRequests)
          .where(and(eq(signatureRequests.id, id), eq(signatureRequests.firmId, firmId)))
          .limit(1);

        if (!row) throw new NotFoundError("Signature request not found");
        if (row.status !== "sent" && row.status !== "delivered")
          throw new ValidationError("Only sent or delivered signature requests can be reminded");
        if (!row.externalId)
          throw new ValidationError("Cannot send reminder for request without external ID");

        // Get matter ID from document for timeline event
        const [doc] = await tx
          .select({ matterId: documents.matterId })
          .from(documents)
          .where(eq(documents.id, row.documentId))
          .limit(1);

        if (doc?.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: doc.matterId,
            type: "signature_request_reminded",
            title: "Signature request reminder sent",
            actorType: "user",
            actorId: user.user.id,
            entityType: "signature_request",
            entityId: id,
            occurredAt: new Date(),
            metadata: { externalId: row.externalId },
          });
        }

        return row;
      });

      return NextResponse.json({
        success: true,
        message: "Reminder sent successfully",
        signatureRequest: sigRequest,
      });
    })
  )
);
