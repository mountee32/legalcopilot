import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      params: Promise.resolve({ id: "acc-1" }),
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

describe("POST /api/integrations/email/accounts/[id]/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("triggers sync for connected account", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return { success: true, accountId: "acc-1" };
    });

    const { POST } = await import("@/app/api/integrations/email/accounts/[id]/sync/route");
    const request = new Request(
      "http://localhost:3000/api/integrations/email/accounts/acc-1/sync",
      { method: "POST" }
    );
    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 404 for non-existent account", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new NotFoundError("Email account not found");
    });

    const { POST } = await import("@/app/api/integrations/email/accounts/[id]/sync/route");
    const request = new Request(
      "http://localhost:3000/api/integrations/email/accounts/nonexistent/sync",
      { method: "POST" }
    );
    const response = await POST(request, {} as any);

    expect(response.status).toBe(404);
  });

  it("rejects sync of disconnected account", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Only connected accounts can be synced");
    });

    const { POST } = await import("@/app/api/integrations/email/accounts/[id]/sync/route");
    const request = new Request(
      "http://localhost:3000/api/integrations/email/accounts/acc-1/sync",
      { method: "POST" }
    );
    const response = await POST(request, {} as any);

    expect(response.status).toBe(400);
  });
});
