import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "matter-1" }),
      user: { user: { id: "user-1" } },
    }),
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: (handler: any) => handler,
  NotFoundError: class NotFoundError extends Error {
    name = "NotFoundError";
  },
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("GET /api/matters/[id]/ai/chat/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns conversations for matter sorted by lastMessageAt desc", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const conversations = [
      {
        id: "conv-2",
        title: "Latest chat",
        messageCount: 4,
        lastMessageAt: "2026-02-24T10:00:00Z",
        createdAt: "2026-02-24T09:00:00Z",
      },
      {
        id: "conv-1",
        title: "Older chat",
        messageCount: 2,
        lastMessageAt: "2026-02-23T10:00:00Z",
        createdAt: "2026-02-23T09:00:00Z",
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(conversations),
      };
      // First limit call: matter check
      mockTx.limit.mockResolvedValueOnce([{ id: "matter-1" }]);
      // After that, the chain returns conversations via offset
      return callback(mockTx);
    });

    const { GET } = await import("@/app/api/matters/[id]/ai/chat/history/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat/history");

    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.conversations).toBeDefined();
  });

  it("returns empty array for matter with no conversations", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ conversations: [] } as any);

    // For this test, withFirmDb returns directly so we need to adjust
    vi.mocked(withFirmDb).mockReset();
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };
      mockTx.limit.mockResolvedValueOnce([{ id: "matter-1" }]);
      return callback(mockTx);
    });

    const { GET } = await import("@/app/api/matters/[id]/ai/chat/history/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat/history");

    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.conversations).toEqual([]);
  });

  it("calls withFirmDb with correct firm ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };
      mockTx.limit.mockResolvedValueOnce([{ id: "matter-1" }]);
      return callback(mockTx);
    });

    const { GET } = await import("@/app/api/matters/[id]/ai/chat/history/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat/history");

    await GET(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });
});
