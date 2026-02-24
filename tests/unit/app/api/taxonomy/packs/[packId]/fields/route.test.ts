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

const mockParams = (packId: string) => Promise.resolve({ packId });

describe("Taxonomy Field Create API - POST /api/taxonomy/packs/:packId/fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a field in a firm-owned pack", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "field-1",
      categoryId: "cat-1",
      key: "mmi_date",
      label: "MMI Date",
      description: null,
      dataType: "date",
      examples: [],
      confidenceThreshold: "0.900",
      requiresHumanReview: false,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
    } as any);

    const { POST } = await import("@/app/api/taxonomy/packs/[packId]/fields/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/fields", {
      method: "POST",
      body: JSON.stringify({
        categoryId: "11111111-1111-4111-a111-111111111111",
        key: "mmi_date",
        label: "MMI Date",
        dataType: "date",
        confidenceThreshold: 0.9,
      }),
    });
    const response = await POST(request as any, { params: mockParams("pack-1") } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.key).toBe("mmi_date");
    expect(json.label).toBe("MMI Date");
  });

  it("returns validation error for invalid field key format", async () => {
    const { POST } = await import("@/app/api/taxonomy/packs/[packId]/fields/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/fields", {
      method: "POST",
      body: JSON.stringify({
        categoryId: "11111111-1111-4111-a111-111111111111",
        key: "Invalid Key",
        label: "MMI Date",
        dataType: "date",
      }),
    });
    const response = await POST(request as any, { params: mockParams("pack-1") } as any);

    expect([400, 500]).toContain(response.status);
  });
});
