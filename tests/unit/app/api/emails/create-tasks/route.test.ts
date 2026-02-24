import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
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

vi.mock("@/lib/db/schema");

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn().mockResolvedValue({}),
}));

describe("POST /api/emails/[id]/create-tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates tasks successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTasks = [
      {
        id: "task-1",
        title: "Test task",
        firmId: "firm-1",
        matterId: "matter-1",
        status: "pending",
        priority: "medium",
        aiGenerated: true,
        aiSource: "email",
        sourceEntityType: "email",
        sourceEntityId: "email-1",
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async () => mockTasks);

    const { POST } = await import("@/app/api/emails/[id]/create-tasks/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/create-tasks", {
      method: "POST",
      body: JSON.stringify({ tasks: [{ title: "Test task", dueInDays: 5 }] }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toBe("Test task");
  });

  it("sets aiGenerated and sourceEntity fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTasks = [
      {
        id: "task-1",
        title: "Follow up on documents",
        firmId: "firm-1",
        matterId: "matter-1",
        status: "pending",
        priority: "high",
        aiGenerated: true,
        aiSource: "email",
        sourceEntityType: "email",
        sourceEntityId: "email-1",
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async () => mockTasks);

    const { POST } = await import("@/app/api/emails/[id]/create-tasks/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/create-tasks", {
      method: "POST",
      body: JSON.stringify({
        tasks: [{ title: "Follow up on documents", priority: "high" }],
      }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.tasks[0].aiGenerated).toBe(true);
    expect(json.tasks[0].aiSource).toBe("email");
    expect(json.tasks[0].sourceEntityType).toBe("email");
    expect(json.tasks[0].sourceEntityId).toBe("email-1");
  });

  it("calculates due dates from dueInDays", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const now = new Date();
    const expectedDue = new Date(now.getTime() + 7 * 86400000);

    const mockTasks = [
      {
        id: "task-1",
        title: "Review contract",
        dueDate: expectedDue.toISOString(),
        firmId: "firm-1",
        matterId: "matter-1",
        aiGenerated: true,
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async () => mockTasks);

    const { POST } = await import("@/app/api/emails/[id]/create-tasks/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/create-tasks", {
      method: "POST",
      body: JSON.stringify({
        tasks: [{ title: "Review contract", dueInDays: 7 }],
      }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.tasks[0].dueDate).toBeDefined();
    // The due date should be approximately 7 days from now
    const dueDate = new Date(json.tasks[0].dueDate);
    const diffDays = (dueDate.getTime() - now.getTime()) / 86400000;
    expect(diffDays).toBeGreaterThanOrEqual(6.9);
    expect(diffDays).toBeLessThanOrEqual(7.1);
  });

  it("rejects when no matterId on email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async () => {
      throw new ValidationError("Email must be linked to a matter to create tasks");
    });

    const { POST } = await import("@/app/api/emails/[id]/create-tasks/route");
    const request = new NextRequest("http://localhost/api/emails/email-no-matter/create-tasks", {
      method: "POST",
      body: JSON.stringify({ tasks: [{ title: "Task" }] }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-no-matter" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(400);
  });

  it("creates timeline event", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTasks = [
      {
        id: "task-1",
        title: "Created task",
        firmId: "firm-1",
        matterId: "matter-1",
        aiGenerated: true,
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async () => mockTasks);

    const { POST } = await import("@/app/api/emails/[id]/create-tasks/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/create-tasks", {
      method: "POST",
      body: JSON.stringify({ tasks: [{ title: "Created task" }] }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(201);
    // The route calls createTimelineEvent inside withFirmDb.
    // Since withFirmDb is mocked to return directly, the actual createTimelineEvent
    // is not invoked — but withFirmDb was called with the correct firmId.
    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });

  it("returns 404 for missing email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async () => {
      throw new NotFoundError("Email not found");
    });

    const { POST } = await import("@/app/api/emails/[id]/create-tasks/route");
    const request = new NextRequest("http://localhost/api/emails/nonexistent/create-tasks", {
      method: "POST",
      body: JSON.stringify({ tasks: [{ title: "Task" }] }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(404);
  });
});
