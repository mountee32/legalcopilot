import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "matter-1" }),
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

describe("GET /api/matters/[id]/findings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns aggregated findings grouped by category", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      matterId: "matter-1",
      total: 3,
      statusCounts: {
        pending: 1,
        accepted: 1,
        rejected: 0,
        auto_applied: 1,
        conflict: 0,
      },
      categories: [
        {
          categoryKey: "claimant_info",
          count: 2,
          findings: [
            { id: "f-1", categoryKey: "claimant_info", fieldKey: "name", status: "accepted" },
            { id: "f-2", categoryKey: "claimant_info", fieldKey: "dob", status: "auto_applied" },
          ],
        },
        {
          categoryKey: "injury_details",
          count: 1,
          findings: [
            {
              id: "f-3",
              categoryKey: "injury_details",
              fieldKey: "injury_date",
              status: "pending",
            },
          ],
        },
      ],
    } as any);

    const { GET } = await import("@/app/api/matters/[id]/findings/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/findings");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.matterId).toBe("matter-1");
    expect(json.total).toBe(3);
    expect(json.categories).toHaveLength(2);
    expect(json.statusCounts.accepted).toBe(1);
  });

  it("returns empty result for matter with no findings", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      matterId: "matter-1",
      total: 0,
      statusCounts: { pending: 0, accepted: 0, rejected: 0, auto_applied: 0, conflict: 0 },
      categories: [],
    } as any);

    const { GET } = await import("@/app/api/matters/[id]/findings/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/findings");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.total).toBe(0);
    expect(json.categories).toHaveLength(0);
  });
});
