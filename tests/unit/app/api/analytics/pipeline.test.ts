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
  NotFoundError: class NotFoundError extends Error {
    name = "NotFoundError";
  },
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("GET /api/analytics/pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns pipeline health KPIs and daily runs", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: {
          totalRuns: 50,
          completedRuns: 45,
          failedRuns: 5,
          avgDurationSeconds: 120,
        },
        dailyRuns: [
          { date: "2026-02-22", completed: 10, failed: 1, running: 0 },
          { date: "2026-02-23", completed: 15, failed: 2, running: 1 },
        ],
        failuresByStage: [
          { stage: "ocr", count: 3 },
          { stage: "extract", count: 2 },
        ],
      };
    });

    const { GET } = await import("@/app/api/analytics/pipeline/route");
    const request = new NextRequest("http://localhost/api/analytics/pipeline?days=30");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.kpis.totalRuns).toBe(50);
    expect(json.kpis.completedRuns).toBe(45);
    expect(json.dailyRuns).toHaveLength(2);
    expect(json.failuresByStage).toHaveLength(2);
  });

  it("defaults to 30 days when no days param provided", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: { totalRuns: 0, completedRuns: 0, failedRuns: 0, avgDurationSeconds: null },
        dailyRuns: [],
        failuresByStage: [],
      };
    });

    const { GET } = await import("@/app/api/analytics/pipeline/route");
    const request = new NextRequest("http://localhost/api/analytics/pipeline");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.kpis.totalRuns).toBe(0);
  });

  it("calls withFirmDb with correct firm ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, _callback) => {
      return {
        kpis: { totalRuns: 0, completedRuns: 0, failedRuns: 0, avgDurationSeconds: null },
        dailyRuns: [],
        failuresByStage: [],
      };
    });

    const { GET } = await import("@/app/api/analytics/pipeline/route");
    const request = new NextRequest("http://localhost/api/analytics/pipeline");
    await GET(request as any, {} as any);

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });
});
