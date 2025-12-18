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

describe("Payment provider accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /integrations/payments/accounts returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce([
      {
        id: "p1",
        provider: "stripe",
        externalAccountId: null,
        status: "connected",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const { GET } = await import("@/app/api/integrations/payments/accounts/route");
    const request = new NextRequest("http://localhost/api/integrations/payments/accounts");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.accounts)).toBe(true);
  });

  it("POST /integrations/payments/accounts returns webhook secret", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "p1",
      provider: "stripe",
      externalAccountId: null,
      status: "connected",
      webhookSecret: "secret-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const { POST } = await import("@/app/api/integrations/payments/accounts/route");
    const request = new NextRequest("http://localhost/api/integrations/payments/accounts", {
      method: "POST",
      body: JSON.stringify({ provider: "stripe" }),
    });
    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.webhookSecret).toBeTruthy();
    expect(typeof json.webhookPath).toBe("string");
  });

  it("GET /integrations/payments/accounts/:id/health returns status without config", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const accountId = "323e4567-e89b-12d3-a456-426614174000";
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: accountId,
      provider: "stripe",
      config: { api_key: "secret-key" },
      webhookSecret: "secret-webhook",
      status: "connected",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const { GET } = await import("@/app/api/integrations/payments/accounts/[id]/health/route");
    const request = new NextRequest(
      `http://localhost/api/integrations/payments/accounts/${accountId}/health`
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
    expect(json.lastSyncAt).toBeNull();
    expect(json.webhookActive).toBe(true);
    expect(json.config).toBeUndefined();
    expect(json.webhookSecret).toBeUndefined();
  });

  it("POST /integrations/payments/accounts/:id/reconnect updates config and status", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const accountId = "323e4567-e89b-12d3-a456-426614174000";
    const updatedAt = new Date();
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: accountId,
      status: "connected",
      updatedAt,
    } as any);

    const { POST } = await import("@/app/api/integrations/payments/accounts/[id]/reconnect/route");
    const request = new NextRequest(
      `http://localhost/api/integrations/payments/accounts/${accountId}/reconnect`,
      {
        method: "POST",
        body: JSON.stringify({ config: { api_key: "new-key" } }),
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
