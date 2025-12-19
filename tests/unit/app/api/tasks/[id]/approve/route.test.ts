/**
 * Approve Task API Tests
 *
 * @see app/api/tasks/[id]/approve/route.ts
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
import { POST } from "@/app/api/tasks/[id]/approve/route";

describe("Approve Task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("POST /api/tasks/[id]/approve", () => {
    it("should approve a task pending approval", async () => {
      const mockTask = {
        id: "task-123",
        title: "Draft Contract",
        status: "in_progress",
        requiresApproval: true,
        approvalStatus: "approved",
        approvedById: "user-123",
        approvedAt: new Date().toISOString(),
        matterId: "matter-1",
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.approvalStatus).toBe("approved");
      expect(data.approvedById).toBeDefined();
    });

    it("should approve with notes", async () => {
      const mockTask = {
        id: "task-123",
        title: "Review Document",
        status: "in_progress",
        requiresApproval: true,
        approvalStatus: "approved",
        approvedById: "user-123",
        approvedAt: new Date().toISOString(),
        matterId: "matter-1",
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Reviewed and looks good. Minor typo on page 3 fixed.",
        }),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.approvalStatus).toBe("approved");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/invalid/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject approving task that does not require approval", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("This task does not require approval"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should reject approving already approved task", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("Task is already approved"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should reject approving task without pending approval request", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("No approval has been requested for this task"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/task-123/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });
  });
});
