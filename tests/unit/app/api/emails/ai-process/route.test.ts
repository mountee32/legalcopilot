import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (_request: any, ctx: any) =>
    handler(_request, { ...ctx, user: { user: { id: "user-1" } } }),
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

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

function mockTx(options: {
  emailRow: {
    id: string;
    subject: string;
    bodyText: string | null;
    bodyHtml: string | null;
    matterId: string | null;
  };
  candidates: Array<{ id: string; reference: string; title: string }>;
  updatedRow: any;
}) {
  const select = vi
    .fn()
    .mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [options.emailRow],
        }),
      }),
    }))
    .mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => options.candidates,
          }),
        }),
      }),
    }));

  const update = vi.fn(() => ({
    set: () => ({
      where: () => ({
        returning: async () => [options.updatedRow],
      }),
    }),
  }));

  return { select, update };
}

describe("Email AI process route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when OPENROUTER_API_KEY missing", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/emails/[id]/ai/process/route");
    const request = new NextRequest("http://localhost/api/emails/e1/ai/process", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(400);

    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });

  it("returns success when withFirmDb returns updated row", async () => {
    process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ id: "e1" } as any);

    const { POST } = await import("@/app/api/emails/[id]/ai/process/route");
    const request = new NextRequest("http://localhost/api/emails/e1/ai/process", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(200);
  });

  it("returns 400 when model returns malformed JSON", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    vi.mocked(generateText).mockResolvedValueOnce({ text: "not-json" } as any);
    vi.mocked(withFirmDb).mockImplementationOnce(async (_firmId, fn) =>
      fn(
        mockTx({
          emailRow: {
            id: "e1",
            subject: "Hello",
            bodyText: "Body",
            bodyHtml: null,
            matterId: null,
          },
          candidates: [{ id: "m1", reference: "MAT-1", title: "Matter" }],
          updatedRow: { id: "e1" },
        }) as any
      )
    );

    const { POST } = await import("@/app/api/emails/[id]/ai/process/route");
    const request = new NextRequest("http://localhost/api/emails/e1/ai/process", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toContain("Model did not return valid JSON");
  });

  it("returns success when model returns valid JSON", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        intent: "general",
        sentiment: "neutral",
        urgency: 2,
        summary: "Summary",
        suggestedTasks: ["Do thing"],
        matchedMatterId: null,
        matchConfidence: 0,
      }),
    } as any);

    vi.mocked(withFirmDb).mockImplementationOnce(async (_firmId, fn) =>
      fn(
        mockTx({
          emailRow: {
            id: "e1",
            subject: "Hello",
            bodyText: "Body",
            bodyHtml: null,
            matterId: null,
          },
          candidates: [{ id: "m1", reference: "MAT-1", title: "Matter" }],
          updatedRow: { id: "e1", aiProcessed: true },
        }) as any
      )
    );

    const { POST } = await import("@/app/api/emails/[id]/ai/process/route");
    const request = new NextRequest("http://localhost/api/emails/e1/ai/process", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      { params: { id: "123e4567-e89b-12d3-a456-426614174000" } } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.email.id).toBe("e1");
  });
});
