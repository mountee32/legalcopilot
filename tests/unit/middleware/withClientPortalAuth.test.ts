import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the database module
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

// Make where() return this so it can chain properly
mockDb.where.mockReturnValue(mockDb);

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  clientPortalSessions: {
    id: "id",
    token: "token",
    clientId: "clientId",
  },
  clients: {
    id: "id",
  },
  matters: {
    id: "id",
    clientId: "clientId",
  },
  invoices: {
    id: "id",
    clientId: "clientId",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ operator: "and", args })),
  gt: vi.fn((field, value) => ({ field, value, operator: "gt" })),
}));

describe("withClientPortalAuth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should authenticate valid session token", async () => {
      const mockSession = {
        id: "session-123",
        clientId: "client-123",
        firmId: "firm-123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockClient = {
        id: "client-123",
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      const { db } = await import("@/lib/db");
      vi.mocked(db.limit)
        .mockResolvedValueOnce([{ session: mockSession, client: mockClient }])
        .mockResolvedValueOnce(undefined); // For update query

      const { withClientPortalAuth } = await import("@/middleware/withClientPortalAuth");

      const mockHandler = vi.fn(async (req, { portalSession }) => {
        return NextResponse.json({ clientId: portalSession.clientId });
      });

      const wrappedHandler = withClientPortalAuth(mockHandler);

      const request = new NextRequest("http://localhost:3000/api/portal/test", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.clientId).toBe("client-123");
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          portalSession: expect.objectContaining({
            clientId: "client-123",
            firmId: "firm-123",
            sessionId: "session-123",
          }),
        })
      );

      // Should update last activity
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith({
        lastActivityAt: expect.any(Date),
      });
    });

    it("should return 401 if authorization header is missing", async () => {
      const { withClientPortalAuth } = await import("@/middleware/withClientPortalAuth");

      const mockHandler = vi.fn();
      const wrappedHandler = withClientPortalAuth(mockHandler);

      const request = new NextRequest("http://localhost:3000/api/portal/test");

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toContain("Missing or invalid authorization header");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header is malformed", async () => {
      const { withClientPortalAuth } = await import("@/middleware/withClientPortalAuth");

      const mockHandler = vi.fn();
      const wrappedHandler = withClientPortalAuth(mockHandler);

      const request = new NextRequest("http://localhost:3000/api/portal/test", {
        headers: {
          Authorization: "InvalidFormat token123",
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 if session token is invalid", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([]);

      const { withClientPortalAuth } = await import("@/middleware/withClientPortalAuth");

      const mockHandler = vi.fn();
      const wrappedHandler = withClientPortalAuth(mockHandler);

      const request = new NextRequest("http://localhost:3000/api/portal/test", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toBe("Invalid or expired session");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 if session is expired", async () => {
      const mockSession = {
        id: "session-123",
        token: "expired-token",
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([mockSession]);

      const { withClientPortalAuth } = await import("@/middleware/withClientPortalAuth");

      const mockHandler = vi.fn();
      const wrappedHandler = withClientPortalAuth(mockHandler);

      const request = new NextRequest("http://localhost:3000/api/portal/test", {
        headers: {
          Authorization: "Bearer expired-token",
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication failed");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockRejectedValue(new Error("Database error"));

      const { withClientPortalAuth } = await import("@/middleware/withClientPortalAuth");

      const mockHandler = vi.fn();
      const wrappedHandler = withClientPortalAuth(mockHandler);

      const request = new NextRequest("http://localhost:3000/api/portal/test", {
        headers: {
          Authorization: "Bearer some-token",
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication failed");
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("verifyClientMatterAccess", () => {
    it("should return true for valid client-matter access", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([{ id: "matter-123" }]);

      const { verifyClientMatterAccess } = await import("@/middleware/withClientPortalAuth");

      const hasAccess = await verifyClientMatterAccess("client-123", "matter-123");

      expect(hasAccess).toBe(true);
    });

    it("should return false for invalid client-matter access", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([]);

      const { verifyClientMatterAccess } = await import("@/middleware/withClientPortalAuth");

      const hasAccess = await verifyClientMatterAccess("client-123", "matter-456");

      expect(hasAccess).toBe(false);
    });
  });

  describe("verifyClientInvoiceAccess", () => {
    it("should return true for valid client-invoice access", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([{ id: "invoice-123" }]);

      const { verifyClientInvoiceAccess } = await import("@/middleware/withClientPortalAuth");

      const hasAccess = await verifyClientInvoiceAccess("client-123", "invoice-123");

      expect(hasAccess).toBe(true);
    });

    it("should return false for invalid client-invoice access", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([]);

      const { verifyClientInvoiceAccess } = await import("@/middleware/withClientPortalAuth");

      const hasAccess = await verifyClientInvoiceAccess("client-123", "invoice-456");

      expect(hasAccess).toBe(false);
    });
  });
});
