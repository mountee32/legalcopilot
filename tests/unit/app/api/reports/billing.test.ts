import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies (same setup as dashboard tests)
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
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
  invoices: {
    firmId: "firmId",
    status: "status",
    dueDate: "dueDate",
    balanceDue: "balanceDue",
    invoiceDate: "invoiceDate",
    total: "total",
    paidAmount: "paidAmount",
    matterId: "matterId",
  },
  timeEntries: {
    firmId: "firmId",
    status: "status",
    amount: "amount",
    workDate: "workDate",
    isBillable: "isBillable",
    matterId: "matterId",
  },
}));

const mockSql = Object.assign(
  vi.fn((strings, ...values) => ({ strings, values, type: "sql" })),
  {
    identifier: vi.fn((name) => ({ type: "identifier", name })),
  }
);

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ op: "and", args })),
  gte: vi.fn((field, value) => ({ field, value, op: "gte" })),
  lte: vi.fn((field, value) => ({ field, value, op: "lte" })),
  sql: mockSql,
}));

describe("Billing Report API", () => {
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

  describe("GET /api/reports/billing", () => {
    it("should return billing report with WIP, aged debt, and revenue", async () => {
      // Mock WIP breakdown
      mockDb.where.mockResolvedValueOnce([
        {
          draft: "5000.00",
          submitted: "15000.00",
          approved: "15000.00",
          total: "35000.00",
        },
      ]);

      // Mock aged debt
      mockDb.where.mockResolvedValueOnce([
        {
          current: "10000.00",
          days31to60: "5000.00",
          days61to90: "3000.00",
          days90plus: "2000.00",
          total: "20000.00",
        },
      ]);

      // Mock revenue
      mockDb.where.mockResolvedValueOnce([
        {
          total: "125000.00",
          paid: "100000.00",
          outstanding: "25000.00",
        },
      ]);

      const { GET } = await import("@/app/api/reports/billing/route");

      const request = new NextRequest("http://localhost:3000/api/reports/billing");
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        wip: {
          total: "35000.00",
          draft: "5000.00",
          submitted: "15000.00",
          approved: "15000.00",
        },
        agedDebt: {
          current: "10000.00",
          days31to60: "5000.00",
          days61to90: "3000.00",
          days90plus: "2000.00",
          total: "20000.00",
        },
        revenue: {
          total: "125000.00",
          paid: "100000.00",
          outstanding: "25000.00",
        },
      });
    });

    it("should handle practice area filter", async () => {
      mockDb.where.mockResolvedValue([
        { draft: "0.00", submitted: "0.00", approved: "0.00", total: "0.00" },
      ]);

      const { GET } = await import("@/app/api/reports/billing/route");

      const request = new NextRequest(
        "http://localhost:3000/api/reports/billing?practiceArea=conveyancing"
      );
      const response = await GET(request, { user: { user: { id: mockUserId } } } as any);

      expect(response.status).toBe(200);
      expect(mockWithFirmDb).toHaveBeenCalledWith(mockFirmId, expect.any(Function));
    });
  });
});
