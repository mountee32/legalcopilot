import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock withClientPortalAuth middleware to bypass authentication
vi.mock("@/middleware/withClientPortalAuth", () => ({
  withClientPortalAuth: (handler: any) => (request: any, ctx: any) => {
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
  orderBy: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
};

// Make where() return this so it can chain properly
mockDb.where.mockReturnValue(mockDb);

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  invoices: {
    id: "id",
    clientId: "clientId",
  },
  matters: {
    id: "id",
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

describe("Portal Invoices API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/portal/invoices", () => {
    it("should return client's invoices when authenticated", async () => {
      const mockInvoices = [
        {
          invoice: {
            id: "invoice-1",
            invoiceNumber: "INV-2024-001",
            status: "sent",
            invoiceDate: "2024-01-15",
            dueDate: "2024-02-15",
            subtotal: "1000.00",
            vatAmount: "200.00",
            vatRate: "20.00",
            total: "1200.00",
            paidAmount: "0.00",
            balanceDue: "1200.00",
            sentAt: new Date("2024-01-15"),
            viewedAt: null,
            paidAt: null,
            createdAt: new Date("2024-01-15"),
          },
          matter: {
            id: "matter-1",
            reference: "MAT-001",
            title: "Property Purchase",
          },
        },
        {
          invoice: {
            id: "invoice-2",
            invoiceNumber: "INV-2024-002",
            status: "paid",
            invoiceDate: "2024-02-01",
            dueDate: "2024-03-01",
            subtotal: "500.00",
            vatAmount: "100.00",
            vatRate: "20.00",
            total: "600.00",
            paidAmount: "600.00",
            balanceDue: "0.00",
            sentAt: new Date("2024-02-01"),
            viewedAt: new Date("2024-02-02"),
            paidAt: new Date("2024-02-10"),
            createdAt: new Date("2024-02-01"),
          },
          matter: {
            id: "matter-2",
            reference: "MAT-002",
            title: "Will Preparation",
          },
        },
      ];

      const { db } = await import("@/lib/db");

      // Mock the database query to return invoices
      vi.mocked(db.orderBy).mockResolvedValue(mockInvoices);

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.invoices).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.invoices[0].invoice.invoiceNumber).toBe("INV-2024-001");
      expect(data.invoices[0].matter.reference).toBe("MAT-001");
    });

    it("should return empty array if client has no invoices", async () => {
      const { db } = await import("@/lib/db");

      // Mock empty result
      vi.mocked(db.orderBy).mockResolvedValue([]);

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoices).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("should include invoices without matter association", async () => {
      const mockInvoices = [
        {
          invoice: {
            id: "invoice-1",
            invoiceNumber: "INV-2024-001",
            status: "sent",
            total: "1200.00",
          },
          matter: null, // No associated matter
        },
      ];

      const { db } = await import("@/lib/db");

      vi.mocked(db.orderBy).mockResolvedValue(mockInvoices);

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoices[0].matter).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.orderBy).mockRejectedValue(new Error("Database error"));

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch invoices");
    });
  });
});
