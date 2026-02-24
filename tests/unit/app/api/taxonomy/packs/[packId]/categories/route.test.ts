import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ packId: "pack-1" }),
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

describe("Taxonomy Categories API - POST /api/taxonomy/packs/:packId/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a category in a firm-owned pack", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockCategory = {
      id: "cat-new",
      packId: "pack-1",
      key: "claimant_info",
      label: "Claimant Information",
      description: null,
      icon: null,
      color: null,
      sortOrder: 0,
      createdAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockCategory as any);

    const { POST } = await import("@/app/api/taxonomy/packs/[packId]/categories/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/categories", {
      method: "POST",
      body: JSON.stringify({
        key: "claimant_info",
        label: "Claimant Information",
      }),
    });

    const response = await POST(
      request as any,
      { params: Promise.resolve({ packId: "pack-1" }) } as any
    );
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.key).toBe("claimant_info");
    expect(json.label).toBe("Claimant Information");
  });

  it("rejects category with invalid key format", async () => {
    const { POST } = await import("@/app/api/taxonomy/packs/[packId]/categories/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/categories", {
      method: "POST",
      body: JSON.stringify({
        key: "Bad Key!",
        label: "Test",
      }),
    });

    const response = await POST(
      request as any,
      { params: Promise.resolve({ packId: "pack-1" }) } as any
    );
    expect([400, 500]).toContain(response.status);
  });
});
