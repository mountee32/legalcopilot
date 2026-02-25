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

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@/lib/ai/openrouter", () => ({
  openrouter: vi.fn((model: string) => model),
  models: { "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet" },
}));

vi.mock("@/lib/generation/context-builder", () => ({
  buildGenerationContext: vi.fn(),
}));

const mockContext = {
  matter: {
    id: "matter-1",
    reference: "MAT-001",
    title: "Smith v Jones",
    practiceArea: "personal_injury",
    status: "active",
    description: null,
    subType: null,
  },
  client: { name: "John Smith", type: "individual" },
  firm: { name: "Test Firm" },
  feeEarner: null,
  findings: { plaintiff_name: "John Smith" },
  findingsByCategory: {
    liability: [
      {
        id: "f1",
        fieldKey: "plaintiff_name",
        label: "Plaintiff Name",
        value: "John Smith",
        confidence: 0.95,
        impact: "high",
        status: "accepted",
        sourceQuote: null,
        categoryKey: "liability",
        pageStart: null,
        pageEnd: null,
      },
    ],
  },
  statusCounts: { pending: 2, accepted: 5, rejected: 0, auto_applied: 3, conflict: 1 },
  today: "2026-02-24",
};

describe("POST /api/matters/[id]/ai/suggest-tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("returns suggestions when AI succeeds", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");

    const suggestions = {
      suggestions: [
        {
          title: "Review medical records",
          description: "Check for completeness",
          priority: "high",
          dueInDays: 7,
          rationale: "Critical evidence for PI claim",
        },
        {
          title: "Contact expert witness",
          priority: "medium",
          dueInDays: 14,
          rationale: "Need medical opinion",
        },
      ],
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      vi.mocked(buildGenerationContext).mockResolvedValueOnce(mockContext as any);
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify(suggestions),
      } as any);
      return callback({} as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-tasks/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/suggest-tasks", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.suggestions).toHaveLength(2);
    expect(json.suggestions[0].title).toBe("Review medical records");
  });

  it("handles AI returning JSON wrapped in code fences", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");

    const suggestions = {
      suggestions: [{ title: "Follow up", priority: "medium" }],
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      vi.mocked(buildGenerationContext).mockResolvedValueOnce(mockContext as any);
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "```json\n" + JSON.stringify(suggestions) + "\n```",
      } as any);
      return callback({} as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-tasks/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/suggest-tasks", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.suggestions).toHaveLength(1);
  });

  it("throws when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-tasks/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/suggest-tasks", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await expect(
      POST(request as any, { params: Promise.resolve({ id: "matter-1" }) } as any)
    ).rejects.toThrow("OPENROUTER_API_KEY");
  });

  it("throws when AI returns invalid JSON", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      vi.mocked(buildGenerationContext).mockResolvedValueOnce(mockContext as any);
      vi.mocked(generateText).mockResolvedValueOnce({
        text: "Sorry, I cannot generate tasks",
      } as any);
      return callback({} as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-tasks/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/suggest-tasks", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await expect(
      POST(request as any, { params: Promise.resolve({ id: "matter-1" }) } as any)
    ).rejects.toThrow("AI did not return valid JSON");
  });

  it("passes optional goal to the prompt", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      vi.mocked(buildGenerationContext).mockResolvedValueOnce(mockContext as any);
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({ suggestions: [{ title: "Task", priority: "low" }] }),
      } as any);
      return callback({} as any);
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-tasks/route");
    const request = new NextRequest("http://localhost/api/matters/matter-1/ai/suggest-tasks", {
      method: "POST",
      body: JSON.stringify({ goal: "Prepare for trial" }),
    });
    const response = await POST(
      request as any,
      { params: Promise.resolve({ id: "matter-1" }) } as any
    );

    expect(response.status).toBe(200);
    // Verify generateText was called with a prompt containing the goal
    expect(vi.mocked(generateText)).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Prepare for trial"),
      })
    );
  });
});
