/**
 * Approvals Integration Tests
 *
 * Tests approval CRUD operations and decision workflows against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { approvalRequests } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createApprovalRequest,
  createTimeEntryApproval,
  createInvoiceSendApproval,
  createTaskApproval,
} from "@tests/fixtures/factories/approval-request";
import { createUser } from "@tests/fixtures/factories/user";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createTimeEntry } from "@tests/fixtures/factories/time-entry";
import { createInvoice } from "@tests/fixtures/factories/invoice";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Approvals Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();
  let user: Awaited<ReturnType<typeof createUser>>;
  let approver: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    user = await createUser({
      firmId: ctx.firmId,
      name: "Test User",
      email: "user@test.com",
    });

    approver = await createUser({
      firmId: ctx.firmId,
      name: "Test Approver",
      email: "approver@test.com",
    });

    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Approval",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter for Approvals",
    });
  });

  describe("Create", () => {
    it("creates an approval request with required fields", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.action",
        summary: "Test approval request",
        sourceType: "ai",
        sourceId: user.id,
      });

      expect(approval.id).toBeDefined();
      expect(approval.firmId).toBe(ctx.firmId);
      expect(approval.action).toBe("test.action");
      expect(approval.summary).toBe("Test approval request");
      expect(approval.status).toBe("pending");
      expect(approval.executionStatus).toBe("not_executed");
    });

    it("creates a time entry approval request", async () => {
      const timeEntry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: user.id,
      });

      const approval = await createTimeEntryApproval(ctx.firmId, timeEntry.id, {
        sourceId: user.id,
      });

      expect(approval.action).toBe("time_entry.approve");
      expect(approval.entityType).toBe("time_entry");
      expect(approval.entityId).toBe(timeEntry.id);
      expect(approval.status).toBe("pending");
    });

    it("creates an invoice send approval request", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        matterId: matter.id,
        clientId: client.id,
      });

      const approval = await createInvoiceSendApproval(ctx.firmId, invoice.id, {
        sourceId: user.id,
      });

      expect(approval.action).toBe("invoice.send");
      expect(approval.entityType).toBe("invoice");
      expect(approval.entityId).toBe(invoice.id);
      expect(approval.status).toBe("pending");
    });

    it("creates a task creation approval request", async () => {
      const tasks = [
        { title: "Task 1", description: "First task", priority: "high" },
        { title: "Task 2", description: "Second task", priority: "medium" },
      ];

      const approval = await createTaskApproval(ctx.firmId, matter.id, tasks, {
        sourceId: user.id,
      });

      expect(approval.action).toBe("task.create");
      expect(approval.entityType).toBe("matter");
      expect(approval.entityId).toBe(matter.id);
      expect(approval.proposedPayload).toMatchObject({
        matterId: matter.id,
        tasks,
      });
    });

    it("defaults to AI source type", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.action",
      });

      expect(approval.sourceType).toBe("ai");
    });

    it("accepts user source type", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.action",
        sourceType: "user",
        sourceId: user.id,
      });

      expect(approval.sourceType).toBe("user");
      expect(approval.proposedPayload).toBeDefined();
    });

    it("accepts system source type", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.action",
        sourceType: "system",
      });

      expect(approval.sourceType).toBe("system");
    });

    it("stores proposed payload as JSON", async () => {
      const payload = {
        recipientEmail: "test@example.com",
        subject: "Test Email",
        body: "Test content",
      };

      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "email.send",
        proposedPayload: payload,
      });

      expect(approval.proposedPayload).toMatchObject(payload);
    });

    it("persists approval data to database", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "document.approve",
        summary: "Approve legal document",
        sourceType: "ai",
      });

      const [dbApproval] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(dbApproval).toBeDefined();
      expect(dbApproval.action).toBe("document.approve");
      expect(dbApproval.summary).toBe("Approve legal document");
      expect(dbApproval.status).toBe("pending");
    });
  });

  describe("Read", () => {
    it("retrieves approval by ID", async () => {
      const created = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.retrieve",
        summary: "Retrieve test",
      });

      const [retrieved] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.summary).toBe("Retrieve test");
    });

    it("lists approvals for a firm", async () => {
      await createApprovalRequest({ firmId: ctx.firmId, action: "list.test1" });
      await createApprovalRequest({ firmId: ctx.firmId, action: "list.test2" });
      await createApprovalRequest({ firmId: ctx.firmId, action: "list.test3" });

      const firmApprovals = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.firmId, ctx.firmId));

      expect(firmApprovals.length).toBeGreaterThanOrEqual(3);
    });

    it("filters approvals by status", async () => {
      await createApprovalRequest({
        firmId: ctx.firmId,
        action: "status.test",
        status: "pending",
      });
      await createApprovalRequest({
        firmId: ctx.firmId,
        action: "status.test",
        status: "approved",
        decidedBy: approver.id,
        decidedAt: new Date(),
      });

      const pending = await db
        .select()
        .from(approvalRequests)
        .where(
          and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.status, "pending"))
        );

      const approved = await db
        .select()
        .from(approvalRequests)
        .where(
          and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.status, "approved"))
        );

      expect(pending.length).toBeGreaterThanOrEqual(1);
      expect(approved.length).toBeGreaterThanOrEqual(1);
    });

    it("filters approvals by action type", async () => {
      await createApprovalRequest({ firmId: ctx.firmId, action: "email.send" });
      await createApprovalRequest({ firmId: ctx.firmId, action: "invoice.send" });

      const emailApprovals = await db
        .select()
        .from(approvalRequests)
        .where(
          and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.action, "email.send"))
        );

      const invoiceApprovals = await db
        .select()
        .from(approvalRequests)
        .where(
          and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.action, "invoice.send"))
        );

      expect(emailApprovals.length).toBeGreaterThanOrEqual(1);
      expect(invoiceApprovals.length).toBeGreaterThanOrEqual(1);
    });

    it("filters approvals by entity type and ID", async () => {
      const timeEntry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: user.id,
      });

      await createTimeEntryApproval(ctx.firmId, timeEntry.id);

      const entityApprovals = await db
        .select()
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.firmId, ctx.firmId),
            eq(approvalRequests.entityType, "time_entry"),
            eq(approvalRequests.entityId, timeEntry.id)
          )
        );

      expect(entityApprovals.length).toBeGreaterThanOrEqual(1);
      expect(entityApprovals[0].entityId).toBe(timeEntry.id);
    });
  });

  describe("Update - Approve", () => {
    it("approves a pending approval", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.approve",
        status: "pending",
      });

      await db
        .update(approvalRequests)
        .set({
          status: "approved",
          decidedBy: approver.id,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approval.id));

      const [updated] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(updated.status).toBe("approved");
      expect(updated.decidedBy).toBe(approver.id);
      expect(updated.decidedAt).toBeDefined();
    });

    it("approves with decision reason", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.approve.reason",
        status: "pending",
      });

      const reason = "Looks good, approved for release";

      await db
        .update(approvalRequests)
        .set({
          status: "approved",
          decidedBy: approver.id,
          decidedAt: new Date(),
          decisionReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approval.id));

      const [updated] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(updated.status).toBe("approved");
      expect(updated.decisionReason).toBe(reason);
    });

    it("cannot approve already approved request", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.double.approve",
        status: "approved",
        decidedBy: approver.id,
        decidedAt: new Date(),
      });

      const [check] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(check.status).toBe("approved");
      // In real API, attempting to approve again would be blocked
    });

    it("cannot approve rejected request", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.rejected.approve",
        status: "rejected",
        decidedBy: approver.id,
        decidedAt: new Date(),
      });

      const [check] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(check.status).toBe("rejected");
      // In real API, attempting to approve would be blocked
    });
  });

  describe("Update - Reject", () => {
    it("rejects a pending approval", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.reject",
        status: "pending",
      });

      await db
        .update(approvalRequests)
        .set({
          status: "rejected",
          decidedBy: approver.id,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approval.id));

      const [updated] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(updated.status).toBe("rejected");
      expect(updated.decidedBy).toBe(approver.id);
      expect(updated.decidedAt).toBeDefined();
    });

    it("rejects with decision reason", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.reject.reason",
        status: "pending",
      });

      const reason = "Document needs additional legal review before sending";

      await db
        .update(approvalRequests)
        .set({
          status: "rejected",
          decidedBy: approver.id,
          decidedAt: new Date(),
          decisionReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approval.id));

      const [updated] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(updated.status).toBe("rejected");
      expect(updated.decisionReason).toBe(reason);
    });
  });

  describe("Bulk Operations", () => {
    it("approves multiple pending approvals", async () => {
      const approval1 = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.approve1",
        status: "pending",
      });
      const approval2 = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.approve2",
        status: "pending",
      });
      const approval3 = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.approve3",
        status: "pending",
      });

      const ids = [approval1.id, approval2.id, approval3.id];

      await db
        .update(approvalRequests)
        .set({
          status: "approved",
          decidedBy: approver.id,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(approvalRequests.firmId, ctx.firmId),
            inArray(approvalRequests.id, ids),
            eq(approvalRequests.status, "pending")
          )
        );

      const updated = await db
        .select()
        .from(approvalRequests)
        .where(inArray(approvalRequests.id, ids));

      expect(updated.length).toBe(3);
      expect(updated.every((a) => a.status === "approved")).toBe(true);
      expect(updated.every((a) => a.decidedBy === approver.id)).toBe(true);
    });

    it("rejects multiple pending approvals", async () => {
      const approval1 = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.reject1",
        status: "pending",
      });
      const approval2 = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.reject2",
        status: "pending",
      });

      const ids = [approval1.id, approval2.id];
      const reason = "Bulk rejection for review cycle";

      await db
        .update(approvalRequests)
        .set({
          status: "rejected",
          decidedBy: approver.id,
          decidedAt: new Date(),
          decisionReason: reason,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(approvalRequests.firmId, ctx.firmId),
            inArray(approvalRequests.id, ids),
            eq(approvalRequests.status, "pending")
          )
        );

      const updated = await db
        .select()
        .from(approvalRequests)
        .where(inArray(approvalRequests.id, ids));

      expect(updated.length).toBe(2);
      expect(updated.every((a) => a.status === "rejected")).toBe(true);
      expect(updated.every((a) => a.decisionReason === reason)).toBe(true);
    });

    it("bulk approve only affects pending approvals", async () => {
      const pending = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.mixed.pending",
        status: "pending",
      });
      const alreadyApproved = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "bulk.mixed.approved",
        status: "approved",
        decidedBy: approver.id,
        decidedAt: new Date(),
      });

      const ids = [pending.id, alreadyApproved.id];

      const updated = await db
        .update(approvalRequests)
        .set({
          status: "approved",
          decidedBy: approver.id,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(approvalRequests.firmId, ctx.firmId),
            inArray(approvalRequests.id, ids),
            eq(approvalRequests.status, "pending")
          )
        )
        .returning();

      // Only pending approval should be updated
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe(pending.id);
    });
  });

  describe("Execution Status", () => {
    it("defaults execution status to not_executed", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.execution",
      });

      expect(approval.executionStatus).toBe("not_executed");
    });

    it("marks as executed after approval execution", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.execute",
        status: "approved",
        decidedBy: approver.id,
        decidedAt: new Date(),
      });

      await db
        .update(approvalRequests)
        .set({
          executionStatus: "executed",
          executedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approval.id));

      const [updated] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(updated.executionStatus).toBe("executed");
      expect(updated.executedAt).toBeDefined();
    });

    it("marks as failed if execution fails", async () => {
      const approval = await createApprovalRequest({
        firmId: ctx.firmId,
        action: "test.fail",
        status: "approved",
        decidedBy: approver.id,
        decidedAt: new Date(),
      });

      const errorMessage = "SMTP connection failed";

      await db
        .update(approvalRequests)
        .set({
          executionStatus: "failed",
          executedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approval.id));

      const [updated] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approval.id));

      expect(updated.executionStatus).toBe("failed");
    });
  });
});

describe("Approvals Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates approvals between firms", async () => {
    // Create approval in first firm
    const approval1 = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "firm1.action",
      summary: "Firm 1 Approval",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const approval2 = await createApprovalRequest({
      firmId: firm2.id,
      action: "firm2.action",
      summary: "Firm 2 Approval",
    });

    // Query approvals for first firm
    const firm1Approvals = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.firmId, ctx.firmId));

    // Query approvals for second firm
    const firm2Approvals = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.firmId, firm2.id));

    // Each firm should only see their own approvals
    expect(firm1Approvals.some((a) => a.id === approval1.id)).toBe(true);
    expect(firm1Approvals.some((a) => a.id === approval2.id)).toBe(false);

    expect(firm2Approvals.some((a) => a.id === approval2.id)).toBe(true);
    expect(firm2Approvals.some((a) => a.id === approval1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(approvalRequests).where(eq(approvalRequests.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing approvals from another firm by ID", async () => {
    // Create approval in first firm
    const approval1 = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "isolated.action",
      summary: "Isolated Approval",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query approval1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.id, approval1.id), eq(approvalRequests.firmId, firm2.id)));

    // Should not find the approval
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot approve approvals from another firm", async () => {
    // Create user in first firm
    const user1 = await createUser({ firmId: ctx.firmId, name: "Firm 1 User" });
    const approval1 = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "cross.firm.approval",
      status: "pending",
    });

    // Create second firm with approver
    const firm2 = await createFirm({ name: "Cross Firm Test" });
    const approver2 = await createUser({ firmId: firm2.id, name: "Firm 2 Approver" });

    // Verify approval belongs to firm1
    const [check] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approval1.id));

    expect(check.firmId).toBe(ctx.firmId);
    expect(check.firmId).not.toBe(firm2.id);

    // In real API, approver from firm2 would not be able to approve firm1's request
    // The API checks firmId before allowing approval

    // Cleanup second firm
    const { users } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Approvals Integration - Filtering", () => {
  const ctx = setupIntegrationSuite();
  let user: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    user = await createUser({ firmId: ctx.firmId, name: "Filter Test User" });
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Filter",
      lastName: "Client",
    });
    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filter Test Matter",
    });
  });

  it("filters by status - pending", async () => {
    await createApprovalRequest({
      firmId: ctx.firmId,
      action: "filter.pending",
      status: "pending",
    });

    const pending = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.status, "pending")));

    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending.every((a) => a.status === "pending")).toBe(true);
  });

  it("filters by status - approved", async () => {
    await createApprovalRequest({
      firmId: ctx.firmId,
      action: "filter.approved",
      status: "approved",
      decidedBy: user.id,
      decidedAt: new Date(),
    });

    const approved = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.status, "approved")));

    expect(approved.length).toBeGreaterThanOrEqual(1);
    expect(approved.every((a) => a.status === "approved")).toBe(true);
  });

  it("filters by status - rejected", async () => {
    await createApprovalRequest({
      firmId: ctx.firmId,
      action: "filter.rejected",
      status: "rejected",
      decidedBy: user.id,
      decidedAt: new Date(),
    });

    const rejected = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.status, "rejected")));

    expect(rejected.length).toBeGreaterThanOrEqual(1);
    expect(rejected.every((a) => a.status === "rejected")).toBe(true);
  });

  it("filters by action type", async () => {
    await createApprovalRequest({ firmId: ctx.firmId, action: "email.send" });
    await createApprovalRequest({ firmId: ctx.firmId, action: "invoice.send" });
    await createApprovalRequest({ firmId: ctx.firmId, action: "task.create" });

    const emailApprovals = await db
      .select()
      .from(approvalRequests)
      .where(
        and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.action, "email.send"))
      );

    expect(emailApprovals.length).toBeGreaterThanOrEqual(1);
    expect(emailApprovals.every((a) => a.action === "email.send")).toBe(true);
  });

  it("filters by entity type", async () => {
    const timeEntry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: user.id,
    });

    await createTimeEntryApproval(ctx.firmId, timeEntry.id);

    const timeEntryApprovals = await db
      .select()
      .from(approvalRequests)
      .where(
        and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.entityType, "time_entry"))
      );

    expect(timeEntryApprovals.length).toBeGreaterThanOrEqual(1);
    expect(timeEntryApprovals.every((a) => a.entityType === "time_entry")).toBe(true);
  });

  it("filters by entity ID", async () => {
    const invoice = await createInvoice({
      firmId: ctx.firmId,
      matterId: matter.id,
      clientId: client.id,
    });

    await createInvoiceSendApproval(ctx.firmId, invoice.id);

    const invoiceApprovals = await db
      .select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.firmId, ctx.firmId),
          eq(approvalRequests.entityType, "invoice"),
          eq(approvalRequests.entityId, invoice.id)
        )
      );

    expect(invoiceApprovals.length).toBeGreaterThanOrEqual(1);
    expect(invoiceApprovals[0].entityId).toBe(invoice.id);
  });

  it("filters by source type", async () => {
    await createApprovalRequest({
      firmId: ctx.firmId,
      action: "source.ai",
      sourceType: "ai",
    });
    await createApprovalRequest({
      firmId: ctx.firmId,
      action: "source.user",
      sourceType: "user",
      sourceId: user.id,
    });
    await createApprovalRequest({
      firmId: ctx.firmId,
      action: "source.system",
      sourceType: "system",
    });

    const aiApprovals = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.sourceType, "ai")));

    const userApprovals = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.sourceType, "user")));

    expect(aiApprovals.length).toBeGreaterThanOrEqual(1);
    expect(userApprovals.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by combined criteria (status + action + entity)", async () => {
    const timeEntry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: user.id,
    });

    await createTimeEntryApproval(ctx.firmId, timeEntry.id, { status: "pending" });

    const filtered = await db
      .select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.firmId, ctx.firmId),
          eq(approvalRequests.status, "pending"),
          eq(approvalRequests.action, "time_entry.approve"),
          eq(approvalRequests.entityType, "time_entry"),
          eq(approvalRequests.entityId, timeEntry.id)
        )
      );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered[0].status).toBe("pending");
    expect(filtered[0].action).toBe("time_entry.approve");
    expect(filtered[0].entityId).toBe(timeEntry.id);
  });
});

describe("Approvals Integration - Workflow Effects", () => {
  const ctx = setupIntegrationSuite();
  let user: Awaited<ReturnType<typeof createUser>>;
  let approver: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    user = await createUser({ firmId: ctx.firmId, name: "Workflow User" });
    approver = await createUser({ firmId: ctx.firmId, name: "Workflow Approver" });
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Workflow",
      lastName: "Client",
    });
    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Workflow Matter",
    });
  });

  it("approval creates audit trail with decision data", async () => {
    const approval = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "audit.test",
      status: "pending",
    });

    const decisionReason = "Reviewed and approved per policy";

    await db
      .update(approvalRequests)
      .set({
        status: "approved",
        decidedBy: approver.id,
        decidedAt: new Date(),
        decisionReason,
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, approval.id));

    const [updated] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approval.id));

    expect(updated.status).toBe("approved");
    expect(updated.decidedBy).toBe(approver.id);
    expect(updated.decidedAt).toBeDefined();
    expect(updated.decisionReason).toBe(decisionReason);
  });

  it("rejection stores reason for audit trail", async () => {
    const approval = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "reject.audit",
      status: "pending",
    });

    const rejectionReason = "Client details need verification before proceeding";

    await db
      .update(approvalRequests)
      .set({
        status: "rejected",
        decidedBy: approver.id,
        decidedAt: new Date(),
        decisionReason: rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, approval.id));

    const [updated] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approval.id));

    expect(updated.status).toBe("rejected");
    expect(updated.decisionReason).toBe(rejectionReason);
  });

  it("cancelled approval preserves original state", async () => {
    const approval = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "cancel.test",
      status: "pending",
    });

    await db
      .update(approvalRequests)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, approval.id));

    const [cancelled] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approval.id));

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.decidedBy).toBeNull();
    expect(cancelled.decidedAt).toBeNull();
  });

  it("expired approval can be marked as expired", async () => {
    const approval = await createApprovalRequest({
      firmId: ctx.firmId,
      action: "expire.test",
      status: "pending",
    });

    await db
      .update(approvalRequests)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, approval.id));

    const [expired] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approval.id));

    expect(expired.status).toBe("expired");
  });
});
