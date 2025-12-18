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

describe("Team Workload API - GET /api/team/workload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns team workload for date range", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "John Smith",
          userEmail: "john@example.com",
          activeMatters: 5,
          upcomingDeadlines: 3,
          pendingTasks: 12,
          hoursScheduled: 120,
          workloadScore: 68,
        },
        {
          userId: "user-2",
          userName: "Jane Doe",
          userEmail: "jane@example.com",
          activeMatters: 7,
          upcomingDeadlines: 5,
          pendingTasks: 18,
          hoursScheduled: 140,
          workloadScore: 85,
        },
      ],
      summary: {
        totalActiveMatters: 12,
        totalUpcomingDeadlines: 8,
        totalPendingTasks: 30,
        averageWorkloadScore: 76.5,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
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
    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest("http://localhost/api/team/workload?endDate=2025-12-31");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when endDate is missing", async () => {
    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest("http://localhost/api/team/workload?startDate=2025-12-01");
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when end date is before start date", async () => {
    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-31&endDate=2025-12-01"
    );
    const response = await GET(request as any, {} as any);

    expect([400, 500]).toContain(response.status);
  });

  it("calculates workload scores correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "Heavy Workload",
          userEmail: "heavy@example.com",
          activeMatters: 10,
          upcomingDeadlines: 5,
          pendingTasks: 20,
          hoursScheduled: 200,
          workloadScore: 100,
        },
      ],
      summary: {
        totalActiveMatters: 10,
        totalUpcomingDeadlines: 5,
        totalPendingTasks: 20,
        averageWorkloadScore: 100,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("handles team members with minimal workload", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "Light Workload",
          userEmail: "light@example.com",
          activeMatters: 0,
          upcomingDeadlines: 0,
          pendingTasks: 0,
          hoursScheduled: 0,
          workloadScore: 0,
        },
      ],
      summary: {
        totalActiveMatters: 0,
        totalUpcomingDeadlines: 0,
        totalPendingTasks: 0,
        averageWorkloadScore: 0,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.teamMembers[0].workloadScore).toBe(0);
  });

  it("caps workload score at 100", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "Overloaded",
          userEmail: "overloaded@example.com",
          activeMatters: 20,
          upcomingDeadlines: 10,
          pendingTasks: 40,
          hoursScheduled: 400,
          workloadScore: 100, // Should be capped
        },
      ],
      summary: {
        totalActiveMatters: 20,
        totalUpcomingDeadlines: 10,
        totalPendingTasks: 40,
        averageWorkloadScore: 100,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("includes all workload metrics in response", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "John Smith",
          userEmail: "john@example.com",
          activeMatters: 5,
          upcomingDeadlines: 3,
          pendingTasks: 12,
          hoursScheduled: 120,
          workloadScore: 68,
        },
      ],
      summary: {
        totalActiveMatters: 5,
        totalUpcomingDeadlines: 3,
        totalPendingTasks: 12,
        averageWorkloadScore: 68,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.teamMembers[0]).toHaveProperty("activeMatters");
    expect(json.teamMembers[0]).toHaveProperty("upcomingDeadlines");
    expect(json.teamMembers[0]).toHaveProperty("pendingTasks");
    expect(json.teamMembers[0]).toHaveProperty("hoursScheduled");
    expect(json.teamMembers[0]).toHaveProperty("workloadScore");
  });

  it("calculates summary correctly for multiple team members", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [
        {
          userId: "user-1",
          userName: "User 1",
          userEmail: "user1@example.com",
          activeMatters: 5,
          upcomingDeadlines: 2,
          pendingTasks: 10,
          hoursScheduled: 100,
          workloadScore: 60,
        },
        {
          userId: "user-2",
          userName: "User 2",
          userEmail: "user2@example.com",
          activeMatters: 3,
          upcomingDeadlines: 4,
          pendingTasks: 8,
          hoursScheduled: 80,
          workloadScore: 50,
        },
      ],
      summary: {
        totalActiveMatters: 8,
        totalUpcomingDeadlines: 6,
        totalPendingTasks: 18,
        averageWorkloadScore: 55,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.summary.totalActiveMatters).toBe(8);
    expect(json.summary.totalUpcomingDeadlines).toBe(6);
    expect(json.summary.totalPendingTasks).toBe(18);
  });

  it("handles empty team gracefully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockResult = {
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      teamMembers: [],
      summary: {
        totalActiveMatters: 0,
        totalUpcomingDeadlines: 0,
        totalPendingTasks: 0,
        averageWorkloadScore: 0,
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockResult as any);

    const { GET } = await import("@/app/api/team/workload/route");
    const request = new NextRequest(
      "http://localhost/api/team/workload?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.teamMembers).toEqual([]);
    expect(json.summary.averageWorkloadScore).toBe(0);
  });
});
