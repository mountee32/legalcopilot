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

const mockFirmId = "firm-123";
const mockMatterId = "123e4567-e89b-12d3-a456-426614174000";

describe("POST /api/probate/estate-account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate estate account with all components", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
      practiceData: {
        assets: [
          { id: "asset-1", type: "property", description: "Main residence", value: "500000.00" },
          { id: "asset-2", type: "savings", description: "Bank account", value: "50000.00" },
        ],
        liabilities: [
          {
            id: "liability-1",
            type: "mortgage",
            description: "House mortgage",
            amount: "200000.00",
          },
          { id: "liability-2", type: "loan", description: "Personal loan", amount: "10000.00" },
        ],
        distributions: [{ id: "dist-1", beneficiaryId: "ben-1", amount: "100000.00" }],
      },
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

    const { POST } = await import("@/app/api/probate/estate-account/route");

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        includeAssets: true,
        includeLiabilities: true,
        includeDistributions: true,
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // 500,000 + 50,000 = 550,000
    expect(data.estateGrossValue).toBe("550000.00");
    // 550,000 - 210,000 = 340,000
    expect(data.estateNetValue).toBe("340000.00");
    // 100,000
    expect(data.totalDistributions).toBe("100000.00");
    // 340,000 - 100,000 = 240,000
    expect(data.remainingBalance).toBe("240000.00");
    expect(data.summary).toContain("2 asset(s)");
    expect(data.summary).toContain("2 liability(ies)");
    expect(data.summary).toContain("1 distribution(s)");
  });

  it("should handle estate with no data", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
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

    const { POST } = await import("@/app/api/probate/estate-account/route");

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateGrossValue).toBe("0.00");
    expect(data.estateNetValue).toBe("0.00");
    expect(data.totalDistributions).toBe("0.00");
    expect(data.remainingBalance).toBe("0.00");
  });

  it("should exclude components based on flags", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
      practiceData: {
        assets: [
          { id: "asset-1", type: "property", description: "Main residence", value: "500000.00" },
        ],
        liabilities: [
          { id: "liability-1", type: "mortgage", description: "Mortgage", amount: "200000.00" },
        ],
        distributions: [{ id: "dist-1", beneficiaryId: "ben-1", amount: "100000.00" }],
      },
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

    const { POST } = await import("@/app/api/probate/estate-account/route");

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        includeAssets: true,
        includeLiabilities: false,
        includeDistributions: false,
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Gross value includes assets
    expect(data.estateGrossValue).toBe("500000.00");
    // Net value equals gross when liabilities excluded
    expect(data.estateNetValue).toBe("500000.00");
    // No distributions calculated
    expect(data.totalDistributions).toBe("0.00");
    expect(data.remainingBalance).toBe("500000.00");
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

    const { POST } = await import("@/app/api/probate/estate-account/route");

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain("Matter not found");
  });

  it("should return 400 if matter is not a probate matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
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

    const { POST } = await import("@/app/api/probate/estate-account/route");

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("not a probate matter");
  });

  it("should handle numeric values as numbers", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
      practiceData: {
        assets: [
          { id: "asset-1", type: "property", description: "Property", value: 500000 }, // number not string
        ],
        liabilities: [
          { id: "liability-1", type: "mortgage", description: "Mortgage", amount: 200000 },
        ],
      },
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

    const { POST } = await import("@/app/api/probate/estate-account/route");

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateGrossValue).toBe("500000.00");
    expect(data.estateNetValue).toBe("300000.00");
  });
});
