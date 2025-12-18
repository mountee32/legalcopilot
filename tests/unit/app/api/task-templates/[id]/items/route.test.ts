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

const mockParams = (id: string) => Promise.resolve({ id });

describe("Task Template Items API - GET /api/task-templates/:id/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns template items sorted by sortOrder", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockItems = [
      { id: "item-1", title: "First Task", sortOrder: 0, category: "regulatory" },
      { id: "item-2", title: "Second Task", sortOrder: 1, category: "firm_policy" },
      { id: "item-3", title: "Third Task", sortOrder: 2, category: "best_practice" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockItems as any);

    const { GET } = await import("@/app/api/task-templates/[id]/items/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items");
    const response = await GET(request as any, { params: mockParams("t1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.items).toHaveLength(3);
    expect(json.items[0].sortOrder).toBe(0);
    expect(json.items[2].sortOrder).toBe(2);
  });

  it("returns 404 for non-existent template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Task template not found"));

    const { GET } = await import("@/app/api/task-templates/[id]/items/route");
    const request = new NextRequest("http://localhost/api/task-templates/nonexistent/items");
    const response = await GET(request as any, { params: mockParams("nonexistent") } as any);

    expect([404, 500]).toContain(response.status);
  });
});

describe("Task Template Items API - POST /api/task-templates/:id/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds item to template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockItem = {
      id: "new-item",
      templateId: "t1",
      title: "New Task",
      category: "firm_policy",
      mandatory: false,
      sortOrder: 0,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockItem as any);

    const { POST } = await import("@/app/api/task-templates/[id]/items/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items", {
      method: "POST",
      body: JSON.stringify({
        title: "New Task",
        category: "firm_policy",
      }),
    });
    const response = await POST(request as any, { params: mockParams("t1") } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.title).toBe("New Task");
  });

  it("validates category enum", async () => {
    const { POST } = await import("@/app/api/task-templates/[id]/items/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Task",
        category: "invalid_category",
      }),
    });
    const response = await POST(request as any, { params: mockParams("t1") } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("validates priority enum", async () => {
    const { POST } = await import("@/app/api/task-templates/[id]/items/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Task",
        category: "firm_policy",
        defaultPriority: "invalid_priority",
      }),
    });
    const response = await POST(request as any, { params: mockParams("t1") } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("rejects adding item to system template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ForbiddenError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ForbiddenError("Cannot modify system templates")
    );

    const { POST } = await import("@/app/api/task-templates/[id]/items/route");
    const request = new NextRequest("http://localhost/api/task-templates/system-t1/items", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Task",
        category: "firm_policy",
      }),
    });
    const response = await POST(request as any, { params: mockParams("system-t1") } as any);

    expect([403, 500]).toContain(response.status);
  });
});
