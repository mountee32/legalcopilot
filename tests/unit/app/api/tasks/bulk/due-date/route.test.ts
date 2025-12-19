/**
 * Bulk Set Due Date API Tests
 *
 * @see app/api/tasks/bulk/due-date/route.ts
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
vi.mock("@/lib/timeline/createEvent");

import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";
import { POST } from "@/app/api/tasks/bulk/due-date/route";

// Test UUIDs
const taskId1 = "b0000000-0000-4000-a000-000000000001";
const taskId2 = "b0000000-0000-4000-a000-000000000002";
const taskId3 = "b0000000-0000-4000-a000-000000000003";
const invalidId1 = "d0000000-0000-4000-a000-000000000001";
const invalidId2 = "d0000000-0000-4000-a000-000000000002";

describe("Bulk Set Due Date API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("POST /api/tasks/bulk/due-date", () => {
    it("should set due date for multiple tasks", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: true },
        { id: taskId3, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2, taskId3],
          dueDate: "2025-01-15T00:00:00Z",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
      expect(data.failed).toBe(0);
    });

    it("should clear due date when dueDate is null", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: true },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
          dueDate: null,
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

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [invalidId1, invalidId2],
          dueDate: "2025-01-15T00:00:00Z",
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

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2, taskId3],
          dueDate: "2025-01-15T00:00:00Z",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.processed).toBe(2);
      expect(data.failed).toBe(1);
    });

    it("should reject modifying completed tasks", async () => {
      const mockResults = [
        { id: taskId1, success: true },
        { id: taskId2, success: false, error: "Cannot modify task with status 'completed'" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
          dueDate: "2025-01-15T00:00:00Z",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.failed).toBe(1);
      expect(data.results.find((r: any) => r.id === taskId2).error).toContain("completed");
    });

    it("should reject modifying cancelled tasks", async () => {
      const mockResults = [
        { id: taskId1, success: false, error: "Cannot modify task with status 'cancelled'" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1],
          dueDate: "2025-01-15T00:00:00Z",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].error).toContain("cancelled");
    });

    it("should require task IDs", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: "2025-01-15T00:00:00Z",
        }),
      });

      const response = await POST(request, {} as any);

      expect(response.status).toBe(400);
    });

    it("should accept ISO date string format", async () => {
      const mockResults = [{ id: taskId1, success: true }];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1],
          dueDate: "2025-01-15T00:00:00.000Z",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle all tasks being ineligible", async () => {
      const mockResults = [
        { id: taskId1, success: false, error: "Cannot modify task with status 'completed'" },
        { id: taskId2, success: false, error: "Cannot modify task with status 'cancelled'" },
      ];

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResults));

      const request = new NextRequest("http://localhost:3000/api/tasks/bulk/due-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [taskId1, taskId2],
          dueDate: "2025-01-15T00:00:00Z",
        }),
      });

      const response = await POST(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.processed).toBe(0);
      expect(data.failed).toBe(2);
    });
  });
});
