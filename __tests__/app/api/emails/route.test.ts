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

describe("Emails API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: [{ id: "e1" }] } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?page=1&limit=20");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.emails)).toBe(true);
    expect(json.pagination.total).toBe(1);
  });
});
