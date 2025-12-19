/**
 * Unit tests for Documents [id] API Route
 *
 * Tests GET, PATCH, DELETE handlers for /api/documents/[id]
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse, NextRequest } from "next/server";
import {
  mockUser,
  mockFirmId,
  mockWithFirmDbSuccess,
  mockWithFirmDbError,
  createMockRequest,
  createMockContext,
} from "@tests/helpers/mocks";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

// Mock middleware and dependencies - MUST be before route imports
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/db/tenant");
vi.mock("@/lib/tenancy");
vi.mock("@/lib/timeline/createEvent");
vi.mock("@/lib/storage/minio");

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import * as timelineModule from "@/lib/timeline/createEvent";
import * as storageModule from "@/lib/storage/minio";
import { GET, PATCH, DELETE } from "@/app/api/documents/[id]/route";

describe("Documents [id] API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
    vi.mocked(timelineModule.createTimelineEvent).mockResolvedValue(undefined);
    vi.mocked(storageModule.deleteFile).mockResolvedValue({ success: true, fileName: "test.pdf" });
  });

  describe("GET /api/documents/[id]", () => {
    it("should return document with all fields including AI metadata", async () => {
      const mockDocument = {
        id: "doc-123",
        firmId: mockFirmId,
        title: "Test Document",
        type: "contract",
        status: "draft",
        filename: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        documentDate: new Date(),
        aiSummary: "This is a test summary",
        aiConfidence: 85,
        aiModel: "gemini-flash",
        aiTokensUsed: 1500,
        analyzedAt: new Date(),
        extractedParties: [{ name: "John Doe", role: "Buyer" }],
        extractedDates: [{ label: "Signing Date", date: "2024-01-15" }],
        extractedText: "Extracted document text",
        createdAt: new Date(),
        updatedAt: new Date(),
        upload: null,
        matter: null,
        createdByUser: null,
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockDocument));

      const request = createMockRequest("GET", "/api/documents/doc-123");
      const context = createMockContext({ id: "doc-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("doc-123");
      expect(data.title).toBe("Test Document");
      expect(data.aiConfidence).toBe(85);
      expect(data.extractedParties).toEqual([{ name: "John Doe", role: "Buyer" }]);
      expect(data.extractedDates).toEqual([{ label: "Signing Date", date: "2024-01-15" }]);
    });

    it("should return 404 when document not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Document not found"))
      );

      const request = createMockRequest("GET", "/api/documents/nonexistent");
      const context = createMockContext({ id: "nonexistent" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 400 when document ID is missing", async () => {
      const request = createMockRequest("GET", "/api/documents/");
      const context = createMockContext({});

      const response = await GET(request, context);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/documents/[id]", () => {
    const baseDocument = {
      id: "doc-123",
      firmId: mockFirmId,
      title: "Updated Title",
      type: "contract",
      status: "draft",
      updatedAt: new Date(),
    };

    it("should update document title successfully", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({ ...baseDocument, title: "New Title" })
      );

      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        title: "New Title",
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("New Title");
    });

    it("should update extractedParties successfully", async () => {
      const parties = [
        { name: "Alice Smith", role: "Seller" },
        { name: "Bob Jones", role: "Buyer" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({ ...baseDocument, extractedParties: parties })
      );

      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        extractedParties: parties,
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.extractedParties).toEqual(parties);
    });

    it("should update extractedDates successfully", async () => {
      const dates = [
        { label: "Start Date", date: "2024-01-01" },
        { label: "End Date", date: "2024-12-31" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({ ...baseDocument, extractedDates: dates })
      );

      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        extractedDates: dates,
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.extractedDates).toEqual(dates);
    });

    it("should update aiSummary successfully", async () => {
      const summary = "This is an updated AI summary";

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({ ...baseDocument, aiSummary: summary })
      );

      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        aiSummary: summary,
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiSummary).toBe(summary);
    });

    it("should return 400 for invalid party format", async () => {
      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        extractedParties: [{ invalidField: "test" }],
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid date format", async () => {
      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        extractedDates: [{ label: 123, date: "invalid" }],
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);

      expect(response.status).toBe(400);
    });

    it("should return 404 when document not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Document not found"))
      );

      const request = createMockRequest("PATCH", "/api/documents/nonexistent", {
        title: "New Title",
      });
      const context = createMockContext({ id: "nonexistent" });

      const response = await PATCH(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 404 when matter not found for assignment", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Matter not found"))
      );

      // Use valid UUID format for matterId to pass schema validation
      const request = createMockRequest("PATCH", "/api/documents/doc-123", {
        matterId: "123e4567-e89b-12d3-a456-426614174000",
      });
      const context = createMockContext({ id: "doc-123" });

      const response = await PATCH(request, context);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/documents/[id]", () => {
    it("should delete document successfully and return 204", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
        // Mock successful deletion
        return undefined;
      });

      const request = createMockRequest("DELETE", "/api/documents/doc-123");
      const context = createMockContext({ id: "doc-123" });

      const response = await DELETE(request, context);

      expect(response.status).toBe(204);
    });

    it("should return 404 when document not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Document not found"))
      );

      const request = createMockRequest("DELETE", "/api/documents/nonexistent");
      const context = createMockContext({ id: "nonexistent" });

      const response = await DELETE(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 400 when document ID is missing", async () => {
      const request = createMockRequest("DELETE", "/api/documents/");
      const context = createMockContext({});

      const response = await DELETE(request, context);

      expect(response.status).toBe(400);
    });

    it("should handle storage deletion failure gracefully", async () => {
      // Mock storage failure but DB success
      vi.mocked(storageModule.deleteFile).mockRejectedValue(new Error("Storage error"));
      vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
        return undefined;
      });

      const request = createMockRequest("DELETE", "/api/documents/doc-123");
      const context = createMockContext({ id: "doc-123" });

      // Should still succeed even if storage fails
      const response = await DELETE(request, context);

      expect(response.status).toBe(204);
    });
  });
});
