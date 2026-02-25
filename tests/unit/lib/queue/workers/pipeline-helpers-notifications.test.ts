import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  pipelineRuns: {
    id: "id",
    firmId: "firm_id",
    matterId: "matter_id",
    triggeredBy: "triggered_by",
    stageStatuses: "stage_statuses",
    status: "status",
  },
  pipelineFindings: {
    matterId: "matter_id",
    firmId: "firm_id",
    status: "status",
    impact: "impact",
    confidence: "confidence",
  },
  matters: { id: "id" },
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => ({ id: "tl-1" })),
}));

vi.mock("@/lib/pipeline/risk-score", () => ({
  calculateRiskScore: vi.fn(() => ({ score: 50, factors: [] })),
}));

vi.mock("@/lib/notifications/create", () => ({
  createNotification: vi.fn(async () => undefined),
}));

async function mockDbForCompleted(run: Record<string, unknown>) {
  const { db } = await import("@/lib/db");
  let selectCall = 0;
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => {
        selectCall++;
        if (selectCall === 1) return [run];
        return [];
      }),
    }),
  });
  (db.update as any).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  });
}

async function mockDbForFailed(run: Record<string, unknown>) {
  const { db } = await import("@/lib/db");
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([run]),
    }),
  });
  (db.update as any).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  });
}

describe("markPipelineCompleted - notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls createNotification when triggeredBy is set", async () => {
    await mockDbForCompleted({
      firmId: "f1",
      matterId: "m1",
      triggeredBy: "u1",
    });

    const { markPipelineCompleted } = await import("@/lib/queue/workers/pipeline-helpers");
    await markPipelineCompleted("run-1");

    const { createNotification } = await import("@/lib/notifications/create");
    expect(createNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "system",
        userId: "u1",
        title: "Document pipeline completed",
      })
    );
  });

  it("does not call createNotification when triggeredBy is null", async () => {
    await mockDbForCompleted({
      firmId: "f1",
      matterId: "m1",
      triggeredBy: null,
    });

    const { markPipelineCompleted } = await import("@/lib/queue/workers/pipeline-helpers");
    await markPipelineCompleted("run-1");

    const { createNotification } = await import("@/lib/notifications/create");
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("does not block pipeline completion when notification fails", async () => {
    await mockDbForCompleted({
      firmId: "f1",
      matterId: "m1",
      triggeredBy: "u1",
    });

    const { createNotification } = await import("@/lib/notifications/create");
    vi.mocked(createNotification).mockRejectedValue(new Error("DB timeout"));

    const { markPipelineCompleted } = await import("@/lib/queue/workers/pipeline-helpers");
    await expect(markPipelineCompleted("run-1")).resolves.toBeUndefined();
  });
});

describe("markPipelineFailed - notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls createNotification on pipeline failure", async () => {
    await mockDbForFailed({
      stageStatuses: {},
      firmId: "f1",
      matterId: "m1",
      triggeredBy: "u1",
    });

    const { markPipelineFailed } = await import("@/lib/queue/workers/pipeline-helpers");
    await markPipelineFailed("run-1", "extract", "Model timeout");

    const { createNotification } = await import("@/lib/notifications/create");
    expect(createNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "system",
        userId: "u1",
        title: "Pipeline failed at stage: extract",
      })
    );
  });

  it("uses generic error message instead of raw error details", async () => {
    await mockDbForFailed({
      stageStatuses: {},
      firmId: "f1",
      matterId: "m1",
      triggeredBy: "u1",
    });

    const { markPipelineFailed } = await import("@/lib/queue/workers/pipeline-helpers");
    await markPipelineFailed("run-1", "extract", "Internal: model timeout at xyz");

    const { createNotification } = await import("@/lib/notifications/create");
    const call = vi.mocked(createNotification).mock.calls[0][1];
    expect(call.body).toBe(
      "A pipeline stage encountered an error. Check the pipeline tab for details."
    );
  });
});
