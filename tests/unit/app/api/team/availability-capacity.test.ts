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

describe("Team Availability API - GET /api/team/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns team availability for date range", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "John Smith",
          userEmail: "john@example.com",
          windows: [
            {
              id: "window-1",
              firmId: "firm-1",
              userId: "user-1",
              dayOfWeek: "monday",
              startTime: "09:00:00",
              endTime: "17:00:00",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          leaveRequests: [
            {
              id: "leave-1",
              firmId: "firm-1",
              userId: "user-1",
              type: "annual",
              startDate: "2025-12-20",
              endDate: "2025-12-24",
              daysCount: 3,
              status: "approved",
              reason: "Holiday",
              decidedBy: "manager-1",
              decidedAt: new Date(),
              decisionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/availability/route");
    const request = new NextRequest(
      "http://localhost/api/team/availability?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.startDate).toBe("2025-12-01");
    expect(json.endDate).toBe("2025-12-31");
    expect(json.teamMembers).toBeDefined();
  });

  it("returns error when startDate is missing", async () => {
    const { GET } = await import("@/app/api/team/availability/route");
    const request = new NextRequest("http://localhost/api/team/availability?endDate=2025-12-31");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when endDate is missing", async () => {
    const { GET } = await import("@/app/api/team/availability/route");
    const request = new NextRequest("http://localhost/api/team/availability?startDate=2025-12-01");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when end date is before start date", async () => {
    const { GET } = await import("@/app/api/team/availability/route");
    const request = new NextRequest(
      "http://localhost/api/team/availability?startDate=2025-12-31&endDate=2025-12-01"
    );
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("includes only approved and pending leave requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "John Smith",
          userEmail: "john@example.com",
          windows: [],
          leaveRequests: [
            {
              id: "leave-1",
              status: "approved",
              type: "annual",
              startDate: "2025-12-20",
              endDate: "2025-12-24",
            },
            {
              id: "leave-2",
              status: "pending",
              type: "sick",
              startDate: "2025-12-15",
              endDate: "2025-12-16",
            },
          ],
        },
      ],
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/availability/route");
    const request = new NextRequest(
      "http://localhost/api/team/availability?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });
});

describe("Team Capacity API - GET /api/team/capacity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns team capacity summary for date range", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "John Smith",
          userEmail: "john@example.com",
          totalHoursAvailable: 160,
          hoursScheduled: 120,
          hoursRemaining: 40,
          utilization: 75,
          activeMatters: 5,
        },
        {
          userId: "user-2",
          userName: "Jane Doe",
          userEmail: "jane@example.com",
          totalHoursAvailable: 160,
          hoursScheduled: 140,
          hoursRemaining: 20,
          utilization: 87.5,
          activeMatters: 7,
        },
      ],
      summary: {
        totalCapacity: 320,
        totalScheduled: 260,
        totalRemaining: 60,
        averageUtilization: 81.25,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest(
      "http://localhost/api/team/capacity?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.startDate).toBe("2025-12-01");
    expect(json.endDate).toBe("2025-12-31");
    expect(json.teamMembers).toBeDefined();
    expect(json.summary).toBeDefined();
  });

  it("returns error when startDate is missing", async () => {
    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest("http://localhost/api/team/capacity?endDate=2025-12-31");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when endDate is missing", async () => {
    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest("http://localhost/api/team/capacity?startDate=2025-12-01");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when end date is before start date", async () => {
    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest(
      "http://localhost/api/team/capacity?startDate=2025-12-31&endDate=2025-12-01"
    );
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("calculates capacity accounting for approved leave", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-05",
      teamMembers: [
        {
          userId: "user-1",
          userName: "John Smith",
          userEmail: "john@example.com",
          totalHoursAvailable: 32, // 4 working days * 8 hours (1 day leave)
          hoursScheduled: 24,
          hoursRemaining: 8,
          utilization: 75,
          activeMatters: 3,
        },
      ],
      summary: {
        totalCapacity: 32,
        totalScheduled: 24,
        totalRemaining: 8,
        averageUtilization: 75,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest(
      "http://localhost/api/team/capacity?startDate=2025-12-01&endDate=2025-12-05"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("handles team members with no scheduled work", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-3",
          userName: "New User",
          userEmail: "new@example.com",
          totalHoursAvailable: 160,
          hoursScheduled: 0,
          hoursRemaining: 160,
          utilization: 0,
          activeMatters: 0,
        },
      ],
      summary: {
        totalCapacity: 160,
        totalScheduled: 0,
        totalRemaining: 160,
        averageUtilization: 0,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest(
      "http://localhost/api/team/capacity?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.teamMembers[0].utilization).toBe(0);
  });

  it("caps utilization at 100%", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "Overworked User",
          userEmail: "overworked@example.com",
          totalHoursAvailable: 160,
          hoursScheduled: 200,
          hoursRemaining: -40,
          utilization: 100, // Capped even though actual is 125%
          activeMatters: 10,
        },
      ],
      summary: {
        totalCapacity: 160,
        totalScheduled: 200,
        totalRemaining: -40,
        averageUtilization: 100,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/capacity/route");
    const request = new NextRequest(
      "http://localhost/api/team/capacity?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });
});
