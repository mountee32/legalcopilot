/**
 * Task Notes API Tests
 *
 * @see app/api/tasks/[id]/notes/route.ts
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
import { GET, POST } from "@/app/api/tasks/[id]/notes/route";

describe("Task Notes API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("GET /api/tasks/[id]/notes", () => {
    it("should return notes for a task", async () => {
      const mockNotes = [
        {
          id: "note-1",
          taskId: "task-123",
          content: "Test note content",
          visibility: "internal",
          authorId: "user-123",
          authorName: "Test User",
          originalNoteId: null,
          version: 1,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({
          notes: mockNotes,
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

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes");
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notes).toHaveLength(1);
      expect(data.notes[0].content).toBe("Test note content");
      expect(data.pagination.total).toBe(1);
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/notes");
      const context = createMockContext({ id: "invalid" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should filter by visibility when specified", async () => {
      const mockNotes = [
        {
          id: "note-1",
          taskId: "task-123",
          content: "Internal note",
          visibility: "internal",
          authorId: "user-123",
          authorName: "Test User",
          version: 1,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({
          notes: mockNotes,
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
        "http://localhost:3000/api/tasks/task-123/notes?visibility=internal"
      );
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notes).toHaveLength(1);
      expect(data.notes[0].visibility).toBe("internal");
    });

    it("should include history when requested", async () => {
      const mockNotes = [
        {
          id: "note-1",
          taskId: "task-123",
          content: "Updated content",
          visibility: "internal",
          authorId: "user-123",
          version: 2,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "note-1-v1",
          taskId: "task-123",
          content: "Original content",
          visibility: "internal",
          authorId: "user-123",
          version: 1,
          isCurrent: false,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbSuccess({
          notes: mockNotes,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/notes?includeHistory=true"
      );
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notes).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });
  });

  describe("POST /api/tasks/[id]/notes", () => {
    it("should create a note with valid data", async () => {
      const mockNote = {
        id: "note-new",
        taskId: "task-123",
        content: "New note content",
        visibility: "internal",
        authorId: "user-123",
        version: 1,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockNote));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "New note content",
          visibility: "internal",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.content).toBe("New note content");
      expect(data.visibility).toBe("internal");
    });

    it("should reject empty content", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          visibility: "internal",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Test content",
          visibility: "internal",
        }),
      });
      const context = createMockContext({ id: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should create note with attachments", async () => {
      const docId = "d0000000-0000-4000-a000-000000000001";
      const mockNote = {
        id: "note-new",
        taskId: "task-123",
        content: "Note with attachments",
        visibility: "internal",
        authorId: "user-123",
        version: 1,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [
          {
            id: "attach-1",
            noteId: "note-new",
            documentId: docId,
            documentName: "document.pdf",
            createdAt: new Date().toISOString(),
          },
        ],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockNote));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Note with attachments",
          visibility: "internal",
          attachmentIds: [docId],
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.attachments).toHaveLength(1);
    });

    it("should reject invalid attachment document IDs", async () => {
      const invalidDocId = "f0000000-0000-4000-a000-000000000001";
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError(`Invalid document IDs: ${invalidDocId}`))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Note with invalid attachments",
          visibility: "internal",
          attachmentIds: [invalidDocId],
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should default visibility to internal", async () => {
      const mockNote = {
        id: "note-new",
        taskId: "task-123",
        content: "Note without visibility",
        visibility: "internal",
        authorId: "user-123",
        version: 1,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockNote));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Note without visibility specified",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.visibility).toBe("internal");
    });

    it("should support client_visible visibility", async () => {
      const mockNote = {
        id: "note-new",
        taskId: "task-123",
        content: "Client visible note",
        visibility: "client_visible",
        authorId: "user-123",
        version: 1,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockNote));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Client visible note",
          visibility: "client_visible",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.visibility).toBe("client_visible");
    });
  });
});
