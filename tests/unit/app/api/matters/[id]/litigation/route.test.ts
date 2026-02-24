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

describe("PATCH /api/matters/[id]/litigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update litigation data successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "litigation",
      practiceData: {
        caseType: "civil",
      },
    };

    const mockUpdated = {
      ...mockMatter,
      practiceData: {
        caseType: "civil",
        court: "High Court",
        courtReference: "HC-2024-001234",
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

    const { PATCH } = await import("@/app/api/matters/[id]/litigation/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/litigation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court: "High Court",
        courtReference: "HC-2024-001234",
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
    expect(data.practiceData.court).toBe("High Court");
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

    const { PATCH } = await import("@/app/api/matters/[id]/litigation/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/litigation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court: "High Court",
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

  it("should return 400 if matter is not a litigation matter", async () => {
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

    const { PATCH } = await import("@/app/api/matters/[id]/litigation/route");

    const request = new Request(`http://localhost:3000/api/matters/${mockMatterId}/litigation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court: "High Court",
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
    expect(data.message).toContain("not a litigation matter");
  });
});
