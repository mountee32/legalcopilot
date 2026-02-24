import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "import-1" }),
      user: { user: { id: "user-1" } },
    }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/queue/email-poll", () => ({
  emailPollQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

describe("POST /api/email-imports/[id]/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("retries a failed import", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return { success: true, importId: "import-1" };
    });

    const { POST } = await import("@/app/api/email-imports/[id]/retry/route");
    const request = new Request("http://localhost:3000/api/email-imports/import-1/retry", {
      method: "POST",
    });
    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("rejects retry of non-failed import", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Only failed imports can be retried");
    });

    const { POST } = await import("@/app/api/email-imports/[id]/retry/route");
    const request = new Request("http://localhost:3000/api/email-imports/import-1/retry", {
      method: "POST",
    });
    const response = await POST(request, {} as any);

    expect(response.status).toBe(400);
  });

  it("returns 404 for non-existent import", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new NotFoundError("Email import not found");
    });

    const { POST } = await import("@/app/api/email-imports/[id]/retry/route");
    const request = new Request("http://localhost:3000/api/email-imports/nonexistent/retry", {
      method: "POST",
    });
    const response = await POST(request, {} as any);

    expect(response.status).toBe(404);
  });
});
