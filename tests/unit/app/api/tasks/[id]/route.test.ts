/**
 * Task Detail API Tests
 *
 * @see app/api/tasks/[id]/route.ts
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
import { GET, PATCH } from "@/app/api/tasks/[id]/route";

describe("Task Detail API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("GET /api/tasks/[id]", () => {
    it("should return task with notes and evidence counts", async () => {
      const mockTask = {
        id: "task-123",
        matterId: "matter-1",
        title: "Review contract",
        description: "Review and annotate client contract",
        status: "in_progress",
        priority: "high",
        assigneeId: "user-456",
        dueDate: new Date().toISOString(),
        isMandatory: true,
        requiresEvidence: true,
        requiresApproval: false,
        firmId: mockFirmId,
        notesCount: 3,
        evidenceCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123");
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("task-123");
      expect(data.notesCount).toBe(3);
      expect(data.evidenceCount).toBe(2);
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(async () => null);

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid");
      const context = createMockContext({ id: "invalid" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should return task with all fields", async () => {
      const now = new Date();
      const mockTask = {
        id: "task-123",
        matterId: "matter-1",
        title: "Complete AML checks",
        description: "Perform anti-money laundering verification",
        status: "pending",
        priority: "urgent",
        assigneeId: "user-456",
        dueDate: now.toISOString(),
        isMandatory: true,
        requiresEvidence: true,
        requiresApproval: true,
        templateId: "template-1",
        stageId: "stage-1",
        sortOrder: 1,
        checklistItems: ["Item 1", "Item 2"],
        tags: ["aml", "compliance"],
        firmId: mockFirmId,
        notesCount: 0,
        evidenceCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123");
      const context = createMockContext({ id: "task-123" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Complete AML checks");
      expect(data.priority).toBe("urgent");
      expect(data.isMandatory).toBe(true);
      expect(data.requiresEvidence).toBe(true);
      expect(data.requiresApproval).toBe(true);
      expect(data.checklistItems).toEqual(["Item 1", "Item 2"]);
      expect(data.tags).toEqual(["aml", "compliance"]);
    });
  });

  describe("PATCH /api/tasks/[id]", () => {
    it("should update task title and description", async () => {
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Updated title",
        description: "Updated description",
        status: "in_progress",
        priority: "high",
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated title",
          description: "Updated description",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Updated title");
      expect(data.description).toBe("Updated description");
    });

    it("should update task status", async () => {
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        status: "completed",
        completedAt: new Date().toISOString(),
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.completedAt).toBeDefined();
    });

    it("should update assignee", async () => {
      const newAssigneeId = "a1234567-1234-4567-8901-123456789012";
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        assigneeId: newAssigneeId,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: newAssigneeId,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assigneeId).toBe(newAssigneeId);
    });

    it("should update priority", async () => {
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        priority: "urgent",
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: "urgent",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.priority).toBe("urgent");
    });

    it("should update due date", async () => {
      const newDueDate = new Date("2025-01-15").toISOString();
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        dueDate: newDueDate,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: newDueDate,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dueDate).toBe(newDueDate);
    });

    it("should clear due date when set to null", async () => {
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        dueDate: null,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: null,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dueDate).toBeNull();
    });

    it("should reject updating isMandatory field", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isMandatory: false,
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);

      expect(response.status).toBe(400);
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated",
        }),
      });
      const context = createMockContext({ id: "invalid" });

      const response = await PATCH(request, context);

      expect(response.status).toBe(404);
    });

    it("should update checklist items", async () => {
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        checklistItems: ["New item 1", "New item 2", "New item 3"],
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItems: ["New item 1", "New item 2", "New item 3"],
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checklistItems).toEqual(["New item 1", "New item 2", "New item 3"]);
    });

    it("should update tags", async () => {
      const mockUpdated = {
        id: "task-123",
        matterId: "matter-1",
        title: "Task",
        tags: ["urgent", "client-facing"],
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockUpdated));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: ["urgent", "client-facing"],
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toEqual(["urgent", "client-facing"]);
    });
  });
});
