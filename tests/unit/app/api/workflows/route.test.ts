/**
 * Workflow Templates API Tests
 *
 * @see app/api/workflows/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockContext } from "@tests/helpers/mocks";

// Mock middleware FIRST (before importing route)
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "a0000000-0000-4000-a000-000000000001" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
  },
}));

import { db } from "@/lib/db";
import { GET } from "@/app/api/workflows/route";

// Helper to create a chainable mock
function createChainableMock(resolvedValue: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(resolvedValue),
    innerJoin: vi.fn().mockReturnThis(),
  };
  return chain;
}

describe("Workflow Templates API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workflows", () => {
    it("should list active workflow templates", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          key: "conveyancing-sale",
          name: "Residential Sale",
          description: "Standard residential sale workflow",
          practiceArea: "conveyancing",
          subTypes: ["residential_sale"],
          version: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "wf-2",
          key: "litigation-civil",
          name: "Civil Litigation",
          description: "Civil litigation workflow",
          practiceArea: "litigation",
          subTypes: null,
          version: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      // Set up mock call sequence
      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Count query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 2 }]),
            }),
          } as any;
        } else if (selectCallCount === 2) {
          // Main workflows query
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockWorkflows),
                  }),
                }),
              }),
            }),
          } as any;
        } else {
          // Stage/task count queries
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: selectCallCount <= 4 ? 6 : 20 }]),
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 20 }]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it("should filter by practice area", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          key: "conveyancing-sale",
          name: "Residential Sale",
          practiceArea: "conveyancing",
          isActive: true,
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 1 }]),
            }),
          } as any;
        } else if (selectCallCount === 2) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockWorkflows),
                  }),
                }),
              }),
            }),
          } as any;
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 6 }]),
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 20 }]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest(
        "http://localhost:3000/api/workflows?practiceArea=conveyancing"
      );
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows).toHaveLength(1);
      expect(data.workflows[0].practiceArea).toBe("conveyancing");
    });

    it("should only return active templates by default", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          key: "conveyancing-sale",
          name: "Residential Sale",
          isActive: true,
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 1 }]),
            }),
          } as any;
        } else if (selectCallCount === 2) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockWorkflows),
                  }),
                }),
              }),
            }),
          } as any;
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 6 }]),
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 20 }]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows.every((w: any) => w.isActive)).toBe(true);
    });

    it("should return empty array when no workflows match", async () => {
      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 0 }]),
            }),
          } as any;
        } else {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest(
        "http://localhost:3000/api/workflows?practiceArea=immigration"
      );
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });

    it("should include stage and task counts", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          key: "conveyancing-sale",
          name: "Residential Sale",
          isActive: true,
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 1 }]),
            }),
          } as any;
        } else if (selectCallCount === 2) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockWorkflows),
                  }),
                }),
              }),
            }),
          } as any;
        } else if (selectCallCount === 3) {
          // Stage count
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 6 }]),
            }),
          } as any;
        } else {
          // Task count
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 20 }]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows[0].stageCount).toBe(6);
      expect(data.workflows[0].taskCount).toBe(20);
    });

    it("should return workflows with subTypes array", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          key: "conveyancing-sale",
          name: "Residential Sale",
          subTypes: ["residential_sale", "leasehold_sale"],
          isActive: true,
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 1 }]),
            }),
          } as any;
        } else if (selectCallCount === 2) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue(mockWorkflows),
                  }),
                }),
              }),
            }),
          } as any;
        } else if (selectCallCount === 3) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 6 }]),
            }),
          } as any;
        } else {
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ count: 20 }]),
              }),
            }),
          } as any;
        }
      });

      const request = new NextRequest("http://localhost:3000/api/workflows");
      const context = createMockContext({});

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows[0].subTypes).toEqual(["residential_sale", "leasehold_sale"]);
    });
  });
});
