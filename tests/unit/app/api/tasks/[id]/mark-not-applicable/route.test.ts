/**
 * Mark Not Applicable Task API Tests
 *
 * @see app/api/tasks/[id]/mark-not-applicable/route.ts
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
import { POST } from "@/app/api/tasks/[id]/mark-not-applicable/route";

describe("Mark Not Applicable Task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
    vi.mocked(completionModule.canSkipOrMarkNotApplicable).mockReturnValue(true);
  });

  describe("POST /api/tasks/[id]/mark-not-applicable", () => {
    it("should mark task as not applicable", async () => {
      const mockTask = {
        id: "task-123",
        title: "AML Check",
        status: "not_applicable",
        matterId: "matter-1",
        isMandatory: false,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/mark-not-applicable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Client is existing customer - AML already on file",
          }),
        }
      );
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("not_applicable");
    });

    it("should return 404 when task not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("Task not found"))
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/invalid/mark-not-applicable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Test reason",
          }),
        }
      );
      const context = createMockContext({ id: "invalid" });

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("should reject marking already skipped task", async () => {
      vi.mocked(completionModule.canSkipOrMarkNotApplicable).mockReturnValue(false);
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(
          new ValidationError(
            "Cannot mark task as not applicable with status 'skipped'. Task must be pending, in_progress, or completed."
          )
        )
      );

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/mark-not-applicable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Test reason",
          }),
        }
      );
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should require a reason", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/mark-not-applicable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("should mark mandatory task as not applicable", async () => {
      const mockTask = {
        id: "task-123",
        title: "Mandatory Task",
        status: "not_applicable",
        matterId: "matter-1",
        isMandatory: true,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/mark-not-applicable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Exemption applies - client is regulated entity",
          }),
        }
      );
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("not_applicable");
    });

    it("should mark completed task as not applicable", async () => {
      const mockTask = {
        id: "task-123",
        title: "Completed Task",
        status: "not_applicable",
        matterId: "matter-1",
        isMandatory: false,
        firmId: mockFirmId,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockTask));

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-123/mark-not-applicable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Task was completed in error - not applicable to this matter type",
          }),
        }
      );
      const context = createMockContext({ id: "task-123" });

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("not_applicable");
    });
  });
});
