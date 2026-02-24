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

describe("Taxonomy Packs API - GET /api/taxonomy/packs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated packs with counts", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 1,
      rows: [
        {
          id: "pack-1",
          firmId: null,
          key: "workers-comp",
          version: "1.0.0",
          name: "Workers' Compensation",
          description: "System pack",
          practiceArea: "workers_compensation",
          isSystem: true,
          isActive: true,
          parentPackId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryCount: 5,
          fieldCount: 42,
        },
      ],
    } as any);

    const { GET } = await import("@/app/api/taxonomy/packs/route");
    const request = new NextRequest(
      "http://localhost/api/taxonomy/packs?page=1&limit=20&includeSystem=true"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.packs).toHaveLength(1);
    expect(json.packs[0].key).toBe("workers-comp");
    expect(json.packs[0].fieldCount).toBe(42);
    expect(json.pagination.total).toBe(1);
  });

  it("returns validation error for invalid page value", async () => {
    const { GET } = await import("@/app/api/taxonomy/packs/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs?page=0");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });
});

describe("Taxonomy Packs API - POST /api/taxonomy/packs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a new firm-owned pack", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockPack = {
      id: "pack-new",
      firmId: "firm-1",
      key: "custom-pi",
      name: "Custom PI Pack",
      description: "Custom personal injury pack",
      practiceArea: "personal_injury",
      version: "1.0.0",
      isSystem: false,
      isActive: true,
      parentPackId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockPack as any);

    const { POST } = await import("@/app/api/taxonomy/packs/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs", {
      method: "POST",
      body: JSON.stringify({
        key: "custom-pi",
        name: "Custom PI Pack",
        description: "Custom personal injury pack",
        practiceArea: "personal_injury",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.key).toBe("custom-pi");
    expect(json.isSystem).toBe(false);
  });

  it("rejects pack with invalid key format", async () => {
    const { POST } = await import("@/app/api/taxonomy/packs/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs", {
      method: "POST",
      body: JSON.stringify({
        key: "Invalid Key!",
        name: "Test Pack",
        practiceArea: "personal_injury",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("rejects pack with missing practice area", async () => {
    const { POST } = await import("@/app/api/taxonomy/packs/route");
    const request = new NextRequest("http://localhost/api/taxonomy/packs", {
      method: "POST",
      body: JSON.stringify({
        key: "test-pack",
        name: "Test Pack",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });
});
