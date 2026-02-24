import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock withClientPortalAuth middleware - check for auth header
vi.mock("@/middleware/withClientPortalAuth", () => ({
  withClientPortalAuth: (handler: any) => (request: any, ctx: any) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const mockPortalSession = {
      sessionId: "session-123",
      clientId: "client-123",
      firmId: "firm-123",
      client: {
        id: "client-123",
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
      },
    };
    return handler(request, { ...ctx, portalSession: mockPortalSession });
  },
}));

// Mock the database module
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  matters: {
    id: "id",
    clientId: "clientId",
    reference: "reference",
    title: "title",
    description: "description",
    status: "status",
    practiceArea: "practiceArea",
    billingType: "billingType",
    openedAt: "openedAt",
    closedAt: "closedAt",
    keyDeadline: "keyDeadline",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  clients: {
    id: "id",
  },
  clientPortalSessions: {
    id: "id",
    token: "token",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ operator: "and", args })),
  gt: vi.fn((field, value) => ({ field, value, operator: "gt" })),
  desc: vi.fn((field) => ({ field, direction: "desc" })),
}));

describe("Portal Matters API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Re-establish chain mocks after clearAllMocks
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnValue(mockDb);
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.innerJoin.mockReturnThis();
  });

  describe("GET /api/portal/matters", () => {
    it("should return client's matters when authenticated", async () => {
      const mockMatters = [
        {
          id: "matter-1",
          reference: "MAT-001",
          title: "Property Purchase",
          description: "Residential property purchase",
          status: "active",
          practiceArea: "conveyancing",
          billingType: "fixed_fee",
          openedAt: new Date("2024-01-01"),
          closedAt: null,
          keyDeadline: new Date("2024-06-01"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        },
        {
          id: "matter-2",
          reference: "MAT-002",
          title: "Will Preparation",
          description: "Last will and testament",
          status: "closed",
          practiceArea: "probate",
          billingType: "fixed_fee",
          openedAt: new Date("2024-02-01"),
          closedAt: new Date("2024-02-15"),
          keyDeadline: null,
          createdAt: new Date("2024-02-01"),
          updatedAt: new Date("2024-02-15"),
        },
      ];

      // The route does: db.select({...}).from(matters).where(eq(...)).orderBy(desc(...))
      mockDb.orderBy.mockResolvedValueOnce(mockMatters);

      const { GET } = await import("@/app/api/portal/matters/route");

      const request = new NextRequest("http://localhost:3000/api/portal/matters", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.matters).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.matters[0].reference).toBe("MAT-001");
    });

    it("should return 401 without authentication", async () => {
      const { GET } = await import("@/app/api/portal/matters/route");

      const request = new NextRequest("http://localhost:3000/api/portal/matters", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty array if client has no matters", async () => {
      // The route does: db.select({...}).from(matters).where(eq(...)).orderBy(desc(...))
      mockDb.orderBy.mockResolvedValueOnce([]);

      const { GET } = await import("@/app/api/portal/matters/route");

      const request = new NextRequest("http://localhost:3000/api/portal/matters", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.matters).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      // Make orderBy throw to simulate DB error
      mockDb.orderBy.mockRejectedValueOnce(new Error("Database error"));

      const { GET } = await import("@/app/api/portal/matters/route");

      const request = new NextRequest("http://localhost:3000/api/portal/matters", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch matters");
    });
  });
});
