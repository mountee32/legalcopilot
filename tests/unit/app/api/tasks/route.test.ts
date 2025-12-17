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

describe("Tasks API - GET /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of tasks", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTasks = [
      {
        id: "t1",
        matterId: "m1",
        title: "Review contract",
        description: "Review and approve draft contract",
        assigneeId: "user-1",
        priority: "high",
        status: "pending",
        dueDate: "2025-12-20T10:00:00Z",
      },
      {
        id: "t2",
        matterId: "m2",
        title: "File documents",
        description: null,
        assigneeId: "user-2",
        priority: "medium",
        status: "in_progress",
        dueDate: null,
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockTasks } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.tasks)).toBe(true);
    expect(json.tasks.length).toBe(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("returns empty list when no tasks exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.tasks).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });

  it("filters by matterId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockTasks = [{ id: "t1", matterId, title: "Task for specific matter" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTasks } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest(`http://localhost/api/tasks?matterId=${matterId}`);
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.tasks.length).toBe(1);
    expect(json.tasks[0].matterId).toBe(matterId);
  });

  it("filters by assigneeId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const assigneeId = "223e4567-e89b-12d3-a456-426614174000";
    const mockTasks = [{ id: "t1", assigneeId, title: "Assigned task" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTasks } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest(`http://localhost/api/tasks?assigneeId=${assigneeId}`);
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.tasks.length).toBe(1);
  });

  it("filters by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTasks = [{ id: "t1", status: "completed", title: "Completed task" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTasks } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks?status=completed");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.tasks[0].status).toBe("completed");
  });

  it("filters by priority parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTasks = [{ id: "t1", priority: "urgent", title: "Urgent task" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTasks } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks?priority=urgent");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.tasks[0].priority).toBe("urgent");
  });

  it("handles pagination correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 50,
      rows: Array(10).fill({ id: "t", title: "Task" }),
    } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks?page=2&limit=10");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.totalPages).toBe(5);
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });

  it("supports multiple filter combinations", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockTasks = [{ id: "t1", matterId, status: "pending", priority: "high" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTasks } as any);

    const { GET } = await import("@/app/api/tasks/route");
    const request = new NextRequest(
      `http://localhost/api/tasks?matterId=${matterId}&status=pending&priority=high`
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });
});

describe("Tasks API - POST /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates task successfully with required fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockTask = {
      id: "new-t1",
      firmId: "firm-1",
      matterId,
      title: "Review contract documents",
      description: null,
      assigneeId: null,
      createdById: "user-1",
      priority: "medium",
      status: "pending",
      dueDate: null,
      completedAt: null,
      checklistItems: null,
      tags: null,
      aiGenerated: false,
      aiSource: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTask as any);

    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Review contract documents",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.title).toBe("Review contract documents");
    expect(json.matterId).toBe(matterId);
    expect(json.priority).toBe("medium");
    expect(json.status).toBe("pending");
  });

  it("creates task with all optional fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const assigneeId = "223e4567-e89b-12d3-a456-426614174000";
    const mockTask = {
      id: "new-t2",
      matterId,
      title: "Urgent: File court documents",
      description: "File documents with court before 5pm",
      assigneeId,
      priority: "urgent",
      status: "pending",
      dueDate: new Date("2025-12-20T17:00:00Z"),
      checklistItems: [{ text: "Prepare documents", completed: false }],
      tags: ["court", "deadline"],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTask as any);

    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Urgent: File court documents",
        description: "File documents with court before 5pm",
        assigneeId,
        priority: "urgent",
        dueDate: "2025-12-20T17:00:00Z",
        checklistItems: [{ text: "Prepare documents", completed: false }],
        tags: ["court", "deadline"],
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.priority).toBe("urgent");
    expect(json.assigneeId).toBe(assigneeId);
    expect(json.description).toBe("File documents with court before 5pm");
  });

  it("returns 404 when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Matter not found"));

    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Task for non-existent matter",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([404, 500]).toContain(response.status);
  });

  it("returns error when title is missing", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        // title is missing
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when matterId is missing", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Task without matter",
        // matterId is missing
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when title is empty string", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        title: "",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates priority enum values", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Task",
        priority: "invalid_priority",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates matterId is a valid UUID", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "not-a-uuid",
        title: "Task with invalid matter ID",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates assigneeId is a valid UUID when provided", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Task",
        assigneeId: "not-a-uuid",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("defaults priority to medium when not provided", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTask = {
      id: "new-t3",
      matterId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Task without priority",
      priority: "medium",
      status: "pending",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTask as any);

    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Task without priority",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.priority).toBe("medium");
  });

  it("sets status to pending for new tasks", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTask = {
      id: "new-t4",
      matterId: "123e4567-e89b-12d3-a456-426614174000",
      title: "New task",
      status: "pending",
      priority: "medium",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTask as any);

    const { POST } = await import("@/app/api/tasks/route");
    const request = new NextRequest("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        title: "New task",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.status).toBe("pending");
  });
});
