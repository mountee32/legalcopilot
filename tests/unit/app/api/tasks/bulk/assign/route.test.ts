/**
 * Bulk Assign Tasks API Tests
 *
 * @see app/api/tasks/bulk/assign/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockFirmId, mockWithFirmDbSuccess, mockWithFirmDbError } from "@tests/helpers/mocks";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

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
import { POST } from "@/app/api/tasks/bulk/assign/route";

// Test UUIDs
const taskId1 = "b0000000-0000-4000-a000-000000000001";
const taskId2 = "b0000000-0000-4000-a000-000000000002";
const taskId3 = "b0000000-0000-4000-a000-000000000003";
const userId = "c0000000-0000-4000-a000-000000000001";
const invalidId1 = "d0000000-0000-4000-a000-000000000001";
const invalidId2 = "d0000000-0000-4000-a000-000000000002";
const invalidUserId = "e0000000-0000-4000-a000-000000000001";

describe("Bulk Assign Tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("POST /api/tasks/bulk/assign", () => {
    it("should assign multiple tasks to a user", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: true },
        { id: taskId3, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2, taskId3],
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
      expect(data.failed).toBe(0);
    });

    it("should unassign tasks when assigneeId is null", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
          assigneeId: null,
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(2);
    });

    it("should return 404 when no tasks found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new NotFoundError("No tasks found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [invalidId1, invalidId2],
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(404);
    });

    it("should return 400 when assignee not found", async () => {
      vi.mocked(tenantModule.withFirmDb).mockImplementation(
        mockWithFirmDbError(new ValidationError("Assignee not found"))
      );

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1],
          assigneeId: invalidUserId,
        }),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(400);
    });

    it("should handle partial success", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: false, error: "Task not found" },
        { id: taskId3, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2, taskId3],
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.processed).toBe(2);
      expect(data.failed).toBe(1);
    });

    it("should reject assigning completed tasks", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: false, error: "Cannot assign task with status 'completed'" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.failed).toBe(1);
      expect(data.results.find((r: any) => r.id === taskId2).error).toContain("completed");
    });

    it("should reject assigning cancelled tasks", async () => {
      const mockResults = [
        { id: taskId1, success: false, error: "Cannot assign task with status 'cancelled'" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1],
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].error).toContain("cancelled");
    });

    it("should succeed when already assigned to same user", async () => {
      const mockResults = [{ id: taskId1, success: true }];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1],
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should require task IDs", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: userId,
        }),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(400);
    });
  });
});
