import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

// Simple mocking approach - just verify the endpoints work
vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  complianceAlerts: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  desc: vi.fn(),
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

describe("GET /api/compliance/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock withFirmDb to return default empty results
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return { alerts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    });
  });

  it("should accept pagination parameters", async () => {
    const { GET } = await import("@/app/api/compliance/alerts/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/alerts?page=1&limit=20");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("alerts");
    expect(data).toHaveProperty("pagination");
  });

  it("should accept status filter", async () => {
    const { GET } = await import("@/app/api/compliance/alerts/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/alerts?status=pending");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });

  it("should accept priority filter", async () => {
    const { GET } = await import("@/app/api/compliance/alerts/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/alerts?priority=urgent");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });

  it("should accept UUID filters", async () => {
    const { GET } = await import("@/app/api/compliance/alerts/route");

    const request = new NextRequest(
      "http://localhost:3000/api/compliance/alerts?matterId=550e8400-e29b-41d4-a716-446655440000&userId=550e8400-e29b-41d4-a716-446655440001&ruleId=550e8400-e29b-41d4-a716-446655440002"
    );
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });
});
