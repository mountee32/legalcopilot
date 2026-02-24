import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDlqEntries,
  getDlqSummary,
  clearDlqEntries,
  attachDlqMonitoring,
} from "@/lib/queue/pipeline-dlq";

// Mock pipeline-helpers to prevent DB access
vi.mock("@/lib/queue/workers/pipeline-helpers", () => ({
  markPipelineFailed: vi.fn(),
}));

describe("Pipeline DLQ Monitoring", () => {
  beforeEach(() => {
    // Clear DLQ state between tests
    clearDlqEntries();
  });

  it("getDlqEntries returns empty array initially", () => {
    expect(getDlqEntries()).toEqual([]);
  });

  it("getDlqSummary returns empty counts initially", () => {
    const summary = getDlqSummary();
    expect(Object.keys(summary).length).toBe(0);
  });

  it("clearDlqEntries returns 0 when empty", () => {
    expect(clearDlqEntries()).toBe(0);
  });

  it("getDlqEntries filters by stage", () => {
    // No entries, filter should still work
    expect(getDlqEntries("intake")).toEqual([]);
    expect(getDlqEntries("classify")).toEqual([]);
  });

  it("clearDlqEntries filters by stage", () => {
    expect(clearDlqEntries("ocr")).toBe(0);
  });

  it("attachDlqMonitoring attaches event listener to worker", () => {
    const mockWorker = { on: vi.fn() } as any;
    attachDlqMonitoring(mockWorker, "intake");
    expect(mockWorker.on).toHaveBeenCalledWith("failed", expect.any(Function));
  });

  it("DLQ handler ignores non-permanent failures", async () => {
    const handlers: Record<string, Function> = {};
    const mockWorker = {
      on: vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
      }),
    } as any;

    attachDlqMonitoring(mockWorker, "extract");

    // Simulate a failed job that still has retries left
    const mockJob = {
      id: "job-1",
      attemptsMade: 1,
      opts: { attempts: 3 },
      data: {
        pipelineRunId: "run-1",
        firmId: "firm-1",
        matterId: "matter-1",
        documentId: "doc-1",
        triggeredBy: null,
      },
    };

    await handlers.failed(mockJob, new Error("Transient error"));

    // Should not be tracked — still has retries
    expect(getDlqEntries()).toEqual([]);
  });

  it("DLQ handler tracks permanently failed jobs", async () => {
    const handlers: Record<string, Function> = {};
    const mockWorker = {
      on: vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
      }),
    } as any;

    attachDlqMonitoring(mockWorker, "classify");

    // Simulate a permanently failed job (all retries exhausted)
    const mockJob = {
      id: "job-2",
      attemptsMade: 3,
      opts: { attempts: 3 },
      data: {
        pipelineRunId: "run-2",
        firmId: "firm-1",
        matterId: "matter-2",
        documentId: "doc-2",
        triggeredBy: null,
      },
    };

    await handlers.failed(mockJob, new Error("Permanent failure"));

    const entries = getDlqEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].stage).toBe("classify");
    expect(entries[0].pipelineRunId).toBe("run-2");
    expect(entries[0].error).toBe("Permanent failure");

    const summary = getDlqSummary();
    expect(summary.classify).toBe(1);
  });

  it("clearDlqEntries clears tracked entries and returns count", async () => {
    const handlers: Record<string, Function> = {};
    const mockWorker = {
      on: vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
      }),
    } as any;

    attachDlqMonitoring(mockWorker, "ocr");

    const mockJob = {
      id: "job-3",
      attemptsMade: 3,
      opts: { attempts: 3 },
      data: {
        pipelineRunId: "run-3",
        firmId: "firm-1",
        matterId: "matter-3",
        documentId: "doc-3",
        triggeredBy: null,
      },
    };

    await handlers.failed(mockJob, new Error("OCR failed"));
    expect(getDlqEntries()).toHaveLength(1);

    const cleared = clearDlqEntries();
    expect(cleared).toBe(1);
    expect(getDlqEntries()).toEqual([]);
  });
});
