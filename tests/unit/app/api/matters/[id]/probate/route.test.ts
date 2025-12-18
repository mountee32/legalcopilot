import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/matters/[id]/probate/route";
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

describe("PATCH /api/matters/[id]/probate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  it("should update probate data successfully", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
      practiceData: {
        deceasedName: "John Smith",
        dateOfDeath: "2024-01-15",
        grantType: "probate",
      },
    };

    const mockUpdated = {
      ...mockMatter,
      practiceData: {
        deceasedName: "John Smith",
        dateOfDeath: "2024-01-15",
        grantType: "probate",
        grantIssuedAt: "2024-06-01T10:00:00.000Z",
        grantReference: "GRANT-2024-001",
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

    const request = new Request("http://localhost:3000/api/matters/matter-123/probate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantIssuedAt: "2024-06-01T10:00:00.000Z",
        grantReference: "GRANT-2024-001",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.practiceData.grantReference).toBe("GRANT-2024-001");
  });

  it("should update beneficiaries array", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "probate",
      practiceData: {
        deceasedName: "John Smith",
        dateOfDeath: "2024-01-15",
        grantType: "probate",
        beneficiaries: [],
      },
    };

    const newBeneficiaries = [
      { name: "Jane Smith", relationship: "spouse", share: 50 },
      { name: "Bob Smith", relationship: "child", share: 50 },
    ];

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
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
              ...mockMatter.practiceData,
              beneficiaries: newBeneficiaries,
            },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/matters/matter-123/probate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiaries: newBeneficiaries,
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.practiceData.beneficiaries).toHaveLength(2);
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

    const request = new Request("http://localhost:3000/api/matters/non-existent/probate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantReference: "GRANT-2024-001",
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

  it("should return 400 if matter is not a probate matter", async () => {
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

    const request = new Request("http://localhost:3000/api/matters/matter-123/probate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantReference: "GRANT-2024-001",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockMatterId }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not a probate matter");
  });
});
