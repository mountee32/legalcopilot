import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("Calendar integration accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /integrations/calendar/accounts returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 1,
      rows: [
        {
          id: "c1",
          provider: "google",
          externalAccountId: null,
          status: "connected",
          syncDirection: "push",
          lastSyncAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    } as any);

    const { GET } = await import("@/app/api/integrations/calendar/accounts/route");
    const request = new NextRequest(
      "http://localhost/api/integrations/calendar/accounts?page=1&limit=20"
    );
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.accounts)).toBe(true);
    expect(json.pagination.total).toBe(1);
  });

  it("POST /integrations/calendar/accounts returns webhook secret", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "c1",
      provider: "google",
      externalAccountId: null,
      status: "connected",
      syncDirection: "push",
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      webhookSecret: "secret-1",
    } as any);

    const { POST } = await import("@/app/api/integrations/calendar/accounts/route");
    const request = new NextRequest("http://localhost/api/integrations/calendar/accounts", {
      method: "POST",
      body: JSON.stringify({ provider: "google", syncDirection: "push" }),
    });
    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.webhookSecret).toBeTruthy();
    expect(typeof json.webhookPath).toBe("string");
  });

  it("GET /integrations/calendar/accounts/:id/health returns status without tokens", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const accountId = "223e4567-e89b-12d3-a456-426614174000";
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: accountId,
      provider: "google",
      tokens: { access_token: "secret-token" },
      webhookSecret: "secret-webhook",
      status: "connected",
      lastSyncAt: new Date("2025-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const { GET } = await import("@/app/api/integrations/calendar/accounts/[id]/health/route");
    const request = new NextRequest(
      `http://localhost/api/integrations/calendar/accounts/${accountId}/health`
    );
    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: accountId }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("connected");
    expect(json.lastSyncAt).toBeTruthy();
    expect(json.webhookActive).toBe(true);
    expect(json.tokens).toBeUndefined();
    expect(json.webhookSecret).toBeUndefined();
  });

  it("POST /integrations/calendar/accounts/:id/reconnect updates tokens and status", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const accountId = "223e4567-e89b-12d3-a456-426614174000";
    const updatedAt = new Date();
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: accountId,
      status: "connected",
      updatedAt,
    } as any);

    const { POST } = await import("@/app/api/integrations/calendar/accounts/[id]/reconnect/route");
    const request = new NextRequest(
      `http://localhost/api/integrations/calendar/accounts/${accountId}/reconnect`,
      {
        method: "POST",
        body: JSON.stringify({ tokens: { access_token: "new-token" } }),
      }
    );
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: accountId }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe(accountId);
    expect(json.status).toBe("connected");
    expect(json.updatedAt).toBeTruthy();
  });
});
