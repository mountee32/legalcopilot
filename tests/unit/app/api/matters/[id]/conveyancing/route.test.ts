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

describe("PATCH /api/matters/[id]/conveyancing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update conveyancing data successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockUpdatedMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
      practiceData: {
        transactionType: "purchase",
        propertyType: "freehold",
        purchasePrice: "500000.00",
        completionDate: "2024-12-31",
      },
    };

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: mockMatterId,
            firmId: mockFirmId,
            practiceArea: "conveyancing",
            practiceData: {
              transactionType: "purchase",
              propertyType: "freehold",
            },
          },
        ]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedMatter]),
      };
      return callback(mockTx as any);
    });

    const { PATCH } = await import("@/app/api/matters/[id]/conveyancing/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/conveyancing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
        completionDate: "2024-12-31",
      }),
    });

    const response = await PATCH(
      request as any,
      {
        params: Promise.resolve({ id: mockMatterId }),
      } as any
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.practiceData).toBeDefined();
    expect(data.practiceData.purchasePrice).toBe("500000.00");
  });

  it("should merge with existing practiceData", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

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

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
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

    const { PATCH } = await import("@/app/api/matters/[id]/conveyancing/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/conveyancing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completionDate: "2024-12-31",
      }),
    });

    const response = await PATCH(
      request as any,
      {
        params: Promise.resolve({ id: mockMatterId }),
      } as any
    );

    expect(response.status).toBe(200);
  });

  it("should return 404 if matter not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    // When matter is not found, withFirmDb callback returns null, then route throws NotFoundError
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      return callback(mockTx as any);
    });

    const { PATCH } = await import("@/app/api/matters/[id]/conveyancing/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/conveyancing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
      }),
    });

    const response = await PATCH(
      request as any,
      {
        params: Promise.resolve({ id: mockMatterId }),
      } as any
    );
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

    const { PATCH } = await import("@/app/api/matters/[id]/conveyancing/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/conveyancing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
      }),
    });

    const response = await PATCH(
      request as any,
      {
        params: Promise.resolve({ id: mockMatterId }),
      } as any
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("not a conveyancing matter");
  });

  it("should return 400 for invalid schema", async () => {
    const { PATCH } = await import("@/app/api/matters/[id]/conveyancing/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/conveyancing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyType: "invalid-type", // Not in enum
      }),
    });

    const response = await PATCH(
      request as any,
      {
        params: Promise.resolve({ id: mockMatterId }),
      } as any
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
