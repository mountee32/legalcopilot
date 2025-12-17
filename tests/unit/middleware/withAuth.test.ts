import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const getSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

describe("withAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session missing", async () => {
    const { withAuth } = await import("@/middleware/withAuth");
    getSession.mockResolvedValueOnce(null);

    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler({ headers: new Headers() } as any, {} as any);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when getSession throws", async () => {
    const { withAuth } = await import("@/middleware/withAuth");
    getSession.mockRejectedValueOnce(new Error("boom"));

    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler({ headers: new Headers() } as any, {} as any);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Authentication failed");
  });

  it("passes user session into handler when authenticated", async () => {
    const { withAuth } = await import("@/middleware/withAuth");
    getSession.mockResolvedValueOnce({ user: { id: "user-1", email: "u@test.example.com" } });

    const inner = vi.fn(async (_req: any, ctx: any) =>
      NextResponse.json({ userId: ctx.user.user.id })
    );
    const handler = withAuth(inner as any);
    const res = await handler({ headers: new Headers() } as any, { params: { id: "x" } } as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.userId).toBe("user-1");
    expect(inner).toHaveBeenCalledTimes(1);
  });
});
