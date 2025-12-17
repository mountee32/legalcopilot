// @vitest-environment node
/**
 * Advanced Queue Integration Tests
 *
 * Tests BullMQ advanced features: scheduling, priority, failed jobs, and cancellation.
 * Uses real Redis connection.
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { randomUUID } from "crypto";

function redisConnection(): { host: string; port: number } {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return { host: url.hostname, port: Number(url.port || 6379) };
}

describe("Queue Integration - Advanced Features", () => {
  const connection = redisConnection();

  describe("Delayed Jobs (Scheduling)", () => {
    const queueName = `test-delayed-${randomUUID()}`;
    let queue: Queue;
    let events: QueueEvents;
    let worker: Worker;
    const processed: { data: unknown; time: number }[] = [];
    let startTime: number;

    beforeAll(async () => {
      queue = new Queue(queueName, { connection });
      events = new QueueEvents(queueName, { connection });
      startTime = Date.now();

      worker = new Worker(
        queueName,
        async (job) => {
          processed.push({ data: job.data, time: Date.now() - startTime });
          return { ok: true };
        },
        { connection }
      );
    });

    afterAll(async () => {
      await worker.close();
      await events.close();
      await queue.obliterate({ force: true }).catch(() => {});
      await queue.close();
    });

    it("delayed job executes after delay period", async () => {
      const delayMs = 50;
      startTime = Date.now();
      processed.length = 0;

      const job = await queue.add("delayed", { value: "test" }, { delay: delayMs });

      // Wait for job to complete
      await job.waitUntilFinished(events, 5000);

      expect(processed.length).toBe(1);
      expect(processed[0].data).toEqual({ value: "test" });
      // Job should have executed after the delay
      expect(processed[0].time).toBeGreaterThanOrEqual(delayMs - 10); // Allow 10ms tolerance
    });

    it("scheduled job can be cancelled before execution", async () => {
      // Add a delayed job
      const job = await queue.add("to-cancel", { value: "cancel-me" }, { delay: 5000 });

      // Verify it's in delayed state
      const stateBefore = await job.getState();
      expect(stateBefore).toBe("delayed");

      // Cancel it by removing
      await job.remove();

      // Verify it's gone
      const jobAfter = await queue.getJob(job.id!);
      expect(jobAfter).toBeFalsy(); // BullMQ returns undefined for missing jobs
    });
  });

  describe("Priority Queues", () => {
    const queueName = `test-priority-${randomUUID()}`;
    let queue: Queue;
    let events: QueueEvents;
    let worker: Worker | null = null;
    const processedOrder: number[] = [];

    beforeAll(async () => {
      queue = new Queue(queueName, { connection });
      events = new QueueEvents(queueName, { connection });
    });

    afterAll(async () => {
      if (worker) await worker.close();
      await events.close();
      await queue.obliterate({ force: true }).catch(() => {});
      await queue.close();
    });

    it("higher priority job (lower number) processes before lower priority", async () => {
      processedOrder.length = 0;

      // Add jobs in order: low priority first, high priority second
      // DON'T start worker yet so jobs queue up
      await queue.add("low-priority", { priority: "low" }, { priority: 10 });
      await queue.add("high-priority", { priority: "high" }, { priority: 1 });
      await queue.add("medium-priority", { priority: "medium" }, { priority: 5 });

      // Now start worker to process them
      worker = new Worker(
        queueName,
        async (job) => {
          processedOrder.push(job.opts.priority || 0);
          return { ok: true };
        },
        { connection }
      );

      // Wait for all jobs to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Jobs should be processed in priority order: 1, 5, 10
      expect(processedOrder.length).toBe(3);
      expect(processedOrder[0]).toBe(1); // High priority first
      expect(processedOrder[1]).toBe(5); // Medium second
      expect(processedOrder[2]).toBe(10); // Low last
    });
  });

  describe("Failed Jobs (Dead Letter)", () => {
    const queueName = `test-failed-${randomUUID()}`;
    let queue: Queue;
    let events: QueueEvents;
    let worker: Worker;
    let shouldFail = true;

    beforeAll(async () => {
      queue = new Queue(queueName, { connection });
      events = new QueueEvents(queueName, { connection });

      worker = new Worker(
        queueName,
        async (job) => {
          if (shouldFail && job.data.failAlways) {
            throw new Error("Intentional failure");
          }
          return { ok: true, attemptNumber: job.attemptsMade };
        },
        { connection }
      );
    });

    afterAll(async () => {
      await worker.close();
      await events.close();
      await queue.obliterate({ force: true }).catch(() => {});
      await queue.close();
    });

    it("job failing all attempts moves to failed state", async () => {
      const job = await queue.add(
        "will-fail",
        { failAlways: true },
        { attempts: 2, backoff: { type: "fixed", delay: 10 } }
      );

      // Wait for job to exhaust retries
      try {
        await job.waitUntilFinished(events, 5000);
      } catch {
        // Expected to throw when job fails
      }

      // Verify job is in failed state
      const state = await job.getState();
      expect(state).toBe("failed");

      // Verify it's in the failed list
      const failed = await queue.getFailed();
      expect(failed.some((j) => j.id === job.id)).toBe(true);
    });

    it("failed job can be retried and succeeds", async () => {
      // First, let a job fail
      shouldFail = true;
      const job = await queue.add("retry-after-fail", { failAlways: true }, { attempts: 1 });

      // Wait for it to fail
      try {
        await job.waitUntilFinished(events, 5000);
      } catch {
        // Expected
      }

      const stateBefore = await job.getState();
      expect(stateBefore).toBe("failed");

      // Now make it succeed and retry
      shouldFail = false;
      await job.retry();

      // Wait for completion
      const result = await job.waitUntilFinished(events, 5000);

      expect(result).toEqual({ ok: true, attemptNumber: 1 });

      const stateAfter = await job.getState();
      expect(stateAfter).toBe("completed");
    });

    it("failed job can be permanently removed", async () => {
      shouldFail = true;
      const job = await queue.add("remove-after-fail", { failAlways: true }, { attempts: 1 });

      // Wait for failure
      try {
        await job.waitUntilFinished(events, 5000);
      } catch {
        // Expected
      }

      const stateBefore = await job.getState();
      expect(stateBefore).toBe("failed");

      // Remove the failed job
      await job.remove();

      // Verify it's gone
      const jobAfter = await queue.getJob(job.id!);
      expect(jobAfter).toBeFalsy(); // BullMQ returns undefined for missing jobs
    });
  });

  describe("Multiple Priorities Ordering", () => {
    const queueName = `test-multi-priority-${randomUUID()}`;
    let queue: Queue;
    let events: QueueEvents;
    let worker: Worker | null = null;
    const processedValues: string[] = [];

    beforeAll(async () => {
      queue = new Queue(queueName, { connection });
      events = new QueueEvents(queueName, { connection });
    });

    afterAll(async () => {
      if (worker) await worker.close();
      await events.close();
      await queue.obliterate({ force: true }).catch(() => {});
      await queue.close();
    });

    it("processes multiple jobs in correct priority order", async () => {
      processedValues.length = 0;

      // Add multiple jobs with various priorities (no worker yet)
      await queue.add("job-e", { value: "E" }, { priority: 5 });
      await queue.add("job-a", { value: "A" }, { priority: 1 });
      await queue.add("job-d", { value: "D" }, { priority: 4 });
      await queue.add("job-c", { value: "C" }, { priority: 3 });
      await queue.add("job-b", { value: "B" }, { priority: 2 });

      // Start worker to process
      worker = new Worker(
        queueName,
        async (job) => {
          processedValues.push(job.data.value);
          return { ok: true };
        },
        { connection }
      );

      // Wait for all jobs
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should be in priority order: A(1), B(2), C(3), D(4), E(5)
      expect(processedValues).toEqual(["A", "B", "C", "D", "E"]);
    });
  });
});
