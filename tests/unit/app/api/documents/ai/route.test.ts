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

describe("Document AI routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /documents/:id/extract returns extraction shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      extractedText: "hello",
      chunkCount: null,
    } as any);

    const { POST } = await import("@/app/api/documents/[id]/extract/route");
    const request = new NextRequest("http://localhost/api/documents/d1/extract", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(typeof json.extractedText).toBe("string");
    expect(typeof json.length).toBe("number");
  });

  it("POST /documents/:id/summarize returns 400 when OPENROUTER_API_KEY missing", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/documents/[id]/summarize/route");
    const request = new NextRequest("http://localhost/api/documents/d1/summarize", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(400);
    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });

  it("POST /documents/:id/entities returns 400 when OPENROUTER_API_KEY missing", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/documents/[id]/entities/route");
    const request = new NextRequest("http://localhost/api/documents/d1/entities", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(400);
    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });
});
