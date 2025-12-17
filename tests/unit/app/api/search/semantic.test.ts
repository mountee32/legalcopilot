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

describe("Semantic search routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENROUTER_API_KEY;
  });

  it("POST /api/search/semantic returns 400 when OPENROUTER_API_KEY missing", async () => {
    const { POST } = await import("@/app/api/search/semantic/route");
    const request = new NextRequest("http://localhost/api/search/semantic", {
      method: "POST",
      body: JSON.stringify({ query: "test" }),
    });
    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeTruthy();
  });

  it("GET /api/matters/:id/search returns 400 when OPENROUTER_API_KEY missing", async () => {
    const { GET } = await import("@/app/api/matters/[id]/search/route");
    const request = new NextRequest("http://localhost/api/matters/m1/search?q=test");
    const response = await GET(request as any, { params: { id: "m1" } } as any);
    expect(response.status).toBe(400);
  });
});
