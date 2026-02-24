import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock middleware and dependencies
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-123" }, session: { id: "session-123" } },
    }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-123"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

const mockFirmId = "firm-123";
const mockMatterId = "123e4567-e89b-12d3-a456-426614174000";

describe("POST /api/conveyancing/searches/order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should order a search successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
      practiceData: { searches: [] },
    };

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            ...mockMatter,
            practiceData: {
              searches: [
                {
                  type: "local",
                  provider: "TM Group",
                  status: "ordered",
                },
              ],
            },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/conveyancing/searches/order/route");

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.searchId).toBeDefined();
    expect(data.message).toContain("local search ordered");
  });

  it("should return 404 if matter not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/conveyancing/searches/order/route");

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain("Matter not found");
  });

  it("should return 400 if matter is not a conveyancing matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "litigation",
      practiceData: {},
    };

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/conveyancing/searches/order/route");

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("not a conveyancing matter");
  });

  it("should append to existing searches array", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const existingSearch = {
      id: "223e4567-e89b-12d3-a456-426614174001",
      type: "drainage",
      provider: "Provider A",
      status: "ordered",
      orderedAt: "2024-01-01T00:00:00.000Z",
    };

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
      practiceData: { searches: [existingSearch] },
    };

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn((data: any) => {
          // Verify that existing searches are preserved
          expect(data.practiceData.searches).toHaveLength(2);
          expect(data.practiceData.searches[0]).toEqual(existingSearch);
          return mockTx;
        }),
        returning: vi.fn().mockResolvedValue([
          {
            ...mockMatter,
            practiceData: {
              searches: [
                existingSearch,
                {
                  id: expect.any(String),
                  type: "local",
                  provider: "TM Group",
                  status: "ordered",
                  orderedAt: expect.any(String),
                },
              ],
            },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/conveyancing/searches/order/route");

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 for invalid input", async () => {
    const { POST } = await import("@/app/api/conveyancing/searches/order/route");

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "invalid-uuid",
        // Missing searchType and provider
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
