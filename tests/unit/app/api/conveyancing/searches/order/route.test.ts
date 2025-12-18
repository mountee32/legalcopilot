import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/conveyancing/searches/order/route";
import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";

// Mock dependencies
vi.mock("@/lib/db/tenant");
vi.mock("@/lib/tenancy");
vi.mock("@/lib/timeline/createEvent");

const mockUser = {
  user: { id: "user-123", email: "test@example.com" },
  session: { id: "session-123" },
};

const mockFirmId = "firm-123";
const mockMatterId = "matter-123";

describe("POST /api/conveyancing/searches/order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  it("should order a search successfully", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
      practiceData: { searches: [] },
    };

    const mockUpdated = {
      ...mockMatter,
      practiceData: {
        searches: [
          expect.objectContaining({
            type: "local",
            provider: "TM Group",
            status: "ordered",
          }),
        ],
      },
    };

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdated]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.searchId).toBeDefined();
    expect(data.message).toContain("local search ordered");
  });

  it("should return 404 if matter not found", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "non-existent",
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Matter not found");
  });

  it("should return 400 if matter is not a conveyancing matter", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "litigation",
      practiceData: {},
    };

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not a conveyancing matter");
  });

  it("should append to existing searches array", async () => {
    const existingSearch = {
      id: "search-1",
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

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
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

    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        searchType: "local",
        provider: "TM Group",
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 for invalid input", async () => {
    const request = new Request("http://localhost:3000/api/conveyancing/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "invalid-uuid",
        // Missing searchType and provider
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
