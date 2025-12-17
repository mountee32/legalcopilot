/**
 * Task factory for creating test tasks
 */
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskAiSource = "email" | "document" | "matter" | "other";

export interface TaskFactoryOptions {
  id?: string;
  firmId: string;
  matterId: string;
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  createdById?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date | null;
  aiGenerated?: boolean;
  aiSource?: TaskAiSource | null;
}

export interface TestTask {
  id: string;
  firmId: string;
  matterId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  aiGenerated: boolean;
}

/**
 * Create a test task in the database
 */
export async function createTask(options: TaskFactoryOptions): Promise<TestTask> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const taskData = {
    id,
    firmId: options.firmId,
    matterId: options.matterId,
    title: options.title || `Test Task ${suffix}`,
    description: options.description ?? null,
    assigneeId: options.assigneeId ?? null,
    createdById: options.createdById ?? null,
    priority: options.priority || "medium",
    status: options.status || "pending",
    dueDate: options.dueDate ?? null,
    aiGenerated: options.aiGenerated ?? false,
    aiSource: options.aiSource ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [task] = await db.insert(tasks).values(taskData).returning();

  return {
    id: task.id,
    firmId: task.firmId,
    matterId: task.matterId,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    aiGenerated: task.aiGenerated,
  };
}

/**
 * Build task data without inserting into database
 */
export function buildTaskData(
  firmId: string,
  matterId: string,
  options: Partial<TaskFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);

  return {
    firmId,
    matterId,
    title: options.title || `Test Task ${suffix}`,
    description: options.description ?? null,
    assigneeId: options.assigneeId ?? null,
    priority: options.priority || "medium",
    status: options.status || "pending",
    dueDate: options.dueDate?.toISOString() ?? null,
    aiGenerated: options.aiGenerated ?? false,
  };
}

/**
 * Create an AI-generated task
 */
export async function createAIGeneratedTask(
  firmId: string,
  matterId: string,
  options: Partial<TaskFactoryOptions> = {}
): Promise<TestTask> {
  return createTask({
    ...options,
    firmId,
    matterId,
    aiGenerated: true,
    aiSource: options.aiSource || "matter",
  });
}

/**
 * Create an urgent task
 */
export async function createUrgentTask(
  firmId: string,
  matterId: string,
  options: Partial<TaskFactoryOptions> = {}
): Promise<TestTask> {
  return createTask({
    ...options,
    firmId,
    matterId,
    priority: "urgent",
    dueDate: options.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  });
}

/**
 * Create a completed task
 */
export async function createCompletedTask(
  firmId: string,
  matterId: string,
  options: Partial<TaskFactoryOptions> = {}
): Promise<TestTask> {
  return createTask({
    ...options,
    firmId,
    matterId,
    status: "completed",
  });
}
