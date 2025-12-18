import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  clients: {
    id: "id",
    email: "email",
    firmId: "firmId",
  },
  clientPortalTokens: {
    firmId: "firmId",
    clientId: "clientId",
    token: "token",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ operator: "and", args })),
}));

vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: vi.fn((size) => ({
      toString: () => "a".repeat(size * 2), // Simulate hex encoding (2 chars per byte)
    })),
  };
});

describe("Portal Auth Request API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset NODE_ENV for tests
    process.env.NODE_ENV = "test";
  });

  describe("POST /api/portal/auth/request", () => {
    it("should generate token for valid client email", async () => {
      const mockClient = {
        id: "client-123",
        email: "client@example.com",
        firmId: "firm-123",
        firstName: "John",
        lastName: "Doe",
      };

      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([mockClient]);
      vi.mocked(db.values).mockResolvedValue(undefined);

      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: "client@example.com",
          firmId: "firm-123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("magic link has been sent");
      // In test/dev mode, token should be included
      expect(data.token).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          firmId: "firm-123",
          clientId: "client-123",
          email: "client@example.com",
          status: "pending",
        })
      );
    });

    it("should return success even for non-existent email (security)", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([]);

      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: "nonexistent@example.com",
          firmId: "firm-123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("magic link has been sent");
      // Should not create token for non-existent email
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should return 400 if email is missing", async () => {
      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          firmId: "firm-123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and firmId are required");
    });

    it("should return 400 if firmId is missing", async () => {
      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: "client@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and firmId are required");
    });

    it("should return 400 for invalid email format", async () => {
      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: "invalid-email",
          firmId: "firm-123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid email format");
    });

    it("should normalize email to lowercase", async () => {
      const mockClient = {
        id: "client-123",
        email: "client@example.com",
        firmId: "firm-123",
      };

      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue([mockClient]);
      vi.mocked(db.values).mockResolvedValue(undefined);

      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: "CLIENT@EXAMPLE.COM",
          firmId: "firm-123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "client@example.com",
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockRejectedValue(new Error("Database connection failed"));

      const { POST } = await import("@/app/api/portal/auth/request/route");

      const request = new NextRequest("http://localhost:3000/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: "client@example.com",
          firmId: "firm-123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to process request");
    });
  });
});
