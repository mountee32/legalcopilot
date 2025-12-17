import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { invoices, payments, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreatePaymentSchema, PaymentQuerySchema } from "@/lib/api/schemas";
import { formatMoney, parseMoney, roundMoney } from "@/lib/billing/money";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("billing:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = PaymentQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(payments.firmId, firmId)];
      if (query.invoiceId) whereClauses.push(eq(payments.invoiceId, query.invoiceId));
      if (query.method) whereClauses.push(eq(payments.method, query.method));
      if (query.from) whereClauses.push(gte(payments.paymentDate, query.from));
      if (query.to) whereClauses.push(lte(payments.paymentDate, query.to));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(payments)
          .where(where);

        const rows = await tx
          .select()
          .from(payments)
          .where(where)
          .orderBy(desc(payments.paymentDate), desc(payments.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        payments: rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreatePaymentSchema.parse(body);

      const now = new Date();
      const paymentDate = new Date(data.paymentDate + "T00:00:00Z");
      if (paymentDate.getTime() > now.getTime() + 60_000) {
        throw new ValidationError("Payment date cannot be in the future");
      }

      const amount = parseMoney(data.amount);
      if (amount <= 0) throw new ValidationError("Payment amount must be greater than zero");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const payment = await withFirmDb(firmId, async (tx) => {
        const [invoice] = await tx
          .select({
            id: invoices.id,
            status: invoices.status,
            total: invoices.total,
            paidAmount: invoices.paidAmount,
            balanceDue: invoices.balanceDue,
            matterId: invoices.matterId,
          })
          .from(invoices)
          .where(and(eq(invoices.id, data.invoiceId), eq(invoices.firmId, firmId)))
          .limit(1);

        if (!invoice) throw new NotFoundError("Invoice not found");
        if (invoice.status === "written_off")
          throw new ValidationError("Cannot record payments for a voided invoice");

        const balanceDue = parseMoney(invoice.balanceDue);
        if (amount > balanceDue + 1e-9)
          throw new ValidationError("Payment amount exceeds balance due");

        const [row] = await tx
          .insert(payments)
          .values({
            firmId,
            invoiceId: data.invoiceId,
            amount: data.amount,
            method: data.method,
            paymentDate: data.paymentDate,
            reference: data.reference ?? null,
            notes: data.notes ?? null,
            recordedBy: user.user.id,
          })
          .returning();

        const prevPaid = parseMoney(invoice.paidAmount ?? "0");
        const newPaid = roundMoney(prevPaid + amount);
        const total = parseMoney(invoice.total);
        const newBalance = roundMoney(total - newPaid);

        const status =
          newBalance <= 0.00001 ? "paid" : newPaid > 0.00001 ? "partially_paid" : invoice.status;

        await tx
          .update(invoices)
          .set({
            paidAmount: formatMoney(newPaid),
            balanceDue: formatMoney(Math.max(0, newBalance)),
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
            type: "payment_recorded",
            title: "Payment recorded",
            actorType: "user",
            actorId: user.user.id,
            entityType: "payment",
            entityId: row.id,
            occurredAt: new Date(),
            metadata: { invoiceId: invoice.id, amount: data.amount, method: data.method },
          });
        }

        return row ?? null;
      });

      if (!payment) throw new ValidationError("Failed to record payment");
      return NextResponse.json(payment, { status: 201 });
    })
  )
);
