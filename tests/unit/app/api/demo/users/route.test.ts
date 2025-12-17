import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  users: {
    id: "id",
    email: "email",
    name: "name",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

describe("Users API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/demo/users", () => {
    it("should return list of users", async () => {
      // Mock database response
      const mockUsers = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "user1@example.com",
          name: "User One",
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174001",
          email: "user2@example.com",
          name: "User Two",
          createdAt: new Date("2024-01-02"),
        },
      ];

      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockResolvedValue(mockUsers);

      // Import the route handler
      const { GET } = await import("@/app/api/demo/users/route");

      // Call the handler
      const response = await GET();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      // Dates are serialized as strings in JSON response
      expect(data.users).toEqual(
        mockUsers.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))
      );
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.limit).toHaveBeenCalledWith(10);
    });

    it("should handle database errors gracefully", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.limit).mockRejectedValue(new Error("Database connection failed"));

      const { GET } = await import("@/app/api/demo/users/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch users");
    });
  });

  describe("POST /api/demo/users", () => {
    it("should create a new user with valid data", async () => {
      const mockNewUser = {
        id: "323e4567-e89b-12d3-a456-426614174002",
        email: "newuser@example.com",
        name: "New User",
        emailVerified: false,
        createdAt: new Date(),
      };

      const { db } = await import("@/lib/db");
      vi.mocked(db.returning).mockResolvedValue([mockNewUser]);

      const { POST } = await import("@/app/api/demo/users/route");

      const request = new NextRequest("http://localhost:3000/api/demo/users", {
        method: "POST",
        body: JSON.stringify({
          email: "newuser@example.com",
          name: "New User",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Dates are serialized as strings in JSON response
      expect(data.user).toEqual({
        ...mockNewUser,
        createdAt: mockNewUser.createdAt.toISOString(),
      });
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith({
        email: "newuser@example.com",
        name: "New User",
        emailVerified: false,
      });
    });

    it("should create user with null name when name is not provided", async () => {
      const mockNewUser = {
        id: "423e4567-e89b-12d3-a456-426614174003",
        email: "noname@example.com",
        name: null,
        emailVerified: false,
        createdAt: new Date(),
      };

      const { db } = await import("@/lib/db");
      vi.mocked(db.returning).mockResolvedValue([mockNewUser]);

      const { POST } = await import("@/app/api/demo/users/route");

      const request = new NextRequest("http://localhost:3000/api/demo/users", {
        method: "POST",
        body: JSON.stringify({
          email: "noname@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.name).toBeNull();
    });

    it("should return 400 if email is missing", async () => {
      const { POST } = await import("@/app/api/demo/users/route");

      const request = new NextRequest("http://localhost:3000/api/demo/users", {
        method: "POST",
        body: JSON.stringify({
          name: "User Without Email",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email is required");
    });

    it("should handle database errors during creation", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.returning).mockRejectedValue(new Error("Duplicate email"));

      const { POST } = await import("@/app/api/demo/users/route");

      const request = new NextRequest("http://localhost:3000/api/demo/users", {
        method: "POST",
        body: JSON.stringify({
          email: "duplicate@example.com",
          name: "Duplicate User",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create user");
    });
  });

  describe("DELETE /api/demo/users", () => {
    it("should delete user with valid id", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.where).mockResolvedValue(undefined);

      const { DELETE } = await import("@/app/api/demo/users/route");

      const request = new NextRequest(
        "http://localhost:3000/api/demo/users?id=123e4567-e89b-12d3-a456-426614174000",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it("should return 400 if id is missing", async () => {
      const { DELETE } = await import("@/app/api/demo/users/route");

      const request = new NextRequest("http://localhost:3000/api/demo/users", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User ID is required");
    });

    it("should handle database errors during deletion", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.where).mockRejectedValue(new Error("User not found"));

      const { DELETE } = await import("@/app/api/demo/users/route");

      const request = new NextRequest("http://localhost:3000/api/demo/users?id=nonexistent-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete user");
    });
  });
});
