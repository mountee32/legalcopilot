// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { Queue, Worker, QueueEvents } from "bullmq";
import { randomUUID } from "crypto";

function redisConnection(): { host: string; port: number } {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return { host: url.hostname, port: Number(url.port || 6379) };
}

describe("Queue Integration - Processing", () => {
  const connection = redisConnection();
  const queueName = `test-processing-${randomUUID()}`;

  const queue = new Queue(queueName, { connection });
  const events = new QueueEvents(queueName, { connection });

  const processed: unknown[] = [];
  const worker = new Worker(
    queueName,
    async (job) => {
      processed.push(job.data);
      return { ok: true };
    },
    { connection }
  );

  afterAll(async () => {
    await worker.close();
    await events.close();
    await queue.obliterate({ force: true }).catch(() => {});
    await queue.close();
  });

  it("processes an enqueued job", async () => {
    const job = await queue.add("test", { hello: "world" });
    const result = await job.waitUntilFinished(events);

    expect(result).toEqual({ ok: true });
    expect(processed).toContainEqual({ hello: "world" });
  });
});
