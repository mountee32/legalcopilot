import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("Notification preferences API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns preferences shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      preferences: { channelsByType: { system: ["in_app"] } },
      updatedAt: new Date().toISOString(),
    } as any);

    const { GET } = await import("@/app/api/notifications/preferences/route");
    const request = new NextRequest("http://localhost/api/notifications/preferences");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.preferences).toBeTruthy();
  });

  it("PATCH returns preferences shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      preferences: { channelsByType: { system: ["in_app", "email"] } },
      updatedAt: new Date().toISOString(),
    } as any);

    const { PATCH } = await import("@/app/api/notifications/preferences/route");
    const request = new NextRequest("http://localhost/api/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify({ channelsByType: { system: ["in_app", "email"] } }),
    });
    const response = await PATCH(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.preferences.channelsByType.system).toHaveLength(2);
  });
});
