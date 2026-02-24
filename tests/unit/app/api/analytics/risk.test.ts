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

describe("GET /api/analytics/risk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns risk overview metrics", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: {
          mattersWithRisk: 15,
          avgRiskScore: 42,
          highRiskCount: 3,
          criticalFindingsCount: 7,
        },
        riskDistribution: [
          { bucket: "0-20", count: 3 },
          { bucket: "21-40", count: 5 },
          { bucket: "41-60", count: 4 },
          { bucket: "61-80", count: 2 },
          { bucket: "81-100", count: 1 },
        ],
        riskByPracticeArea: [
          { practiceArea: "personal_injury", avgScore: 62, matterCount: 5 },
          { practiceArea: "litigation", avgScore: 35, matterCount: 4 },
        ],
      };
    });

    const { GET } = await import("@/app/api/analytics/risk/route");
    const request = new NextRequest("http://localhost/api/analytics/risk?days=30");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.kpis.mattersWithRisk).toBe(15);
    expect(json.kpis.highRiskCount).toBe(3);
    expect(json.riskDistribution).toHaveLength(5);
    expect(json.riskByPracticeArea).toHaveLength(2);
    expect(json.riskByPracticeArea[0].practiceArea).toBe("personal_injury");
  });

  it("handles no risk data gracefully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: {
          mattersWithRisk: 0,
          avgRiskScore: null,
          highRiskCount: 0,
          criticalFindingsCount: 0,
        },
        riskDistribution: [],
        riskByPracticeArea: [],
      };
    });

    const { GET } = await import("@/app/api/analytics/risk/route");
    const request = new NextRequest("http://localhost/api/analytics/risk");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.kpis.mattersWithRisk).toBe(0);
    expect(json.kpis.avgRiskScore).toBeNull();
    expect(json.riskDistribution).toEqual([]);
    expect(json.riskByPracticeArea).toEqual([]);
  });

  it("calls withFirmDb with correct firm ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: {
          mattersWithRisk: 0,
          avgRiskScore: null,
          highRiskCount: 0,
          criticalFindingsCount: 0,
        },
        riskDistribution: [],
        riskByPracticeArea: [],
      };
    });

    const { GET } = await import("@/app/api/analytics/risk/route");
    const request = new NextRequest("http://localhost/api/analytics/risk");
    await GET(request as any, {} as any);

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });
});
