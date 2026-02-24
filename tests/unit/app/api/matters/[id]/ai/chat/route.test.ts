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

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/ai/openrouter", () => ({
  openrouter: vi.fn((model: string) => model),
  models: { "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet" },
}));

vi.mock("@/lib/ai/chat-context", () => ({
  buildChatContext: vi.fn(async () => ({
    generation: { matter: {}, client: {}, firm: { name: "Test" }, findingsByCategory: {} },
    chunks: [],
    timelineEvents: [],
    ragUsed: false,
  })),
  buildChatSystemPrompt: vi.fn(() => "system prompt"),
  formatChatHistory: vi.fn((msgs: any[]) => msgs),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => ({})),
}));

vi.mock("ai", () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: () =>
      new Response("streaming data", {
        headers: new Headers({ "Content-Type": "text/event-stream" }),
      }),
  })),
}));

describe("POST /api/matters/[id]/ai/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("creates new conversation when no conversationId provided", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "matter-1" }]),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: "conv-new" }]),
      } as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/chat/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are the key findings?" }),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Conversation-Id")).toBe("conv-new");
  });

  it("resumes existing conversation with conversationId", async () => {
    const convUuid = "a0000000-0000-4000-a000-000000000001";
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      // First limit: matter check, second: conversation check, third: messages history
      mockTx.limit
        .mockResolvedValueOnce([{ id: "matter-1" }])
        .mockResolvedValueOnce([{ id: convUuid }])
        .mockResolvedValueOnce([
          { role: "user", content: "Previous question" },
          { role: "assistant", content: "Previous answer" },
        ]);
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/chat/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Follow-up question",
        conversationId: convUuid,
      }),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Conversation-Id")).toBe(convUuid);
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      const mockTx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // Empty = matter not found
      };
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/chat/route");
    const request = new NextRequest("http://localhost/api/matters/missing/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "missing" }),
      } as any
    );

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Matter not found");
  });

  it("validates message body with Zod", async () => {
    const { POST } = await import("@/app/api/matters/[id]/ai/chat/route");

    // Empty message
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Validation Error");
  });

  it("returns 500 when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/matters/[id]/ai/chat/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "matter-1" }),
      } as any
    );

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toContain("OPENROUTER_API_KEY");
  });
});
