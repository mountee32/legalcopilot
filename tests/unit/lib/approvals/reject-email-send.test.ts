import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/schema");

const approval = {
  id: "apr-1",
  firmId: "f-1",
  action: "email.send" as const,
  proposedPayload: { emailId: "e-1" },
  entityType: "email" as const,
  entityId: "e-1",
};

function buildTx() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  return { update: mockUpdate, _mockSet: mockSet, _mockWhere: mockWhere } as any;
}

describe("applyRejectionSideEffectsIfSupported — email.send", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("reverts email to draft", async () => {
    const { applyRejectionSideEffectsIfSupported } = await import("@/lib/approvals/reject");
    const tx = buildTx();

    await applyRejectionSideEffectsIfSupported(tx, approval as any);

    expect(tx.update).toHaveBeenCalled();
    expect(tx._mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: "draft" }));
  });

  it("clears approvalRequestId", async () => {
    const { applyRejectionSideEffectsIfSupported } = await import("@/lib/approvals/reject");
    const tx = buildTx();

    await applyRejectionSideEffectsIfSupported(tx, approval as any);

    expect(tx._mockSet).toHaveBeenCalledWith(expect.objectContaining({ approvalRequestId: null }));
  });

  it("handles missing emailId gracefully", async () => {
    const { applyRejectionSideEffectsIfSupported } = await import("@/lib/approvals/reject");
    const tx = buildTx();
    const noEntityApproval = { ...approval, entityId: null };

    await expect(
      applyRejectionSideEffectsIfSupported(tx, noEntityApproval as any)
    ).resolves.not.toThrow();

    expect(tx.update).not.toHaveBeenCalled();
  });
});
