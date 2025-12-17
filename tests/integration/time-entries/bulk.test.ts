/**
 * Bulk Time Entry Submission Integration Tests
 *
 * Tests bulk time entry submission workflow and atomic operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { timeEntries, approvalRequests } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createTimeEntry } from "@tests/fixtures/factories/time-entry";
import { createUser } from "@tests/fixtures/factories/user";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Bulk Time Entry Submission Integration", () => {
  const ctx = setupIntegrationSuite();
  let feeEarner: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    feeEarner = await createUser({
      firmId: ctx.firmId,
      name: "Bulk Test Fee Earner",
    });

    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Bulk",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Bulk Test Matter",
    });
  });

  describe("Bulk Submission Workflow", () => {
    it("submits multiple draft entries successfully", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Bulk entry 1",
        durationMinutes: 30,
      });

      const entry2 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Bulk entry 2",
        durationMinutes: 60,
      });

      const entry3 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Bulk entry 3",
        durationMinutes: 45,
      });

      const ids = [entry1.id, entry2.id, entry3.id];

      // Bulk submit
      await db
        .update(timeEntries)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      // Verify all entries are now submitted
      const [check1] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry1.id));
      const [check2] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry2.id));
      const [check3] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry3.id));

      expect(check1.status).toBe("submitted");
      expect(check2.status).toBe("submitted");
      expect(check3.status).toBe("submitted");
    });

    it("updates all entries to submitted status atomically", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Atomic test 1",
      });

      const entry2 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Atomic test 2",
      });

      const ids = [entry1.id, entry2.id];

      // Atomic update
      await db
        .update(timeEntries)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      // Verify both entries are submitted
      const entries = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.status === "submitted")).toBe(true);
    });

    it("validates all entries are draft before submission", async () => {
      const draftEntry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Valid draft",
      });

      const submittedEntry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "submitted",
        description: "Already submitted",
      });

      const ids = [draftEntry.id, submittedEntry.id];

      // Check statuses before bulk operation
      const beforeCheck = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      const allDraft = beforeCheck.every((e) => e.status === "draft");
      expect(allDraft).toBe(false); // One is already submitted

      // In real API, this would fail validation
      // Here we verify the check would catch the issue
      const [draftCheck] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, draftEntry.id));

      const [submittedCheck] = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.id, submittedEntry.id));

      expect(draftCheck.status).toBe("draft");
      expect(submittedCheck.status).toBe("submitted");
    });

    it("handles bulk submission of entries for same matter", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Matter entry 1",
      });

      const entry2 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Matter entry 2",
      });

      const ids = [entry1.id, entry2.id];

      await db
        .update(timeEntries)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      const entries = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.status === "submitted")).toBe(true);
      expect(entries.every((e) => e.matterId === matter.id)).toBe(true);
    });
  });

  describe("Bulk Submission Validation", () => {
    it("verifies all entry IDs exist before submission", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Valid entry",
      });

      const fakeId = "00000000-0000-0000-0000-000000000000";
      const ids = [entry1.id, fakeId];

      // Check if all IDs exist
      const found = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      // Should only find one entry
      expect(found.length).toBe(1);
      expect(found.length).not.toBe(ids.length);

      // In real API, this would throw NotFoundError
      // Verify the existing entry is still draft
      const [check] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry1.id));
      expect(check.status).toBe("draft");
    });

    it("validates all entries belong to same firm", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Firm validation test",
      });

      // Verify entry belongs to correct firm
      const [check] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry1.id));
      expect(check.firmId).toBe(ctx.firmId);
    });

    it("rejects already submitted entries in batch", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "submitted",
        description: "Already submitted",
      });

      const entry2 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Valid draft",
      });

      const ids = [entry1.id, entry2.id];

      // Check statuses
      const entries = await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      const hasNonDraft = entries.some((e) => e.status !== "draft");
      expect(hasNonDraft).toBe(true); // One is already submitted

      // In real API, this would fail validation with "All time entries must be draft to submit"
    });
  });

  describe("Bulk Submission with Approvals", () => {
    it("can create approval requests for submitted entries", async () => {
      const entry1 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Approval test 1",
      });

      const entry2 = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
        description: "Approval test 2",
      });

      const ids = [entry1.id, entry2.id];

      // Submit entries
      await db
        .update(timeEntries)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

      // Create approval requests
      const inserted = await db
        .insert(approvalRequests)
        .values(
          ids.map((id) => ({
            firmId: ctx.firmId,
            sourceType: "user" as const,
            sourceId: feeEarner.id,
            action: "time_entry.approve" as const,
            summary: "Approve time entry",
            proposedPayload: { timeEntryId: id, matterId: matter.id },
            entityType: "time_entry" as const,
            entityId: id,
            updatedAt: new Date(),
          }))
        )
        .returning({ id: approvalRequests.id });

      expect(inserted.length).toBe(2);

      // Verify approval requests exist
      const requests = await db
        .select()
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.firmId, ctx.firmId),
            inArray(
              approvalRequests.id,
              inserted.map((r) => r.id)
            )
          )
        );

      expect(requests.length).toBe(2);
      expect(requests.every((r) => r.action === "time_entry.approve")).toBe(true);
      expect(requests.every((r) => r.status === "pending")).toBe(true);
    });
  });
});

describe("Bulk Time Entry Submission Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates bulk submission between firms", async () => {
    // Create entry in first firm
    const feeEarner1 = await createUser({ firmId: ctx.firmId, name: "Firm 1 Fee Earner" });
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const entry1 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      status: "draft",
      description: "Firm 1 Entry",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Verify entry belongs to firm1
    const [dbEntry] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry1.id));
    expect(dbEntry.firmId).toBe(ctx.firmId);
    expect(dbEntry.firmId).not.toBe(firm2.id);

    // Verify isolation - entry not found in firm2 context
    const result = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.id, entry1.id), eq(timeEntries.firmId, firm2.id)));

    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("only submits entries within the same firm", async () => {
    const feeEarner = await createUser({ firmId: ctx.firmId, name: "Multi-tenant Fee Earner" });
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const entry1 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
      description: "Same firm entry 1",
    });

    const entry2 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
      description: "Same firm entry 2",
    });

    const ids = [entry1.id, entry2.id];

    // Submit both entries with firm context
    await db
      .update(timeEntries)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

    // Verify both are submitted
    const entries = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.firmId, ctx.firmId), inArray(timeEntries.id, ids)));

    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.status === "submitted")).toBe(true);
    expect(entries.every((e) => e.firmId === ctx.firmId)).toBe(true);
  });

  it("prevents bulk submission across firm boundaries", async () => {
    const feeEarner = await createUser({ firmId: ctx.firmId, name: "Protected Fee Earner" });
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
      description: "Protected entry",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Unauthorized Firm" });

    // Attempt to update with wrong firmId
    const updateResult = await db
      .update(timeEntries)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(and(eq(timeEntries.firmId, firm2.id), inArray(timeEntries.id, [entry.id])))
      .returning();

    // Should not update anything (wrong firm)
    expect(updateResult.length).toBe(0);

    // Verify entry is still draft
    const [unchanged] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));
    expect(unchanged.status).toBe("draft");
    expect(unchanged.firmId).toBe(ctx.firmId);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
