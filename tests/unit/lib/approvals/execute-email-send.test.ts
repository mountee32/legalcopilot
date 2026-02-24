import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/schema");
vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/queue/email-send", () => ({
  emailSendQueue: { add: vi.fn().mockResolvedValue({}) },
}));

const approval = {
  id: "apr-1",
  firmId: "f-1",
  action: "email.send" as const,
  proposedPayload: { emailId: "e-1", subject: "Test", contentHash: "hash123" },
  entityType: "email" as const,
  entityId: "e-1",
};

const emailRow = {
  id: "e-1",
  matterId: "m-1",
  status: "pending",
  direction: "outbound",
  contentHash: "hash123",
};

function buildTx(selectResult: any = [emailRow]) {
  const mockLimit = vi.fn().mockResolvedValue(selectResult);
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  return { select: mockSelect, update: mockUpdate, _mockSet: mockSet } as any;
}

describe("executeApprovalIfSupported — email.send", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("enqueues send job after approval", async () => {
    const { executeApprovalIfSupported } = await import("@/lib/approvals/execute");
    const { emailSendQueue } = await import("@/lib/queue/email-send");
    const tx = buildTx();

    const result = await executeApprovalIfSupported(tx, approval as any);

    expect(emailSendQueue.add).toHaveBeenCalledWith("email:send", {
      emailId: "e-1",
      firmId: "f-1",
      approvalRequestId: "apr-1",
    });
    expect(result.executionStatus).toBe("executed");
  });

  it("validates outbound and pending status", async () => {
    const { executeApprovalIfSupported } = await import("@/lib/approvals/execute");
    const tx = buildTx([{ ...emailRow, direction: "inbound" }]);

    const result = await executeApprovalIfSupported(tx, approval as any);

    expect(result.executionStatus).toBe("failed");
  });

  it("checks content hash mismatch", async () => {
    const { executeApprovalIfSupported } = await import("@/lib/approvals/execute");
    const tx = buildTx([{ ...emailRow, contentHash: "different-hash" }]);

    const result = await executeApprovalIfSupported(tx, approval as any);

    expect(result.executionStatus).toBe("failed");
  });

  it("creates timeline event when matterId present", async () => {
    const { executeApprovalIfSupported } = await import("@/lib/approvals/execute");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");
    const tx = buildTx();

    await executeApprovalIfSupported(tx, approval as any);

    expect(createTimelineEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ matterId: "m-1", type: "email_sent" })
    );
  });

  it("returns failed for missing emailId", async () => {
    const { executeApprovalIfSupported } = await import("@/lib/approvals/execute");
    const tx = buildTx();
    const noEmailApproval = {
      ...approval,
      proposedPayload: {},
      entityId: null,
    };

    const result = await executeApprovalIfSupported(tx, noEmailApproval as any);

    expect(result.executionStatus).toBe("failed");
  });
});
