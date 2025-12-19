/**
 * Task Note Detail API Tests
 *
 * @see app/api/tasks/[id]/notes/[noteId]/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockFirmId,
  mockWithFirmDbSuccess,
  mockWithFirmDbError,
  createMockContext,
} from "@tests/helpers/mocks";
import { NotFoundError, ForbiddenError } from "@/middleware/withErrorHandler";

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
import { GET, PUT } from "@/app/api/tasks/[id]/notes/[noteId]/route";

describe("Task Note Detail API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("GET /api/tasks/[id]/notes/[noteId]", () => {
    it("should return note with history", async () => {
      const mockResult = {
        id: "note-1",
        taskId: "task-123",
        content: "Test note content",
        visibility: "internal",
        authorId: "user-123",
        authorName: "John Doe",
        originalNoteId: null,
        version: 1,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [],
        history: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1");
      const context = createMockContext({ id: "task-123", noteId: "note-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("note-1");
      expect(data.content).toBe("Test note content");
      expect(data.history).toHaveLength(0);
    });

    it("should return note with version history", async () => {
      const mockResult = {
        id: "note-1-v2",
        taskId: "task-123",
        content: "Updated content",
        visibility: "internal",
        authorId: "user-123",
        authorName: "John Doe",
        originalNoteId: "note-1",
        version: 2,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [],
        history: [
          {
            id: "note-1",
            taskId: "task-123",
            content: "Original content",
            visibility: "internal",
            authorId: "user-123",
            authorName: "John Doe",
            originalNoteId: null,
            version: 1,
            isCurrent: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1-v2");
      const context = createMockContext({ id: "task-123", noteId: "note-1-v2" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe(2);
      expect(data.history).toHaveLength(1);
      expect(data.history[0].version).toBe(1);
    });

    it("should return note with attachments", async () => {
      const mockResult = {
        id: "note-1",
        taskId: "task-123",
        content: "Note with attachment",
        visibility: "internal",
        authorId: "user-123",
        authorName: "John Doe",
        version: 1,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        attachments: [
          {
            id: "attach-1",
            noteId: "note-1",
            documentId: "doc-1",
            documentName: "report.pdf",
            createdAt: new Date().toISOString(),
          },
        ],
        history: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1");
      const context = createMockContext({ id: "task-123", noteId: "note-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.attachments).toHaveLength(1);
      expect(data.attachments[0].documentName).toBe("report.pdf");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/notes/note-1");
      const context = createMockContext({ id: "invalid", noteId: "note-1" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 404 when note not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Note not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/invalid");
      const context = createMockContext({ id: "task-123", noteId: "invalid" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/tasks/[id]/notes/[noteId]", () => {
    it("should update note and create new version", async () => {
      const mockResult = {
        id: "note-1-v2",
        taskId: "task-123",
        content: "Updated content",
        visibility: "internal",
        authorId: "user-123",
        authorName: "John Doe",
        originalNoteId: "note-1",
        version: 2,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        previousVersion: {
          id: "note-1",
          version: 1,
        },
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Updated content",
        }),
      });
      const context = createMockContext({ id: "task-123", noteId: "note-1" });

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe("Updated content");
      expect(data.version).toBe(2);
      expect(data.previousVersion.version).toBe(1);
    });

    it("should update visibility", async () => {
      const mockResult = {
        id: "note-1-v2",
        taskId: "task-123",
        content: "Updated content",
        visibility: "client_visible",
        authorId: "user-123",
        authorName: "John Doe",
        version: 2,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        previousVersion: {
          id: "note-1",
          version: 1,
        },
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Updated content",
          visibility: "client_visible",
        }),
      });
      const context = createMockContext({ id: "task-123", noteId: "note-1" });

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.visibility).toBe("client_visible");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/notes/note-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Updated content",
        }),
      });
      const context = createMockContext({ id: "invalid", noteId: "note-1" });

      const response = await PUT(request, context);

      expect(response.status).toBe(404);
    });

    it("should return 404 when note not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Note not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/invalid", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Updated content",
        }),
      });
      const context = createMockContext({ id: "task-123", noteId: "invalid" });

      const response = await PUT(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject editing historical version", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ForbiddenError("Cannot edit a historical version of a note"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1-old", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Try to update old version",
        }),
      });
      const context = createMockContext({ id: "task-123", noteId: "note-1-old" });

      const response = await PUT(request, context);

      expect(response.status).toBe(403);
    });

    it("should require content", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/notes/note-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123", noteId: "note-1" });

      const response = await PUT(request, context);

      expect(response.status).toBe(400);
    });
  });
});
