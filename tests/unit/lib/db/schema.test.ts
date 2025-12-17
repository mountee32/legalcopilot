import { describe, it, expect } from "vitest";
import { z } from "zod";

// Define Zod schemas for validation (matching the Drizzle schema)
const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
  emailVerified: z.boolean().optional().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const SessionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
  token: z.string().min(1),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

const JobSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  data: z.record(z.any()).nullable().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  result: z.record(z.any()).nullable().optional(),
  error: z.string().nullable().optional(),
  attempts: z.string().optional().default("0"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  completedAt: z.date().nullable().optional(),
});

const UploadSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().nullable().optional(),
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.string(),
  bucket: z.string().min(1),
  path: z.string().min(1),
  url: z.string().url(),
  createdAt: z.date().optional(),
});

describe("Database Schema Validation", () => {
  describe("UserSchema", () => {
    it("should validate a valid user object", () => {
      const validUser = {
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidUser = {
        email: "not-an-email",
        name: "Test User",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("should allow nullable name", () => {
      const userWithoutName = {
        email: "test@example.com",
        name: null,
      };

      const result = UserSchema.safeParse(userWithoutName);
      expect(result.success).toBe(true);
    });

    it("should validate image URL if provided", () => {
      const userWithInvalidImage = {
        email: "test@example.com",
        image: "not-a-url",
      };

      const result = UserSchema.safeParse(userWithInvalidImage);
      expect(result.success).toBe(false);
    });

    it("should accept valid image URL", () => {
      const userWithImage = {
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      };

      const result = UserSchema.safeParse(userWithImage);
      expect(result.success).toBe(true);
    });
  });

  describe("SessionSchema", () => {
    it("should validate a valid session object", () => {
      const validSession = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        expiresAt: new Date(Date.now() + 86400000),
        token: "valid-session-token",
      };

      const result = SessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for userId", () => {
      const invalidSession = {
        userId: "not-a-uuid",
        expiresAt: new Date(),
        token: "token",
      };

      const result = SessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
    });

    it("should reject empty token", () => {
      const sessionWithoutToken = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        expiresAt: new Date(),
        token: "",
      };

      const result = SessionSchema.safeParse(sessionWithoutToken);
      expect(result.success).toBe(false);
    });

    it("should allow optional ipAddress and userAgent", () => {
      const sessionWithMetadata = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        expiresAt: new Date(),
        token: "token",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      };

      const result = SessionSchema.safeParse(sessionWithMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe("JobSchema", () => {
    it("should validate a valid job object", () => {
      const validJob = {
        name: "email-job",
        data: { to: "user@example.com", subject: "Test" },
        status: "pending" as const,
      };

      const result = JobSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalidJob = {
        name: "test-job",
        status: "invalid-status",
      };

      const result = JobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });

    it("should accept all valid status values", () => {
      const statuses = ["pending", "processing", "completed", "failed"];

      statuses.forEach((status) => {
        const job = {
          name: "test-job",
          status,
        };

        const result = JobSchema.safeParse(job);
        expect(result.success).toBe(true);
      });
    });

    it("should default status to pending", () => {
      const jobWithoutStatus = {
        name: "test-job",
      };

      const result = JobSchema.parse(jobWithoutStatus);
      expect(result.status).toBe("pending");
    });

    it("should allow nullable error field", () => {
      const completedJob = {
        name: "test-job",
        status: "completed" as const,
        error: null,
      };

      const result = JobSchema.safeParse(completedJob);
      expect(result.success).toBe(true);
    });
  });

  describe("UploadSchema", () => {
    it("should validate a valid upload object", () => {
      const validUpload = {
        filename: "file-123.jpg",
        originalName: "photo.jpg",
        mimeType: "image/jpeg",
        size: "1024000",
        bucket: "uploads",
        path: "uploads/file-123.jpg",
        url: "https://storage.example.com/uploads/file-123.jpg",
      };

      const result = UploadSchema.safeParse(validUpload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid URL", () => {
      const invalidUpload = {
        filename: "file.jpg",
        originalName: "photo.jpg",
        mimeType: "image/jpeg",
        size: "1024",
        bucket: "uploads",
        path: "uploads/file.jpg",
        url: "not-a-valid-url",
      };

      const result = UploadSchema.safeParse(invalidUpload);
      expect(result.success).toBe(false);
    });

    it("should require all required fields", () => {
      const incompleteUpload = {
        filename: "file.jpg",
        // missing other required fields
      };

      const result = UploadSchema.safeParse(incompleteUpload);
      expect(result.success).toBe(false);
    });

    it("should allow nullable userId", () => {
      const uploadWithoutUser = {
        userId: null,
        filename: "file.jpg",
        originalName: "photo.jpg",
        mimeType: "image/jpeg",
        size: "1024",
        bucket: "uploads",
        path: "uploads/file.jpg",
        url: "https://storage.example.com/file.jpg",
      };

      const result = UploadSchema.safeParse(uploadWithoutUser);
      expect(result.success).toBe(true);
    });
  });
});
