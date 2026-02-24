import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "@/app/api/pipeline/dlq/route";

// --- standard mocks ---
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (fn: Function) => fn,
}));
vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: (fn: Function) => fn,
}));

import * as dlqModule from "@/lib/queue/pipeline-dlq";
vi.mock("@/lib/queue/pipeline-dlq");

const mockUser = { user: { id: "user-1" } };

describe("GET /api/pipeline/dlq", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns DLQ entries and summary", async () => {
    vi.mocked(dlqModule.getDlqEntries).mockReturnValue([
      {
        jobId: "j-1",
        stage: "extract" as any,
        pipelineRunId: "run-1",
        matterId: "m-1",
        firmId: "f-1",
        error: "Timeout",
        failedAt: new Date(),
        attemptsMade: 3,
      },
    ]);
    vi.mocked(dlqModule.getDlqSummary).mockReturnValue({ extract: 1 } as any);

    const request = new Request("http://localhost/api/pipeline/dlq");
    const response = await GET(request, { user: mockUser } as any);
    const data = await response.json();

    expect(data.totalEntries).toBe(1);
    expect(data.summary.extract).toBe(1);
    expect(data.entries).toHaveLength(1);
  });

  it("filters by stage", async () => {
    vi.mocked(dlqModule.getDlqEntries).mockReturnValue([]);
    vi.mocked(dlqModule.getDlqSummary).mockReturnValue({} as any);

    const request = new Request("http://localhost/api/pipeline/dlq?stage=classify");
    const response = await GET(request, { user: mockUser } as any);
    const data = await response.json();

    expect(dlqModule.getDlqEntries).toHaveBeenCalledWith("classify");
    expect(data.totalEntries).toBe(0);
  });
});

describe("DELETE /api/pipeline/dlq", () => {
  it("clears DLQ entries", async () => {
    vi.mocked(dlqModule.clearDlqEntries).mockReturnValue(5);

    const request = new Request("http://localhost/api/pipeline/dlq", { method: "DELETE" });
    const response = await DELETE(request, { user: mockUser } as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.cleared).toBe(5);
  });
});
