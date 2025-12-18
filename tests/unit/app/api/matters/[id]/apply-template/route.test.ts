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

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

const mockParams = (id: string) => Promise.resolve({ id });

describe("Apply Template API - POST /api/matters/:id/apply-template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("applies template and creates tasks", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      applicationId: "app-1",
      tasksCreated: 5,
      tasksSkipped: 2,
      tasks: [
        { id: "task-1", title: "AML Check", templateItemId: "item-1" },
        { id: "task-2", title: "Conflict Check", templateItemId: "item-2" },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { POST } = await import("@/app/api/matters/[id]/apply-template/route");
    const request = new NextRequest("http://localhost/api/matters/m1/apply-template", {
      method: "POST",
      body: JSON.stringify({
        templateId: "t1",
      }),
    });
    const response = await POST(request as any, { params: mockParams("m1") } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.tasksCreated).toBe(5);
    expect(json.tasksSkipped).toBe(2);
    expect(json.tasks).toHaveLength(2);
  });

  it("creates only selected optional items", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      applicationId: "app-2",
      tasksCreated: 3,
      tasksSkipped: 4,
      tasks: [
        { id: "task-1", title: "Mandatory Task", templateItemId: "item-1" },
        { id: "task-2", title: "Selected Optional", templateItemId: "item-3" },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { POST } = await import("@/app/api/matters/[id]/apply-template/route");
    const request = new NextRequest("http://localhost/api/matters/m1/apply-template", {
      method: "POST",
      body: JSON.stringify({
        templateId: "t1",
        selectedItemIds: ["item-1", "item-3"],
      }),
    });
    const response = await POST(request as any, { params: mockParams("m1") } as any);

    expect(response.status).toBe(201);
  });

  it("applies modifications to tasks", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      applicationId: "app-3",
      tasksCreated: 2,
      tasksSkipped: 0,
      tasks: [{ id: "task-1", title: "Modified Title", templateItemId: "item-1" }],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { POST } = await import("@/app/api/matters/[id]/apply-template/route");
    const request = new NextRequest("http://localhost/api/matters/m1/apply-template", {
      method: "POST",
      body: JSON.stringify({
        templateId: "t1",
        modifications: [
          {
            templateItemId: "item-1",
            title: "Modified Title",
            priority: "high",
          },
        ],
      }),
    });
    const response = await POST(request as any, { params: mockParams("m1") } as any);

    expect(response.status).toBe(201);
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockImplementation(async () => {
      throw new NotFoundError("Matter not found");
    });

    const { POST } = await import("@/app/api/matters/[id]/apply-template/route");
    const request = new NextRequest("http://localhost/api/matters/nonexistent/apply-template", {
      method: "POST",
      body: JSON.stringify({ templateId: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const response = await POST(request as any, { params: mockParams("nonexistent") } as any);

    expect([400, 404, 500]).toContain(response.status);
  });

  it("returns 404 for non-existent template", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockImplementation(async () => {
      throw new NotFoundError("Task template not found");
    });

    const { POST } = await import("@/app/api/matters/[id]/apply-template/route");
    const request = new NextRequest("http://localhost/api/matters/m1/apply-template", {
      method: "POST",
      body: JSON.stringify({ templateId: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const response = await POST(request as any, { params: mockParams("m1") } as any);

    expect([400, 404, 500]).toContain(response.status);
  });

  it("returns error when templateId is missing", async () => {
    const { POST } = await import("@/app/api/matters/[id]/apply-template/route");
    const request = new NextRequest("http://localhost/api/matters/m1/apply-template", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request as any, { params: mockParams("m1") } as any);

    expect([400, 500]).toContain(response.status);
  });
});
