import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
  invoices,
  payments,
  paymentProviderAccounts,
  paymentProviderEvents,
  timeEntries,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { UuidSchema } from "@/lib/api/schemas";
import { formatMoney, parseMoney, roundMoney } from "@/lib/billing/money";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type WebhookPayload = {
  id?: string;
  type?: string;
  data?: Record<string, any>;
  createdAt?: string;
};

export const POST = withErrorHandler(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const firmId = UuidSchema.parse(resolvedParams.firmId);
  const accountId = UuidSchema.parse(resolvedParams.accountId);

  const secret = request.headers.get("x-webhook-secret") ?? "";
  const externalEventIdHeader = request.headers.get("x-event-id") ?? undefined;

  const payload = (await request.json().catch(() => ({}))) as WebhookPayload;
  const externalEventId =
    externalEventIdHeader ?? (typeof payload?.id === "string" ? payload.id : undefined);
  if (!externalEventId) throw new ValidationError("Missing external event id");

  const result = await withFirmDb(firmId, async (tx) => {
    const [account] = await tx
      .select()
      .from(paymentProviderAccounts)
      .where(
        and(eq(paymentProviderAccounts.firmId, firmId), eq(paymentProviderAccounts.id, accountId))
      );

    if (!account) throw new ValidationError("Unknown payment provider account");
    if (account.status !== "connected")
      throw new ValidationError("Payment provider account is not connected");
    if (!secret || secret !== account.webhookSecret)
      throw new ValidationError("Invalid webhook secret");

    const inserted = await tx
      .insert(paymentProviderEvents)
      .values({
        firmId,
        accountId: account.id,
        provider: account.provider,
        externalEventId,
        eventType: payload.type ?? null,
        payload,
        processedOk: false,
      })
      .onConflictDoNothing({
        target: [
          paymentProviderEvents.firmId,
          paymentProviderEvents.provider,
          paymentProviderEvents.externalEventId,
        ],
      })
      .returning({ id: paymentProviderEvents.id });

    const isDuplicate = inserted.length === 0;
    if (isDuplicate) return { accepted: true, createdPaymentId: null as string | null };

    const invoiceId =
      typeof payload?.data?.invoiceId === "string" ? (payload.data.invoiceId as string) : undefined;
    const amount =
      typeof payload?.data?.amount === "string"
        ? (payload.data.amount as string)
        : typeof payload?.data?.amount === "number"
          ? formatMoney(payload.data.amount)
          : undefined;
    const providerPaymentId =
      typeof payload?.data?.paymentId === "string"
        ? (payload.data.paymentId as string)
        : typeof payload?.data?.externalId === "string"
          ? (payload.data.externalId as string)
          : externalEventId;

    if (!invoiceId || !amount) return { accepted: true, createdPaymentId: null as string | null };

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
      .where(and(eq(invoices.id, invoiceId), eq(invoices.firmId, firmId)))
      .limit(1);

    if (!invoice) return { accepted: true, createdPaymentId: null as string | null };
    if (invoice.status === "written_off")
      return { accepted: true, createdPaymentId: null as string | null };

    const existing = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.firmId, firmId),
          eq(payments.externalProvider, account.provider),
          eq(payments.externalId, providerPaymentId)
        )
      )
      .limit(1);

    if (existing.length > 0) return { accepted: true, createdPaymentId: existing[0]!.id };

    const now = new Date();
    const paymentDateRaw =
      typeof payload?.data?.paymentDate === "string"
        ? (payload.data.paymentDate as string)
        : typeof payload?.createdAt === "string"
          ? (payload.createdAt as string)
          : toIsoDate(now);

    const paymentDate = paymentDateRaw.includes("T") ? paymentDateRaw.slice(0, 10) : paymentDateRaw;
    const method = account.provider === "stripe" ? "card" : "bank_transfer";

    const amountNum = parseMoney(amount);
    if (amountNum <= 0) return { accepted: true, createdPaymentId: null as string | null };

    const [row] = await tx
      .insert(payments)
      .values({
        firmId,
        invoiceId: invoice.id,
        amount,
        method,
        paymentDate,
        reference: typeof payload?.data?.reference === "string" ? payload.data.reference : null,
        notes: typeof payload?.data?.notes === "string" ? payload.data.notes : null,
        recordedBy: null,
        externalProvider: account.provider,
        externalId: providerPaymentId,
      })
      .returning();

    const prevPaid = parseMoney(invoice.paidAmount ?? "0");
    const newPaid = roundMoney(prevPaid + amountNum);
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
        title: "Payment recorded (gateway)",
        actorType: "system",
        actorId: null,
        entityType: "payment",
        entityId: row.id,
        occurredAt: new Date(),
        metadata: { invoiceId: invoice.id, amount, method, provider: account.provider },
      });
    }

    return { accepted: true, createdPaymentId: row.id };
  });

  return NextResponse.json(result);
});
