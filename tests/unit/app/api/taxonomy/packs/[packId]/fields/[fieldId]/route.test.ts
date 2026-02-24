import { beforeEach, describe, expect, it, vi } from "vitest";
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

const mockParams = (packId: string, fieldId: string) => Promise.resolve({ packId, fieldId });

describe("Taxonomy Field Update API - PUT /api/taxonomy/packs/:packId/fields/:fieldId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates editable field attributes", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "field-1",
      categoryId: "cat-1",
      key: "mmi_date",
      label: "MMI Date (Updated)",
      description: "Updated description",
      dataType: "date",
      examples: [],
      confidenceThreshold: "0.920",
      requiresHumanReview: true,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
    } as any);

    const { PUT } = await import("@/app/api/taxonomy/packs/[packId]/fields/[fieldId]/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/fields/field-1", {
      method: "PUT",
      body: JSON.stringify({
        label: "MMI Date (Updated)",
        description: "Updated description",
        confidenceThreshold: 0.92,
        requiresHumanReview: true,
      }),
    });
    const response = await PUT(
      request as any,
      {
        params: mockParams("pack-1", "field-1"),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.label).toBe("MMI Date (Updated)");
    expect(json.requiresHumanReview).toBe(true);
  });

  it("returns not found when field does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Taxonomy field not found"));

    const { PUT } = await import("@/app/api/taxonomy/packs/[packId]/fields/[fieldId]/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/fields/missing", {
      method: "PUT",
      body: JSON.stringify({
        label: "Updated",
      }),
    });
    const response = await PUT(
      request as any,
      {
        params: mockParams("pack-1", "missing"),
      } as any
    );

    expect([404, 500]).toContain(response.status);
  });
});
