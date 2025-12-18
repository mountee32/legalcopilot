import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  complianceAlerts: {},
  complianceRules: {},
  riskEvaluations: {},
  matters: {},
  tasks: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  count: vi.fn(),
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

describe("GET /api/compliance/reports/weekly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return weekly compliance report", async () => {
    const mockReport = {
      period: {
        start: "2024-01-01T00:00:00.000Z",
        end: "2024-01-07T00:00:00.000Z",
      },
      complianceScore: 85,
      alerts: {
        total: 10,
        byStatus: { pending: 2, acknowledged: 3, resolved: 4, dismissed: 1 },
        byPriority: { info: 3, warning: 4, urgent: 2, critical: 1 },
      },
      riskEvaluations: {
        evaluationsPerformed: 15,
        averageScore: 45,
        bySeverity: { low: 5, medium: 6, high: 3, critical: 1 },
      },
      matters: {
        activeTotal: 50,
        highRisk: 5,
        criticalRisk: 1,
      },
      tasks: {
        overdue: 3,
      },
      rules: {
        active: 12,
      },
      recommendations: ["Review overdue tasks"],
      generatedAt: new Date().toISOString(),
    };

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return mockReport;
    });

    const { GET } = await import("@/app/api/compliance/reports/weekly/route");

    const request = new NextRequest("http://localhost/api/compliance/reports/weekly");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("period");
    expect(data).toHaveProperty("complianceScore");
    expect(data).toHaveProperty("alerts");
    expect(data).toHaveProperty("riskEvaluations");
    expect(data).toHaveProperty("matters");
    expect(data).toHaveProperty("tasks");
    expect(data).toHaveProperty("rules");
    expect(data).toHaveProperty("recommendations");
    expect(data).toHaveProperty("generatedAt");
  });

  it("should handle custom end date", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        period: {
          start: "2024-01-01T00:00:00.000Z",
          end: "2024-01-15T00:00:00.000Z",
        },
        complianceScore: 90,
        alerts: {
          total: 5,
          byStatus: { pending: 0, acknowledged: 1, resolved: 3, dismissed: 1 },
          byPriority: { info: 2, warning: 2, urgent: 1, critical: 0 },
        },
        riskEvaluations: {
          evaluationsPerformed: 8,
          averageScore: 35,
          bySeverity: { low: 4, medium: 3, high: 1, critical: 0 },
        },
        matters: {
          activeTotal: 30,
          highRisk: 2,
          criticalRisk: 0,
        },
        tasks: {
          overdue: 0,
        },
        rules: {
          active: 10,
        },
        recommendations: ["Compliance metrics are within acceptable ranges"],
        generatedAt: new Date().toISOString(),
      };
    });

    const { GET } = await import("@/app/api/compliance/reports/weekly/route");

    const request = new NextRequest(
      "http://localhost/api/compliance/reports/weekly?endDate=2024-01-15"
    );

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.period).toBeDefined();
  });

  it("should include recommendations for critical issues", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        complianceScore: 60,
        alerts: {
          total: 15,
          byStatus: { pending: 10, acknowledged: 2, resolved: 2, dismissed: 1 },
          byPriority: { info: 1, warning: 5, urgent: 4, critical: 5 },
        },
        riskEvaluations: {
          evaluationsPerformed: 20,
          averageScore: 70,
          bySeverity: { low: 2, medium: 5, high: 8, critical: 5 },
        },
        matters: {
          activeTotal: 40,
          highRisk: 10,
          criticalRisk: 5,
        },
        tasks: {
          overdue: 8,
        },
        rules: {
          active: 15,
        },
        recommendations: [
          "Address 5 critical compliance alert(s) immediately",
          "Review and acknowledge 10 pending alerts",
          "Schedule supervision reviews for 5 critical-risk matter(s)",
          "Address 8 overdue task(s) to maintain compliance",
          "Overall risk score is elevated - consider reviewing workload distribution",
        ],
        generatedAt: new Date().toISOString(),
      };
    });

    const { GET } = await import("@/app/api/compliance/reports/weekly/route");

    const request = new NextRequest("http://localhost/api/compliance/reports/weekly");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.recommendations).toBeDefined();
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBeGreaterThan(0);
  });

  it("should calculate compliance score correctly", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        complianceScore: 100,
        alerts: {
          total: 0,
          byStatus: { pending: 0, acknowledged: 0, resolved: 0, dismissed: 0 },
          byPriority: { info: 0, warning: 0, urgent: 0, critical: 0 },
        },
        riskEvaluations: {
          evaluationsPerformed: 0,
          averageScore: 0,
          bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        },
        matters: {
          activeTotal: 0,
          highRisk: 0,
          criticalRisk: 0,
        },
        tasks: {
          overdue: 0,
        },
        rules: {
          active: 5,
        },
        recommendations: [
          "Compliance metrics are within acceptable ranges - maintain current practices",
        ],
        generatedAt: new Date().toISOString(),
      };
    });

    const { GET } = await import("@/app/api/compliance/reports/weekly/route");

    const request = new NextRequest("http://localhost/api/compliance/reports/weekly");

    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.complianceScore).toBe(100);
  });
});
