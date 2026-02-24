import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the database module
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  clientPortalTokens: {
    id: "id",
    token: "token",
    status: "status",
    expiresAt: "expiresAt",
  },
  clientPortalSessions: {
    id: "id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ operator: "and", args })),
  gt: vi.fn((field, value) => ({ field, value, operator: "gt" })),
}));

vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: vi.fn((size) => ({
      toString: () => "session-token-" + "a".repeat(size * 2 - 14),
    })),
  };
});

describe("Portal Auth Verify API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Re-establish the chain mocks after clearAllMocks
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnValue(mockDb);
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
  });

  describe("POST /api/portal/auth/verify", () => {
    it("should create session for valid token", async () => {
      const mockToken = {
        id: "token-123",
        firmId: "firm-123",
        clientId: "client-123",
        token: "valid-token-abc123",
        email: "client@example.com",
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      };

      const mockSession = {
        id: "session-123",
        firmId: "firm-123",
        clientId: "client-123",
        token: "session-token-abc",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      // SELECT chain: db.select().from().where().limit(1)
      // where() #1 must return mockDb so .limit() is chainable
      // UPDATE chain: await db.update().set().where()
      // where() #2 is terminal and awaited, must resolve
      // INSERT chain: await db.insert().values().returning()
      mockDb.where
        .mockReturnValueOnce(mockDb) // SELECT chain - returns mockDb for .limit()
        .mockResolvedValueOnce(undefined); // UPDATE chain - terminal, awaited

      mockDb.limit.mockResolvedValueOnce([mockToken]);
      mockDb.returning.mockResolvedValueOnce([mockSession]);

      const { POST } = await import("@/app/api/portal/auth/verify/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          token: "valid-token-abc123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionToken).toBeDefined();
      expect(data.clientId).toBe("client-123");
      expect(data.expiresAt).toBeDefined();

      // Should mark token as used
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "used",
          usedAt: expect.any(Date),
        })
      );

      // Should create session
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          firmId: "firm-123",
          clientId: "client-123",
        })
      );
    });

    it("should return 400 if token is missing", async () => {
      const { POST } = await import("@/app/api/portal/auth/verify/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/verify", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Token is required");
    });

    it("should return 401 for invalid token", async () => {
      // Mock limit to return empty array (token not found)
      mockDb.limit.mockResolvedValueOnce([]);

      const { POST } = await import("@/app/api/portal/auth/verify/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          token: "invalid-token",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid or expired token");
    });

    it("should return 401 for expired token", async () => {
      // Expired tokens are filtered by the WHERE clause in the query,
      // so they won't be returned from the database
      mockDb.limit.mockResolvedValueOnce([]);

      const { POST } = await import("@/app/api/portal/auth/verify/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          token: "expired-token",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid or expired token");
    });

    it("should handle database errors gracefully", async () => {
      mockDb.limit.mockRejectedValueOnce(new Error("Database connection failed"));

      const { POST } = await import("@/app/api/portal/auth/verify/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          token: "some-token",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to verify token");
    });
  });
});
