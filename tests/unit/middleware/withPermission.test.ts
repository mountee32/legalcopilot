import { describe, it, expect, vi, beforeEach } from "vitest";
import { withPermission } from "@/middleware/withPermission";
import { ForbiddenError } from "@/middleware/withErrorHandler";

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/auth/rbac", () => ({
  getUserPermissions: vi.fn(async () => ["cases:read"]),
  hasPermission: (permissions: string[], required: string) => permissions.includes(required),
}));

describe("withPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ForbiddenError when missing permission", async () => {
    const handler = withPermission("firm:settings")(async () => new Response("ok"));
    await expect(
      handler({} as any, { user: { user: { id: "user-1" } } } as any)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("passes through when permission present", async () => {
    const { getUserPermissions } = await import("@/lib/auth/rbac");
    vi.mocked(getUserPermissions).mockResolvedValueOnce(["firm:settings"]);

    const handler = withPermission("firm:settings")(async () => new Response("ok"));
    const response = await handler({} as any, { user: { user: { id: "user-1" } } } as any);
    expect(response.status).toBe(200);
  });
});
