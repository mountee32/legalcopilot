/**
 * Workflow Template Detail API Tests
 *
 * @see app/api/workflows/[id]/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockContext } from "@tests/helpers/mocks";
import { NotFoundError } from "@/middleware/withErrorHandler";

// Mock middleware FIRST (before importing route)
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-123" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue([]),
  },
}));

import { db } from "@/lib/db";
import { GET } from "@/app/api/workflows/[id]/route";

describe("Workflow Template Detail API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workflows/[id]", () => {
    it("should return workflow with stages and tasks", async () => {
      const mockWorkflow = {
        id: "wf-1",
        key: "conveyancing-sale",
        name: "Residential Sale",
        description: "Standard residential sale workflow",
        practiceArea: "conveyancing",
        subTypes: ["residential_sale"],
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const mockStages = [
        {
          id: "stage-1",
          workflowTemplateId: "wf-1",
          name: "Initial",
          description: "Initial stage tasks",
          sortOrder: 1,
          gateType: "none",
        },
        {
          id: "stage-2",
          workflowTemplateId: "wf-1",
          name: "Due Diligence",
          description: "Due diligence checks",
          sortOrder: 2,
          gateType: "hard",
        },
      ];

      const mockTasks = [
        {
          id: "task-template-1",
          stageId: "stage-1",
          title: "Client Onboarding",
          description: "Complete client onboarding form",
          sortOrder: 1,
          isMandatory: true,
          defaultPriority: "high",
          requiresEvidence: false,
          requiresApproval: false,
        },
        {
          id: "task-template-2",
          stageId: "stage-1",
          title: "ID Verification",
          description: "Verify client identity",
          sortOrder: 2,
          isMandatory: true,
          defaultPriority: "high",
          requiresEvidence: true,
          requiresApproval: false,
        },
      ];

      // Mock chain for workflow query
      const workflowSelectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWorkflow]),
          }),
        }),
      });

      // Mock chain for stages query
      const stagesSelectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockStages),
          }),
        }),
      });

      // Mock chain for tasks query
      const tasksSelectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTasks),
          }),
        }),
      });

      // Alternate between different select implementations
      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return workflowSelectMock() as any;
        } else if (selectCallCount === 2) {
          return stagesSelectMock() as any;
        } else {
          return tasksSelectMock() as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows/wf-1");
      const context = createMockContext({ id: "wf-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow).toBeDefined();
      expect(data.workflow.id).toBe("wf-1");
      expect(data.workflow.stages).toHaveLength(2);
    });

    it("should return 404 when workflow not found", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const request = new NextRequest("http://localhost:3000/api/workflows/invalid");
      const context = createMockContext({ id: "invalid" });

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it("should return workflow with empty stages", async () => {
      const mockWorkflow = {
        id: "wf-empty",
        key: "empty-workflow",
        name: "Empty Workflow",
        description: "Workflow with no stages",
        practiceArea: "general",
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockWorkflow]),
              }),
            }),
          } as any;
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows/wf-empty");
      const context = createMockContext({ id: "wf-empty" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.stages).toHaveLength(0);
    });

    it("should return stages ordered by sortOrder", async () => {
      const mockWorkflow = {
        id: "wf-1",
        key: "test-workflow",
        name: "Test Workflow",
        description: "Test workflow with stages",
        practiceArea: "litigation",
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const mockStages = [
        { id: "stage-1", sortOrder: 1, name: "First" },
        { id: "stage-2", sortOrder: 2, name: "Second" },
        { id: "stage-3", sortOrder: 3, name: "Third" },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockWorkflow]),
              }),
            }),
          } as any;
        } else if (selectCallCount === 2) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockStages),
              }),
            }),
          } as any;
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows/wf-1");
      const context = createMockContext({ id: "wf-1" });

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.stages).toHaveLength(3);
      expect(data.workflow.stages[0].sortOrder).toBe(1);
      expect(data.workflow.stages[1].sortOrder).toBe(2);
      expect(data.workflow.stages[2].sortOrder).toBe(3);
    });
  });
});
