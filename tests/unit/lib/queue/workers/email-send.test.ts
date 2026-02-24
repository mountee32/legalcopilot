/**
 * Tests for email send worker — processEmailSend
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Must mock bullmq before importing the worker (Worker constructor runs at import)
vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation(() => ({ on: vi.fn() })),
  Queue: vi.fn().mockImplementation(() => ({ add: vi.fn() })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emails: { id: "id", firmId: "firm_id", status: "status" },
  emailAccounts: { id: "id", firmId: "firm_id", userId: "user_id", status: "status" },
  approvalRequests: { id: "id" },
}));

vi.mock("@/lib/email/graph-client", () => ({
  sendEmail: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "AuthError";
    }
  },
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/queue/email-send", () => ({
  emailSendQueue: { add: vi.fn() },
}));

import { db } from "@/lib/db";
import { sendEmail, AuthError } from "@/lib/email/graph-client";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { processEmailSend } from "@/lib/queue/workers/email-send";
import type { Job } from "bullmq";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const emailRow = {
  id: "e1",
  firmId: "f1",
  status: "sent",
  createdBy: "u1",
  matterId: "m1",
  subject: "Test",
  toAddresses: [{ email: "to@test.com" }],
  ccAddresses: [],
  bccAddresses: [],
  bodyText: "Hello",
  bodyHtml: null,
  inReplyTo: null,
};

const accountRow = {
  id: "acc1",
  firmId: "f1",
  userId: "u1",
  status: "connected",
  emailAddress: "from@test.com",
  tokens: {
    access_token: "tok",
    refresh_token: "rtok",
    expires_at: Date.now() + 300000,
  },
};

const makeJob = () =>
  ({ data: { emailId: "e1", firmId: "f1", approvalRequestId: "a1" } }) as unknown as Job;

// ---------------------------------------------------------------------------
// Helpers for chaining drizzle mocks
// ---------------------------------------------------------------------------

function mockSelectReturning(...resultSets: unknown[][]) {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(
    () =>
      ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => {
              const result = resultSets[callCount] ?? [];
              callCount++;
              return Promise.resolve(result);
            }),
          })),
        })),
      }) as any
  );
}

function mockUpdate() {
  vi.mocked(db.update).mockImplementation(
    () =>
      ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      }) as any
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("processEmailSend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delivers email successfully", async () => {
    mockSelectReturning([emailRow], [accountRow]);
    mockUpdate();
    vi.mocked(sendEmail).mockResolvedValue(undefined as any);

    await processEmailSend(makeJob());

    expect(sendEmail).toHaveBeenCalledWith(
      accountRow,
      expect.objectContaining({
        subject: "Test",
        toRecipients: [{ emailAddress: { name: undefined, address: "to@test.com" } }],
      })
    );
  });

  it("updates email status to delivered", async () => {
    mockSelectReturning([emailRow], [accountRow]);
    mockUpdate();
    vi.mocked(sendEmail).mockResolvedValue(undefined as any);

    await processEmailSend(makeJob());

    expect(db.update).toHaveBeenCalled();
    // First update call is for setting status to "delivered"
    const updateCall = vi.mocked(db.update).mock.results[0];
    const setCall = (updateCall.value as any).set;
    expect(setCall).toHaveBeenCalledWith(expect.objectContaining({ status: "delivered" }));
  });

  it("creates timeline event on success", async () => {
    mockSelectReturning([emailRow], [accountRow]);
    mockUpdate();
    vi.mocked(sendEmail).mockResolvedValue(undefined as any);

    await processEmailSend(makeJob());

    expect(createTimelineEvent).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        firmId: "f1",
        matterId: "m1",
        type: "email_sent",
      })
    );
  });

  it("throws if email not found", async () => {
    mockSelectReturning([]);
    mockUpdate();

    await expect(processEmailSend(makeJob())).rejects.toThrow("Email e1 not found for firm f1");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("handles auth error by marking failed", async () => {
    mockSelectReturning([emailRow], [accountRow]);
    mockUpdate();
    vi.mocked(sendEmail).mockRejectedValue(new AuthError("token expired"));

    // Should not throw — auth errors are handled gracefully
    await processEmailSend(makeJob());

    // markEmailFailed does two updates: emails + approvalRequests
    expect(db.update).toHaveBeenCalledTimes(2);
  });

  it("retries on transient error", async () => {
    mockSelectReturning([emailRow], [accountRow]);
    mockUpdate();
    vi.mocked(sendEmail).mockRejectedValue(new Error("network timeout"));

    await expect(processEmailSend(makeJob())).rejects.toThrow("network timeout");
  });

  it("marks permanent failure when no email account found", async () => {
    // Email found, but no connected account
    mockSelectReturning([emailRow], []);
    mockUpdate();

    await processEmailSend(makeJob());

    // markEmailFailed updates emails (failed) + approvalRequests (executionStatus=failed)
    expect(db.update).toHaveBeenCalledTimes(2);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("skips if already delivered", async () => {
    mockSelectReturning([{ ...emailRow, status: "delivered" }]);
    mockUpdate();

    await processEmailSend(makeJob());

    expect(sendEmail).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});
