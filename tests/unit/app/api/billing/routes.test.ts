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

describe("Billing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /time-entries returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: [{ id: "t1" }] } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries?page=1&limit=20");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.timeEntries)).toBe(true);
    expect(json.pagination.total).toBe(1);
  });

  it("GET /invoices returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 2,
      rows: [{ id: "i1" }, { id: "i2" }],
    } as any);

    const { GET } = await import("@/app/api/invoices/route");
    const request = new NextRequest("http://localhost/api/invoices?page=1&limit=20");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.invoices)).toBe(true);
    expect(json.pagination.total).toBe(2);
  });

  it("GET /payments returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/payments/route");
    const request = new NextRequest("http://localhost/api/payments?page=1&limit=20");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);
  });

  it("POST /invoices/:id/send returns 201 on approval create", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ id: "a1", action: "invoice.send" } as any);

    const { POST } = await import("@/app/api/invoices/[id]/send/route");
    const request = new NextRequest("http://localhost/api/invoices/i1/send", { method: "POST" });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );
    expect(response.status).toBe(201);
  });

  it("POST /invoices/:id/pay-link returns 201 with payment link", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "i1",
      token: "test-token",
      expiresAt: new Date("2025-12-21T00:00:00Z"),
    } as any);

    const { POST } = await import("@/app/api/invoices/[id]/pay-link/route");
    const request = new NextRequest("http://localhost/api/invoices/i1/pay-link", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.paymentUrl).toBeDefined();
    expect(json.token).toBe("test-token");
  });
});
