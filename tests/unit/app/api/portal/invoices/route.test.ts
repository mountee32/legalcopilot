import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
      const mockSession = {
        id: "session-123",
        clientId: "client-123",
        firmId: "firm-123",
        token: "valid-session-token",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockClient = {
        id: "client-123",
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
      };

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

      // First call for auth middleware (innerJoin chain)
      vi.mocked(db.limit)
        .mockResolvedValueOnce([{ session: mockSession, client: mockClient }])
        .mockResolvedValueOnce(undefined); // For update query

      // Second call for invoices query
      vi.mocked(db.orderBy).mockResolvedValue(mockInvoices);

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
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

    it("should return 401 without authentication", async () => {
      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty array if client has no invoices", async () => {
      const mockSession = {
        id: "session-123",
        clientId: "client-123",
        firmId: "firm-123",
        token: "valid-session-token",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockClient = {
        id: "client-123",
        email: "client@example.com",
      };

      const { db } = await import("@/lib/db");

      // Reset all mocks first
      vi.mocked(db.limit).mockClear();
      vi.mocked(db.orderBy).mockClear();
      vi.mocked(db.where).mockClear();

      vi.mocked(db.limit).mockResolvedValueOnce([{ session: mockSession, client: mockClient }]);
      vi.mocked(db.where).mockReturnValueOnce(Promise.resolve(undefined) as any);
      vi.mocked(db.orderBy).mockResolvedValue([]);

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoices).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("should include invoices without matter association", async () => {
      const mockSession = {
        id: "session-123",
        clientId: "client-123",
        firmId: "firm-123",
        token: "valid-session-token",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockClient = {
        id: "client-123",
        email: "client@example.com",
      };

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

      vi.mocked(db.limit)
        .mockResolvedValueOnce([{ session: mockSession, client: mockClient }])
        .mockResolvedValueOnce(undefined); // For update query
      vi.mocked(db.orderBy).mockResolvedValue(mockInvoices);

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoices[0].matter).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const mockSession = {
        id: "session-123",
        clientId: "client-123",
        firmId: "firm-123",
        token: "valid-session-token",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockClient = {
        id: "client-123",
        email: "client@example.com",
      };

      const { db } = await import("@/lib/db");

      // Reset all mocks first
      vi.mocked(db.limit).mockClear();
      vi.mocked(db.orderBy).mockClear();
      vi.mocked(db.where).mockClear();

      vi.mocked(db.limit).mockResolvedValueOnce([{ session: mockSession, client: mockClient }]);
      vi.mocked(db.where).mockReturnValueOnce(Promise.resolve(undefined) as any);
      vi.mocked(db.orderBy).mockRejectedValue(new Error("Database error"));

      const { GET } = await import("@/app/api/portal/invoices/route");

      const request = new NextRequest("http://localhost:3000/api/portal/invoices", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-session-token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch invoices");
    });
  });
});
