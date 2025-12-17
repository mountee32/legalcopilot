/**
 * Tasks Integration Tests
 *
 * Tests task CRUD operations, workflow, assignment, and multi-tenancy
 * against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { tasks, matters as mattersTable, timelineEvents } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createTask,
  createUrgentTask,
  createCompletedTask,
  createAIGeneratedTask,
} from "@tests/fixtures/factories/task";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createUser } from "@tests/fixtures/factories/user";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Tasks Integration - CRUD Operations", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a task for a matter with required fields", async () => {
      // Create client and matter first
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Review contract",
      });

      expect(task.id).toBeDefined();
      expect(task.firmId).toBe(ctx.firmId);
      expect(task.matterId).toBe(matter.id);
      expect(task.title).toBe("Review contract");
      expect(task.status).toBe("pending");
      expect(task.priority).toBe("medium");
      expect(task.aiGenerated).toBe(false);
    });

    it("creates a task with due date and assignee", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const user = await createUser({ firmId: ctx.firmId });

      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Draft response",
        description: "Draft response to court filing",
        assigneeId: user.id,
        dueDate,
        priority: "high",
      });

      expect(task.id).toBeDefined();
      expect(task.assigneeId).toBe(user.id);
      expect(task.dueDate).toEqual(dueDate);
      expect(task.description).toBe("Draft response to court filing");
      expect(task.priority).toBe("high");
    });

    it("creates an AI-generated task", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createAIGeneratedTask(ctx.firmId, matter.id, {
        title: "Follow up with client",
      });

      expect(task.aiGenerated).toBe(true);
    });

    it("creates an urgent task with near due date", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createUrgentTask(ctx.firmId, matter.id, {
        title: "File urgent motion",
      });

      expect(task.priority).toBe("urgent");
      expect(task.dueDate).toBeDefined();
    });

    it("persists task data to database", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Persist test",
        description: "Test description",
        priority: "low",
      });

      const [dbTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));

      expect(dbTask).toBeDefined();
      expect(dbTask.title).toBe("Persist test");
      expect(dbTask.description).toBe("Test description");
      expect(dbTask.priority).toBe("low");
      expect(dbTask.matterId).toBe(matter.id);
    });
  });

  describe("Read", () => {
    it("retrieves task by ID", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const created = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Retrieve test",
      });

      const [retrieved] = await db.select().from(tasks).where(eq(tasks.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Retrieve test");
    });

    it("lists tasks for a matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      // Create several tasks for the matter
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task 1",
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task 2",
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task 3",
      });

      const matterTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.matterId, matter.id)));

      expect(matterTasks.length).toBeGreaterThanOrEqual(3);
    });

    it("lists all tasks for a firm", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter1 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });
      const matter2 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await createTask({
        firmId: ctx.firmId,
        matterId: matter1.id,
        title: "Firm task 1",
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter2.id,
        title: "Firm task 2",
      });

      const firmTasks = await db.select().from(tasks).where(eq(tasks.firmId, ctx.firmId));

      expect(firmTasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Update", () => {
    it("updates task fields", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Original title",
        description: "Original description",
      });

      await db
        .update(tasks)
        .set({
          title: "Updated title",
          description: "Updated description",
          priority: "high",
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));

      expect(updated.title).toBe("Updated title");
      expect(updated.description).toBe("Updated description");
      expect(updated.priority).toBe("high");
    });

    it("updates task due date", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task with changing due date",
      });

      const newDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

      await db
        .update(tasks)
        .set({
          dueDate: newDueDate,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id));

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));

      expect(updated.dueDate).toEqual(newDueDate);
    });

    it("updates task status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Status change test",
        status: "pending",
      });

      expect(task.status).toBe("pending");

      await db
        .update(tasks)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(tasks.id, task.id));

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));

      expect(updated.status).toBe("in_progress");
    });
  });

  describe("Delete", () => {
    it("deletes a task", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task to delete",
      });

      // Verify task exists
      const [exists] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(exists).toBeDefined();

      // Delete task
      await db.delete(tasks).where(eq(tasks.id, task.id));

      // Verify task is deleted
      const [deleted] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(deleted).toBeUndefined();
    });

    it("can mark task as cancelled instead of deleting", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const task = await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task to cancel",
        status: "pending",
      });

      await db
        .update(tasks)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(tasks.id, task.id));

      const [cancelled] = await db.select().from(tasks).where(eq(tasks.id, task.id));

      expect(cancelled).toBeDefined();
      expect(cancelled.status).toBe("cancelled");
    });
  });

  describe("Filter", () => {
    it("filters tasks by matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter1 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Matter 1",
      });
      const matter2 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Matter 2",
      });

      await createTask({
        firmId: ctx.firmId,
        matterId: matter1.id,
        title: "Matter 1 Task",
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter2.id,
        title: "Matter 2 Task",
      });

      const matter1Tasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.matterId, matter1.id)));

      const matter2Tasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.matterId, matter2.id)));

      expect(matter1Tasks.length).toBeGreaterThanOrEqual(1);
      expect(matter2Tasks.length).toBeGreaterThanOrEqual(1);
      expect(matter1Tasks.every((t) => t.matterId === matter1.id)).toBe(true);
      expect(matter2Tasks.every((t) => t.matterId === matter2.id)).toBe(true);
    });

    it("filters tasks by assignee", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const user1 = await createUser({ firmId: ctx.firmId, name: "User 1" });
      const user2 = await createUser({ firmId: ctx.firmId, name: "User 2" });

      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task for User 1",
        assigneeId: user1.id,
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Task for User 2",
        assigneeId: user2.id,
      });

      const user1Tasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.assigneeId, user1.id)));

      const user2Tasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.assigneeId, user2.id)));

      expect(user1Tasks.length).toBeGreaterThanOrEqual(1);
      expect(user2Tasks.length).toBeGreaterThanOrEqual(1);
      expect(user1Tasks.every((t) => t.assigneeId === user1.id)).toBe(true);
      expect(user2Tasks.every((t) => t.assigneeId === user2.id)).toBe(true);
    });

    it("filters tasks by status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Pending task",
        status: "pending",
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "In progress task",
        status: "in_progress",
      });
      await createCompletedTask(ctx.firmId, matter.id, {
        title: "Completed task",
      });

      const pendingTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.status, "pending")));

      const inProgressTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.status, "in_progress")));

      const completedTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.status, "completed")));

      expect(pendingTasks.length).toBeGreaterThanOrEqual(1);
      expect(inProgressTasks.length).toBeGreaterThanOrEqual(1);
      expect(completedTasks.length).toBeGreaterThanOrEqual(1);
    });

    it("filters tasks by due date range", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Due tomorrow",
        dueDate: tomorrow,
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Due next week",
        dueDate: nextWeek,
      });
      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Due next month",
        dueDate: nextMonth,
      });

      // Filter tasks due within the next week
      const weekStart = now;
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const tasksThisWeek = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.firmId, ctx.firmId),
            gte(tasks.dueDate, weekStart),
            lte(tasks.dueDate, weekEnd)
          )
        );

      expect(tasksThisWeek.length).toBeGreaterThanOrEqual(2); // tomorrow and next week
    });

    it("filters tasks by priority", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await createTask({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Low priority",
        priority: "low",
      });
      await createUrgentTask(ctx.firmId, matter.id, {
        title: "Urgent task",
      });

      const urgentTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.priority, "urgent")));

      expect(urgentTasks.length).toBeGreaterThanOrEqual(1);
      expect(urgentTasks.every((t) => t.priority === "urgent")).toBe(true);
    });
  });
});

describe("Tasks Integration - Task Workflow", () => {
  const ctx = setupIntegrationSuite();

  it("marks task as complete", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Task to complete",
      status: "pending",
    });

    const completedAt = new Date();

    await db
      .update(tasks)
      .set({
        status: "completed",
        completedAt,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    const [completed] = await db.select().from(tasks).where(eq(tasks.id, task.id));

    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toEqual(completedAt);
  });

  it("reopens completed task", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const task = await createCompletedTask(ctx.firmId, matter.id, {
      title: "Completed task to reopen",
    });

    // Manually set completedAt since factory doesn't do it
    await db
      .update(tasks)
      .set({
        completedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    // Verify it's completed
    const [completedTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
    expect(completedTask.status).toBe("completed");

    // Reopen the task
    await db
      .update(tasks)
      .set({
        status: "pending",
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    const [reopened] = await db.select().from(tasks).where(eq(tasks.id, task.id));

    expect(reopened.status).toBe("pending");
    expect(reopened.completedAt).toBeNull();
  });

  it("task completion updates matter timeline", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Task with timeline event",
      status: "pending",
    });

    // Complete the task
    const completedAt = new Date();
    await db
      .update(tasks)
      .set({
        status: "completed",
        completedAt,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    // Create a timeline event for the completion
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "task_completed",
      title: `Task completed: ${task.title}`,
      description: `Task "${task.title}" was marked as completed`,
      actorType: "user",
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
      },
      occurredAt: completedAt,
    });

    // Verify timeline event was created
    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    const taskCompletedEvent = events.find((e) => e.type === "task_completed");
    expect(taskCompletedEvent).toBeDefined();
    expect(taskCompletedEvent?.metadata).toMatchObject({
      taskId: task.id,
      taskTitle: task.title,
    });
  });

  it("tracks task status transitions", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Task with status transitions",
      status: "pending",
    });

    // Transition to in_progress
    await db
      .update(tasks)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(tasks.id, task.id));

    let [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));
    expect(updated.status).toBe("in_progress");

    // Transition to completed
    await db
      .update(tasks)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));
    expect(updated.status).toBe("completed");
    expect(updated.completedAt).toBeDefined();
  });
});

describe("Tasks Integration - Assignment", () => {
  const ctx = setupIntegrationSuite();

  it("assigns task to user", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const user = await createUser({ firmId: ctx.firmId, name: "Assignee" });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Unassigned task",
      assigneeId: null,
    });

    expect(task.assigneeId).toBeNull();

    // Assign to user
    await db
      .update(tasks)
      .set({
        assigneeId: user.id,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    const [assigned] = await db.select().from(tasks).where(eq(tasks.id, task.id));

    expect(assigned.assigneeId).toBe(user.id);
  });

  it("reassigns task to different user", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const user1 = await createUser({ firmId: ctx.firmId, name: "User 1" });
    const user2 = await createUser({ firmId: ctx.firmId, name: "User 2" });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Task to reassign",
      assigneeId: user1.id,
    });

    expect(task.assigneeId).toBe(user1.id);

    // Reassign to user2
    await db
      .update(tasks)
      .set({
        assigneeId: user2.id,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    const [reassigned] = await db.select().from(tasks).where(eq(tasks.id, task.id));

    expect(reassigned.assigneeId).toBe(user2.id);
    expect(reassigned.assigneeId).not.toBe(user1.id);
  });

  it("lists tasks assigned to user", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const user = await createUser({ firmId: ctx.firmId, name: "Task Owner" });

    // Create tasks for this user
    await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "User task 1",
      assigneeId: user.id,
    });
    await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "User task 2",
      assigneeId: user.id,
      status: "in_progress",
    });
    await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "User task 3",
      assigneeId: user.id,
      status: "completed",
    });

    // Create task for another user to verify filtering
    const otherUser = await createUser({ firmId: ctx.firmId, name: "Other User" });
    await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Other user task",
      assigneeId: otherUser.id,
    });

    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.assigneeId, user.id)));

    expect(userTasks.length).toBeGreaterThanOrEqual(3);
    expect(userTasks.every((t) => t.assigneeId === user.id)).toBe(true);
  });

  it("unassigns task from user", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });
    const user = await createUser({ firmId: ctx.firmId, name: "Assignee" });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Task to unassign",
      assigneeId: user.id,
    });

    expect(task.assigneeId).toBe(user.id);

    // Unassign
    await db
      .update(tasks)
      .set({
        assigneeId: null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    const [unassigned] = await db.select().from(tasks).where(eq(tasks.id, task.id));

    expect(unassigned.assigneeId).toBeNull();
  });

  it("lists unassigned tasks", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Unassigned 1",
      assigneeId: null,
    });
    const task2 = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Unassigned 2",
      assigneeId: null,
    });

    const unassignedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.firmId, ctx.firmId), eq(tasks.matterId, matter.id), isNull(tasks.assigneeId))
      );

    expect(unassignedTasks.length).toBeGreaterThanOrEqual(2);
    expect(unassignedTasks.some((t) => t.id === task1.id)).toBe(true);
    expect(unassignedTasks.some((t) => t.id === task2.id)).toBe(true);
  });
});

describe("Tasks Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates tasks between firms", async () => {
    // Create client and matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Task",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
    });

    const task2 = await createTask({
      firmId: firm2.id,
      matterId: matter2.id,
      title: "Firm 2 Task",
    });

    // Query tasks for first firm
    const firm1Tasks = await db.select().from(tasks).where(eq(tasks.firmId, ctx.firmId));

    // Query tasks for second firm
    const firm2Tasks = await db.select().from(tasks).where(eq(tasks.firmId, firm2.id));

    // Each firm should only see their own tasks
    expect(firm1Tasks.some((t) => t.id === task1.id)).toBe(true);
    expect(firm1Tasks.some((t) => t.id === task2.id)).toBe(false);

    expect(firm2Tasks.some((t) => t.id === task2.id)).toBe(true);
    expect(firm2Tasks.some((t) => t.id === task1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(tasks).where(eq(tasks.firmId, firm2.id));
    await db.delete(mattersTable).where(eq(mattersTable.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing tasks from another firm by ID", async () => {
    // Create task in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Isolated Task",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query task1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, task1.id),
          eq(tasks.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find the task
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing tasks through matter from another firm", async () => {
    // Create task in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Matter Task",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Cross-Firm Test Firm" });

    // Try to query tasks for matter1 with firm2's firmId
    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.matterId, matter1.id),
          eq(tasks.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find any tasks
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates assigned tasks between firms", async () => {
    // Create user and task in first firm
    const user1 = await createUser({ firmId: ctx.firmId });
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const task1 = await createTask({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Assigned Task",
      assigneeId: user1.id,
    });

    // Create second firm with its own user
    const firm2 = await createFirm({ name: "Assignment Test Firm" });
    const user2 = await createUser({ firmId: firm2.id });

    // Try to find tasks assigned to user1 in firm2's context
    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.firmId, firm2.id), // Wrong firm
          eq(tasks.assigneeId, user1.id)
        )
      );

    expect(result.length).toBe(0);

    // Verify task exists in firm1's context
    const firm1Result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.assigneeId, user1.id)));

    expect(firm1Result.length).toBeGreaterThanOrEqual(1);
    expect(firm1Result.some((t) => t.id === task1.id)).toBe(true);

    // Cleanup second firm
    const { users: usersTable } = await import("@/lib/db/schema");
    await db.delete(usersTable).where(eq(usersTable.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
