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

describe("Calendar API - GET /api/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 without date range (missing from parameter)", async () => {
    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?to=2024-01-31T00:00:00Z&page=1&limit=20"
    );
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(400);
  });

  it("returns 400 without date range (missing to parameter)", async () => {
    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?from=2024-01-01T00:00:00Z&page=1&limit=20"
    );
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(400);
  });

  it("returns paginated list of calendar events", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEvents = [
      {
        id: "evt-1",
        matterId: "matter-1",
        title: "Court Hearing",
        description: "Initial hearing for case",
        eventType: "hearing",
        status: "scheduled",
        priority: "high",
        startAt: new Date("2024-01-15T10:00:00Z"),
        endAt: new Date("2024-01-15T11:00:00Z"),
        allDay: false,
        location: "Court Room 3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "evt-2",
        matterId: "matter-1",
        title: "Filing Deadline",
        eventType: "filing_deadline",
        status: "scheduled",
        priority: "critical",
        startAt: new Date("2024-01-20T17:00:00Z"),
        endAt: null,
        allDay: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockEvents } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&page=1&limit=20"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.events)).toBe(true);
    expect(json.events.length).toBe(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expect(json.events[0].title).toBe("Court Hearing");
    expect(json.events[1].title).toBe("Filing Deadline");
  });

  it("returns empty list when no events exist in date range", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events).toEqual([]);
    expect(json.pagination.total).toBe(0);
    expect(json.pagination.totalPages).toBe(1);
  });

  it("filters by matterId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEvents = [
      {
        id: "evt-1",
        matterId,
        title: "Meeting for Matter 123",
        eventType: "meeting",
        status: "scheduled",
        startAt: new Date("2024-01-15T10:00:00Z"),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEvents } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      `http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&matterId=${matterId}`
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events.length).toBe(1);
    expect(json.events[0].matterId).toBe(matterId);
  });

  it("filters by eventType parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEvents = [
      {
        id: "evt-1",
        title: "Court Hearing",
        eventType: "hearing",
        status: "scheduled",
        startAt: new Date("2024-01-15T10:00:00Z"),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEvents } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&eventType=hearing"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events[0].eventType).toBe("hearing");
  });

  it("filters by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEvents = [
      {
        id: "evt-1",
        title: "Completed Meeting",
        eventType: "meeting",
        status: "completed",
        startAt: new Date("2024-01-10T10:00:00Z"),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEvents } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&status=completed"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events[0].status).toBe("completed");
  });

  it("handles pagination correctly with multiple pages", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEvents = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: `evt-${i}`,
        title: `Event ${i}`,
        eventType: "meeting",
        status: "scheduled",
        startAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`),
      }));
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 50, rows: mockEvents } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      "http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-12-31T23:59:59Z&page=2&limit=10"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.total).toBe(50);
    expect(json.pagination.totalPages).toBe(5);
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });

  it("combines multiple filters correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEvents = [
      {
        id: "evt-1",
        matterId,
        title: "Hearing for Matter 123",
        eventType: "hearing",
        status: "scheduled",
        startAt: new Date("2024-01-15T10:00:00Z"),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEvents } as any);

    const { GET } = await import("@/app/api/calendar/route");
    const request = new NextRequest(
      `http://localhost/api/calendar?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&matterId=${matterId}&eventType=hearing&status=scheduled`
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events.length).toBe(1);
  });
});

describe("Calendar API - POST /api/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a calendar event successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEvent = {
      id: "new-evt-1",
      firmId: "firm-1",
      matterId,
      title: "Client Meeting",
      description: "Discuss case progress",
      eventType: "meeting",
      status: "scheduled",
      priority: "medium",
      startAt: new Date("2024-02-15T14:00:00Z"),
      endAt: new Date("2024-02-15T15:00:00Z"),
      allDay: false,
      location: "Office Conference Room",
      attendees: null,
      reminderMinutes: [30],
      recurrence: null,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: matterId }]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockEvent]),
      };
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Client Meeting",
        description: "Discuss case progress",
        eventType: "meeting",
        startAt: "2024-02-15T14:00:00Z",
        endAt: "2024-02-15T15:00:00Z",
        location: "Office Conference Room",
        reminderMinutes: [30],
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.title).toBe("Client Meeting");
    expect(json.eventType).toBe("meeting");
    expect(json.status).toBe("scheduled");
    expect(json.priority).toBe("medium");
  });

  it("creates an all-day event successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174001";
    const mockEvent = {
      id: "new-evt-2",
      firmId: "firm-1",
      matterId,
      title: "Filing Deadline",
      eventType: "filing_deadline",
      status: "scheduled",
      priority: "medium",
      startAt: new Date("2024-03-01T00:00:00Z"),
      endAt: null,
      allDay: true,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: matterId }]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockEvent]),
      };
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Filing Deadline",
        eventType: "filing_deadline",
        startAt: "2024-03-01T00:00:00Z",
        allDay: true,
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.allDay).toBe(true);
  });

  it("creates event without matterId (firm-level event)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEvent = {
      id: "new-evt-3",
      firmId: "firm-1",
      matterId: null,
      title: "Firm Holiday",
      eventType: "other",
      status: "scheduled",
      priority: "medium",
      startAt: new Date("2024-12-25T00:00:00Z"),
      endAt: null,
      allDay: true,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockEvent]),
      };
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        title: "Firm Holiday",
        eventType: "other",
        startAt: "2024-12-25T00:00:00Z",
        allDay: true,
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.matterId).toBe(null);
  });

  it("returns validation error when endAt is before startAt", async () => {
    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        title: "Invalid Event",
        eventType: "meeting",
        startAt: "2024-02-15T15:00:00Z",
        endAt: "2024-02-15T14:00:00Z",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(400);
  });

  it("returns error when title is missing", async () => {
    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        eventType: "meeting",
        startAt: "2024-02-15T14:00:00Z",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when eventType is missing", async () => {
    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        title: "Meeting",
        startAt: "2024-02-15T14:00:00Z",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when startAt is missing", async () => {
    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        title: "Meeting",
        eventType: "meeting",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when title exceeds max length", async () => {
    const { POST } = await import("@/app/api/calendar/route");
    const longTitle = "A".repeat(201);
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        title: longTitle,
        eventType: "meeting",
        startAt: "2024-02-15T14:00:00Z",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns 404 when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174002";
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Meeting",
        eventType: "meeting",
        startAt: "2024-02-15T14:00:00Z",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(404);
  });

  it("returns error for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("creates event with optional fields (attendees, reminders, recurrence)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174003";
    const mockEvent = {
      id: "new-evt-4",
      firmId: "firm-1",
      matterId,
      title: "Team Meeting",
      eventType: "meeting",
      status: "scheduled",
      priority: "medium",
      startAt: new Date("2024-02-20T10:00:00Z"),
      endAt: new Date("2024-02-20T11:00:00Z"),
      allDay: false,
      attendees: [{ email: "lawyer@firm.com" }, { email: "client@example.com" }],
      reminderMinutes: [15, 60],
      recurrence: { frequency: "weekly", count: 4 },
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: matterId }]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockEvent]),
      };
      return callback(mockTx);
    });

    const { POST } = await import("@/app/api/calendar/route");
    const request = new NextRequest("http://localhost/api/calendar", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Team Meeting",
        eventType: "meeting",
        startAt: "2024-02-20T10:00:00Z",
        endAt: "2024-02-20T11:00:00Z",
        attendees: [{ email: "lawyer@firm.com" }, { email: "client@example.com" }],
        reminderMinutes: [15, 60],
        recurrence: { frequency: "weekly", count: 4 },
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.attendees).toBeDefined();
    expect(json.reminderMinutes).toBeDefined();
    expect(json.recurrence).toBeDefined();
  });
});
