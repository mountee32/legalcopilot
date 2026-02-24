import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-1" } },
    }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: (_perm: string) => (handler: any) => handler,
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("GET /api/analytics/extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns extraction quality metrics", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: {
          totalFindings: 200,
          avgConfidence: 0.82,
          acceptRate: 0.75,
          autoAppliedRate: 0.15,
        },
        findingsByStatus: [
          { status: "accepted", count: 120 },
          { status: "pending", count: 40 },
          { status: "auto_applied", count: 30 },
          { status: "rejected", count: 10 },
        ],
        confidenceDistribution: [
          { bucket: "0-20%", count: 5 },
          { bucket: "20-40%", count: 10 },
          { bucket: "40-60%", count: 25 },
          { bucket: "60-80%", count: 60 },
          { bucket: "80-100%", count: 100 },
        ],
        topCategories: [
          { category: "claimant_info", count: 50, avgConfidence: 0.9 },
          { category: "incident_details", count: 40, avgConfidence: 0.85 },
        ],
      };
    });

    const { GET } = await import("@/app/api/analytics/extraction/route");
    const request = new NextRequest("http://localhost/api/analytics/extraction?days=30");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.kpis.totalFindings).toBe(200);
    expect(json.kpis.avgConfidence).toBe(0.82);
    expect(json.findingsByStatus).toHaveLength(4);
    expect(json.confidenceDistribution).toHaveLength(5);
    expect(json.topCategories).toHaveLength(2);
  });

  it("handles empty findings gracefully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: {
          totalFindings: 0,
          avgConfidence: null,
          acceptRate: null,
          autoAppliedRate: null,
        },
        findingsByStatus: [],
        confidenceDistribution: [],
        topCategories: [],
      };
    });

    const { GET } = await import("@/app/api/analytics/extraction/route");
    const request = new NextRequest("http://localhost/api/analytics/extraction");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.kpis.totalFindings).toBe(0);
    expect(json.kpis.avgConfidence).toBeNull();
    expect(json.findingsByStatus).toEqual([]);
  });

  it("respects days query parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: { totalFindings: 10, avgConfidence: 0.9, acceptRate: 1.0, autoAppliedRate: 0 },
        findingsByStatus: [{ status: "accepted", count: 10 }],
        confidenceDistribution: [{ bucket: "80-100%", count: 10 }],
        topCategories: [],
      };
    });

    const { GET } = await import("@/app/api/analytics/extraction/route");
    const request = new NextRequest("http://localhost/api/analytics/extraction?days=7");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });
});
