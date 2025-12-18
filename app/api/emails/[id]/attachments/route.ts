import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { emails, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { AttachDocumentsRequestSchema } from "@/lib/api/schemas/emails";

export const POST = withErrorHandler(
  withAuth(
    withPermission("emails:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = AttachDocumentsRequestSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [email] = await tx
          .select({
            id: emails.id,
            status: emails.status,
            direction: emails.direction,
            attachmentIds: emails.attachmentIds,
            attachmentCount: emails.attachmentCount,
            matterId: emails.matterId,
          })
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);

        if (!email) throw new NotFoundError("Email not found");
        if (email.direction !== "outbound")
          throw new ValidationError("Can only attach documents to outbound emails");
        if (email.status !== "draft")
          throw new ValidationError("Can only attach documents to draft emails");

        const foundDocuments = await tx
          .select({ id: documents.id, matterId: documents.matterId })
          .from(documents)
          .where(and(eq(documents.firmId, firmId), inArray(documents.id, data.documentIds)));

        if (foundDocuments.length !== data.documentIds.length) {
          throw new NotFoundError("One or more documents not found");
        }

        if (email.matterId) {
          const invalidDocs = foundDocuments.filter((doc) => doc.matterId !== email.matterId);
          if (invalidDocs.length > 0) {
            throw new ValidationError("All documents must belong to the same matter as the email");
          }
        }

        const currentAttachments = Array.isArray(email.attachmentIds)
          ? (email.attachmentIds as string[])
          : [];

        const alreadyAttached = data.documentIds.filter((docId) =>
          currentAttachments.includes(docId)
        );
        if (alreadyAttached.length > 0) {
          throw new ValidationError(`Documents already attached: ${alreadyAttached.join(", ")}`);
        }

        const newAttachments = [...currentAttachments, ...data.documentIds];

        const [row] = await tx
          .update(emails)
          .set({
            attachmentIds: newAttachments,
            attachmentCount: newAttachments.length,
            hasAttachments: true,
            updatedAt: new Date(),
          })
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .returning();

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Email not found");
      return NextResponse.json({ success: true, email: updated });
    })
  )
);
