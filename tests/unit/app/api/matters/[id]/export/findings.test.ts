/**
 * Tests for GET /api/matters/[id]/export/findings
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "matter-1" }),
      user: { user: { id: "user-1" } },
    }),
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

vi.mock("@/lib/generation/context-builder", () => ({
  buildGenerationContext: vi.fn(),
}));

vi.mock("@/lib/generation/pdf-report", () => ({
  generateFindingsReport: vi.fn(),
}));

describe("GET /api/matters/[id]/export/findings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns PDF with correct content-type and content-disposition", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    // The PDF bytes as a Uint8Array
    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    vi.mocked(withFirmDb).mockResolvedValueOnce(fakePdf);

    const { GET } = await import("@/app/api/matters/[id]/export/findings/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/export/findings");
    const response = await GET(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain(".pdf");
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      Object.assign(new Error("Matter not found"), { statusCode: 404 })
    );

    const { GET } = await import("@/app/api/matters/[id]/export/findings/route");
    const req = new NextRequest("http://localhost:3000/api/matters/missing/export/findings");
    const response = await GET(req, { params: Promise.resolve({ id: "missing" }) } as any);

    expect(response.status).toBe(404);
  });

  it("calls withFirmDb with correct firm ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    vi.mocked(withFirmDb).mockResolvedValueOnce(fakePdf);

    const { GET } = await import("@/app/api/matters/[id]/export/findings/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/export/findings");
    await GET(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });

  it("returns PDF with valid Content-Length header", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const fakePdf = new Uint8Array(500);
    vi.mocked(withFirmDb).mockResolvedValueOnce(fakePdf);

    const { GET } = await import("@/app/api/matters/[id]/export/findings/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/export/findings");
    const response = await GET(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(response.headers.get("Content-Length")).toBe("500");
  });
});
