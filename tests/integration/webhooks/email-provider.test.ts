// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailAccounts, emailProviderEvents } from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";

describe("Webhooks - Email Provider", () => {
  const ctx = setupIntegrationSuite();

  it("validates secret and enforces idempotency", async () => {
    const user = await createUser({ firmId: ctx.firmId });
    const [account] = await db
      .insert(emailAccounts)
      .values({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "google",
        emailAddress: user.email,
        webhookSecret: "email_secret",
        status: "connected",
      })
      .returning({ id: emailAccounts.id });

    const { POST } = await import("@/app/api/webhooks/email/[firmId]/[accountId]/route");

    const makeReq = (secret: string) =>
      new NextRequest(`http://localhost/api/webhooks/email/${ctx.firmId}/${account.id}`, {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": secret,
          "x-event-id": "evt_email_1",
        }),
        body: JSON.stringify({ id: "evt_email_1", event: "delivered" }),
      });

    const bad = await POST(
      makeReq("wrong") as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(bad.status).toBe(400);

    const ok1 = await POST(
      makeReq("email_secret") as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(ok1.status).toBe(200);

    const ok2 = await POST(
      makeReq("email_secret") as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(ok2.status).toBe(200);

    const rows = await db
      .select({ id: emailProviderEvents.id })
      .from(emailProviderEvents)
      .where(
        and(
          eq(emailProviderEvents.firmId, ctx.firmId),
          eq(emailProviderEvents.provider, "google"),
          eq(emailProviderEvents.externalEventId, "evt_email_1")
        )
      );
    expect(rows).toHaveLength(1);
  });
});
