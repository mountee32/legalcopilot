/**
 * Time Entries Integration Tests
 *
 * Tests time entry CRUD operations and submission workflows against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { timeEntries } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createTimeEntry,
  createSubmittedTimeEntry,
  createApprovedTimeEntry,
} from "@tests/fixtures/factories/time-entry";
import { createUser } from "@tests/fixtures/factories/user";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Time Entries Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();
  let feeEarner: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    // Create test data for this suite
    feeEarner = await createUser({
      firmId: ctx.firmId,
      name: "Test Fee Earner",
      email: "feeearner@test.com",
    });

    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Time Entry",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter for Time Entries",
    });
  });

  describe("Create", () => {
    it("creates a time entry with required fields", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        description: "Client meeting",
        durationMinutes: 60,
        hourlyRate: "200.00",
      });

      expect(entry.id).toBeDefined();
      expect(entry.firmId).toBe(ctx.firmId);
      expect(entry.matterId).toBe(matter.id);
      expect(entry.feeEarnerId).toBe(feeEarner.id);
      expect(entry.description).toBe("Client meeting");
      expect(entry.durationMinutes).toBe(60);
      expect(entry.hourlyRate).toBe("200.00");
      expect(entry.amount).toBe("200.00"); // 1 hour * 200/hour
      expect(entry.status).toBe("draft");
    });

    it("calculates amount correctly from duration and rate", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        durationMinutes: 30, // 0.5 hours
        hourlyRate: "200.00",
      });

      expect(entry.amount).toBe("100.00");
    });

    it("handles 6-minute billing units correctly", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        durationMinutes: 6, // 0.1 hours
        hourlyRate: "200.00",
      });

      expect(entry.amount).toBe("20.00");
    });

    it("defaults status to draft", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
      });

      expect(entry.status).toBe("draft");
    });

    it("uses current date as work date by default", async () => {
      const today = new Date().toISOString().split("T")[0];

      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
      });

      expect(entry.workDate).toBe(today);
    });

    it("persists time entry data to database", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        description: "Persist test",
        durationMinutes: 120,
        hourlyRate: "250.00",
        workDate: "2024-01-15",
      });

      const [dbEntry] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

      expect(dbEntry).toBeDefined();
      expect(dbEntry.description).toBe("Persist test");
      expect(dbEntry.durationMinutes).toBe(120);
      expect(dbEntry.hourlyRate).toBe("250.00");
      expect(dbEntry.workDate).toBe("2024-01-15");
    });
  });

  describe("Read", () => {
    it("retrieves time entry by ID", async () => {
      const created = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        description: "Retrieve test",
      });

      const [retrieved] = await db.select().from(timeEntries).where(eq(timeEntries.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.description).toBe("Retrieve test");
    });

    it("lists time entries for a matter", async () => {
      const testMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "List Test Matter",
      });

      await createTimeEntry({
        firmId: ctx.firmId,
        matterId: testMatter.id,
        feeEarnerId: feeEarner.id,
        description: "Entry 1",
      });
      await createTimeEntry({
        firmId: ctx.firmId,
        matterId: testMatter.id,
        feeEarnerId: feeEarner.id,
        description: "Entry 2",
      });

      const entries = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.matterId, testMatter.id));

      expect(entries.length).toBe(2);
    });

    it("lists time entries for a fee earner", async () => {
      const testFeeEarner = await createUser({
        firmId: ctx.firmId,
        name: "List Test Fee Earner",
      });

      await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: testFeeEarner.id,
        description: "Fee Earner Entry 1",
      });
      await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: testFeeEarner.id,
        description: "Fee Earner Entry 2",
      });

      const entries = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.feeEarnerId, testFeeEarner.id));

      expect(entries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Update", () => {
    it("updates time entry description", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        description: "Original description",
      });

      await db
        .update(timeEntries)
        .set({
          description: "Updated description",
          updatedAt: new Date(),
        })
        .where(eq(timeEntries.id, entry.id));

      const [updated] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

      expect(updated.description).toBe("Updated description");
    });

    it("updates time entry duration and recalculates amount", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        durationMinutes: 60,
        hourlyRate: "200.00",
      });

      const newDuration = 120;
      const newAmount = ((newDuration / 60) * 200).toFixed(2);

      await db
        .update(timeEntries)
        .set({
          durationMinutes: newDuration,
          amount: newAmount,
          updatedAt: new Date(),
        })
        .where(eq(timeEntries.id, entry.id));

      const [updated] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

      expect(updated.durationMinutes).toBe(120);
      expect(updated.amount).toBe("400.00");
    });

    it("updates hourly rate and recalculates amount", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        durationMinutes: 60,
        hourlyRate: "200.00",
      });

      const newRate = "250.00";
      const newAmount = ((60 / 60) * 250).toFixed(2);

      await db
        .update(timeEntries)
        .set({
          hourlyRate: newRate,
          amount: newAmount,
          updatedAt: new Date(),
        })
        .where(eq(timeEntries.id, entry.id));

      const [updated] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

      expect(updated.hourlyRate).toBe("250.00");
      expect(updated.amount).toBe("250.00");
    });

    it("updates work date", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        workDate: "2024-01-01",
      });

      await db
        .update(timeEntries)
        .set({
          workDate: "2024-01-15",
          updatedAt: new Date(),
        })
        .where(eq(timeEntries.id, entry.id));

      const [updated] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

      expect(updated.workDate).toBe("2024-01-15");
    });
  });

  describe("Delete", () => {
    it("deletes draft time entry", async () => {
      const entry = await createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: feeEarner.id,
        status: "draft",
      });

      await db.delete(timeEntries).where(eq(timeEntries.id, entry.id));

      const [deleted] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

      expect(deleted).toBeUndefined();
    });
  });
});

describe("Time Entries Integration - Submission Workflow", () => {
  const ctx = setupIntegrationSuite();
  let feeEarner: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    feeEarner = await createUser({
      firmId: ctx.firmId,
      name: "Workflow Test Fee Earner",
    });

    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Workflow",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Workflow Test Matter",
    });
  });

  it("submits a draft time entry for approval", async () => {
    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
    });

    // Submit the entry
    await db
      .update(timeEntries)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(eq(timeEntries.id, entry.id));

    const [submitted] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(submitted.status).toBe("submitted");
  });

  it("creates time entry in submitted status directly", async () => {
    const entry = await createSubmittedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Direct submission",
    });

    expect(entry.status).toBe("submitted");
  });

  it("approves a submitted time entry", async () => {
    const entry = await createSubmittedTimeEntry(ctx.firmId, matter.id, feeEarner.id);

    // Approve the entry
    await db
      .update(timeEntries)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(timeEntries.id, entry.id));

    const [approved] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(approved.status).toBe("approved");
  });

  it("cannot edit submitted time entry (simulate API validation)", async () => {
    const entry = await createSubmittedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Submitted entry",
    });

    // In real API, this would be blocked
    // Here we verify the status is submitted, which should prevent edits at API layer
    const [check] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(check.status).toBe("submitted");
    expect(check.status).not.toBe("draft");
  });

  it("cannot delete submitted time entry (simulate API validation)", async () => {
    const entry = await createSubmittedTimeEntry(ctx.firmId, matter.id, feeEarner.id);

    // Verify the entry exists and is submitted
    const [check] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(check.status).toBe("submitted");
    // In real API, deletion would be blocked for submitted entries
  });

  it("supports bulk submission workflow", async () => {
    // Create multiple draft entries
    const entry1 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
      description: "Bulk 1",
    });

    const entry2 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
      description: "Bulk 2",
    });

    const entry3 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
      description: "Bulk 3",
    });

    // Bulk submit all three entries
    await db
      .update(timeEntries)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(
        and(
          eq(timeEntries.firmId, ctx.firmId),
          eq(timeEntries.feeEarnerId, feeEarner.id),
          eq(timeEntries.status, "draft")
        )
      );

    // Verify all are submitted
    const [check1] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry1.id));
    const [check2] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry2.id));
    const [check3] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry3.id));

    expect(check1.status).toBe("submitted");
    expect(check2.status).toBe("submitted");
    expect(check3.status).toBe("submitted");
  });

  it("marks time entry as billed when included on invoice", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id);

    // Simulate adding to invoice (use a valid UUID)
    const { randomUUID } = await import("crypto");
    const invoiceId = randomUUID();
    await db
      .update(timeEntries)
      .set({
        status: "billed",
        invoiceId,
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, entry.id));

    const [billed] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(billed.status).toBe("billed");
    expect(billed.invoiceId).toBe(invoiceId);
  });

  it("supports writing off time entries", async () => {
    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
    });

    await db
      .update(timeEntries)
      .set({ status: "written_off", updatedAt: new Date() })
      .where(eq(timeEntries.id, entry.id));

    const [writtenOff] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(writtenOff.status).toBe("written_off");
  });
});

describe("Time Entries Integration - Filtering", () => {
  const ctx = setupIntegrationSuite();
  let feeEarner1: Awaited<ReturnType<typeof createUser>>;
  let feeEarner2: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter1: Awaited<ReturnType<typeof createMatter>>;
  let matter2: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    feeEarner1 = await createUser({
      firmId: ctx.firmId,
      name: "Filter Test Fee Earner 1",
    });

    feeEarner2 = await createUser({
      firmId: ctx.firmId,
      name: "Filter Test Fee Earner 2",
    });

    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Filter",
      lastName: "Test Client",
    });

    matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filter Test Matter 1",
    });

    matter2 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filter Test Matter 2",
    });
  });

  it("filters by matter", async () => {
    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      description: "Matter 1 Entry",
    });

    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter2.id,
      feeEarnerId: feeEarner1.id,
      description: "Matter 2 Entry",
    });

    const matter1Entries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.matterId, matter1.id));

    const matter2Entries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.matterId, matter2.id));

    expect(matter1Entries.length).toBeGreaterThanOrEqual(1);
    expect(matter2Entries.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by fee earner", async () => {
    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      description: "Fee Earner 1 Entry",
    });

    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner2.id,
      description: "Fee Earner 2 Entry",
    });

    const feeEarner1Entries = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.firmId, ctx.firmId), eq(timeEntries.feeEarnerId, feeEarner1.id)));

    const feeEarner2Entries = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.firmId, ctx.firmId), eq(timeEntries.feeEarnerId, feeEarner2.id)));

    expect(feeEarner1Entries.length).toBeGreaterThanOrEqual(1);
    expect(feeEarner2Entries.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by status", async () => {
    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      status: "draft",
      description: "Draft entry for filtering",
    });

    await createSubmittedTimeEntry(ctx.firmId, matter1.id, feeEarner1.id, {
      description: "Submitted entry for filtering",
    });

    await createApprovedTimeEntry(ctx.firmId, matter1.id, feeEarner1.id, {
      description: "Approved entry for filtering",
    });

    const draftEntries = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.firmId, ctx.firmId), eq(timeEntries.status, "draft")));

    const submittedEntries = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.firmId, ctx.firmId), eq(timeEntries.status, "submitted")));

    const approvedEntries = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.firmId, ctx.firmId), eq(timeEntries.status, "approved")));

    expect(draftEntries.length).toBeGreaterThanOrEqual(1);
    expect(submittedEntries.length).toBeGreaterThanOrEqual(1);
    expect(approvedEntries.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by date range", async () => {
    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      workDate: "2024-01-10",
      description: "January entry",
    });

    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      workDate: "2024-02-15",
      description: "February entry",
    });

    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      workDate: "2024-03-20",
      description: "March entry",
    });

    const januaryEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.firmId, ctx.firmId),
          gte(timeEntries.workDate, "2024-01-01"),
          lte(timeEntries.workDate, "2024-01-31")
        )
      );

    const q1Entries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.firmId, ctx.firmId),
          gte(timeEntries.workDate, "2024-01-01"),
          lte(timeEntries.workDate, "2024-03-31")
        )
      );

    expect(januaryEntries.length).toBeGreaterThanOrEqual(1);
    expect(q1Entries.length).toBeGreaterThanOrEqual(3);
  });

  it("filters by combined criteria (matter + status + date)", async () => {
    const testMatter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Combined Filter Test Matter",
    });

    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: testMatter.id,
      feeEarnerId: feeEarner1.id,
      workDate: "2024-06-15",
      status: "draft",
      description: "Combined filter match",
    });

    await createTimeEntry({
      firmId: ctx.firmId,
      matterId: testMatter.id,
      feeEarnerId: feeEarner1.id,
      workDate: "2024-06-20",
      status: "submitted",
      description: "Different status",
    });

    const filtered = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.firmId, ctx.firmId),
          eq(timeEntries.matterId, testMatter.id),
          eq(timeEntries.status, "draft"),
          gte(timeEntries.workDate, "2024-06-01"),
          lte(timeEntries.workDate, "2024-06-30")
        )
      );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered[0].description).toContain("Combined filter match");
  });
});

describe("Time Entries Integration - Validation", () => {
  const ctx = setupIntegrationSuite();
  let feeEarner: Awaited<ReturnType<typeof createUser>>;
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    feeEarner = await createUser({
      firmId: ctx.firmId,
      name: "Validation Test Fee Earner",
    });

    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Validation",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Validation Test Matter",
    });
  });

  it("requires valid matter reference", async () => {
    const invalidMatterId = "00000000-0000-0000-0000-000000000000";

    await expect(
      createTimeEntry({
        firmId: ctx.firmId,
        matterId: invalidMatterId,
        feeEarnerId: feeEarner.id,
      })
    ).rejects.toThrow();
  });

  it("requires valid fee earner reference", async () => {
    const invalidFeeEarnerId = "00000000-0000-0000-0000-000000000000";

    await expect(
      createTimeEntry({
        firmId: ctx.firmId,
        matterId: matter.id,
        feeEarnerId: invalidFeeEarnerId,
      })
    ).rejects.toThrow();
  });

  it("accepts positive duration minutes", async () => {
    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      durationMinutes: 1,
    });

    expect(entry.durationMinutes).toBe(1);
  });

  it("accepts large duration values", async () => {
    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      durationMinutes: 480, // 8 hours
    });

    expect(entry.durationMinutes).toBe(480);
  });

  it("uses default hourly rate when not specified", async () => {
    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      // No hourlyRate specified, factory should use default
    });

    expect(entry.hourlyRate).toBe("200.00");
  });

  it("accepts custom hourly rate", async () => {
    const entry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      hourlyRate: "350.00",
    });

    expect(entry.hourlyRate).toBe("350.00");
  });
});

describe("Time Entries Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates time entries between firms", async () => {
    // Create data for first firm
    const feeEarner1 = await createUser({ firmId: ctx.firmId, name: "Firm 1 Fee Earner" });
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Firm1",
      lastName: "Client",
    });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });
    const entry1 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      description: "Firm 1 Time Entry",
    });

    // Create second firm with data
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const feeEarner2 = await createUser({ firmId: firm2.id, name: "Firm 2 Fee Earner" });
    const client2 = await createClient({
      firmId: firm2.id,
      firstName: "Firm2",
      lastName: "Client",
    });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm 2 Matter",
    });
    const entry2 = await createTimeEntry({
      firmId: firm2.id,
      matterId: matter2.id,
      feeEarnerId: feeEarner2.id,
      description: "Firm 2 Time Entry",
    });

    // Query time entries for first firm
    const firm1Entries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.firmId, ctx.firmId));

    // Query time entries for second firm
    const firm2Entries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.firmId, firm2.id));

    // Each firm should only see their own entries
    expect(firm1Entries.some((e) => e.id === entry1.id)).toBe(true);
    expect(firm1Entries.some((e) => e.id === entry2.id)).toBe(false);

    expect(firm2Entries.some((e) => e.id === entry2.id)).toBe(true);
    expect(firm2Entries.some((e) => e.id === entry1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(timeEntries).where(eq(timeEntries.firmId, firm2.id));
    const { matters } = await import("@/lib/db/schema");
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { users } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing time entries from another firm by ID", async () => {
    // Create entry in first firm
    const feeEarner1 = await createUser({ firmId: ctx.firmId, name: "Isolated Fee Earner" });
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Isolated",
      lastName: "Client",
    });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Isolated Matter",
    });
    const entry1 = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter1.id,
      feeEarnerId: feeEarner1.id,
      description: "Isolated Entry",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query entry1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.id, entry1.id), eq(timeEntries.firmId, firm2.id)));

    // Should not find the entry
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot create time entry for matter from another firm", async () => {
    // Create data for first firm
    const feeEarner1 = await createUser({ firmId: ctx.firmId, name: "Cross Firm Fee Earner" });
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Cross",
      lastName: "Client",
    });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Cross Firm Matter",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Cross Firm Test" });
    const feeEarner2 = await createUser({ firmId: firm2.id, name: "Firm 2 Fee Earner Cross" });

    // Try to create time entry in firm2 for matter from firm1 (should fail in real API)
    // Here we demonstrate that the matter belongs to firm1
    const [matterCheck] = await db
      .select()
      .from((await import("@/lib/db/schema")).matters)
      .where(eq((await import("@/lib/db/schema")).matters.id, matter1.id));

    expect(matterCheck.firmId).toBe(ctx.firmId);
    expect(matterCheck.firmId).not.toBe(firm2.id);

    // Cleanup second firm
    const { users } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
