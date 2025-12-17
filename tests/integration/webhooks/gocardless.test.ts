// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoices, payments, paymentProviderAccounts } from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createInvoice } from "@tests/fixtures/factories/invoice";

describe("Webhooks - Payments (GoCardless)", () => {
  const ctx = setupIntegrationSuite();

  it("records bank transfer payment and updates invoice", async () => {
    const [account] = await db
      .insert(paymentProviderAccounts)
      .values({
        firmId: ctx.firmId,
        provider: "gocardless",
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
        lastName: "GC",
        email: `pay-gc-${Date.now()}@test.example.com`,
      })
      .returning({ id: clients.id });

    const invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      subtotal: "50.00",
      paidAmount: "0.00",
      balanceDue: "60.00",
      status: "sent",
    });

    const { POST } = await import("@/app/api/webhooks/payments/[firmId]/[accountId]/route");
    const req = new NextRequest(
      `http://localhost/api/webhooks/payments/${ctx.firmId}/${account.id}`,
      {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": "whsec_valid",
          "x-event-id": "evt_gc_1",
        }),
        body: JSON.stringify({
          id: "evt_gc_1",
          type: "payment.succeeded",
          data: { invoiceId: invoice.id, amount: "60.00", paymentId: "gc_1" },
        }),
      }
    );

    const res = await POST(
      req as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(res.status).toBe(200);

    const [inv] = await db
      .select({ status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.id, invoice.id)));
    expect(inv.status).toBe("paid");

    const payRows = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.firmId, ctx.firmId), eq(payments.invoiceId, invoice.id)));
    expect(payRows).toHaveLength(1);
  });
});
