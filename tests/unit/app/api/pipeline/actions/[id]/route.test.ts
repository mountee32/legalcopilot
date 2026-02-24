import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "action-1" }),
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

describe("PATCH /api/pipeline/actions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("accepts a pipeline action", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "action-1",
      firmId: "firm-1",
      status: "accepted",
      resolvedBy: "user-1",
      resolvedAt: new Date(),
    } as any);

    const { PATCH } = await import("@/app/api/pipeline/actions/[id]/route");
    const request = new NextRequest("http://localhost/api/pipeline/actions/action-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
    });

    const response = await PATCH(
      request as any,
      { params: Promise.resolve({ id: "action-1" }) } as any
    );
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("accepted");
  });

  it("dismisses a pipeline action", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      id: "action-1",
      status: "dismissed",
      resolvedBy: "user-1",
    } as any);

    const { PATCH } = await import("@/app/api/pipeline/actions/[id]/route");
    const request = new NextRequest("http://localhost/api/pipeline/actions/action-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "dismissed" }),
    });

    const response = await PATCH(
      request as any,
      { params: Promise.resolve({ id: "action-1" }) } as any
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("dismissed");
  });
});
