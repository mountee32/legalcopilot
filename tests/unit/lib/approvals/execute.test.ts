import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeApprovalIfSupported } from "@/lib/approvals/execute";

// Mock timeline event creation
vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

// Mock email send queue
vi.mock("@/lib/queue/email-send", () => ({
  emailSendQueue: { add: vi.fn().mockResolvedValue({}) },
}));

// Create mock db transaction
function createMockTx(mocks: {
  selectResult?: unknown[];
  insertResult?: unknown[];
  updateResult?: unknown[];
}) {
  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockResolvedValue(mocks.selectResult ?? []);
  const mockInsert = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockReturnThis();
  const mockReturning = vi.fn().mockResolvedValue(mocks.insertResult ?? []);
  const mockUpdate = vi.fn().mockReturnThis();
  const mockSet = vi.fn().mockReturnThis();

  return {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    insert: mockInsert,
    values: mockValues,
    returning: mockReturning,
    update: mockUpdate,
    set: mockSet,
    _mocks: {
      mockSelect,
      mockFrom,
      mockWhere,
      mockLimit,
      mockInsert,
      mockValues,
      mockReturning,
      mockUpdate,
      mockSet,
    },
  } as any;
}

describe("executeApprovalIfSupported", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unsupported actions", () => {
    it("returns not_executed for unsupported actions", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "matter.create", // Unsupported action
        proposedPayload: {},
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("not_executed");
    });

    it("returns not_executed for unknown action types", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "foo.bar.baz",
        proposedPayload: {},
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("not_executed");
    });
  });

  describe("task.create", () => {
    it("returns failed when matterId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "task.create",
        proposedPayload: { tasks: [{ title: "Test" }] }, // Missing matterId
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when tasks array is empty", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "task.create",
        proposedPayload: { matterId: "m1", tasks: [] },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when tasks is not an array", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "task.create",
        proposedPayload: { matterId: "m1", tasks: "not-array" },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when task is missing title", async () => {
      const mockTx = createMockTx({ selectResult: [{ id: "m1" }] }); // Matter exists
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "task.create",
        proposedPayload: {
          matterId: "m1",
          tasks: [{ description: "No title" }],
        },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("missing title");
    });
  });

  describe("time_entry.approve", () => {
    it("returns failed when timeEntryId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "time_entry.approve",
        proposedPayload: {}, // Missing timeEntryId
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Missing timeEntryId");
    });

    it("returns failed when time entry not found", async () => {
      const mockTx = createMockTx({ selectResult: [] }); // Not found
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "time_entry.approve",
        proposedPayload: { timeEntryId: "te1" },
        entityType: "time_entry",
        entityId: "te1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Time entry not found");
    });

    it("returns failed when time entry is not submitted", async () => {
      const mockTx = createMockTx({
        selectResult: [{ id: "te1", matterId: "m1", status: "draft" }], // Wrong status
      });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "time_entry.approve",
        proposedPayload: { timeEntryId: "te1" },
        entityType: "time_entry",
        entityId: "te1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("must be submitted");
    });

    it("uses entityId when payload timeEntryId missing", async () => {
      const mockTx = createMockTx({
        selectResult: [{ id: "te1", matterId: "m1", status: "submitted" }],
      });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "time_entry.approve",
        proposedPayload: {}, // No timeEntryId in payload
        entityType: "time_entry",
        entityId: "te1", // But entityId is set
      });

      // Would execute if DB mock was complete - this tests the fallback logic
      expect(result.executionStatus).not.toBe("failed");
    });
  });

  describe("invoice.send", () => {
    it("returns failed when invoiceId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "invoice.send",
        proposedPayload: {}, // Missing invoiceId
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Missing invoiceId");
    });

    it("returns failed when invoice not found", async () => {
      const mockTx = createMockTx({ selectResult: [] });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "invoice.send",
        proposedPayload: { invoiceId: "inv1" },
        entityType: "invoice",
        entityId: "inv1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invoice not found");
    });

    it("returns failed when invoice is not draft", async () => {
      const mockTx = createMockTx({
        selectResult: [{ id: "inv1", matterId: "m1", status: "sent" }], // Already sent
      });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "invoice.send",
        proposedPayload: { invoiceId: "inv1" },
        entityType: "invoice",
        entityId: "inv1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Only draft invoices");
    });
  });

  describe("calendar_event.create", () => {
    it("returns failed when matterId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "calendar_event.create",
        proposedPayload: { events: [{ title: "Test", startAt: "2024-01-20T10:00:00Z" }] },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when events array is empty", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "calendar_event.create",
        proposedPayload: { matterId: "m1", events: [] },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when event missing title or startAt", async () => {
      const mockTx = createMockTx({ selectResult: [{ id: "m1" }] }); // Matter found
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "calendar_event.create",
        proposedPayload: {
          matterId: "m1",
          events: [{ description: "No title or start" }],
        },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("missing title/startAt");
    });
  });

  describe("template.create", () => {
    it("returns failed when name is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "template.create",
        proposedPayload: {
          draft: { type: "document", content: "Hello" }, // Missing name
        },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when type is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "template.create",
        proposedPayload: {
          draft: { name: "Test", content: "Hello" }, // Missing type
        },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });

    it("returns failed when content is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "template.create",
        proposedPayload: {
          draft: { name: "Test", type: "document" }, // Missing content
        },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Invalid proposed payload");
    });
  });

  describe("template.update", () => {
    it("returns failed when templateId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "template.update",
        proposedPayload: { draft: { name: "Updated" } },
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Missing templateId");
    });

    it("returns failed when template not found", async () => {
      const mockTx = createMockTx({ selectResult: [] });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "template.update",
        proposedPayload: { templateId: "t1", draft: { name: "Updated" } },
        entityType: "template",
        entityId: "t1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Template not found");
    });
  });

  describe("conflict_check.clear", () => {
    it("returns failed when conflictCheckId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "conflict_check.clear",
        proposedPayload: {},
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Missing conflictCheckId");
    });

    it("returns failed when conflict check not found", async () => {
      const mockTx = createMockTx({ selectResult: [] });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "conflict_check.clear",
        proposedPayload: { conflictCheckId: "cc1" },
        entityType: "conflict_check",
        entityId: "cc1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Conflict check not found");
    });
  });

  describe("conflict_check.waive", () => {
    it("returns failed when conflictCheckId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "conflict_check.waive",
        proposedPayload: {},
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Missing conflictCheckId");
    });

    it("returns failed when conflict check not found", async () => {
      const mockTx = createMockTx({ selectResult: [] });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "conflict_check.waive",
        proposedPayload: { conflictCheckId: "cc1" },
        entityType: "conflict_check",
        entityId: "cc1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Conflict check not found");
    });
  });

  describe("signature_request.send", () => {
    it("returns failed when signatureRequestId is missing", async () => {
      const mockTx = createMockTx({});
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "signature_request.send",
        proposedPayload: {},
        entityType: null,
        entityId: null,
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Missing signatureRequestId");
    });

    it("returns failed when signature request not found", async () => {
      const mockTx = createMockTx({ selectResult: [] });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "signature_request.send",
        proposedPayload: { signatureRequestId: "sr1" },
        entityType: "signature_request",
        entityId: "sr1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("Signature request not found");
    });

    it("returns failed when signature request not pending approval", async () => {
      const mockTx = createMockTx({
        selectResult: [{ id: "sr1", status: "completed" }],
      });
      const result = await executeApprovalIfSupported(mockTx, {
        id: "a1",
        firmId: "f1",
        action: "signature_request.send",
        proposedPayload: { signatureRequestId: "sr1" },
        entityType: "signature_request",
        entityId: "sr1",
      });

      expect(result.executionStatus).toBe("failed");
      expect(result.executionError).toContain("not pending approval");
    });
  });
});
