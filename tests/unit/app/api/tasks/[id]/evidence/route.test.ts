/**
 * Task Evidence API Tests
 *
 * @see app/api/tasks/[id]/evidence/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockUser,
  mockFirmId,
  mockWithFirmDbSuccess,
  mockWithFirmDbError,
  createMockContext,
} from "@tests/helpers/mocks";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

// Test UUIDs
const userId = "a0000000-0000-4000-a000-000000000001";
const docId = "b0000000-0000-4000-a000-000000000001";
const invalidDocId = "c0000000-0000-4000-a000-000000000001";

// Mock middleware FIRST (before importing route)
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "a0000000-0000-4000-a000-000000000001" } } }),
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
import { GET, POST } from "@/app/api/tasks/[id]/evidence/route";

describe("Task Evidence API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("GET /api/tasks/[id]/evidence", () => {
    it("should return evidence items for a task", async () => {
      const mockEvidence = [
        {
          id: "evidence-1",
          taskId: "task-123",
          type: "id_document",
          description: "Passport",
          documentId: docId,
          documentName: "passport.pdf",
          addedById: "user-123",
          addedByName: "Test User",
          addedAt: new Date().toISOString(),
          verifiedById: null,
          verifiedAt: null,
          verificationMethod: null,
          verificationNotes: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({
          evidence: mockEvidence,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence");
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.evidence).toHaveLength(1);
      expect(data.evidence[0].type).toBe("id_document");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/evidence");
      const context = createMockContext({ id: "invalid" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should filter by type when specified", async () => {
      const mockEvidence = [
        {
          id: "evidence-1",
          taskId: "task-123",
          type: "id_document",
          description: "Passport",
          documentId: docId,
          addedById: "user-123",
          addedAt: new Date().toISOString(),
          verifiedAt: null,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({
          evidence: mockEvidence,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence?type=id_document"
      );
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.evidence).toHaveLength(1);
      expect(data.evidence[0].type).toBe("id_document");
    });

    it("should filter by verified status", async () => {
      const mockEvidence = [
        {
          id: "evidence-1",
          taskId: "task-123",
          type: "id_document",
          verifiedAt: new Date().toISOString(),
          verifiedById: "user-456",
        },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({
          evidence: mockEvidence,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/evidence?verified=true"
      );
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.evidence).toHaveLength(1);
      expect(data.evidence[0].verifiedAt).toBeDefined();
    });
  });

  describe("POST /api/tasks/[id]/evidence", () => {
    it("should add evidence to task", async () => {
      const mockEvidence = {
        id: "evidence-new",
        taskId: "task-123",
        type: "id_document",
        description: "Client passport",
        documentId: docId,
        documentName: "passport.pdf",
        addedById: "user-123",
        addedByName: "Test User",
        addedAt: new Date().toISOString(),
        verifiedById: null,
        verifiedAt: null,
        verifiedByName: null,
        metadata: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "id_document",
          description: "Client passport",
          documentId: docId,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.type).toBe("id_document");
      expect(data.description).toBe("Client passport");
    });

    it("should reject invalid type", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invalid_type",
          description: "Test",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should link document correctly", async () => {
      const mockEvidence = {
        id: "evidence-new",
        taskId: "task-123",
        type: "contract",
        description: "Signed contract",
        documentId: docId,
        documentName: "contract.pdf",
        addedById: "user-123",
        addedByName: "Test User",
        addedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contract",
          description: "Signed contract",
          documentId: docId,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.documentId).toBe(docId);
      expect(data.documentName).toBe("contract.pdf");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "id_document",
          description: "Test",
        }),
      });
      const context = createMockContext({ id: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject invalid document ID", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("Invalid document ID"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contract",
          description: "Test",
          documentId: invalidDocId,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should create evidence without document", async () => {
      const mockEvidence = {
        id: "evidence-new",
        taskId: "task-123",
        type: "other",
        description: "Client confirmed via phone",
        documentId: null,
        documentName: null,
        addedById: "user-123",
        addedByName: "Test User",
        addedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "other",
          description: "Client confirmed via phone",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.documentId).toBeNull();
      expect(data.type).toBe("other");
    });

    it("should accept metadata", async () => {
      const mockEvidence = {
        id: "evidence-new",
        taskId: "task-123",
        type: "id_document",
        description: "Passport",
        documentId: null,
        metadata: {
          documentNumber: "ABC123",
          expiryDate: "2025-12-31",
        },
        addedById: "user-123",
        addedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockEvidence));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "id_document",
          description: "Passport",
          metadata: {
            documentNumber: "ABC123",
            expiryDate: "2025-12-31",
          },
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.metadata).toEqual({
        documentNumber: "ABC123",
        expiryDate: "2025-12-31",
      });
    });
  });
});
