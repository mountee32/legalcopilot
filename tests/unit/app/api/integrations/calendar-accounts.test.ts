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
});
