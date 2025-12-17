import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("Matter AI suggest calendar route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when OPENROUTER_API_KEY missing", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest("http://localhost/api/matters/m1/ai/suggest-calendar", {
      method: "POST",
      body: JSON.stringify({ text: "Hearing on 2025-01-02" }),
    });
    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBe(400);
    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });

  it("requires matter ID in params", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest("http://localhost/api/matters//ai/suggest-calendar", {
      method: "POST",
      body: JSON.stringify({ text: "Hearing on 2025-01-02" }),
    });
    const response = await POST(request as any, { params: {} } as any);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("requires text in request body", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect([400, 500]).toContain(response.status);
  });

  it("creates approval request with suggested events", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    const mockApproval = {
      id: "approval-1",
      action: "calendar_event.create",
      status: "pending",
      proposedPayload: {
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        events: [
          {
            title: "Court hearing",
            description: "Initial hearing",
            eventType: "hearing",
            startAt: "2025-01-02T10:00:00Z",
            endAt: "2025-01-02T11:00:00Z",
            allDay: false,
            priority: "high",
          },
        ],
      },
    };

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        events: [
          {
            title: "Court hearing",
            description: "Initial hearing",
            eventType: "hearing",
            startAt: "2025-01-02T10:00:00Z",
            endAt: "2025-01-02T11:00:00Z",
            allDay: false,
            priority: "high",
          },
        ],
      }),
    } as any);

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "The court hearing is scheduled for 2 January 2025 at 10:00 AM",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.action).toBe("calendar_event.create");
  });

  it("handles multiple suggested events", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    const mockApproval = {
      id: "approval-2",
      action: "calendar_event.create",
      status: "pending",
      proposedPayload: {
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        events: [
          {
            title: "Hearing",
            eventType: "hearing",
            startAt: "2025-01-15T09:00:00Z",
            allDay: false,
            priority: "high",
          },
          {
            title: "Filing deadline",
            eventType: "filing_deadline",
            startAt: "2025-01-10T17:00:00Z",
            allDay: true,
            priority: "critical",
          },
          {
            title: "Client meeting",
            eventType: "meeting",
            startAt: "2025-01-05T14:00:00Z",
            allDay: false,
            priority: "medium",
          },
        ],
      },
    };

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        events: [
          {
            title: "Hearing",
            eventType: "hearing",
            startAt: "2025-01-15T09:00:00Z",
            allDay: false,
            priority: "high",
          },
          {
            title: "Filing deadline",
            eventType: "filing_deadline",
            startAt: "2025-01-10T17:00:00Z",
            allDay: true,
            priority: "critical",
          },
          {
            title: "Client meeting",
            eventType: "meeting",
            startAt: "2025-01-05T14:00:00Z",
            allDay: false,
            priority: "medium",
          },
        ],
      }),
    } as any);

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "Hearing on 15 Jan. Filing deadline is 10 Jan. Meeting with client on 5 Jan at 2pm.",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBe(201);
  });

  it("returns error when matter not found", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("Matter not found"));

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "Hearing on 2025-01-02",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("returns error when AI returns invalid JSON", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    vi.mocked(generateText).mockResolvedValueOnce({
      text: "This is not valid JSON",
    } as any);

    // withFirmDb will be called but validation will fail
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId, callback: any) => {
      // Simulate the transaction callback being called
      return await callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "m1", title: "Test", reference: "MAT-001" }]),
      });
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "Some text",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("returns error when AI returns malformed event data", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        events: [
          {
            title: "Event without required fields",
          },
        ],
      }),
    } as any);

    // withFirmDb will be called but validation will fail
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId, callback: any) => {
      return await callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "m1", title: "Test", reference: "MAT-001" }]),
      });
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "Some text",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects text longer than 20,000 characters", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const longText = "x".repeat(25000);

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: longText,
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect([400, 500]).toContain(response.status);
  });

  it("handles events with optional fields", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    const mockApproval = {
      id: "approval-4",
      action: "calendar_event.create",
      status: "pending",
      proposedPayload: {
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        events: [
          {
            title: "Limitation date",
            description: "Statute of limitations expires",
            eventType: "limitation_date",
            startAt: "2025-12-31T23:59:00Z",
            endAt: null,
            allDay: true,
            priority: "critical",
          },
        ],
      },
    };

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        events: [
          {
            title: "Limitation date",
            description: "Statute of limitations expires",
            eventType: "limitation_date",
            startAt: "2025-12-31T23:59:00Z",
            allDay: true,
            priority: "critical",
          },
        ],
      }),
    } as any);

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "The limitation period expires on 31 December 2025",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBe(201);
  });

  it("rejects events with more than 20 items", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    const tooManyEvents = Array(25)
      .fill(null)
      .map((_, i) => ({
        title: `Event ${i + 1}`,
        startAt: "2025-01-15T09:00:00Z",
      }));

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        events: tooManyEvents,
      }),
    } as any);

    // withFirmDb will be called but validation will fail
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId, callback: any) => {
      return await callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "m1", title: "Test", reference: "MAT-001" }]),
      });
    });

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "Many events text",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("handles all supported event types", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { withFirmDb } = await import("@/lib/db/tenant");
    const { generateText } = await import("ai");

    const mockApproval = {
      id: "approval-5",
      action: "calendar_event.create",
      status: "pending",
    };

    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        events: [
          { title: "Hearing", eventType: "hearing", startAt: "2025-01-15T09:00:00Z" },
          { title: "Deadline", eventType: "deadline", startAt: "2025-01-16T09:00:00Z" },
          { title: "Meeting", eventType: "meeting", startAt: "2025-01-17T09:00:00Z" },
          { title: "Reminder", eventType: "reminder", startAt: "2025-01-18T09:00:00Z" },
          {
            title: "Limitation",
            eventType: "limitation_date",
            startAt: "2025-01-19T09:00:00Z",
          },
          {
            title: "Filing",
            eventType: "filing_deadline",
            startAt: "2025-01-20T09:00:00Z",
          },
          { title: "Other", eventType: "other", startAt: "2025-01-21T09:00:00Z" },
        ],
      }),
    } as any);

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/matters/[id]/ai/suggest-calendar/route");
    const request = new NextRequest(
      "http://localhost/api/matters/123e4567-e89b-12d3-a456-426614174000/ai/suggest-calendar",
      {
        method: "POST",
        body: JSON.stringify({
          text: "Multiple event types text",
        }),
      }
    );

    const response = await POST(
      request as any,
      {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      } as any
    );

    expect(response.status).toBe(201);
  });
});
