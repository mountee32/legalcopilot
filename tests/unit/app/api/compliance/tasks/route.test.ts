/**
 * Compliance Tasks API Tests
 *
 * @see app/api/compliance/tasks/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockUser,
  mockFirmId,
  mockWithFirmDbSuccess,
  createMockContext,
} from "@tests/helpers/mocks";

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
import { GET } from "@/app/api/compliance/tasks/route";

describe("Compliance Tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  describe("GET /api/compliance/tasks", () => {
    it("should return overdue mandatory tasks", async () => {
      const mockResult = {
        total: 2,
        rows: [
          {
            task: {
              id: "task-1",
              title: "ID Verification",
              priority: "high",
              status: "pending",
              dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              isMandatory: true,
              requiresEvidence: true,
              requiresApproval: false,
            },
            matter: {
              id: "matter-1",
              reference: "MAT-001",
              title: "Smith v Jones",
              practiceArea: "litigation",
              status: "active",
            },
            client: {
              id: "client-1",
              name: "John Smith",
            },
            assignee: {
              id: "user-1",
              name: "Jane Doe",
              email: "jane@example.com",
            },
          },
        ],
        stats: {
          totalOverdue: 2,
          overdueByPriority: { urgent: 0, high: 1, medium: 1, low: 0 },
          avgDaysOverdue: 3,
        },
        byPracticeArea: [{ practiceArea: "litigation", count: 1 }],
        byAssignee: [{ assigneeId: "user-1", assigneeName: "Jane Doe", count: 1 }],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].isMandatory).toBe(true);
      expect(data.stats.totalOverdue).toBe(2);
    });

    it("should return stats with priority breakdown", async () => {
      const mockResult = {
        total: 5,
        rows: [],
        stats: {
          totalOverdue: 5,
          overdueByPriority: { urgent: 1, high: 2, medium: 1, low: 1 },
          avgDaysOverdue: 7,
        },
        byPracticeArea: [],
        byAssignee: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.overdueByPriority.urgent).toBe(1);
      expect(data.stats.overdueByPriority.high).toBe(2);
      expect(data.stats.avgDaysOverdue).toBe(7);
    });

    it("should filter by practice area", async () => {
      const mockResult = {
        total: 1,
        rows: [
          {
            task: {
              id: "task-1",
              title: "AML Check",
              priority: "high",
              status: "pending",
              isMandatory: true,
            },
            matter: {
              id: "matter-1",
              reference: "MAT-001",
              title: "Property Purchase",
              practiceArea: "conveyancing",
              status: "active",
            },
            client: null,
            assignee: null,
          },
        ],
        stats: {
          totalOverdue: 1,
          overdueByPriority: { urgent: 0, high: 1, medium: 0, low: 0 },
          avgDaysOverdue: 2,
        },
        byPracticeArea: [{ practiceArea: "conveyancing", count: 1 }],
        byAssignee: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest(
        "http://localhost:3000/api/compliance/tasks?practiceArea=conveyancing"
      );
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].matter.practiceArea).toBe("conveyancing");
    });

    it("should filter by assignee", async () => {
      const assigneeId = "c0000000-0000-4000-a000-000000000001";
      const mockResult = {
        total: 1,
        rows: [
          {
            task: {
              id: "task-1",
              title: "File Documents",
              priority: "medium",
              status: "pending",
              isMandatory: true,
            },
            matter: {
              id: "matter-1",
              reference: "MAT-001",
              title: "Test Matter",
              practiceArea: "litigation",
              status: "active",
            },
            client: null,
            assignee: {
              id: assigneeId,
              name: "John Assignee",
              email: "john@example.com",
            },
          },
        ],
        stats: {
          totalOverdue: 1,
          overdueByPriority: { urgent: 0, high: 0, medium: 1, low: 0 },
          avgDaysOverdue: 3,
        },
        byPracticeArea: [],
        byAssignee: [{ assigneeId: assigneeId, assigneeName: "John Assignee", count: 1 }],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest(
        `http://localhost:3000/api/compliance/tasks?assigneeId=${assigneeId}`
      );
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].assignee.id).toBe(assigneeId);
    });

    it("should return empty results when no overdue tasks", async () => {
      const mockResult = {
        total: 0,
        rows: [],
        stats: {
          totalOverdue: 0,
          overdueByPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
          avgDaysOverdue: 0,
        },
        byPracticeArea: [],
        byAssignee: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(0);
      expect(data.stats.totalOverdue).toBe(0);
    });

    it("should calculate days overdue correctly", async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const mockResult = {
        total: 1,
        rows: [
          {
            task: {
              id: "task-1",
              title: "Overdue Task",
              priority: "high",
              status: "pending",
              dueDate: fiveDaysAgo,
              isMandatory: true,
            },
            matter: {
              id: "matter-1",
              reference: "MAT-001",
              title: "Test Matter",
              practiceArea: "litigation",
              status: "active",
            },
            client: null,
            assignee: null,
          },
        ],
        stats: {
          totalOverdue: 1,
          overdueByPriority: { urgent: 0, high: 1, medium: 0, low: 0 },
          avgDaysOverdue: 5,
        },
        byPracticeArea: [],
        byAssignee: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks[0].daysOverdue).toBe(5);
    });

    it("should support pagination", async () => {
      const mockResult = {
        total: 50,
        rows: Array(20)
          .fill(null)
          .map((_, i) => ({
            task: {
              id: `task-${i}`,
              title: `Task ${i}`,
              priority: "medium",
              status: "pending",
              isMandatory: true,
            },
            matter: {
              id: "matter-1",
              reference: "MAT-001",
              title: "Test Matter",
              practiceArea: "litigation",
              status: "active",
            },
            client: null,
            assignee: null,
          })),
        stats: {
          totalOverdue: 50,
          overdueByPriority: { urgent: 0, high: 0, medium: 50, low: 0 },
          avgDaysOverdue: 3,
        },
        byPracticeArea: [],
        byAssignee: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks?page=1&limit=20");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(20);
      expect(data.pagination.total).toBe(50);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasNext).toBe(true);
    });

    it("should group by practice area", async () => {
      const mockResult = {
        total: 3,
        rows: [],
        stats: {
          totalOverdue: 3,
          overdueByPriority: { urgent: 0, high: 1, medium: 2, low: 0 },
          avgDaysOverdue: 4,
        },
        byPracticeArea: [
          { practiceArea: "litigation", count: 2 },
          { practiceArea: "conveyancing", count: 1 },
        ],
        byAssignee: [],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.byPracticeArea).toHaveLength(2);
      expect(data.byPracticeArea[0].practiceArea).toBe("litigation");
      expect(data.byPracticeArea[0].count).toBe(2);
    });

    it("should group by assignee", async () => {
      const mockResult = {
        total: 3,
        rows: [],
        stats: {
          totalOverdue: 3,
          overdueByPriority: { urgent: 0, high: 1, medium: 2, low: 0 },
          avgDaysOverdue: 4,
        },
        byPracticeArea: [],
        byAssignee: [
          { assigneeId: "user-1", assigneeName: "Jane Doe", count: 2 },
          { assigneeId: null, assigneeName: null, count: 1 },
        ],
      };

      vi.mocked(tenantModule.withFirmDb).mockImplementation(mockWithFirmDbSuccess(mockResult));

      const request = new NextRequest("http://localhost:3000/api/compliance/tasks");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.byAssignee).toHaveLength(2);
      expect(data.byAssignee[0].assigneeName).toBe("Jane Doe");
      expect(data.byAssignee[1].assigneeName).toBeNull(); // Unassigned
    });
  });
});
