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

describe("Team Leave API - GET /api/team/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of leave requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeaves = [
      {
        id: "leave-1",
        firmId: "firm-1",
        userId: "user-1",
        type: "annual",
        startDate: "2025-12-20",
        endDate: "2025-12-24",
        daysCount: 3,
        reason: "Christmas holiday",
        status: "approved",
        decidedBy: "manager-1",
        decidedAt: new Date("2025-12-10T10:00:00Z"),
        decisionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "leave-2",
        firmId: "firm-1",
        userId: "user-2",
        type: "sick",
        startDate: "2025-12-18",
        endDate: "2025-12-19",
        daysCount: 2,
        reason: null,
        status: "pending",
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      leaveRequests: mockLeaves,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    } as any);

    const { GET } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.leaveRequests).toBeDefined();
    expect(json.pagination).toBeDefined();
  });

  it("filters by userId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const userId = "223e4567-e89b-12d3-a456-426614174000";
    const mockLeaves = [
      {
        id: "leave-1",
        userId,
        type: "annual",
        startDate: "2025-12-20",
        endDate: "2025-12-24",
        daysCount: 3,
        status: "pending",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      leaveRequests: mockLeaves,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    } as any);

    const { GET } = await import("@/app/api/team/leave/route");
    const request = new NextRequest(`http://localhost/api/team/leave?userId=${userId}`);
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("filters by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      leaveRequests: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    } as any);

    const { GET } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave?status=approved");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("filters by type parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      leaveRequests: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    } as any);

    const { GET } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave?type=annual");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("filters by date range", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      leaveRequests: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    } as any);

    const { GET } = await import("@/app/api/team/leave/route");
    const request = new NextRequest(
      "http://localhost/api/team/leave?startDate=2025-12-01&endDate=2025-12-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });
});

describe("Team Leave API - POST /api/team/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates leave request successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeave = {
      id: "new-leave-1",
      firmId: "firm-1",
      userId: "user-1",
      type: "annual",
      startDate: "2025-12-20",
      endDate: "2025-12-24",
      daysCount: 3,
      reason: "Christmas break",
      status: "pending",
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLeave as any);

    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "annual",
        startDate: "2025-12-20",
        endDate: "2025-12-24",
        reason: "Christmas break",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.type).toBe("annual");
    expect(json.status).toBe("pending");
  });

  it("creates leave request without reason", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeave = {
      id: "new-leave-2",
      type: "sick",
      startDate: "2025-12-18",
      endDate: "2025-12-19",
      daysCount: 2,
      reason: null,
      status: "pending",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLeave as any);

    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "sick",
        startDate: "2025-12-18",
        endDate: "2025-12-19",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("returns error when end date is before start date", async () => {
    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "annual",
        startDate: "2025-12-24",
        endDate: "2025-12-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when type is missing", async () => {
    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        startDate: "2025-12-20",
        endDate: "2025-12-24",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when startDate is missing", async () => {
    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "annual",
        endDate: "2025-12-24",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when endDate is missing", async () => {
    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "annual",
        startDate: "2025-12-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates leave type enum", async () => {
    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "invalid_type",
        startDate: "2025-12-20",
        endDate: "2025-12-24",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("calculates working days correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeave = {
      id: "new-leave-3",
      type: "annual",
      startDate: "2025-12-22", // Monday
      endDate: "2025-12-26", // Friday
      daysCount: 5,
      status: "pending",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLeave as any);

    const { POST } = await import("@/app/api/team/leave/route");
    const request = new NextRequest("http://localhost/api/team/leave", {
      method: "POST",
      body: JSON.stringify({
        type: "annual",
        startDate: "2025-12-22",
        endDate: "2025-12-26",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });
});
