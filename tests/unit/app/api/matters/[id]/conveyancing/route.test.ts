import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/matters/[id]/conveyancing/route";
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

describe("PATCH /api/matters/[id]/conveyancing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  it("should update conveyancing data successfully", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
      practiceData: {
        transactionType: "purchase",
        propertyType: "freehold",
      },
    };

    const mockUpdated = {
      ...mockMatter,
      practiceData: {
        transactionType: "purchase",
        propertyType: "freehold",
        purchasePrice: "500000.00",
        completionDate: "2024-12-31",
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

    const request = new Request("http://localhost:3000/api/matters/matter-123/conveyancing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
        completionDate: "2024-12-31",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.practiceData).toBeDefined();
    expect(data.practiceData.purchasePrice).toBe("500000.00");
  });

  it("should merge with existing practiceData", async () => {
    const existingData = {
      transactionType: "purchase",
      propertyType: "freehold",
      purchasePrice: "500000.00",
    };

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
      practiceData: existingData,
    };

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn((data: any) => {
          // Verify merge happened
          expect(data.practiceData).toMatchObject({
            transactionType: "purchase",
            propertyType: "freehold",
            purchasePrice: "500000.00",
            completionDate: "2024-12-31",
          });
          return mockTx;
        }),
        returning: vi.fn().mockResolvedValue([
          {
            ...mockMatter,
            practiceData: {
              ...existingData,
              completionDate: "2024-12-31",
            },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/matters/matter-123/conveyancing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completionDate: "2024-12-31",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);

    expect(response.status).toBe(200);
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

    const request = new Request("http://localhost:3000/api/matters/non-existent/conveyancing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "non-existent" }),
      user: mockUser,
    } as any);
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

    const request = new Request("http://localhost:3000/api/matters/matter-123/conveyancing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not a conveyancing matter");
  });

  it("should return 400 for invalid schema", async () => {
    const request = new Request("http://localhost:3000/api/matters/matter-123/conveyancing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyType: "invalid-type", // Not in enum
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
