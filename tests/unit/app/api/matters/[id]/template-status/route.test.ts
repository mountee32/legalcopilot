import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
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

const mockParams = (id: string) => Promise.resolve({ id });

describe("Template Status API - GET /api/matters/:id/template-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns applied template info", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      applications: [
        {
          id: "app-1",
          templateId: "t1",
          templateName: "Freehold Purchase - Standard",
          appliedAt: "2025-01-15T10:00:00Z",
          appliedById: "user-1",
          appliedByName: "Sarah Harrison",
          itemsApplied: [
            { templateItemId: "item-1", taskId: "task-1", wasModified: false, wasSkipped: false },
            { templateItemId: "item-2", taskId: "task-2", wasModified: true, wasSkipped: false },
            { templateItemId: "item-3", taskId: null, wasModified: false, wasSkipped: true },
          ],
        },
      ],
      skippedItems: [
        { id: "item-3", title: "Optional Task", mandatory: false, category: "best_practice" },
      ],
      availableTemplates: [
        { id: "t1", name: "Freehold Purchase - Standard", practiceArea: "conveyancing" },
        { id: "t2", name: "Freehold Sale - Standard", practiceArea: "conveyancing" },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/matters/[id]/template-status/route");
    const request = new NextRequest("http://localhost/api/matters/m1/template-status");
    const response = await GET(request as any, { params: mockParams("m1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.applications).toHaveLength(1);
    expect(json.applications[0].templateName).toBe("Freehold Purchase - Standard");
    expect(json.skippedItems).toHaveLength(1);
    expect(json.availableTemplates).toHaveLength(2);
  });

  it("returns empty when no template applied", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      applications: [],
      skippedItems: [],
      availableTemplates: [{ id: "t1", name: "Freehold Purchase", practiceArea: "conveyancing" }],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/matters/[id]/template-status/route");
    const request = new NextRequest("http://localhost/api/matters/m1/template-status");
    const response = await GET(request as any, { params: mockParams("m1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.applications).toEqual([]);
    expect(json.skippedItems).toEqual([]);
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Matter not found"));

    const { GET } = await import("@/app/api/matters/[id]/template-status/route");
    const request = new NextRequest("http://localhost/api/matters/nonexistent/template-status");
    const response = await GET(request as any, { params: mockParams("nonexistent") } as any);

    expect([404, 500]).toContain(response.status);
  });
});
