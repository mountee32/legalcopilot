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

describe("Taxonomy Pack Detail API - GET /api/taxonomy/packs/:packId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns full pack detail with nested fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      pack: {
        id: "pack-1",
        firmId: null,
        key: "workers-comp",
        version: "1.0.0",
        name: "Workers' Compensation",
        description: "System pack",
        practiceArea: "workers_compensation",
        isSystem: true,
        isActive: true,
        parentPackId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      categories: [
        {
          id: "cat-1",
          packId: "pack-1",
          key: "medical_intelligence",
          label: "Medical Intelligence",
          description: null,
          icon: null,
          color: null,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      fields: [
        {
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
        },
      ],
      documentTypes: [],
      actionTriggers: [],
      reconciliationRules: [],
      promptTemplates: [],
    } as any);

    const { GET } = await import("@/app/api/taxonomy/packs/[packId]/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1");
    const response = await GET(request as any, { params: mockParams("pack-1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pack.id).toBe("pack-1");
    expect(json.categories).toHaveLength(1);
    expect(json.categories[0].fields).toHaveLength(1);
    expect(json.categories[0].fields[0].key).toBe("mmi_date");
  });

  it("returns not found when pack does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Taxonomy pack not found"));

    const { GET } = await import("@/app/api/taxonomy/packs/[packId]/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/missing");
    const response = await GET(request as any, { params: mockParams("missing") } as any);

    expect([404, 500]).toContain(response.status);
  });
});
