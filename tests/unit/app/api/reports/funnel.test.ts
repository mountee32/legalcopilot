import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  groupBy: vi.fn(),
  transaction: vi.fn(),
};

const mockWithFirmDb = vi.fn();
const mockGetOrCreateFirmIdForUser = vi.fn();
const mockAuth = {
  api: {
    getSession: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/db/tenant", () => ({ withFirmDb: mockWithFirmDb }));
vi.mock("@/lib/tenancy", () => ({ getOrCreateFirmIdForUser: mockGetOrCreateFirmIdForUser }));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/auth/rbac", () => ({
  getUserPermissions: vi.fn().mockResolvedValue(["reports:view"]),
  hasPermission: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/db/schema", () => ({
  leads: {
    firmId: "firmId",
    status: "status",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    enquiryType: "enquiryType",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ op: "and", args })),
  gte: vi.fn((field, value) => ({ field, value, op: "gte" })),
  lte: vi.fn((field, value) => ({ field, value, op: "lte" })),
  sql: vi.fn((strings, ...values) => ({ strings, values, type: "sql" })),
}));

describe("Funnel Report API", () => {
  const mockFirmId = "firm-123";
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateFirmIdForUser.mockResolvedValue(mockFirmId);
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: mockUserId, email: "test@example.com" },
    });
    mockWithFirmDb.mockImplementation(async (firmId, callback) => {
      return callback(mockDb);
    });
  });

  describe("GET /api/reports/funnel", () => {
    it("should return funnel metrics", async () => {
      // Mock status counts (groupBy returns promise)
      mockDb.where.mockReturnValueOnce({
        groupBy: vi.fn().mockResolvedValueOnce([
          { status: "new", count: 30 },
          { status: "contacted", count: 25 },
          { status: "qualified", count: 20 },
          { status: "won", count: 15 },
          { status: "lost", count: 10 },
        ]),
      });

      // Mock total count
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);

      // Mock won count
      mockDb.where.mockResolvedValueOnce([{ count: 15 }]);

      // Mock lost count
      mockDb.where.mockResolvedValueOnce([{ count: 10 }]);

      // Mock avg time to convert
      mockDb.where.mockResolvedValueOnce([{ avgDays: 14.5 }]);

      const { GET } = await import("@/app/api/reports/funnel/route");

      const request = new NextRequest("http://localhost:3000/api/reports/funnel");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        totalLeads: 100,
        wonLeads: 15,
        lostLeads: 10,
        conversionRate: 0.15,
        avgTimeToConvert: 14.5,
      });
      expect(data.byStatus).toHaveLength(5);
      expect(data.byStatus[0]).toMatchObject({
        status: "new",
        count: 30,
        percentage: 30,
      });
    });

    it("should handle zero leads", async () => {
      mockDb.where.mockReturnValueOnce({
        groupBy: vi.fn().mockResolvedValueOnce([]),
      });
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.where.mockResolvedValueOnce([{ avgDays: 0 }]);

      const { GET } = await import("@/app/api/reports/funnel/route");

      const request = new NextRequest("http://localhost:3000/api/reports/funnel");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalLeads).toBe(0);
      expect(data.conversionRate).toBe(0);
    });
  });
});
