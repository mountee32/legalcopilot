// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  invoices,
  payments,
  paymentProviderAccounts,
  paymentProviderEvents,
} from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createInvoice } from "@tests/fixtures/factories/invoice";

describe("Webhooks - Payments (Stripe)", () => {
  const ctx = setupIntegrationSuite();

  it("rejects invalid webhook secret", async () => {
    const [account] = await db
      .insert(paymentProviderAccounts)
      .values({
        firmId: ctx.firmId,
        provider: "stripe",
        webhookSecret: "whsec_valid",
        status: "connected",
      })
      .returning({ id: paymentProviderAccounts.id });

    const { POST } = await import("@/app/api/webhooks/payments/[firmId]/[accountId]/route");
    const req = new NextRequest(
      `http://localhost/api/webhooks/payments/${ctx.firmId}/${account.id}`,
      {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": "wrong",
          "x-event-id": "evt_1",
        }),
        body: JSON.stringify({ id: "evt_1", type: "payment.succeeded", data: {} }),
      }
    );

    const res = await POST(
      req as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(res.status).toBe(400);
  });

  it("creates payment, updates invoice, and is idempotent by event id", async () => {
    const [account] = await db
      .insert(paymentProviderAccounts)
      .values({
        firmId: ctx.firmId,
        provider: "stripe",
        webhookSecret: "whsec_valid",
        status: "connected",
      })
      .returning({ id: paymentProviderAccounts.id });

    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference: `CLI-${Date.now()}`,
        type: "individual",
        status: "active",
        firstName: "Pay",
        lastName: "Test",
        email: `pay-${Date.now()}@test.example.com`,
      })
      .returning({ id: clients.id });

    const invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      subtotal: "100.00",
      paidAmount: "0.00",
      balanceDue: "120.00",
      status: "sent",
    });

    const payload = {
      id: "evt_paid_1",
      type: "payment.succeeded",
      data: { invoiceId: invoice.id, amount: "120.00", paymentId: "pi_1" },
    };

    const { POST } = await import("@/app/api/webhooks/payments/[firmId]/[accountId]/route");
    const makeReq = () =>
      new NextRequest(`http://localhost/api/webhooks/payments/${ctx.firmId}/${account.id}`, {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": "whsec_valid",
          "x-event-id": "evt_paid_1",
        }),
        body: JSON.stringify(payload),
      });

    const res1 = await POST(
      makeReq() as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.accepted).toBe(true);

    const [updated] = await db
      .select({
        status: invoices.status,
        paidAmount: invoices.paidAmount,
        balanceDue: invoices.balanceDue,
      })
      .from(invoices)
      .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.id, invoice.id)));
    expect(updated.status).toBe("paid");
    expect(updated.balanceDue).toBe("0.00");

    const res2 = await POST(
      makeReq() as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(res2.status).toBe(200);

    const evRows = await db
      .select({ id: paymentProviderEvents.id })
      .from(paymentProviderEvents)
      .where(
        and(
          eq(paymentProviderEvents.firmId, ctx.firmId),
          eq(paymentProviderEvents.provider, "stripe"),
          eq(paymentProviderEvents.externalEventId, "evt_paid_1")
        )
      );
    expect(evRows).toHaveLength(1);

    const payRows = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.firmId, ctx.firmId), eq(payments.invoiceId, invoice.id)));
    expect(payRows).toHaveLength(1);
  });
});
