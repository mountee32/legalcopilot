/**
 * Verify Evidence API Tests
 *
 * @see app/api/tasks/[id]/evidence/[evidenceId]/verify/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockFirmId,
  mockWithFirmDbSuccess,
  mockWithFirmDbError,
  createMockContext,
} from "@tests/helpers/mocks";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

// Mock middleware FIRST (before importing route)
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-123" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

// Mock other dependencies
vi.mock("@/lib/db/tenant");
vi.mock("@/lib/tenancy");
vi.mock("@/lib/timeline/createEvent");

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import { POST } from "@/app/api/tasks/[id]/evidence/[evidenceId]/verify/route";

describe("Verify Evidence API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("POST /api/tasks/[id]/evidence/[evidenceId]/verify", () => {
    it("should verify evidence with method and notes", async () => {
      const now = new Date();
      const mockResult = {
        id: "evidence-1",
        taskId: "task-123",
        type: "identity_document",
        description: "Passport",
        documentId: "doc-1",
        documentName: "passport.pdf",
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: "user-123",
        verifiedByName: "Jane Reviewer",
        verifiedAt: now.toISOString(),
        verificationMethod: "manual",
        verificationNotes: "Verified against original document",
        firmId: mockFirmId,
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "manual",
            verificationNotes: "Verified against original document",
          }),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verifiedAt).toBeDefined();
      expect(data.verifiedById).toBe("user-123");
      expect(data.verificationMethod).toBe("manual");
    });

    it("should verify evidence without notes", async () => {
      const now = new Date();
      const mockResult = {
        id: "evidence-1",
        taskId: "task-123",
        type: "identity_document",
        verifiedById: "user-123",
        verifiedAt: now.toISOString(),
        verificationMethod: "integration",
        verificationNotes: null,
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "integration",
          }),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verificationMethod).toBe("integration");
      expect(data.verificationNotes).toBeNull();
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/invalid/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "manual",
          }),
        }
      );
      const context = createMockContext({ id: "invalid", evidenceId: "evidence-1" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 404 when evidence not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Evidence not found"))
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/invalid/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "manual",
          }),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject verifying already verified evidence", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("Evidence is already verified"))
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "manual",
          }),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should require verification method", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should support various verification methods", async () => {
      const now = new Date();
      const mockResult = {
        id: "evidence-1",
        taskId: "task-123",
        type: "financial_statement",
        verifiedById: "user-123",
        verifiedAt: now.toISOString(),
        verificationMethod: "ai",
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "ai",
            verificationNotes: "Confirmed with bank directly",
          }),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verificationMethod).toBe("ai");
    });

    it("should include document name in response", async () => {
      const now = new Date();
      const mockResult = {
        id: "evidence-1",
        taskId: "task-123",
        type: "signed_document",
        documentId: "doc-1",
        documentName: "signed-contract.pdf",
        verifiedById: "user-123",
        verifiedAt: now.toISOString(),
        verificationMethod: "manual",
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationMethod: "manual",
          }),
        }
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documentName).toBe("signed-contract.pdf");
    });
  });
});
