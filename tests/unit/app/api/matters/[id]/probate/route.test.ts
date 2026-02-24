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

describe("PATCH /api/matters/[id]/probate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update probate data successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

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

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
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

    const { PATCH } = await import("@/app/api/matters/[id]/probate/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/probate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantIssuedAt: "2024-06-01T10:00:00.000Z",
        grantReference: "GRANT-2024-001",
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
    expect(data.practiceData.grantReference).toBe("GRANT-2024-001");
  });

  it("should update beneficiaries array", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

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
              ...mockMatter.practiceData,
              beneficiaries: newBeneficiaries,
            },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const { PATCH } = await import("@/app/api/matters/[id]/probate/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/probate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiaries: newBeneficiaries,
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
    expect(data.practiceData.beneficiaries).toHaveLength(2);
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

    const { PATCH } = await import("@/app/api/matters/[id]/probate/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/probate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantReference: "GRANT-2024-001",
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

  it("should return 400 if matter is not a probate matter", async () => {
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

    const { PATCH } = await import("@/app/api/matters/[id]/probate/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/probate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantReference: "GRANT-2024-001",
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
    expect(data.message).toContain("not a probate matter");
  });
});
