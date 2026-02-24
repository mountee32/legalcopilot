import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "matter-1" }),
      user: { user: { id: "user-1" } },
    }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

describe("Pipeline API - GET /api/matters/[id]/pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns list of pipeline runs for a matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockRuns = [
      {
        id: "run-1",
        firmId: "firm-1",
        matterId: "matter-1",
        documentId: "doc-1",
        status: "completed",
        currentStage: "actions",
        stageStatuses: {},
        findingsCount: 5,
        actionsCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "run-2",
        firmId: "firm-1",
        matterId: "matter-1",
        documentId: "doc-2",
        status: "running",
        currentStage: "extract",
        stageStatuses: {},
        findingsCount: 0,
        actionsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockRuns as any);

    const { GET } = await import("@/app/api/matters/[id]/pipeline/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/pipeline");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.runs)).toBe(true);
    expect(json.runs.length).toBe(2);
    expect(json.runs[0].status).toBe("completed");
  });

  it("returns empty list when no pipeline runs exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/matters/[id]/pipeline/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/pipeline");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.runs).toEqual([]);
  });

  it("returns 404 when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Matter not found"));

    const { GET } = await import("@/app/api/matters/[id]/pipeline/route");
    const request = new NextRequest("http://localhost/api/matters/matter-999/pipeline");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ id: "matter-999" }) } as any
    );

    expect(response.status).toBe(404);
  });
});
