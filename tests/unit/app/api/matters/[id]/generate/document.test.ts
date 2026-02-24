/**
 * Tests for POST /api/matters/[id]/generate
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

vi.mock("@/lib/generation/demand-letter", () => ({
  generateDemandLetter: vi.fn(),
  textToPdf: vi.fn(),
}));

vi.mock("@/lib/templates/render", () => ({
  renderTemplate: vi.fn(),
}));

vi.mock("@/lib/storage/minio", () => ({
  uploadFile: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => ({})),
}));

describe("POST /api/matters/[id]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("generates document and returns record", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      document: {
        id: "doc-1",
        title: "PI Demand Letter — MAT-001",
        type: "letter_out",
        status: "draft",
        filename: "PI_Demand_Letter_MAT-001.pdf",
      },
      aiSections: ["liability_narrative"],
      missingFields: [],
      tokensUsed: 150,
    });

    const { POST } = await import("@/app/api/matters/[id]/generate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: "00000000-0000-4000-a000-000000000001" }),
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.document.id).toBe("doc-1");
    expect(data.document.status).toBe("draft");
    expect(data.document.type).toBe("letter_out");
    expect(data.aiSections).toEqual(["liability_narrative"]);
    expect(data.tokensUsed).toBe(150);
  });

  it("returns 404 for missing template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      Object.assign(new Error("Template not found"), { statusCode: 404 })
    );

    const { POST } = await import("@/app/api/matters/[id]/generate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: "00000000-0000-4000-a000-000000000099" }),
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(response.status).toBe(404);
  });

  it("calls withFirmDb with correct firm ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      document: {
        id: "doc-1",
        title: "Test",
        type: "letter_out",
        status: "draft",
        filename: "test.pdf",
      },
      aiSections: [],
      missingFields: [],
      tokensUsed: 0,
    });

    const { POST } = await import("@/app/api/matters/[id]/generate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: "00000000-0000-4000-a000-000000000001" }),
    });
    await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });

  it("validates request body requires templateId", async () => {
    const { POST } = await import("@/app/api/matters/[id]/generate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    // Zod validation error should return 400
    expect(response.status).toBe(400);
  });

  it("returns document with correct metadata fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      document: {
        id: "doc-2",
        title: "PI Demand Letter — MAT-002",
        type: "letter_out",
        status: "draft",
        filename: "PI_Demand_Letter_MAT-002.pdf",
      },
      aiSections: ["liability_narrative", "injury_narrative", "damages_narrative"],
      missingFields: ["findings.total_demand"],
      tokensUsed: 500,
    });

    const { POST } = await import("@/app/api/matters/[id]/generate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: "00000000-0000-4000-a000-000000000001" }),
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);
    const data = await response.json();

    expect(data.aiSections).toHaveLength(3);
    expect(data.missingFields).toContain("findings.total_demand");
    expect(data.tokensUsed).toBe(500);
  });
});
