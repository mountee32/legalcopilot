import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
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
  matters: {
    firmId: "firmId",
    status: "status",
    practiceArea: "practiceArea",
    createdAt: "createdAt",
    id: "id",
  },
  invoices: { matterId: "matterId", paidAmount: "paidAmount", id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ op: "and", args })),
  gte: vi.fn((field, value) => ({ field, value, op: "gte" })),
  lte: vi.fn((field, value) => ({ field, value, op: "lte" })),
  sql: vi.fn((strings, ...values) => ({ strings, values, type: "sql" })),
}));

describe("Matter Summary Report API", () => {
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

  describe("GET /api/reports/matters", () => {
    it("should return matter summary with status and practice area breakdowns", async () => {
      // Mock total count
      mockDb.where.mockResolvedValueOnce([{ count: 150 }]);

      // Mock status breakdown
      mockDb.groupBy.mockResolvedValueOnce([
        { status: "active", count: 75 },
        { status: "lead", count: 30 },
        { status: "on_hold", count: 20 },
        { status: "closed", count: 20 },
        { status: "archived", count: 5 },
      ]);

      // Mock practice area breakdown
      mockDb.groupBy.mockResolvedValueOnce([
        { practiceArea: "conveyancing", count: 50, revenue: "50000.00" },
        { practiceArea: "litigation", count: 40, revenue: "75000.00" },
        { practiceArea: "family", count: 30, revenue: "35000.00" },
        { practiceArea: "probate", count: 20, revenue: "20000.00" },
        { practiceArea: "employment", count: 10, revenue: "15000.00" },
      ]);

      const { GET } = await import("@/app/api/reports/matters/route");

      const request = new NextRequest("http://localhost:3000/api/reports/matters");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBe(150);
      expect(data.byStatus).toHaveLength(5);
      expect(data.byStatus[0]).toMatchObject({
        status: "active",
        count: 75,
        percentage: 50,
      });

      expect(data.byPracticeArea).toHaveLength(5);
      expect(data.byPracticeArea[0]).toMatchObject({
        practiceArea: "conveyancing",
        count: 50,
        percentage: expect.closeTo(33.33, 1),
        revenue: "50000.00",
      });
    });

    it("should handle practice area filter", async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 50 }]);
      mockDb.groupBy.mockResolvedValueOnce([{ status: "active", count: 40 }]);
      mockDb.groupBy.mockResolvedValueOnce([
        { practiceArea: "conveyancing", count: 50, revenue: "50000.00" },
      ]);

      const { GET } = await import("@/app/api/reports/matters/route");

      const request = new NextRequest(
        "http://localhost:3000/api/reports/matters?practiceArea=conveyancing"
      );
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);

      expect(response.status).toBe(200);
      expect(mockWithFirmDb).toHaveBeenCalledWith(mockFirmId, expect.any(Function));
    });

    it("should handle no matters", async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.groupBy.mockResolvedValueOnce([]);
      mockDb.groupBy.mockResolvedValueOnce([]);

      const { GET } = await import("@/app/api/reports/matters/route");

      const request = new NextRequest("http://localhost:3000/api/reports/matters");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBe(0);
      expect(data.byStatus).toHaveLength(0);
      expect(data.byPracticeArea).toHaveLength(0);
    });
  });
});
