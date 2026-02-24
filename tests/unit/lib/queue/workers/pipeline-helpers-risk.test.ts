import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  pipelineRuns: { id: "id", firmId: "firm_id", matterId: "matter_id" },
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
  createTimelineEvent: vi.fn(async () => ({})),
}));

vi.mock("@/lib/pipeline/risk-score", () => ({
  calculateRiskScore: vi.fn(),
}));

describe("markPipelineCompleted - risk recalculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls recalculateMatterRisk after pipeline completion", async () => {
    const { db } = await import("@/lib/db");
    const { calculateRiskScore } = await import("@/lib/pipeline/risk-score");

    // Mock the first select (for run data)
    const selectMock = vi.fn().mockReturnThis();
    const fromMock = vi.fn().mockReturnThis();
    const whereMock = vi.fn();

    // First call: markPipelineCompleted's select for run
    // Second call: recalculateMatterRisk's select for findings
    let callCount = 0;
    whereMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [{ firmId: "firm-1", matterId: "matter-1" }];
      if (callCount === 2) return []; // empty findings
      return [];
    });

    vi.mocked(db.select).mockReturnValue({ from: fromMock } as any);
    fromMock.mockReturnValue({ where: whereMock } as any);

    const setMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    vi.mocked(db.update).mockReturnValue({ set: setMock } as any);

    vi.mocked(calculateRiskScore).mockReturnValue({ score: 0, factors: [] });

    const { markPipelineCompleted } = await import("@/lib/queue/workers/pipeline-helpers");
    await markPipelineCompleted("run-1");

    expect(calculateRiskScore).toHaveBeenCalled();
  });

  it("does not block pipeline completion when risk calculation fails", async () => {
    const { db } = await import("@/lib/db");
    const { calculateRiskScore } = await import("@/lib/pipeline/risk-score");

    let callCount = 0;
    const whereMock = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [{ firmId: "firm-1", matterId: "matter-1" }];
      throw new Error("DB connection failed");
    });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ where: whereMock }),
    } as any);

    const setMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    vi.mocked(db.update).mockReturnValue({ set: setMock } as any);

    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");
    vi.mocked(createTimelineEvent).mockResolvedValue(undefined as any);

    const { markPipelineCompleted } = await import("@/lib/queue/workers/pipeline-helpers");

    // Should not throw despite risk calculation failure
    await expect(markPipelineCompleted("run-1")).resolves.toBeUndefined();
  });

  it("recalculateMatterRisk fetches findings and updates matter", async () => {
    const { db } = await import("@/lib/db");
    const { calculateRiskScore } = await import("@/lib/pipeline/risk-score");

    const mockFindings = [
      { status: "pending", impact: "high", confidence: "0.850" },
      { status: "accepted", impact: "medium", confidence: "0.920" },
    ];

    const whereMockSelect = vi.fn().mockResolvedValue(mockFindings);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ where: whereMockSelect }),
    } as any);

    const whereMockUpdate = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMockUpdate });
    vi.mocked(db.update).mockReturnValue({ set: setMock } as any);

    vi.mocked(calculateRiskScore).mockReturnValue({
      score: 42,
      factors: [{ key: "test", label: "Test", contribution: 42, detail: "testing" }],
    });

    const { recalculateMatterRisk } = await import("@/lib/queue/workers/pipeline-helpers");
    const result = await recalculateMatterRisk("matter-1", "firm-1");

    expect(result.score).toBe(42);
    expect(result.factors).toHaveLength(1);
    expect(db.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        riskScore: 42,
        riskFactors: expect.any(Array),
        riskAssessedAt: expect.any(Date),
      })
    );
  });

  it("handles empty findings gracefully", async () => {
    const { db } = await import("@/lib/db");
    const { calculateRiskScore } = await import("@/lib/pipeline/risk-score");

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const setMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    vi.mocked(db.update).mockReturnValue({ set: setMock } as any);

    vi.mocked(calculateRiskScore).mockReturnValue({ score: 0, factors: [] });

    const { recalculateMatterRisk } = await import("@/lib/queue/workers/pipeline-helpers");
    const result = await recalculateMatterRisk("matter-1", "firm-1");

    expect(result.score).toBe(0);
    expect(result.factors).toEqual([]);
    expect(calculateRiskScore).toHaveBeenCalledWith([]);
  });
});
