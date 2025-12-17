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

describe("Timeline route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns timeline list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 2,
      rows: [{ id: "e1" }, { id: "e2" }],
    } as any);

    const { GET } = await import("@/app/api/matters/[id]/timeline/route");
    const request = new NextRequest("http://localhost/api/matters/m1/timeline?page=1&limit=20");
    const response = await GET(request as any, { params: { id: "m1" } } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.events)).toBe(true);
    expect(json.pagination.total).toBe(2);
  });

  it("POST returns created event", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "e1",
      type: "note_added",
      title: "Call with client",
    } as any);

    const { POST } = await import("@/app/api/matters/[id]/timeline/route");
    const request = new NextRequest("http://localhost/api/matters/m1/timeline", {
      method: "POST",
      body: JSON.stringify({ title: "Call with client" }),
    });
    const response = await POST(request as any, { params: { id: "m1" } } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.id).toBe("e1");
  });
});
