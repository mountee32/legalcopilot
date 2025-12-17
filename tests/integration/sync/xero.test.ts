// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountingConnections, accountingSyncEvents } from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";

describe("Webhooks - Accounting (Xero)", () => {
  const ctx = setupIntegrationSuite();

  it("rejects invalid secret", async () => {
    const [conn] = await db
      .insert(accountingConnections)
      .values({
        firmId: ctx.firmId,
        provider: "xero",
        webhookSecret: "acc_secret",
        status: "connected",
      })
      .returning({ id: accountingConnections.id });

    const { POST } = await import("@/app/api/webhooks/accounting/[firmId]/[connectionId]/route");
    const req = new NextRequest(
      `http://localhost/api/webhooks/accounting/${ctx.firmId}/${conn.id}`,
      {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": "wrong",
        }),
        body: JSON.stringify({ entityType: "invoice", status: "received" }),
      }
    );

    const res = await POST(
      req as any,
      { params: { firmId: ctx.firmId, connectionId: conn.id } } as any
    );
    expect(res.status).toBe(400);
  });

  it("creates accounting sync event for valid secret", async () => {
    const [conn] = await db
      .insert(accountingConnections)
      .values({
        firmId: ctx.firmId,
        provider: "xero",
        webhookSecret: "acc_secret",
        status: "connected",
      })
      .returning({ id: accountingConnections.id });

    const { POST } = await import("@/app/api/webhooks/accounting/[firmId]/[connectionId]/route");
    const req = new NextRequest(
      `http://localhost/api/webhooks/accounting/${ctx.firmId}/${conn.id}`,
      {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": "acc_secret",
        }),
        body: JSON.stringify({ entityType: "invoice", status: "received", externalId: "xero_1" }),
      }
    );

    const res = await POST(
      req as any,
      { params: { firmId: ctx.firmId, connectionId: conn.id } } as any
    );
    expect(res.status).toBe(200);

    const rows = await db
      .select({ id: accountingSyncEvents.id })
      .from(accountingSyncEvents)
      .where(eq(accountingSyncEvents.firmId, ctx.firmId));
    expect(rows.length).toBeGreaterThan(0);
  });
});
