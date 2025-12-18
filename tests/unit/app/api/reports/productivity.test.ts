import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
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
  timeEntries: {
    firmId: "firmId",
    feeEarnerId: "feeEarnerId",
    workDate: "workDate",
    durationMinutes: "durationMinutes",
    isBillable: "isBillable",
    amount: "amount",
    matterId: "matterId",
  },
  users: { id: "id", name: "name" },
  matters: {
    firmId: "firmId",
    feeEarnerId: "feeEarnerId",
    status: "status",
    id: "id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ op: "and", args })),
  gte: vi.fn((field, value) => ({ field, value, op: "gte" })),
  lte: vi.fn((field, value) => ({ field, value, op: "lte" })),
  sql: vi.fn((strings, ...values) => ({ strings, values, type: "sql" })),
}));

describe("Productivity Report API", () => {
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

  describe("GET /api/reports/productivity", () => {
    it("should return productivity metrics by fee earner", async () => {
      // Mock fee earner stats
      mockDb.groupBy.mockResolvedValueOnce([
        {
          feeEarnerId: "123e4567-e89b-12d3-a456-426614174001",
          feeEarnerName: "Jane Smith",
          totalMinutes: 9630, // 160.5 hours
          billableMinutes: 8700, // 145 hours
          nonBillableMinutes: 930, // 15.5 hours
          revenue: "25000.00",
        },
        {
          feeEarnerId: "223e4567-e89b-12d3-a456-426614174002",
          feeEarnerName: "John Doe",
          totalMinutes: 8400, // 140 hours
          billableMinutes: 7800, // 130 hours
          nonBillableMinutes: 600, // 10 hours
          revenue: "22000.00",
        },
      ]);

      // Mock matter counts
      mockDb.groupBy.mockResolvedValueOnce([
        { feeEarnerId: "123e4567-e89b-12d3-a456-426614174001", count: 12 },
        { feeEarnerId: "223e4567-e89b-12d3-a456-426614174002", count: 8 },
      ]);

      const { GET } = await import("@/app/api/reports/productivity/route");

      const request = new NextRequest("http://localhost:3000/api/reports/productivity");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feeEarners).toHaveLength(2);
      expect(data.feeEarners[0]).toMatchObject({
        feeEarnerId: "123e4567-e89b-12d3-a456-426614174001",
        feeEarnerName: "Jane Smith",
        totalHours: 160.5,
        billableHours: 145.0,
        nonBillableHours: 15.5,
        revenue: "25000.00",
        activeMatters: 12,
      });
      expect(data.feeEarners[0].utilisation).toBeCloseTo(0.903, 2);

      expect(data.summary).toMatchObject({
        totalHours: 300.5,
        totalBillableHours: 275.0,
      });
      expect(data.summary.totalRevenue).toBe("47000.00");
    });

    it("should filter by specific fee earner", async () => {
      const feeEarnerId = "123e4567-e89b-12d3-a456-426614174001";
      mockDb.groupBy.mockResolvedValueOnce([
        {
          feeEarnerId,
          feeEarnerName: "Jane Smith",
          totalMinutes: 9630,
          billableMinutes: 8700,
          nonBillableMinutes: 930,
          revenue: "25000.00",
        },
      ]);

      mockDb.groupBy.mockResolvedValueOnce([{ feeEarnerId, count: 12 }]);

      const { GET } = await import("@/app/api/reports/productivity/route");

      const request = new NextRequest(
        `http://localhost:3000/api/reports/productivity?feeEarnerId=${feeEarnerId}`
      );
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feeEarners).toHaveLength(1);
      expect(mockWithFirmDb).toHaveBeenCalledWith(mockFirmId, expect.any(Function));
    });

    it("should handle no fee earner data", async () => {
      mockDb.groupBy.mockResolvedValueOnce([]);
      mockDb.groupBy.mockResolvedValueOnce([]);

      const { GET } = await import("@/app/api/reports/productivity/route");

      const request = new NextRequest("http://localhost:3000/api/reports/productivity");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feeEarners).toHaveLength(0);
      expect(data.summary.totalHours).toBe(0);
    });
  });
});
