// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { calendarAccounts, calendarProviderEvents } from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";

describe("Webhooks - Calendar (Google)", () => {
  const ctx = setupIntegrationSuite();

  it("validates secret and enforces idempotency", async () => {
    const user = await createUser({ firmId: ctx.firmId });
    const [account] = await db
      .insert(calendarAccounts)
      .values({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "google",
        webhookSecret: "cal_secret",
        status: "connected",
        syncDirection: "both",
      })
      .returning({ id: calendarAccounts.id });

    const { POST } = await import("@/app/api/webhooks/calendar/[firmId]/[accountId]/route");

    const makeReq = () =>
      new NextRequest(`http://localhost/api/webhooks/calendar/${ctx.firmId}/${account.id}`, {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          "x-webhook-secret": "cal_secret",
          "x-event-id": "evt_cal_1",
        }),
        body: JSON.stringify({ id: "evt_cal_1", type: "calendar.event" }),
      });

    const res1 = await POST(
      makeReq() as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(res1.status).toBe(200);
    const res2 = await POST(
      makeReq() as any,
      { params: { firmId: ctx.firmId, accountId: account.id } } as any
    );
    expect(res2.status).toBe(200);

    const rows = await db
      .select({ id: calendarProviderEvents.id })
      .from(calendarProviderEvents)
      .where(
        and(
          eq(calendarProviderEvents.firmId, ctx.firmId),
          eq(calendarProviderEvents.provider, "google"),
          eq(calendarProviderEvents.externalEventId, "evt_cal_1")
        )
      );
    expect(rows).toHaveLength(1);
  });
});
