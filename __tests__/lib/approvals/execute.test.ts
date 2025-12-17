import { describe, it, expect } from "vitest";
import { executeApprovalIfSupported } from "@/lib/approvals/execute";

describe("executeApprovalIfSupported", () => {
  it("returns not_executed for unsupported actions", async () => {
    const result = await executeApprovalIfSupported({} as any, {
      id: "a1",
      firmId: "f1",
      action: "email.send",
      proposedPayload: {},
      entityType: null,
      entityId: null,
    });

    expect(result.executionStatus).toBe("not_executed");
  });
});
