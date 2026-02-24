import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock BullMQ before imports
vi.mock("bullmq", () => {
  const mockAdd = vi.fn().mockResolvedValue({ id: "job-1" });
  return {
    Queue: vi.fn().mockImplementation(() => ({ add: mockAdd })),
    QueueEvents: vi.fn(),
  };
});

describe("Pipeline Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports all 6 stage queues", async () => {
    const pipeline = await import("@/lib/queue/pipeline");

    expect(pipeline.intakeQueue).toBeDefined();
    expect(pipeline.ocrQueue).toBeDefined();
    expect(pipeline.classifyQueue).toBeDefined();
    expect(pipeline.extractQueue).toBeDefined();
    expect(pipeline.reconcileQueue).toBeDefined();
    expect(pipeline.actionsQueue).toBeDefined();
  });

  it("defines correct pipeline stage order", async () => {
    const { PIPELINE_STAGES } = await import("@/lib/queue/pipeline");

    expect(PIPELINE_STAGES).toEqual([
      "intake",
      "ocr",
      "classify",
      "extract",
      "reconcile",
      "actions",
    ]);
  });

  it("getNextStage returns correct next stages", async () => {
    const { getNextStage } = await import("@/lib/queue/pipeline");

    expect(getNextStage("intake")).toBe("ocr");
    expect(getNextStage("ocr")).toBe("classify");
    expect(getNextStage("classify")).toBe("extract");
    expect(getNextStage("extract")).toBe("reconcile");
    expect(getNextStage("reconcile")).toBe("actions");
    expect(getNextStage("actions")).toBeNull();
  });

  it("startPipeline enqueues intake job", async () => {
    const { startPipeline, intakeQueue } = await import("@/lib/queue/pipeline");

    const data = {
      pipelineRunId: "run-1",
      firmId: "firm-1",
      matterId: "matter-1",
      documentId: "doc-1",
      triggeredBy: "user-1",
    };

    await startPipeline(data);

    expect(intakeQueue.add).toHaveBeenCalledWith(
      "pipeline:intake",
      data,
      expect.objectContaining({
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      })
    );
  });

  it("advanceToNextStage moves from intake to ocr", async () => {
    const { advanceToNextStage, ocrQueue } = await import("@/lib/queue/pipeline");

    const data = {
      pipelineRunId: "run-1",
      firmId: "firm-1",
      matterId: "matter-1",
      documentId: "doc-1",
      triggeredBy: "user-1",
    };

    const next = await advanceToNextStage("intake", data);

    expect(next).toBe("ocr");
    expect(ocrQueue.add).toHaveBeenCalledWith(
      "pipeline:ocr",
      data,
      expect.objectContaining({ attempts: 3 })
    );
  });

  it("advanceToNextStage returns null at end of pipeline", async () => {
    const { advanceToNextStage } = await import("@/lib/queue/pipeline");

    const data = {
      pipelineRunId: "run-1",
      firmId: "firm-1",
      matterId: "matter-1",
      documentId: "doc-1",
      triggeredBy: null,
    };

    const next = await advanceToNextStage("actions", data);

    expect(next).toBeNull();
  });

  it("retryFromStage enqueues the specified stage", async () => {
    const { retryFromStage, extractQueue } = await import("@/lib/queue/pipeline");

    const data = {
      pipelineRunId: "run-1",
      firmId: "firm-1",
      matterId: "matter-1",
      documentId: "doc-1",
      triggeredBy: "user-1",
    };

    await retryFromStage("extract", data);

    expect(extractQueue.add).toHaveBeenCalledWith(
      "pipeline:extract",
      data,
      expect.objectContaining({ attempts: 3 })
    );
  });

  it("stage configs have reasonable concurrency values", async () => {
    const { STAGE_CONFIG } = await import("@/lib/queue/pipeline");

    for (const [stage, config] of Object.entries(STAGE_CONFIG)) {
      expect(config.concurrency).toBeGreaterThan(0);
      expect(config.attempts).toBeGreaterThan(0);
      expect(config.backoffDelay).toBeGreaterThan(0);
      expect(config.timeoutMs).toBeGreaterThan(0);
    }

    // AI-heavy stages should have lower concurrency
    expect(STAGE_CONFIG.extract.concurrency).toBeLessThanOrEqual(STAGE_CONFIG.intake.concurrency);
  });
});
