import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
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

describe("Task Templates API - GET /api/task-templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of templates", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "t1",
        firmId: null,
        name: "Freehold Purchase - Standard",
        practiceArea: "conveyancing",
        subType: "freehold_purchase",
        isDefault: true,
        isActive: true,
      },
      {
        id: "t2",
        firmId: "firm-1",
        name: "Custom Conveyancing",
        practiceArea: "conveyancing",
        subType: "freehold_sale",
        isDefault: false,
        isActive: true,
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.templates)).toBe(true);
    expect(json.templates.length).toBe(2);
    expect(json.pagination.total).toBe(2);
  });

  it("returns empty list when no templates exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });

  it("filters by practiceArea parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "t1",
        name: "Litigation Template",
        practiceArea: "litigation",
        subType: "contract_dispute",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates?practiceArea=litigation");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates.length).toBe(1);
    expect(json.templates[0].practiceArea).toBe("litigation");
  });

  it("filters by subType parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "t1",
        name: "Freehold Purchase",
        practiceArea: "conveyancing",
        subType: "freehold_purchase",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/task-templates/route");
    const request = new NextRequest(
      "http://localhost/api/task-templates?subType=freehold_purchase"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates[0].subType).toBe("freehold_purchase");
  });
});

describe("Task Templates API - POST /api/task-templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates template successfully with required fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-t1",
      firmId: "firm-1",
      name: "Custom Freehold",
      practiceArea: "conveyancing",
      subType: "freehold_purchase",
      isDefault: false,
      isActive: true,
      createdById: "user-1",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Custom Freehold",
        practiceArea: "conveyancing",
        subType: "freehold_purchase",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.name).toBe("Custom Freehold");
    expect(json.practiceArea).toBe("conveyancing");
  });

  it("creates template with items", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-t2",
      firmId: "firm-1",
      name: "Template with Items",
      practiceArea: "litigation",
      subType: "contract_dispute",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Template with Items",
        practiceArea: "litigation",
        subType: "contract_dispute",
        items: [
          { title: "Review case", category: "firm_policy", mandatory: true },
          { title: "File documents", category: "best_practice", mandatory: false },
        ],
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("returns error when name is missing", async () => {
    const { POST } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({
        practiceArea: "conveyancing",
        subType: "freehold_purchase",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid practiceArea", async () => {
    const { POST } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Template",
        practiceArea: "invalid_area",
        subType: "some_type",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid subType for practiceArea", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Invalid subType 'wrong_type' for practice area 'conveyancing'")
    );

    const { POST } = await import("@/app/api/task-templates/route");
    const request = new NextRequest("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Template",
        practiceArea: "conveyancing",
        subType: "wrong_type",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 422, 500]).toContain(response.status);
  });
});
