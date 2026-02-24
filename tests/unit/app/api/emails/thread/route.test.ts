import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/db/schema");

describe("GET /api/emails/[id]/thread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns thread in chronological order", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const threadEmails = [
      {
        id: "email-1",
        threadId: "thread-1",
        subject: "Initial enquiry",
        direction: "inbound",
        createdAt: "2026-02-20T09:00:00.000Z",
      },
      {
        id: "email-2",
        threadId: "thread-1",
        subject: "Re: Initial enquiry",
        direction: "outbound",
        createdAt: "2026-02-20T10:00:00.000Z",
      },
      {
        id: "email-3",
        threadId: "thread-1",
        subject: "Re: Re: Initial enquiry",
        direction: "inbound",
        createdAt: "2026-02-20T11:00:00.000Z",
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async () => ({
      thread: threadEmails,
      currentEmailId: "email-2",
    }));

    const { GET } = await import("@/app/api/emails/[id]/thread/route");
    const request = new NextRequest("http://localhost/api/emails/email-2/thread", {
      method: "GET",
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: "email-2" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.thread).toHaveLength(3);
    expect(json.currentEmailId).toBe("email-2");
    // Verify chronological order
    const timestamps = json.thread.map((e: { createdAt: string }) =>
      new Date(e.createdAt).getTime()
    );
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  it("returns single email when no threadId", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const singleEmail = {
      id: "email-solo",
      threadId: null,
      subject: "Standalone email",
      direction: "inbound",
      createdAt: "2026-02-21T08:00:00.000Z",
    };

    vi.mocked(withFirmDb).mockImplementation(async () => ({
      thread: [singleEmail],
      currentEmailId: "email-solo",
    }));

    const { GET } = await import("@/app/api/emails/[id]/thread/route");
    const request = new NextRequest("http://localhost/api/emails/email-solo/thread", {
      method: "GET",
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: "email-solo" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.thread).toHaveLength(1);
    expect(json.thread[0].id).toBe("email-solo");
    expect(json.currentEmailId).toBe("email-solo");
  });

  it("includes both inbound and outbound emails in thread", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mixedThread = [
      {
        id: "email-a",
        threadId: "thread-2",
        subject: "Client question",
        direction: "inbound",
        createdAt: "2026-02-22T09:00:00.000Z",
      },
      {
        id: "email-b",
        threadId: "thread-2",
        subject: "Re: Client question",
        direction: "outbound",
        createdAt: "2026-02-22T10:00:00.000Z",
      },
      {
        id: "email-c",
        threadId: "thread-2",
        subject: "Re: Re: Client question",
        direction: "inbound",
        createdAt: "2026-02-22T11:00:00.000Z",
      },
    ];

    vi.mocked(withFirmDb).mockImplementation(async () => ({
      thread: mixedThread,
      currentEmailId: "email-a",
    }));

    const { GET } = await import("@/app/api/emails/[id]/thread/route");
    const request = new NextRequest("http://localhost/api/emails/email-a/thread", {
      method: "GET",
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: "email-a" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    const directions = json.thread.map((e: { direction: string }) => e.direction);
    expect(directions).toContain("inbound");
    expect(directions).toContain("outbound");
    expect(directions).toEqual(["inbound", "outbound", "inbound"]);
  });

  it("returns 404 for missing email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async () => {
      throw new NotFoundError("Email not found");
    });

    const { GET } = await import("@/app/api/emails/[id]/thread/route");
    const request = new NextRequest("http://localhost/api/emails/nonexistent/thread", {
      method: "GET",
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(404);
  });
});
