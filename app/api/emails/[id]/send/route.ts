import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, emails } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { createHash } from "crypto";

export const POST = withErrorHandler(
  withAuth(
    withPermission("emails:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [email] = await tx
          .select({
            id: emails.id,
            subject: emails.subject,
            status: emails.status,
            direction: emails.direction,
            toAddresses: emails.toAddresses,
            bodyText: emails.bodyText,
            bodyHtml: emails.bodyHtml,
            approvalRequestId: emails.approvalRequestId,
          })
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);

        if (!email) throw new NotFoundError("Email not found");
        if (email.direction !== "outbound")
          throw new ValidationError("Only outbound emails can be sent");
        if (email.status !== "draft") throw new ValidationError("Only draft emails can be sent");

        if (email.approvalRequestId) {
          const [existingApproval] = await tx
            .select({ id: approvalRequests.id, status: approvalRequests.status })
            .from(approvalRequests)
            .where(eq(approvalRequests.id, email.approvalRequestId))
            .limit(1);

          if (existingApproval && existingApproval.status === "pending") {
            throw new ValidationError("An approval request already exists for this email");
          }
        }

        const [existingPending] = await tx
          .select({ id: approvalRequests.id })
          .from(approvalRequests)
          .where(
            and(
              eq(approvalRequests.firmId, firmId),
              eq(approvalRequests.status, "pending"),
              eq(approvalRequests.action, "email.send"),
              eq(approvalRequests.entityType, "email"),
              eq(approvalRequests.entityId, id)
            )
          )
          .limit(1);

        if (existingPending)
          throw new ValidationError("An approval request already exists for this email");

        const contentToHash = JSON.stringify({
          subject: email.subject,
          to: email.toAddresses,
          body: email.bodyHtml || email.bodyText,
        });
        const contentHash = createHash("sha256").update(contentToHash).digest("hex");

        const toAddresses = Array.isArray(email.toAddresses) ? email.toAddresses : [];
        const recipientList =
          toAddresses.length > 0
            ? toAddresses
                .map((addr: any) =>
                  typeof addr === "object" && addr.email ? addr.email : String(addr)
                )
                .join(", ")
            : "recipients";

        const [row] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "user",
            sourceId: user.user.id,
            action: "email.send",
            summary: `Send email "${email.subject}" to ${recipientList}`,
            proposedPayload: { emailId: email.id, subject: email.subject, contentHash },
            entityType: "email",
            entityId: email.id,
            updatedAt: new Date(),
          })
          .returning();

        if (!row) throw new ValidationError("Failed to create approval request");

        await tx
          .update(emails)
          .set({
            status: "pending",
            approvalRequestId: row.id,
            contentHash,
            updatedAt: new Date(),
          })
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)));

        return row;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
