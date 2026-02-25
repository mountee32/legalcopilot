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
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/db/schema", () => ({
  pipelineFindings: {
    id: "id",
    firmId: "firm_id",
    status: "status",
    resolvedBy: "resolved_by",
    resolvedAt: "resolved_at",
  },
}));

describe("POST /api/pipeline/findings/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("batch accepts multiple findings", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ updated: 3 } as any);

    const { POST } = await import("@/app/api/pipeline/findings/batch/route");
    const request = new NextRequest("http://localhost/api/pipeline/findings/batch", {
      method: "POST",
      body: JSON.stringify({
        findingIds: [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
          "00000000-0000-0000-0000-000000000003",
        ],
        status: "accepted",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.updated).toBe(3);
  });

  it("batch rejects findings", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ updated: 2 } as any);

    const { POST } = await import("@/app/api/pipeline/findings/batch/route");
    const request = new NextRequest("http://localhost/api/pipeline/findings/batch", {
      method: "POST",
      body: JSON.stringify({
        findingIds: [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
        ],
        status: "rejected",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.updated).toBe(2);
  });

  it("rejects empty findingIds array", async () => {
    const { POST } = await import("@/app/api/pipeline/findings/batch/route");
    const request = new NextRequest("http://localhost/api/pipeline/findings/batch", {
      method: "POST",
      body: JSON.stringify({
        findingIds: [],
        status: "accepted",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(400);
  });

  it("rejects invalid status for batch", async () => {
    const { POST } = await import("@/app/api/pipeline/findings/batch/route");
    const request = new NextRequest("http://localhost/api/pipeline/findings/batch", {
      method: "POST",
      body: JSON.stringify({
        findingIds: ["00000000-0000-0000-0000-000000000001"],
        status: "revised",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(400);
  });
});
