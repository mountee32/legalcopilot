import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "import-1" }),
      user: { user: { id: "user-1", email: "test@test.com", name: "Test" } },
    }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/email/graph-client", () => ({
  fetchAttachments: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/storage/minio", () => ({
  uploadFile: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/queue/pipeline", () => ({
  startPipeline: vi.fn(),
}));

describe("Email Import [id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("GET /api/email-imports/[id]", () => {
    it("returns import detail", async () => {
      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
        return {
          id: "import-1",
          firmId: "firm-1",
          fromAddress: "test@example.com",
          subject: "Test",
          status: "completed",
        };
      });

      const { GET } = await import("@/app/api/email-imports/[id]/route");
      const request = new Request("http://localhost:3000/api/email-imports/import-1");
      const response = await GET(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("import-1");
    });

    it("returns 404 for non-existent import", async () => {
      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
        throw new NotFoundError("Email import not found");
      });

      const { GET } = await import("@/app/api/email-imports/[id]/route");
      const request = new Request("http://localhost:3000/api/email-imports/nonexistent");
      const response = await GET(request, {} as any);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/email-imports/[id]", () => {
    it("routes unmatched import to a matter", async () => {
      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
        return {
          id: "import-1",
          firmId: "firm-1",
          matterId: "00000000-0000-0000-0000-000000000001",
          matchMethod: "manual",
          status: "matched",
        };
      });

      const { PATCH } = await import("@/app/api/email-imports/[id]/route");
      const request = new Request("http://localhost:3000/api/email-imports/import-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId: "00000000-0000-0000-0000-000000000001" }),
      });
      const response = await PATCH(request, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.matchMethod).toBe("manual");
    });

    it("rejects routing of non-unmatched import", async () => {
      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
        throw new ValidationError("Only unmatched imports can be manually routed");
      });

      const { PATCH } = await import("@/app/api/email-imports/[id]/route");
      const request = new Request("http://localhost:3000/api/email-imports/import-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId: "00000000-0000-0000-0000-000000000001" }),
      });
      const response = await PATCH(request, {} as any);

      expect(response.status).toBe(400);
    });

    it("returns 404 when import not found for routing", async () => {
      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
        throw new NotFoundError("Email import not found");
      });

      const { PATCH } = await import("@/app/api/email-imports/[id]/route");
      const request = new Request("http://localhost:3000/api/email-imports/nonexistent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId: "00000000-0000-0000-0000-000000000001" }),
      });
      const response = await PATCH(request, {} as any);

      expect(response.status).toBe(404);
    });

    it("validates matterId is required in request body", async () => {
      const { PATCH } = await import("@/app/api/email-imports/[id]/route");
      const request = new Request("http://localhost:3000/api/email-imports/import-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const response = await PATCH(request, {} as any);

      // ZodError caught by withErrorHandler → 400
      expect(response.status).toBe(400);
    });
  });
});
