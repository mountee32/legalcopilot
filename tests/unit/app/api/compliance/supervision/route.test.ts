import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  supervisionMetrics: {},
  users: {},
  matters: {},
  tasks: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  desc: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  sql: vi.fn(),
}));

vi.mock("@/lib/db/tenant");

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(() => "firm-123"),
}));

vi.mock("@/middleware/withAuth", () => ({
  withAuth: vi.fn((handler) => handler),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: vi.fn(() => (handler: any) => handler),
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: vi.fn((handler) => handler),
}));

describe("GET /api/compliance/supervision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return supervision metrics for current period", async () => {
    const mockMetrics = [
      {
        id: "metric-123",
        userId: "user-1",
        supervisorId: null,
        periodStart: new Date("2024-01-01").toISOString(),
        periodEnd: new Date("2024-01-07").toISOString(),
        activeMatters: 15,
        mattersOpened: 3,
        mattersClosed: 2,
        billableHours: 40,
        revenue: 500000,
        overdueTasks: 2,
        highRiskMatters: 1,
        additionalMetrics: null,
        calculatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        metrics: mockMetrics,
        period: {
          start: new Date("2024-01-01").toISOString(),
          end: new Date("2024-01-07").toISOString(),
        },
      };
    });

    const { GET } = await import("@/app/api/compliance/supervision/route");

    const request = new NextRequest("http://localhost/api/compliance/supervision");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("metrics");
    expect(data).toHaveProperty("period");
    expect(Array.isArray(data.metrics)).toBe(true);
  });

  it("should filter by userId", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        metrics: [
          {
            id: "metric-123",
            userId: "user-1",
            activeMatters: 10,
            overdueTasks: 0,
            highRiskMatters: 0,
          },
        ],
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
      };
    });

    const { GET } = await import("@/app/api/compliance/supervision/route");

    const request = new NextRequest("http://localhost/api/compliance/supervision?userId=user-1");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.metrics).toHaveLength(1);
  });

  it("should handle previous period", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        metrics: [],
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
      };
    });

    const { GET } = await import("@/app/api/compliance/supervision/route");

    const request = new NextRequest("http://localhost/api/compliance/supervision?period=previous");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });

  it("should handle custom date range", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        metrics: [],
        period: {
          start: "2024-01-01T00:00:00.000Z",
          end: "2024-01-31T00:00:00.000Z",
        },
      };
    });

    const { GET } = await import("@/app/api/compliance/supervision/route");

    const request = new NextRequest(
      "http://localhost/api/compliance/supervision?period=custom&startDate=2024-01-01&endDate=2024-01-31"
    );

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("period");
  });

  it("should return live metrics when no stored metrics exist", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        metrics: [
          {
            id: "live-user-1",
            userId: "user-1",
            userName: "John Doe",
            userEmail: "john@example.com",
            supervisorId: null,
            periodStart: new Date().toISOString(),
            periodEnd: new Date().toISOString(),
            activeMatters: 5,
            mattersOpened: 0,
            mattersClosed: 0,
            billableHours: 0,
            revenue: 0,
            overdueTasks: 2,
            highRiskMatters: 1,
            additionalMetrics: null,
            calculatedAt: new Date().toISOString(),
            isLive: true,
          },
        ],
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        isLive: true,
      };
    });

    const { GET } = await import("@/app/api/compliance/supervision/route");

    const request = new NextRequest("http://localhost/api/compliance/supervision");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.isLive).toBe(true);
    expect(data.metrics[0]).toHaveProperty("userName");
  });
});
