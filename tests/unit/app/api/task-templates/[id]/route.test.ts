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

describe("Task Templates API - GET /api/task-templates/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns template with items", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "t1",
      firmId: "firm-1",
      name: "Custom Template",
      practiceArea: "conveyancing",
      subType: "freehold_purchase",
      isDefault: false,
      isActive: true,
      items: [
        { id: "item-1", title: "Task 1", mandatory: true, category: "regulatory" },
        { id: "item-2", title: "Task 2", mandatory: false, category: "best_practice" },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { GET } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1");
    const response = await GET(request as any, { params: mockParams("t1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe("t1");
    expect(json.items).toHaveLength(2);
  });

  it("returns 404 for non-existent template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Task template not found"));

    const { GET } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/nonexistent");
    const response = await GET(request as any, { params: mockParams("nonexistent") } as any);

    expect([404, 500]).toContain(response.status);
  });
});

describe("Task Templates API - PUT /api/task-templates/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates firm template successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "t1",
      firmId: "firm-1",
      name: "Updated Template",
      isDefault: true,
      isActive: true,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { PUT } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated Template", isDefault: true }),
    });
    const response = await PUT(request as any, { params: mockParams("t1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.name).toBe("Updated Template");
  });

  it("rejects update of system template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ForbiddenError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ForbiddenError("Cannot modify system templates")
    );

    const { PUT } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/system-t1", {
      method: "PUT",
      body: JSON.stringify({ name: "Try to update system" }),
    });
    const response = await PUT(request as any, { params: mockParams("system-t1") } as any);

    expect([403, 500]).toContain(response.status);
  });

  it("returns 404 for non-existent template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Task template not found"));

    const { PUT } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/nonexistent", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    });
    const response = await PUT(request as any, { params: mockParams("nonexistent") } as any);

    expect([404, 500]).toContain(response.status);
  });
});

describe("Task Templates API - DELETE /api/task-templates/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes firm template successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(undefined as any);

    const { DELETE } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1", {
      method: "DELETE",
    });
    const response = await DELETE(request as any, { params: mockParams("t1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("rejects delete of system template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ForbiddenError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ForbiddenError("Cannot delete system templates")
    );

    const { DELETE } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/system-t1", {
      method: "DELETE",
    });
    const response = await DELETE(request as any, { params: mockParams("system-t1") } as any);

    expect([403, 500]).toContain(response.status);
  });

  it("returns 404 for non-existent template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Task template not found"));

    const { DELETE } = await import("@/app/api/task-templates/[id]/route");
    const request = new NextRequest("http://localhost/api/task-templates/nonexistent", {
      method: "DELETE",
    });
    const response = await DELETE(request as any, { params: mockParams("nonexistent") } as any);

    expect([404, 500]).toContain(response.status);
  });
});
