import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/litigation/bundles/route";
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

describe("POST /api/litigation/bundles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenancyModule.getOrCreateFirmIdForUser).mockResolvedValue(mockFirmId);
  });

  it("should create a bundle successfully", async () => {
    const mockMatter = {
      id: mockMatterId,
      firmId: mockFirmId,
      practiceArea: "litigation",
      practiceData: {},
    };

    const documentIds = ["doc-1", "doc-2", "doc-3"];

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
            practiceData: { bundleDocumentIds: documentIds },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds,
        title: "Trial Bundle",
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bundleDocumentIds).toEqual(documentIds);
    expect(data.message).toContain("3 document(s)");
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

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "non-existent",
        documentIds: ["doc-1"],
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Matter not found");
  });

  it("should return 400 if matter is not a litigation matter", async () => {
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

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: ["doc-1"],
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not a litigation matter");
  });

  it("should return 400 if documentIds is empty", async () => {
    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: [],
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should work without title", async () => {
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
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            ...mockMatter,
            practiceData: { bundleDocumentIds: ["doc-1"] },
          },
        ]),
      };
      return callback(mockTx as any);
    });

    const request = new Request("http://localhost:3000/api/litigation/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: mockMatterId,
        documentIds: ["doc-1"],
        // No title provided
      }),
    });

    const response = await POST(request, { params: {}, user: mockUser } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
