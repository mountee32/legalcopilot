import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

const mockAccount = {
  id: "acc-1",
  firmId: "firm-1",
  tokens: {
    access_token: "valid-token",
    refresh_token: "refresh-tok",
    expires_at: Date.now() + 3_600_000, // 1 hour — well above 5-min threshold
  },
  emailAddress: "test@example.com",
  status: "connected",
};

const baseMessage = {
  subject: "Test Subject",
  body: { contentType: "HTML" as const, content: "<p>Hello</p>" },
  toRecipients: [{ emailAddress: { name: "Bob", address: "bob@example.com" } }],
};

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 202,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers(),
      })
    );
  });

  it("sends basic email with correct payload structure", async () => {
    const mod = await import("@/lib/email/graph-client");
    await mod.sendEmail(mockAccount as any, baseMessage);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const sendCall = calls.find(
      (c: any[]) => typeof c[0] === "string" && c[0].includes("/sendMail")
    );
    expect(sendCall).toBeDefined();

    const body = JSON.parse(sendCall![1].body);
    expect(body.message.subject).toBe("Test Subject");
    expect(body.message.body.contentType).toBe("HTML");
    expect(body.message.toRecipients).toEqual([
      { emailAddress: { name: "Bob", address: "bob@example.com" } },
    ]);
  });

  it("sends reply with In-Reply-To header", async () => {
    const mod = await import("@/lib/email/graph-client");
    const replyMessage = { ...baseMessage, internetMessageId: "<original@example.com>" };

    await mod.sendEmail(mockAccount as any, replyMessage);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const sendCall = calls.find(
      (c: any[]) => typeof c[0] === "string" && c[0].includes("/sendMail")
    );
    const body = JSON.parse(sendCall![1].body);
    expect(body.message.internetMessageHeaders).toContainEqual({
      name: "In-Reply-To",
      value: "<original@example.com>",
    });
  });

  it("succeeds on 202 Accepted without throwing", async () => {
    const mod = await import("@/lib/email/graph-client");
    await expect(mod.sendEmail(mockAccount as any, baseMessage)).resolves.toBeUndefined();
  });

  it("throws AuthError on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
        text: async () => "Unauthorized",
        headers: new Headers(),
      })
    );

    const mod = await import("@/lib/email/graph-client");
    await expect(mod.sendEmail(mockAccount as any, baseMessage)).rejects.toThrow(/Graph API 401/);
  });

  it("retries on 429 rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ "Retry-After": "0" }),
          json: async () => ({}),
          text: async () => "Rate limited",
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 202,
          json: async () => ({}),
          text: async () => "",
          headers: new Headers(),
        })
    );

    const mod = await import("@/lib/email/graph-client");
    await expect(mod.sendEmail(mockAccount as any, baseMessage)).resolves.toBeUndefined();

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    // Should have called fetch at least twice (retry)
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it("throws immediately on 400 permanent error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
        text: async () => "Bad Request",
        headers: new Headers(),
      })
    );

    const mod = await import("@/lib/email/graph-client");
    await expect(mod.sendEmail(mockAccount as any, baseMessage)).rejects.toThrow();
  });

  it("includes CC and BCC recipients in payload", async () => {
    const mod = await import("@/lib/email/graph-client");
    const messageWithCcBcc = {
      ...baseMessage,
      ccRecipients: [{ emailAddress: { name: "Carol", address: "carol@example.com" } }],
      bccRecipients: [{ emailAddress: { address: "secret@example.com" } }],
    };

    await mod.sendEmail(mockAccount as any, messageWithCcBcc);

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const sendCall = calls.find(
      (c: any[]) => typeof c[0] === "string" && c[0].includes("/sendMail")
    );
    const body = JSON.parse(sendCall![1].body);
    expect(body.message.ccRecipients).toEqual([
      { emailAddress: { name: "Carol", address: "carol@example.com" } },
    ]);
    expect(body.message.bccRecipients).toEqual([
      { emailAddress: { address: "secret@example.com" } },
    ]);
  });
});
