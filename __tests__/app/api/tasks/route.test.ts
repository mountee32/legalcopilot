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

describe("Tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: [{ id: "t1" }] } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks?page=1&limit=20");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json.tasks)).toBe(true);
    expect(json.pagination.total).toBe(1);
  });

  it("POST returns created task", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "123e4567-e89b-12d3-a456-426614174000",
      matterId: "223e4567-e89b-12d3-a456-426614174000",
      title: "Do thing",
    } as any);

    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ matterId: "223e4567-e89b-12d3-a456-426614174000", title: "Do thing" }),
    });
    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });
});
