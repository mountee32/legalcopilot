import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  matters: {},
  riskEvaluations: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  desc: vi.fn(),
  gte: vi.fn(),
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

describe("GET /api/compliance/risk-scores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock withFirmDb to return default empty results
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return { riskScores: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    });
  });

  it("should accept pagination parameters", async () => {
    const { GET } = await import("@/app/api/compliance/risk-scores/route");

    const request = new NextRequest(
      "http://localhost:3000/api/compliance/risk-scores?page=1&limit=20"
    );
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("riskScores");
    expect(data).toHaveProperty("pagination");
  });

  it("should accept severity filter", async () => {
    const { GET } = await import("@/app/api/compliance/risk-scores/route");

    const request = new NextRequest(
      "http://localhost:3000/api/compliance/risk-scores?severity=high"
    );
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });

  it("should accept minScore filter", async () => {
    const { GET } = await import("@/app/api/compliance/risk-scores/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/risk-scores?minScore=70");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });

  it("should accept practiceArea filter", async () => {
    const { GET } = await import("@/app/api/compliance/risk-scores/route");

    const request = new NextRequest(
      "http://localhost:3000/api/compliance/risk-scores?practiceArea=conveyancing"
    );
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });
});
