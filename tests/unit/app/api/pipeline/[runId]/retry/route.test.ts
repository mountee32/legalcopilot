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

vi.mock("@/lib/queue/pipeline", () => ({
  retryFromStage: vi.fn().mockResolvedValue(undefined),
  PIPELINE_STAGES: ["intake", "ocr", "classify", "extract", "reconcile", "actions"],
}));

describe("Pipeline API - POST /api/pipeline/[runId]/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("retries a failed pipeline run", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "run-1",
      retryStage: "extract",
    } as any);

    const { POST } = await import("@/app/api/pipeline/[runId]/retry/route");
    const request = new NextRequest("http://localhost/api/pipeline/run-1/retry", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: Promise.resolve({ runId: "run-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.runId).toBe("run-1");
    expect(json.retryFromStage).toBe("extract");
  });

  it("returns 404 when pipeline run not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Pipeline run not found"));

    const { POST } = await import("@/app/api/pipeline/[runId]/retry/route");
    const request = new NextRequest("http://localhost/api/pipeline/run-999/retry", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: Promise.resolve({ runId: "run-999" }) } as any
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 when run is not in failed state", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Only failed pipeline runs can be retried")
    );

    const { POST } = await import("@/app/api/pipeline/[runId]/retry/route");
    const request = new NextRequest("http://localhost/api/pipeline/run-1/retry", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: Promise.resolve({ runId: "run-1" }) } as any
    );

    expect(response.status).toBe(400);
  });
});
