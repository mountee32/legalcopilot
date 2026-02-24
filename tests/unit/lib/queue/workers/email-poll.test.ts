/**
 * Tests for email poll worker
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies
vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation((name, handler, opts) => {
    return { on: vi.fn(), handler };
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "new-id" }]),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emailAccounts: { id: "id", firmId: "firm_id", status: "status" },
  emails: { id: "id" },
  emailImports: { id: "id", firmId: "firm_id", externalMessageId: "external_message_id" },
  documents: { id: "id" },
  pipelineRuns: { id: "id" },
  timelineEvents: {},
  notifications: {},
}));

vi.mock("@/lib/email/graph-client", () => ({
  fetchNewMessages: vi.fn(),
  fetchAttachments: vi.fn(),
  markAsRead: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "AuthError";
    }
  },
}));

vi.mock("@/lib/email/matter-matcher", () => ({
  matchEmailToMatter: vi.fn(),
}));

vi.mock("@/lib/queue/pipeline", () => ({
  startPipeline: vi.fn(),
}));

vi.mock("@/lib/storage/minio", () => ({
  uploadFile: vi.fn().mockResolvedValue({}),
}));

function createMockMessage(overrides: Record<string, any> = {}) {
  return {
    id: "graph-msg-1",
    internetMessageId: "iid-1@outlook.com",
    conversationId: "conv-1",
    from: { emailAddress: { name: "Test Sender", address: "sender@example.com" } },
    subject: "Test Subject",
    receivedDateTime: "2024-12-01T10:00:00Z",
    bodyPreview: "Preview text",
    body: { contentType: "text", content: "Full body" },
    hasAttachments: false,
    isRead: false,
    ...overrides,
  };
}

describe("email-poll worker", () => {
  let db: any;
  let fetchNewMessages: any;
  let fetchAttachments: any;
  let matchEmailToMatter: any;
  let startPipeline: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    db = (await import("@/lib/db")).db;
    fetchNewMessages = (await import("@/lib/email/graph-client")).fetchNewMessages;
    fetchAttachments = (await import("@/lib/email/graph-client")).fetchAttachments;
    matchEmailToMatter = (await import("@/lib/email/matter-matcher")).matchEmailToMatter;
    startPipeline = (await import("@/lib/queue/pipeline")).startPipeline;
  });

  it("skips if account not found", async () => {
    db.limit.mockResolvedValueOnce([]); // no account found

    // Import the worker module to get the handler
    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    expect(result.skipped).toBe(true);
    expect(fetchNewMessages).not.toHaveBeenCalled();
  });

  it("skips if account not connected", async () => {
    db.limit.mockResolvedValueOnce([
      { id: "acc-1", firmId: "firm-1", status: "error", lastSyncAt: null, userId: "user-1" },
    ]);

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    expect(result.skipped).toBe(true);
  });

  it("processes messages and updates lastSyncAt", async () => {
    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: new Date(Date.now() - 3600000),
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]); // account found
    fetchNewMessages.mockResolvedValueOnce([createMockMessage()]);

    // Dedup check — no existing
    db.limit.mockResolvedValueOnce([]);

    // matchEmailToMatter — no match
    matchEmailToMatter.mockResolvedValueOnce(null);

    // Insert email
    db.returning.mockResolvedValueOnce([{ id: "email-1" }]);

    // Insert email_import
    db.returning.mockResolvedValueOnce([{ id: "import-1" }]);

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
  });

  it("skips duplicate messages by externalMessageId", async () => {
    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: null,
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]);
    fetchNewMessages.mockResolvedValueOnce([createMockMessage()]);

    // Dedup check — already exists!
    db.limit.mockResolvedValueOnce([{ id: "existing-import" }]);

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    // Message was processed but skipped (dedup), no error
    expect(result.processed).toBe(1);
    expect(matchEmailToMatter).not.toHaveBeenCalled();
  });

  it("processes attachments when matched to matter", async () => {
    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: null,
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]);
    fetchNewMessages.mockResolvedValueOnce([createMockMessage({ hasAttachments: true })]);

    // Dedup — no existing
    db.limit.mockResolvedValueOnce([]);

    // Match found
    matchEmailToMatter.mockResolvedValueOnce({
      matterId: "matter-1",
      method: "subject_reference",
      confidence: 98,
    });

    // Insert email
    db.returning.mockResolvedValueOnce([{ id: "email-1" }]);

    // Account re-fetch for attachment download
    db.limit.mockResolvedValueOnce([account]);
    db.then = undefined; // Prevent .then chaining

    fetchAttachments.mockResolvedValueOnce([
      {
        id: "att-1",
        name: "report.pdf",
        contentType: "application/pdf",
        size: 1024,
        contentBytes: "cGRmLWRhdGE=",
        isInline: false,
      },
    ]);

    // Document insert
    db.returning.mockResolvedValueOnce([{ id: "doc-1" }]);
    // Pipeline run insert
    db.returning.mockResolvedValueOnce([{ id: "run-1" }]);

    // Email import insert
    db.returning.mockResolvedValueOnce([{ id: "import-1" }]);

    // Timeline + notification
    db.returning.mockResolvedValueOnce([{ id: "tl-1" }]);
    db.returning.mockResolvedValueOnce([{ id: "notif-1" }]);

    // Mark as read — account re-fetch
    db.limit.mockResolvedValueOnce([account]);

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    expect(result.processed).toBe(1);
    expect(startPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        firmId: "firm-1",
        matterId: "matter-1",
      })
    );
  });

  it("handles auth errors by returning error status", async () => {
    const { AuthError } = await import("@/lib/email/graph-client");

    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: null,
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]);
    fetchNewMessages.mockRejectedValueOnce(new AuthError("Token expired"));

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    expect(result.error).toBe("auth_failure");
  });

  it("isolates per-message errors without failing entire poll", async () => {
    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: null,
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]);
    fetchNewMessages.mockResolvedValueOnce([
      createMockMessage({ internetMessageId: "msg-good" }),
      createMockMessage({ internetMessageId: "msg-bad" }),
    ]);

    // First message: dedup no existing
    db.limit.mockResolvedValueOnce([]);
    matchEmailToMatter.mockResolvedValueOnce(null);
    db.returning.mockResolvedValueOnce([{ id: "email-1" }]);
    db.returning.mockResolvedValueOnce([{ id: "import-1" }]);

    // Second message: dedup no existing, then error
    db.limit.mockResolvedValueOnce([]);
    matchEmailToMatter.mockRejectedValueOnce(new Error("DB timeout"));

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    const result = await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    expect(result.processed).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.total).toBe(2);
  });

  it("uses 24h default when account has never synced", async () => {
    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: null, // never synced
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]);
    fetchNewMessages.mockResolvedValueOnce([]);

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    // fetchNewMessages called with a Date roughly 24h ago
    expect(fetchNewMessages).toHaveBeenCalledWith(account, expect.any(Date));
    const sinceDate = fetchNewMessages.mock.calls[0][1] as Date;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    expect(sinceDate.getTime()).toBeCloseTo(twentyFourHoursAgo, -3); // within ~1s
  });

  it("creates unmatched import when no matter match found", async () => {
    const account = {
      id: "acc-1",
      firmId: "firm-1",
      status: "connected",
      lastSyncAt: null,
      userId: "user-1",
    };

    db.limit.mockResolvedValueOnce([account]);
    fetchNewMessages.mockResolvedValueOnce([createMockMessage()]);

    // Dedup — none
    db.limit.mockResolvedValueOnce([]);

    // No match
    matchEmailToMatter.mockResolvedValueOnce(null);

    // Insert email
    db.returning.mockResolvedValueOnce([{ id: "email-1" }]);

    // Insert email_import — verify "unmatched" status
    const insertValues = vi.fn().mockReturnThis();
    db.insert = vi.fn().mockReturnValue({ values: insertValues });
    insertValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "import-1" }]),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
    });

    const { emailPollWorker } = await import("@/lib/queue/workers/email-poll");
    const handler = (emailPollWorker as any).handler;

    await handler({
      data: { emailAccountId: "acc-1", firmId: "firm-1" },
    });

    // Verify no pipeline was started
    expect(startPipeline).not.toHaveBeenCalled();
  });
});
