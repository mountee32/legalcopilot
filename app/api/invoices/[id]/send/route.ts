import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, invoices } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Invoice not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [invoice] = await tx
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            status: invoices.status,
          })
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .limit(1);

        if (!invoice) throw new NotFoundError("Invoice not found");
        if (invoice.status !== "draft")
          throw new ValidationError("Only draft invoices can be sent");

        const [existing] = await tx
          .select({ id: approvalRequests.id })
          .from(approvalRequests)
          .where(
            and(
              eq(approvalRequests.firmId, firmId),
              eq(approvalRequests.status, "pending"),
              eq(approvalRequests.action, "invoice.send"),
              eq(approvalRequests.entityType, "invoice"),
              eq(approvalRequests.entityId, id)
            )
          )
          .limit(1);

        if (existing)
          throw new ValidationError("An approval request already exists for this invoice");

        const [row] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "user",
            sourceId: user.user.id,
            action: "invoice.send",
            summary: `Send invoice ${invoice.invoiceNumber}`,
            proposedPayload: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
            entityType: "invoice",
            entityId: invoice.id,
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
