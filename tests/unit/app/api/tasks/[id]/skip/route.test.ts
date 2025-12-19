/**
 * Skip Task API Tests
 *
 * @see app/api/tasks/[id]/skip/route.ts
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
vi.mock("@/lib/tasks/exceptions");
vi.mock("@/lib/tasks/completion");
vi.mock("@/lib/timeline/createEvent");

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import * as completionModule from "@/lib/tasks/completion";
import { POST } from "@/app/api/tasks/[id]/skip/route";

describe("Skip Task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
    vi.mocked(completionModule.canSkipOrMarkNotApplicable).mockReturnValue(true);
  });

  describe("POST /api/tasks/[id]/skip", () => {
    it("should skip a pending task with reason", async () => {
      const mockTask = {
        id: "task-123",
        title: "ID Verification",
        status: "skipped",
        matterId: "matter-1",
        isMandatory: false,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Client confirmed identity verbally",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("skipped");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Test reason",
        }),
      });
      const context = createMockContext({ id: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject skipping task with invalid status", async () => {
      vi.mocked(completionModule.canSkipOrMarkNotApplicable).mockReturnValue(false);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(
          new ValidationError(
            "Cannot skip task with status 'skipped'. Task must be pending, in_progress, or completed."
          )
        )
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Test reason",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should require a reason", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should skip mandatory task (for MVP)", async () => {
      const mockTask = {
        id: "task-123",
        title: "Mandatory Task",
        status: "skipped",
        matterId: "matter-1",
        isMandatory: true,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Approved by supervisor John Smith",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("skipped");
    });

    it("should skip in_progress task", async () => {
      const mockTask = {
        id: "task-123",
        title: "In Progress Task",
        status: "skipped",
        matterId: "matter-1",
        isMandatory: false,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "No longer required due to case dismissal",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("skipped");
    });
  });
});
