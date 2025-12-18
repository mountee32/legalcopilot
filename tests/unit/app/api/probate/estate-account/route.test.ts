import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/probate/estate-account/route";
import * as tenantModule from "@/lib/db/tenant";
import * as tenancyModule from "@/lib/tenancy";

// Mock dependencies
vi.mock("@/lib/db/tenant");
vi.mock("@/lib/tenancy");

const mockUser = {
  user: { id: "user-123", email: "test@example.com" },
  session: { id: "session-123" },
};

const mockFirmId = "firm-123";
const mockMatterId = "matter-123";

describe("POST /api/probate/estate-account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  it("should generate estate account with all components", async () => {
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

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
      };
      return callback(mockTx as any);
    });

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

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // £500,000 + £50,000 = £550,000
    expect(data.estateGrossValue).toBe("550000.00");
    // £550,000 - £210,000 = £340,000
    expect(data.estateNetValue).toBe("340000.00");
    // £100,000
    expect(data.totalDistributions).toBe("100000.00");
    // £340,000 - £100,000 = £240,000
    expect(data.remainingBalance).toBe("240000.00");
    expect(data.summary).toContain("2 asset(s)");
    expect(data.summary).toContain("2 liability(ies)");
    expect(data.summary).toContain("1 distribution(s)");
  });

  it("should handle estate with no data", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
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

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateGrossValue).toBe("0.00");
    expect(data.estateNetValue).toBe("0.00");
    expect(data.totalDistributions).toBe("0.00");
    expect(data.remainingBalance).toBe("0.00");
  });

  it("should exclude components based on flags", async () => {
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

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
      };
      return callback(mockTx as any);
    });

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

    const response = await POST(request, { params: {}, user: mockUser } as any);
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
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "non-existent",
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Matter not found");
  });

  it("should return 400 if matter is not a probate matter", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "conveyancing",
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

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not a probate matter");
  });

  it("should handle numeric values as numbers", async () => {
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

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMatter]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/probate/estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateGrossValue).toBe("500000.00");
    expect(data.estateNetValue).toBe("300000.00");
  });
});
