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

vi.mock("@/lib/pipeline/risk-score", () => ({
  calculateRiskScore: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => ({})),
}));

describe("POST /api/matters/[id]/risk/recalculate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns recalculated risk score with findings", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      riskScore: 62,
      riskFactors: [
        { key: "critical_pending", label: "Critical", contribution: 30, detail: "2 critical" },
      ],
      riskAssessedAt: new Date().toISOString(),
    });

    const { POST } = await import("@/app/api/matters/[id]/risk/recalculate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/risk/recalculate", {
      method: "POST",
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.riskScore).toBe(62);
    expect(data.riskFactors).toHaveLength(1);
    expect(data.riskAssessedAt).toBeDefined();
  });

  it("returns score 0 when no findings exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      riskScore: 0,
      riskFactors: [],
      riskAssessedAt: new Date().toISOString(),
    });

    const { POST } = await import("@/app/api/matters/[id]/risk/recalculate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/risk/recalculate", {
      method: "POST",
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.riskScore).toBe(0);
    expect(data.riskFactors).toEqual([]);
  });

  it("returns 404 when matter not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      Object.assign(new Error("Matter not found"), { statusCode: 404 })
    );

    const { POST } = await import("@/app/api/matters/[id]/risk/recalculate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/risk/recalculate", {
      method: "POST",
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(response.status).toBe(404);
  });

  it("calls withFirmDb with correct firm ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      riskScore: 10,
      riskFactors: [],
      riskAssessedAt: new Date().toISOString(),
    });

    const { POST } = await import("@/app/api/matters/[id]/risk/recalculate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/risk/recalculate", {
      method: "POST",
    });
    await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });

  it("returns ISO datetime for riskAssessedAt", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const now = new Date().toISOString();
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      riskScore: 45,
      riskFactors: [
        { key: "conflicts", label: "Conflicts", contribution: 12, detail: "1 conflict" },
      ],
      riskAssessedAt: now,
    });

    const { POST } = await import("@/app/api/matters/[id]/risk/recalculate/route");
    const req = new NextRequest("http://localhost:3000/api/matters/matter-1/risk/recalculate", {
      method: "POST",
    });
    const response = await POST(req, { params: Promise.resolve({ id: "matter-1" }) } as any);
    const data = await response.json();

    expect(data.riskAssessedAt).toBe(now);
  });
});
