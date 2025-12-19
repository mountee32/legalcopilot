/**
 * Complete Task API Tests
 *
 * @see app/api/tasks/[id]/complete/route.ts
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
vi.mock("@/lib/tasks/completion");
vi.mock("@/lib/timeline/createEvent");

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import * as completionModule from "@/lib/tasks/completion";
import { POST } from "@/app/api/tasks/[id]/complete/route";

describe("Complete Task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
    vi.mocked(completionModule.canTransitionToCompleted).mockReturnValue(true);
    vi.mocked(completionModule.getCompletionBlockers).mockResolvedValue([]);
  });

  describe("POST /api/tasks/[id]/complete", () => {
    it("should complete a pending task", async () => {
      const now = new Date();
      const mockTask = {
        id: "task-123",
        title: "File Document",
        status: "completed",
        completedAt: now.toISOString(),
        matterId: "matter-1",
        firmId: mockFirmId,
        requiresEvidence: false,
        requiresApproval: false,
        updatedAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.completedAt).toBeDefined();
    });

    it("should complete task with notes", async () => {
      const now = new Date();
      const mockTask = {
        id: "task-123",
        title: "Review Document",
        status: "completed",
        completedAt: now.toISOString(),
        matterId: "matter-1",
        firmId: mockFirmId,
        requiresEvidence: false,
        requiresApproval: false,
        updatedAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "All checks passed. Document verified against originals.",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject completing already completed task", async () => {
      vi.mocked(completionModule.canTransitionToCompleted).mockReturnValue(false);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("Task is already completed"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should reject completing skipped task", async () => {
      vi.mocked(completionModule.canTransitionToCompleted).mockReturnValue(false);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(
          new ValidationError(
            "Cannot complete task with status 'skipped'. Task must be pending or in_progress."
          )
        )
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should reject completion when evidence required but missing", async () => {
      vi.mocked(completionModule.getCompletionBlockers).mockResolvedValue([
        "Evidence required but none provided",
      ]);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(
          new ValidationError("Cannot complete task: Evidence required but none provided")
        )
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should reject completion when verified evidence required but not verified", async () => {
      vi.mocked(completionModule.getCompletionBlockers).mockResolvedValue([
        "Verified evidence required but none verified",
      ]);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(
          new ValidationError("Cannot complete task: Verified evidence required but none verified")
        )
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should reject completion when approval required but not approved", async () => {
      vi.mocked(completionModule.getCompletionBlockers).mockResolvedValue([
        "Approval required but not approved",
      ]);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(
          new ValidationError("Cannot complete task: Approval required but not approved")
        )
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should complete in_progress task", async () => {
      const now = new Date();
      const mockTask = {
        id: "task-123",
        title: "Draft Letter",
        status: "completed",
        completedAt: now.toISOString(),
        matterId: "matter-1",
        firmId: mockFirmId,
        requiresEvidence: false,
        requiresApproval: false,
        updatedAt: now.toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
    });
  });
});
