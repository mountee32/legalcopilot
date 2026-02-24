import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "finding-1" }),
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

describe("PATCH /api/pipeline/findings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("resolves a finding with accepted status", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockFinding = {
      id: "finding-1",
      firmId: "firm-1",
      status: "accepted",
      resolvedBy: "user-1",
      resolvedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockFinding as any);

    const { PATCH } = await import("@/app/api/pipeline/findings/[id]/route");
    const request = new NextRequest("http://localhost/api/pipeline/findings/finding-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });

    const response = await PATCH(
      request as any,
      { params: Promise.resolve({ id: "finding-1" }) } as any
    );
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("accepted");
    expect(json.resolvedBy).toBe("user-1");
  });

  it("resolves a finding with rejected status", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "finding-1",
      status: "rejected",
      resolvedBy: "user-1",
    } as any);

    const { PATCH } = await import("@/app/api/pipeline/findings/[id]/route");
    const request = new NextRequest("http://localhost/api/pipeline/findings/finding-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    });

    const response = await PATCH(
      request as any,
      { params: Promise.resolve({ id: "finding-1" }) } as any
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("rejected");
  });
});
