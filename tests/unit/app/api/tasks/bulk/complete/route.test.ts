/**
 * Bulk Complete Tasks API Tests
 *
 * @see app/api/tasks/bulk/complete/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockFirmId, mockWithFirmDbSuccess, mockWithFirmDbError } from "@tests/helpers/mocks";
import { NotFoundError } from "@/middleware/withErrorHandler";

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
vi.mock("@/lib/tasks/completion");
vi.mock("@/lib/timeline/createEvent");

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import * as completionModule from "@/lib/tasks/completion";
import { POST } from "@/app/api/tasks/bulk/complete/route";

// Test UUIDs
const taskId1 = "b0000000-0000-4000-a000-000000000001";
const taskId2 = "b0000000-0000-4000-a000-000000000002";
const taskId3 = "b0000000-0000-4000-a000-000000000003";
const invalidId1 = "d0000000-0000-4000-a000-000000000001";
const invalidId2 = "d0000000-0000-4000-a000-000000000002";

describe("Bulk Complete Tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
    vi.mocked(completionModule.canTransitionToCompleted).mockReturnValue(true);
  });

  describe("POST /api/tasks/bulk/complete", () => {
    it("should complete multiple eligible tasks", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: true },
        { id: taskId3, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2, taskId3],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
      expect(data.failed).toBe(0);
    });

    it("should complete tasks with notes", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
          notes: "Batch completion - all tasks verified",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(2);
    });

    it("should return 404 when no tasks found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("No tasks found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [invalidId1, invalidId2],
        }),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(404);
    });

    it("should handle partial success", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: false, error: "Task not found" },
        { id: taskId3, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2, taskId3],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.processed).toBe(2);
      expect(data.failed).toBe(1);
    });

    it("should reject tasks with evidence requirements", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: false, error: "Task requires evidence - cannot bulk complete" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.failed).toBe(1);
      expect(data.results.find((r: any) => r.id === taskId2).error).toContain("requires evidence");
    });

    it("should reject tasks with pending approval requirements", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: false, error: "Task requires approval - cannot bulk complete" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.find((r: any) => r.id === taskId2).error).toContain("requires approval");
    });

    it("should reject tasks with invalid status", async () => {
      const mockResults = [
        { id: taskId1, success: false, error: "Cannot complete task with status 'completed'" },
        { id: taskId2, success: false, error: "Cannot complete task with status 'skipped'" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.failed).toBe(2);
    });

    it("should require task IDs", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(400);
    });

    it("should reject empty task ID array", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [],
        }),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(400);
    });

    it("should allow tasks with approved approval status", async () => {
      const mockResults = [{ id: taskId1, success: true }];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1],
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
    });
  });
});
