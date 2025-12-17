import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (_request: any, ctx: any) =>
    handler(_request, { ...ctx, user: { user: { id: "user-1" } } }),
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

describe("Email AI process route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when OPENROUTER_API_KEY missing", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/emails/[id]/ai/process/route");
    const request = new NextRequest("http://localhost/api/emails/e1/ai/process", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(400);

    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });

  it("returns success when withFirmDb returns updated row", async () => {
    process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ id: "e1" } as any);

    const { POST } = await import("@/app/api/emails/[id]/ai/process/route");
    const request = new NextRequest("http://localhost/api/emails/e1/ai/process", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(200);
  });
});
