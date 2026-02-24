import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ runId: "run-1" }),
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

describe("Pipeline API - GET /api/pipeline/[runId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns pipeline run detail with findings and actions", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      run: {
        id: "run-1",
        firmId: "firm-1",
        matterId: "matter-1",
        documentId: "doc-1",
        status: "completed",
        currentStage: "actions",
        stageStatuses: {
          intake: { status: "completed" },
          ocr: { status: "completed" },
          classify: { status: "completed" },
          extract: { status: "completed" },
          reconcile: { status: "completed" },
          actions: { status: "completed" },
        },
        findingsCount: 3,
        actionsCount: 1,
        createdAt: new Date(),
      },
      findings: [
        {
          id: "f-1",
          categoryKey: "claimant_info",
          fieldKey: "claimant_name",
          label: "Claimant Name",
          value: "John Smith",
          confidence: "0.920",
          impact: "high",
          status: "pending",
        },
        {
          id: "f-2",
          categoryKey: "injury_details",
          fieldKey: "injury_date",
          label: "Date of Injury",
          value: "2025-03-15",
          confidence: "0.880",
          impact: "critical",
          status: "pending",
        },
        {
          id: "f-3",
          categoryKey: "employer_info",
          fieldKey: "employer_name",
          label: "Employer Name",
          value: "Acme Corp",
          confidence: "0.750",
          impact: "medium",
          status: "pending",
        },
      ],
      actions: [
        {
          id: "a-1",
          actionType: "create_deadline",
          title: "Set statute of limitations deadline",
          status: "pending",
        },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/pipeline/[runId]/route");
    const request = new NextRequest("http://localhost/api/pipeline/run-1");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ runId: "run-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.run.status).toBe("completed");
    expect(json.findings.length).toBe(3);
    expect(json.actions.length).toBe(1);
    expect(json.findings[0].fieldKey).toBe("claimant_name");
  });

  it("returns 404 when pipeline run not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Pipeline run not found"));

    const { GET } = await import("@/app/api/pipeline/[runId]/route");
    const request = new NextRequest("http://localhost/api/pipeline/run-999");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ runId: "run-999" }) } as any
    );

    expect(response.status).toBe(404);
  });

  it("returns empty findings/actions for queued run", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      run: {
        id: "run-2",
        firmId: "firm-1",
        matterId: "matter-1",
        documentId: "doc-2",
        status: "queued",
        stageStatuses: {},
        findingsCount: 0,
        actionsCount: 0,
      },
      findings: [],
      actions: [],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/pipeline/[runId]/route");
    const request = new NextRequest("http://localhost/api/pipeline/run-2");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ runId: "run-2" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.findings).toEqual([]);
    expect(json.actions).toEqual([]);
  });
});
