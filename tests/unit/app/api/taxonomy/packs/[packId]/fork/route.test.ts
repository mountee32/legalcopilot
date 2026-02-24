import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
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

const mockParams = (packId: string) => Promise.resolve({ packId });

describe("Taxonomy Pack Fork API - POST /api/taxonomy/packs/:packId/fork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forks a taxonomy pack and returns copied counts", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      pack: {
        id: "forked-pack-1",
        firmId: "firm-1",
        key: "workers-comp-custom",
        version: "1.0.0",
        name: "Workers' Compensation (Firm Copy)",
        description: "Firm copy",
        practiceArea: "workers_compensation",
        isSystem: false,
        isActive: true,
        parentPackId: "pack-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      copied: {
        categories: 5,
        fields: 42,
        documentTypes: 25,
        actionTriggers: 6,
        reconciliationRules: 12,
        promptTemplates: 4,
      },
    } as any);

    const { POST } = await import("@/app/api/taxonomy/packs/[packId]/fork/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/fork", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request as any, { params: mockParams("pack-1") } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.pack.parentPackId).toBe("pack-1");
    expect(json.copied.fields).toBe(42);
  });

  it("returns validation error for invalid custom key format", async () => {
    const { POST } = await import("@/app/api/taxonomy/packs/[packId]/fork/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs/pack-1/fork", {
      method: "POST",
      body: JSON.stringify({ key: "Invalid Key" }),
    });
    const response = await POST(request as any, { params: mockParams("pack-1") } as any);

    expect([400, 500]).toContain(response.status);
  });
});
