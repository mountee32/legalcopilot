/**
 * Evidence Detail API Tests
 *
 * @see app/api/tasks/[id]/evidence/[evidenceId]/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockFirmId,
  mockWithFirmDbSuccess,
  mockWithFirmDbError,
  createMockContext,
} from "@tests/helpers/mocks";
import { NotFoundError } from "@/middleware/withErrorHandler";

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

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import { GET } from "@/app/api/tasks/[id]/evidence/[evidenceId]/route";

describe("Evidence Detail API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("GET /api/tasks/[id]/evidence/[evidenceId]", () => {
    it("should return evidence item with full details", async () => {
      const now = new Date();
      const mockEvidence = {
        id: "evidence-1",
        taskId: "task-123",
        type: "identity_document",
        description: "Client passport",
        documentId: "doc-1",
        documentName: "passport.pdf",
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: null,
        verifiedByName: null,
        verifiedAt: null,
        verificationMethod: null,
        verificationNotes: null,
        metadata: null,
        createdAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1"
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("evidence-1");
      expect(data.type).toBe("identity_document");
      expect(data.documentName).toBe("passport.pdf");
      expect(data.addedByName).toBe("John Doe");
    });

    it("should return verified evidence with verifier details", async () => {
      const now = new Date();
      const mockEvidence = {
        id: "evidence-1",
        taskId: "task-123",
        type: "signed_document",
        description: "Signed contract",
        documentId: "doc-1",
        documentName: "contract-signed.pdf",
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: "user-789",
        verifiedByName: "Jane Reviewer",
        verifiedAt: now.toISOString(),
        verificationMethod: "manual",
        verificationNotes: "Verified signature against records",
        metadata: null,
        createdAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1"
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verifiedById).toBe("user-789");
      expect(data.verifiedByName).toBe("Jane Reviewer");
      expect(data.verificationMethod).toBe("manual");
      expect(data.verificationNotes).toBe("Verified signature against records");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/invalid/evidence/evidence-1"
      );
      const context = createMockContext({ id: "invalid", evidenceId: "evidence-1" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 404 when evidence not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Evidence not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence/invalid");
      const context = createMockContext({ id: "task-123", evidenceId: "invalid" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should return evidence with metadata", async () => {
      const now = new Date();
      const mockEvidence = {
        id: "evidence-1",
        taskId: "task-123",
        type: "identity_document",
        description: "Driver's license",
        documentId: "doc-1",
        documentName: "license.pdf",
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: null,
        verifiedByName: null,
        verifiedAt: null,
        verificationMethod: null,
        verificationNotes: null,
        metadata: {
          documentNumber: "DL-12345",
          issueDate: "2020-01-15",
          expiryDate: "2030-01-15",
          issuingAuthority: "DVLA",
        },
        createdAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1"
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toEqual({
        documentNumber: "DL-12345",
        issueDate: "2020-01-15",
        expiryDate: "2030-01-15",
        issuingAuthority: "DVLA",
      });
    });

    it("should return evidence without document", async () => {
      const now = new Date();
      const mockEvidence = {
        id: "evidence-1",
        taskId: "task-123",
        type: "verbal_confirmation",
        description: "Client confirmed by phone",
        documentId: null,
        documentName: null,
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: null,
        verifiedByName: null,
        verifiedAt: null,
        verificationMethod: null,
        verificationNotes: null,
        metadata: null,
        createdAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1"
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe("verbal_confirmation");
      expect(data.documentId).toBeNull();
      expect(data.documentName).toBeNull();
    });

    it("should return evidence with AI verification", async () => {
      const now = new Date();
      const mockEvidence = {
        id: "evidence-1",
        taskId: "task-123",
        type: "financial_statement",
        description: "Bank statement Q4 2024",
        documentId: "doc-1",
        documentName: "bank-statement.pdf",
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: "user-789",
        verifiedByName: "System AI",
        verifiedAt: now.toISOString(),
        verificationMethod: "ai",
        verificationNotes: "Document verified via automated analysis",
        metadata: null,
        createdAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1"
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verificationMethod).toBe("ai");
    });

    it("should return evidence with integration verification", async () => {
      const now = new Date();
      const mockEvidence = {
        id: "evidence-1",
        taskId: "task-123",
        type: "identity_document",
        description: "Passport verified via ID service",
        documentId: "doc-1",
        documentName: "passport.pdf",
        addedById: "user-456",
        addedByName: "John Doe",
        addedAt: now.toISOString(),
        verifiedById: "user-789",
        verifiedByName: "External Integration",
        verifiedAt: now.toISOString(),
        verificationMethod: "integration",
        verificationNotes: "Verified via Onfido integration",
        metadata: {
          integrationRef: "onfido-check-12345",
        },
        createdAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence/evidence-1"
      );
      const context = createMockContext({ id: "task-123", evidenceId: "evidence-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verificationMethod).toBe("integration");
      expect(data.metadata.integrationRef).toBe("onfido-check-12345");
    });
  });
});
