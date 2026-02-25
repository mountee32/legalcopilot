import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-1" } },
    }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: (_perm: string) => (handler: any) => handler,
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: (handler: any) => handler,
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
  },
  ValidationError: class ValidationError extends Error {
    statusCode = 400;
  },
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => undefined),
}));

describe("POST /api/matters/[id]/ai/create-suggested-tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates tasks and returns 201", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: "matter-1" }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              { id: "task-1", title: "Review findings", matterId: "matter-1" },
              { id: "task-2", title: "Contact client", matterId: "matter-1" },
            ]),
          }),
        }),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/create-suggested-tasks/route");
    const request = new NextRequest(
      "http://localhost/api/matters/matter-1/ai/create-suggested-tasks",
      {
        method: "POST",
        body: JSON.stringify({
          tasks: [
            { title: "Review findings", priority: "high", dueInDays: 3 },
            { title: "Contact client", priority: "medium" },
          ],
        }),
      }
    );
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.tasks).toHaveLength(2);
  });

  it("throws NotFoundError when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/create-suggested-tasks/route");
    const request = new NextRequest(
      "http://localhost/api/matters/matter-1/ai/create-suggested-tasks",
      {
        method: "POST",
        body: JSON.stringify({
          tasks: [{ title: "Some task" }],
        }),
      }
    );

    await expect(
      POST(request as any, { params: Promise.resolve({ id: "matter-1" }) } as any)
    ).rejects.toThrow("Matter not found");
  });

  it("validates request body — rejects empty tasks array", async () => {
    const { POST } = await import("@/app/api/matters/[id]/ai/create-suggested-tasks/route");
    const request = new NextRequest(
      "http://localhost/api/matters/matter-1/ai/create-suggested-tasks",
      {
        method: "POST",
        body: JSON.stringify({ tasks: [] }),
      }
    );

    await expect(
      POST(request as any, { params: Promise.resolve({ id: "matter-1" }) } as any)
    ).rejects.toThrow();
  });

  it("creates timeline event with ai_tasks_suggested type", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: "matter-1" }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "task-1", title: "Task 1", matterId: "matter-1" }]),
          }),
        }),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/create-suggested-tasks/route");
    const request = new NextRequest(
      "http://localhost/api/matters/matter-1/ai/create-suggested-tasks",
      {
        method: "POST",
        body: JSON.stringify({
          tasks: [{ title: "Task 1", priority: "medium" }],
        }),
      }
    );
    await POST(request as any, { params: Promise.resolve({ id: "matter-1" }) } as any);

    expect(vi.mocked(createTimelineEvent)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "ai_tasks_suggested",
        firmId: "firm-1",
        matterId: "matter-1",
        metadata: expect.objectContaining({ count: 1 }),
      })
    );
  });
});
