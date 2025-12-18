import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  transaction: vi.fn(),
  execute: vi.fn(),
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
  matters: { firmId: "firmId", status: "status" },
  invoices: {
    firmId: "firmId",
    status: "status",
    invoiceDate: "invoiceDate",
    paidAmount: "paidAmount",
    balanceDue: "balanceDue",
  },
  timeEntries: {
    firmId: "firmId",
    status: "status",
    workDate: "workDate",
    amount: "amount",
    isBillable: "isBillable",
  },
  tasks: { firmId: "firmId", status: "status", dueDate: "dueDate" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ op: "and", args })),
  gte: vi.fn((field, value) => ({ field, value, op: "gte" })),
  lte: vi.fn((field, value) => ({ field, value, op: "lte" })),
  lt: vi.fn((field, value) => ({ field, value, op: "lt" })),
  sql: vi.fn((strings, ...values) => ({ strings, values, type: "sql" })),
  desc: vi.fn((field) => ({ field, direction: "desc" })),
}));

describe("Dashboard Report API", () => {
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

  describe("GET /api/reports/dashboard", () => {
    it("should return dashboard KPIs", async () => {
      // Mock database responses
      mockDb.where.mockResolvedValueOnce([{ count: 42 }]); // Active matters
      mockDb.where.mockResolvedValueOnce([{ total: "125000.00" }]); // Revenue
      mockDb.where.mockResolvedValueOnce([{ total: "35000.00" }]); // WIP
      mockDb.where.mockResolvedValueOnce([{ count: 18 }]); // Pending tasks
      mockDb.where.mockResolvedValueOnce([{ count: 3 }]); // Overdue tasks
      mockDb.where.mockResolvedValueOnce([{ count: 12 }]); // Outstanding invoices
      mockDb.where.mockResolvedValueOnce([{ total: "15000.00" }]); // Overdue debt

      const { GET } = await import("@/app/api/reports/dashboard/route");

      const request = new NextRequest("http://localhost:3000/api/reports/dashboard");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        activeMatters: 42,
        totalRevenue: "125000.00",
        totalWip: "35000.00",
        pendingTasks: 18,
        overdueTasks: 3,
        outstandingInvoices: 12,
        overdueDebt: "15000.00",
      });
    });

    it("should handle date range filters", async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 10 }]);
      mockDb.where.mockResolvedValueOnce([{ total: "50000.00" }]);
      mockDb.where.mockResolvedValueOnce([{ total: "10000.00" }]);
      mockDb.where.mockResolvedValueOnce([{ count: 5 }]);
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.where.mockResolvedValueOnce([{ count: 3 }]);
      mockDb.where.mockResolvedValueOnce([{ total: "5000.00" }]);

      const { GET } = await import("@/app/api/reports/dashboard/route");

      const request = new NextRequest(
        "http://localhost:3000/api/reports/dashboard?from=2024-01-01&to=2024-12-31"
      );
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);

      expect(response.status).toBe(200);
      expect(mockWithFirmDb).toHaveBeenCalledWith(mockFirmId, expect.any(Function));
    });

    it("should handle empty results", async () => {
      mockDb.where.mockResolvedValue([{ count: 0 }]);
      mockDb.where.mockResolvedValue([{ total: "0.00" }]);

      const { GET } = await import("@/app/api/reports/dashboard/route");

      const request = new NextRequest("http://localhost:3000/api/reports/dashboard");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activeMatters).toBe(0);
    });
  });
});
