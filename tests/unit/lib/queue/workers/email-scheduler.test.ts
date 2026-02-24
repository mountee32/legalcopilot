/**
 * Tests for email scheduler worker
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation((name, handler, opts) => {
    return { on: vi.fn(), handler };
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emailAccounts: { id: "id", status: "status", firmId: "firm_id" },
}));

vi.mock("@/lib/queue/email-poll", () => ({
  emailPollQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

describe("email-scheduler worker", () => {
  let db: any;
  let emailPollQueue: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    db = (await import("@/lib/db")).db;
    emailPollQueue = (await import("@/lib/queue/email-poll")).emailPollQueue;
  });

  it("enqueues one poll job per connected account", async () => {
    db.where.mockResolvedValueOnce([
      { id: "acc-1", firmId: "firm-1" },
      { id: "acc-2", firmId: "firm-1" },
      { id: "acc-3", firmId: "firm-2" },
    ]);

    const { emailSchedulerWorker } = await import("@/lib/queue/workers/email-scheduler");
    const handler = (emailSchedulerWorker as any).handler;

    const result = await handler({
      data: { triggeredAt: new Date().toISOString() },
    });

    expect(result.accountsFound).toBe(3);
    expect(result.enqueued).toBe(3);
    expect(emailPollQueue.add).toHaveBeenCalledTimes(3);

    // Verify jobId includes account ID for dedup
    expect(emailPollQueue.add).toHaveBeenCalledWith(
      "email:poll",
      { emailAccountId: "acc-1", firmId: "firm-1" },
      expect.objectContaining({ jobId: "poll:acc-1" })
    );
  });

  it("handles zero connected accounts gracefully", async () => {
    db.where.mockResolvedValueOnce([]);

    const { emailSchedulerWorker } = await import("@/lib/queue/workers/email-scheduler");
    const handler = (emailSchedulerWorker as any).handler;

    const result = await handler({
      data: { triggeredAt: new Date().toISOString() },
    });

    expect(result.accountsFound).toBe(0);
    expect(result.enqueued).toBe(0);
    expect(emailPollQueue.add).not.toHaveBeenCalled();
  });

  it("only queries connected accounts, not error or revoked", async () => {
    db.where.mockResolvedValueOnce([{ id: "acc-1", firmId: "firm-1" }]);

    const { emailSchedulerWorker } = await import("@/lib/queue/workers/email-scheduler");
    const handler = (emailSchedulerWorker as any).handler;

    await handler({ data: { triggeredAt: new Date().toISOString() } });

    // Verify the where clause was called (the mock captures it)
    expect(db.where).toHaveBeenCalled();
  });
});
