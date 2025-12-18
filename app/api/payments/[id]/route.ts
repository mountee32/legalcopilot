import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { invoices, payments, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { formatMoney, parseMoney, roundMoney } from "@/lib/billing/money";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("billing:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Payment not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const row = await withFirmDb(firmId, async (tx) => {
        const [p] = await tx
          .select()
          .from(payments)
          .where(and(eq(payments.id, id), eq(payments.firmId, firmId)))
          .limit(1);
        return p ?? null;
      });

      if (!row) throw new NotFoundError("Payment not found");
      return NextResponse.json(row);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Payment not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        const [payment] = await tx
          .select({ id: payments.id, invoiceId: payments.invoiceId, amount: payments.amount })
          .from(payments)
          .where(and(eq(payments.id, id), eq(payments.firmId, firmId)))
          .limit(1);

        if (!payment) throw new NotFoundError("Payment not found");

        const [invoice] = await tx
          .select({ id: invoices.id, total: invoices.total, matterId: invoices.matterId })
          .from(invoices)
          .where(and(eq(invoices.id, payment.invoiceId), eq(invoices.firmId, firmId)))
          .limit(1);
        if (!invoice) throw new ValidationError("Invoice not found for payment");

        await tx.delete(payments).where(and(eq(payments.id, id), eq(payments.firmId, firmId)));

        const [sumRow] = await tx
          .select({ totalPaid: sql<string>`coalesce(sum(${payments.amount}), '0')` })
          .from(payments)
          .where(and(eq(payments.firmId, firmId), eq(payments.invoiceId, invoice.id)));

        const paid = roundMoney(parseMoney(sumRow?.totalPaid ?? "0"));
        const total = parseMoney(invoice.total);
        const balance = roundMoney(total - paid);
        const status = paid <= 0.00001 ? "sent" : balance <= 0.00001 ? "paid" : "partially_paid";

        await tx
          .update(invoices)
          .set({
            paidAmount: formatMoney(paid),
            balanceDue: formatMoney(Math.max(0, balance)),
            status,
            paidAt: status === "paid" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, invoice.id), eq(invoices.firmId, firmId)));

        const matterIds = new Set<string>();
        if (invoice.matterId) {
          matterIds.add(invoice.matterId);
        } else {
          const rows = await tx
            .select({ matterId: timeEntries.matterId })
            .from(timeEntries)
            .where(and(eq(timeEntries.firmId, firmId), eq(timeEntries.invoiceId, invoice.id)));
          for (const r of rows) matterIds.add(r.matterId);
        }

        for (const matterId of matterIds) {
          await createTimelineEvent(tx, {
            firmId,
            matterId,
            type: "payment_deleted",
            title: "Payment deleted",
            actorType: "user",
            actorId: user.user.id,
            entityType: "payment",
            entityId: id,
            occurredAt: new Date(),
            metadata: { invoiceId: invoice.id },
          });
        }
      });

      return NextResponse.json({ success: true });
    })
  )
);
