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

describe("POST /api/litigation/bundles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a bundle successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "litigation",
      practiceData: {},
    };

    const documentIds = [
      "223e4567-e89b-12d3-a456-426614174001",
      "223e4567-e89b-12d3-a456-426614174002",
      "223e4567-e89b-12d3-a456-426614174003",
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
            practiceData: { bundleDocumentIds: documentIds },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/litigation/bundles/route");

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds,
        title: "Trial Bundle",
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bundleDocumentIds).toEqual(documentIds);
    expect(data.message).toContain("3 document(s)");
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

    const { POST } = await import("@/app/api/litigation/bundles/route");

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: ["223e4567-e89b-12d3-a456-426614174001"],
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
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

    const { POST } = await import("@/app/api/litigation/bundles/route");

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: ["223e4567-e89b-12d3-a456-426614174001"],
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("not a litigation matter");
  });

  it("should return 400 if documentIds is empty", async () => {
    const { POST } = await import("@/app/api/litigation/bundles/route");

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: [],
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should work without title", async () => {
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
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            ...mockMatter,
            practiceData: { bundleDocumentIds: ["223e4567-e89b-12d3-a456-426614174001"] },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/litigation/bundles/route");

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: ["223e4567-e89b-12d3-a456-426614174001"],
        // No title provided
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
