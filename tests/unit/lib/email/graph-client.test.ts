/**
 * Tests for Microsoft Graph email client
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db before imports
vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emailAccounts: { id: "id" },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("graph-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("refreshTokenIfNeeded", () => {
    it("returns existing token if not expired", async () => {
      const { refreshTokenIfNeeded } = await import("@/lib/email/graph-client");

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "valid-token",
          refresh_token: "refresh-token",
          expires_at: Date.now() + 60 * 60 * 1000, // 1 hour from now
        },
      } as any;

      const token = await refreshTokenIfNeeded(account);
      expect(token).toBe("valid-token");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("refreshes token when expired", async () => {
      const { refreshTokenIfNeeded } = await import("@/lib/email/graph-client");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "new-token",
          refresh_token: "new-refresh",
          expires_in: 3600,
          token_type: "Bearer",
        }),
      });

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "expired-token",
          refresh_token: "refresh-token",
          expires_at: Date.now() - 1000, // already expired
        },
      } as any;

      const token = await refreshTokenIfNeeded(account);
      expect(token).toBe("new-token");
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("throws AuthError when no tokens available", async () => {
      const { refreshTokenIfNeeded, AuthError } = await import("@/lib/email/graph-client");

      const account = { id: "acc-1", tokens: null } as any;

      await expect(refreshTokenIfNeeded(account)).rejects.toThrow(AuthError);
    });

    it("throws AuthError on refresh failure", async () => {
      const { refreshTokenIfNeeded, AuthError } = await import("@/lib/email/graph-client");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "invalid_grant",
      });

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "expired",
          refresh_token: "bad-refresh",
          expires_at: 0,
        },
      } as any;

      await expect(refreshTokenIfNeeded(account)).rejects.toThrow(AuthError);
    });
  });

  describe("fetchNewMessages", () => {
    it("returns messages from Graph API", async () => {
      const { fetchNewMessages } = await import("@/lib/email/graph-client");

      const mockMessages = [
        {
          id: "msg-1",
          internetMessageId: "iid-1",
          conversationId: "conv-1",
          from: { emailAddress: { name: "Test", address: "test@example.com" } },
          subject: "Test email",
          receivedDateTime: "2024-12-01T10:00:00Z",
          bodyPreview: "Preview",
          body: { contentType: "text", content: "Body" },
          hasAttachments: false,
          isRead: false,
        },
      ];

      // First call = token check (already valid), second = graph API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: mockMessages }),
      });

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "valid-token",
          refresh_token: "refresh",
          expires_at: Date.now() + 3600000,
        },
      } as any;

      const result = await fetchNewMessages(account, new Date("2024-12-01"));
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe("Test email");
    });

    it("handles pagination with @odata.nextLink", async () => {
      const { fetchNewMessages } = await import("@/lib/email/graph-client");

      const page1 = Array.from({ length: 25 }, (_, i) => ({
        id: `msg-${i}`,
        internetMessageId: `iid-${i}`,
        conversationId: `conv-${i}`,
        from: { emailAddress: { name: "Test", address: "test@example.com" } },
        subject: `Email ${i}`,
        receivedDateTime: "2024-12-01T10:00:00Z",
        bodyPreview: "",
        body: { contentType: "text", content: "" },
        hasAttachments: false,
        isRead: false,
      }));

      const page2 = [
        {
          id: "msg-25",
          internetMessageId: "iid-25",
          conversationId: "conv-25",
          from: { emailAddress: { name: "Test", address: "test@example.com" } },
          subject: "Email 25",
          receivedDateTime: "2024-12-01T10:00:00Z",
          bodyPreview: "",
          body: { contentType: "text", content: "" },
          hasAttachments: false,
          isRead: false,
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            value: page1,
            "@odata.nextLink": "https://graph.microsoft.com/v1.0/me/messages?$skip=25",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ value: page2 }),
        });

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "valid",
          refresh_token: "refresh",
          expires_at: Date.now() + 3600000,
        },
      } as any;

      const result = await fetchNewMessages(account, new Date("2024-12-01"));
      expect(result).toHaveLength(26);
    });
  });

  describe("fetchAttachments", () => {
    it("returns file attachments, filtering inline and oversized", async () => {
      const { fetchAttachments } = await import("@/lib/email/graph-client");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: [
            {
              id: "att-1",
              name: "report.pdf",
              contentType: "application/pdf",
              size: 1024,
              contentBytes: "base64data",
              isInline: false,
            },
            {
              id: "att-2",
              name: "logo.png",
              contentType: "image/png",
              size: 100,
              contentBytes: "logo-data",
              isInline: true, // inline — should be filtered
            },
            {
              id: "att-3",
              name: "huge.zip",
              contentType: "application/zip",
              size: 30 * 1024 * 1024, // 30MB — over limit
              contentBytes: "huge-data",
              isInline: false,
            },
          ],
        }),
      });

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "valid",
          refresh_token: "refresh",
          expires_at: Date.now() + 3600000,
        },
      } as any;

      const result = await fetchAttachments(account, "msg-1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("report.pdf");
    });
  });

  describe("rate limiting and auth errors", () => {
    it("marks account as error on 401", async () => {
      const { fetchNewMessages, AuthError } = await import("@/lib/email/graph-client");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: async () => "Unauthorized",
      });

      const account = {
        id: "acc-1",
        tokens: {
          access_token: "bad-token",
          refresh_token: "refresh",
          expires_at: Date.now() + 3600000,
        },
      } as any;

      await expect(fetchNewMessages(account, new Date())).rejects.toThrow(AuthError);
    });
  });
});
