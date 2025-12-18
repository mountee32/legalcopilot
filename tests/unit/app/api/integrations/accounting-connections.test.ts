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

describe("Accounting connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /integrations/accounting/connections returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce([
      {
        id: "x1",
        provider: "xero",
        externalTenantId: null,
        status: "connected",
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const { GET } = await import("@/app/api/integrations/accounting/connections/route");
    const request = new NextRequest("http://localhost/api/integrations/accounting/connections");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.connections)).toBe(true);
  });

  it("POST /integrations/accounting/connections returns webhook secret", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "x1",
      provider: "xero",
      externalTenantId: null,
      status: "connected",
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      webhookSecret: "secret-1",
    } as any);

    const { POST } = await import("@/app/api/integrations/accounting/connections/route");
    const request = new NextRequest("http://localhost/api/integrations/accounting/connections", {
      method: "POST",
      body: JSON.stringify({ provider: "xero" }),
    });
    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.webhookSecret).toBeTruthy();
    expect(typeof json.webhookPath).toBe("string");
  });

  it("GET /integrations/accounting/connections/:id/health returns status without tokens", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const connectionId = "423e4567-e89b-12d3-a456-426614174000";
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: connectionId,
      provider: "xero",
      tokens: { access_token: "secret-token" },
      webhookSecret: "secret-webhook",
      status: "connected",
      lastSyncAt: new Date("2025-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const { GET } = await import("@/app/api/integrations/accounting/connections/[id]/health/route");
    const request = new NextRequest(
      `http://localhost/api/integrations/accounting/connections/${connectionId}/health`
    );
    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: connectionId }),
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

  it("POST /integrations/accounting/connections/:id/reconnect updates tokens and status", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const connectionId = "423e4567-e89b-12d3-a456-426614174000";
    const updatedAt = new Date();
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: connectionId,
      status: "connected",
      updatedAt,
    } as any);

    const { POST } =
      await import("@/app/api/integrations/accounting/connections/[id]/reconnect/route");
    const request = new NextRequest(
      `http://localhost/api/integrations/accounting/connections/${connectionId}/reconnect`,
      {
        method: "POST",
        body: JSON.stringify({ tokens: { access_token: "new-token" } }),
      }
    );
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: connectionId }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe(connectionId);
    expect(json.status).toBe("connected");
    expect(json.updatedAt).toBeTruthy();
  });
});
