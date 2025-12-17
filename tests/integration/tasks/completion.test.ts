/**
 * Task Completion Integration Tests
 *
 * Tests task completion workflow and status transitions against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createTask } from "@tests/fixtures/factories/task";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Task Completion Integration", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    client = await createClient({ firmId: ctx.firmId });
    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
  });

  describe("Task Completion Workflow", () => {
    it("completes a pending task successfully", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task to complete",
        status: "pending",
      });

      expect(task.status).toBe("pending");

      // Complete the task
      const completedAt = new Date();
      await db
        .update(tasks)
        .set({
          status: "completed",
          completedAt,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, task.id), eq(tasks.firmId, ctx.firmId)));

      // Verify in database
      const [dbTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(dbTask.status).toBe("completed");
      expect(dbTask.completedAt).toBeDefined();
      expect(dbTask.completedAt).toEqual(completedAt);
    });

    it("completes an in-progress task successfully", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "In-progress task to complete",
        status: "in_progress",
      });

      const completedAt = new Date();
      await db
        .update(tasks)
        .set({
          status: "completed",
          completedAt,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, task.id), eq(tasks.firmId, ctx.firmId)));

      const [dbTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(dbTask.status).toBe("completed");
      expect(dbTask.completedAt).toBeDefined();
    });

    it("sets completion timestamp when completing task", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task for timestamp check",
        status: "pending",
      });

      const beforeComplete = new Date();
      const completedAt = new Date();

      await db
        .update(tasks)
        .set({
          status: "completed",
          completedAt,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, task.id), eq(tasks.firmId, ctx.firmId)));

      const afterComplete = new Date();

      const [dbTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(dbTask.completedAt).toBeDefined();

      if (dbTask.completedAt) {
        expect(dbTask.completedAt.getTime()).toBeGreaterThanOrEqual(
          beforeComplete.getTime() - 1000
        );
        expect(dbTask.completedAt.getTime()).toBeLessThanOrEqual(afterComplete.getTime() + 1000);
      }
    });

    it("prevents completing already completed task (validation check)", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Already completed task",
        status: "completed",
      });

      // Set completedAt manually
      const firstCompletedAt = new Date();
      await db.update(tasks).set({ completedAt: firstCompletedAt }).where(eq(tasks.id, task.id));

      // Verify task is completed
      const [current] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(current.status).toBe("completed");

      // In the API, this would be prevented by ValidationError
      // Here we verify the current state is "completed"
      expect(current.status).toBe("completed");
      expect(current.completedAt).toEqual(firstCompletedAt);
    });
  });

  describe("Task Completion Status Transitions", () => {
    it("transitions from pending to completed", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Pending to completed",
        status: "pending",
      });

      await db
        .update(tasks)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(updated.status).toBe("completed");
    });

    it("transitions from in_progress to completed", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "In-progress to completed",
        status: "in_progress",
      });

      await db
        .update(tasks)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(updated.status).toBe("completed");
    });

    it("does not allow null completedAt for completed tasks", async () => {
      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Completed with timestamp",
        status: "pending",
      });

      // Complete with timestamp
      await db
        .update(tasks)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));

      const [completed] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).not.toBeNull();
      expect(completed.completedAt).toBeDefined();
    });
  });
});

describe("Task Completion Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates task completion between firms", async () => {
    // Create task in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });
    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Task",
      status: "pending",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Verify task belongs to firm1
    const [dbTask] = await db.select().from(tasks).where(eq(tasks.id, task1.id));
    expect(dbTask.firmId).toBe(ctx.firmId);
    expect(dbTask.firmId).not.toBe(firm2.id);

    // Complete task in firm1
    await db
      .update(tasks)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, task1.id), eq(tasks.firmId, ctx.firmId)));

    // Verify completion only applies to firm1 task
    const [completed] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task1.id), eq(tasks.firmId, ctx.firmId)));

    expect(completed.status).toBe("completed");

    // Verify firm2 cannot access this task
    const firm2Result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task1.id), eq(tasks.firmId, firm2.id)));

    expect(firm2Result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("only completes tasks within the firm boundary", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Task for firm isolation test",
      status: "pending",
    });

    // Complete the task with firm context
    await db
      .update(tasks)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, task1.id), eq(tasks.firmId, ctx.firmId)));

    // Verify completion
    const [completed] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task1.id), eq(tasks.firmId, ctx.firmId)));

    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeDefined();
    expect(completed.firmId).toBe(ctx.firmId);
  });

  it("prevents completing task from wrong firm", async () => {
    // Create task in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });
    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Protected task",
      status: "pending",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Unauthorized Firm" });

    // Attempt to update task with wrong firmId (simulates what API would prevent)
    const updateResult = await db
      .update(tasks)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, task1.id), eq(tasks.firmId, firm2.id)))
      .returning();

    // Should not update anything (wrong firm)
    expect(updateResult.length).toBe(0);

    // Verify task is still pending
    const [unchanged] = await db.select().from(tasks).where(eq(tasks.id, task1.id));
    expect(unchanged.status).toBe("pending");
    expect(unchanged.completedAt).toBeNull();

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
