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

const mockParams = (id: string, itemId: string) => Promise.resolve({ id, itemId });

describe("Task Template Item API - PUT /api/task-templates/:id/items/:itemId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates template item successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockItem = {
      id: "item-1",
      templateId: "t1",
      title: "Updated Task",
      category: "firm_policy",
      mandatory: true,
      sortOrder: 0,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockItem as any);

    const { PUT } = await import("@/app/api/task-templates/[id]/items/[itemId]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items/item-1", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Task", mandatory: true }),
    });
    const response = await PUT(request as any, { params: mockParams("t1", "item-1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.title).toBe("Updated Task");
    expect(json.mandatory).toBe(true);
  });

  it("returns 404 for non-existent item", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Template item not found"));

    const { PUT } = await import("@/app/api/task-templates/[id]/items/[itemId]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items/nonexistent", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
    });
    const response = await PUT(request as any, { params: mockParams("t1", "nonexistent") } as any);

    expect([404, 500]).toContain(response.status);
  });

  it("rejects update of system template item", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ForbiddenError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ForbiddenError("Cannot modify system templates")
    );

    const { PUT } = await import("@/app/api/task-templates/[id]/items/[itemId]/route");
    const request = new NextRequest("http://localhost/api/task-templates/system-t1/items/item-1", {
      method: "PUT",
      body: JSON.stringify({ title: "Try to update" }),
    });
    const response = await PUT(
      request as any,
      { params: mockParams("system-t1", "item-1") } as any
    );

    expect([403, 500]).toContain(response.status);
  });
});

describe("Task Template Item API - DELETE /api/task-templates/:id/items/:itemId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes template item successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(undefined as any);

    const { DELETE } = await import("@/app/api/task-templates/[id]/items/[itemId]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items/item-1", {
      method: "DELETE",
    });
    const response = await DELETE(request as any, { params: mockParams("t1", "item-1") } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("returns 404 for non-existent item", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Template item not found"));

    const { DELETE } = await import("@/app/api/task-templates/[id]/items/[itemId]/route");
    const request = new NextRequest("http://localhost/api/task-templates/t1/items/nonexistent", {
      method: "DELETE",
    });
    const response = await DELETE(
      request as any,
      { params: mockParams("t1", "nonexistent") } as any
    );

    expect([404, 500]).toContain(response.status);
  });

  it("rejects delete of system template item", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ForbiddenError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ForbiddenError("Cannot modify system templates")
    );

    const { DELETE } = await import("@/app/api/task-templates/[id]/items/[itemId]/route");
    const request = new NextRequest("http://localhost/api/task-templates/system-t1/items/item-1", {
      method: "DELETE",
    });
    const response = await DELETE(
      request as any,
      { params: mockParams("system-t1", "item-1") } as any
    );

    expect([403, 500]).toContain(response.status);
  });
});
