import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  complianceRules: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
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

describe("GET /api/compliance/rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock withFirmDb to return default empty results
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return { rules: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    });
  });

  it("should accept pagination parameters", async () => {
    const { GET } = await import("@/app/api/compliance/rules/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/rules?page=1&limit=20");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("rules");
    expect(data).toHaveProperty("pagination");
  });

  it("should accept type filter", async () => {
    const { GET } = await import("@/app/api/compliance/rules/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/rules?type=deadline");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });

  it("should accept isActive filter", async () => {
    const { GET } = await import("@/app/api/compliance/rules/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/rules?isActive=true");
    const response = await GET(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
  });
});

describe("POST /api/compliance/rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock withFirmDb to return a created rule
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "rule-123",
        firmId: "firm-123",
        name: "Test Rule",
        description: null,
        type: "deadline",
        isActive: true,
        condition: {},
        alertPriority: "warning",
        alertTemplate: "Test",
        checkInterval: null,
        lastCheckedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-123",
      };
    });
  });

  it("should create a new rule with valid data", async () => {
    const { POST } = await import("@/app/api/compliance/rules/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/rules", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Rule",
        type: "deadline",
        condition: { warningDays: 7 },
        alertTemplate: "Test template",
      }),
    });

    const response = await POST(request, {
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
  });

  it("should validate required fields", async () => {
    const { POST } = await import("@/app/api/compliance/rules/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/rules", {
      method: "POST",
      body: JSON.stringify({
        name: "Incomplete Rule",
      }),
    });

    await expect(
      POST(request, {
        user: { user: { id: "user-123" } },
      } as any)
    ).rejects.toThrow();
  });
});
