// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { Queue, Worker, QueueEvents } from "bullmq";
import { randomUUID } from "crypto";

function redisConnection(): { host: string; port: number } {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return { host: url.hostname, port: Number(url.port || 6379) };
}

describe("Queue Integration - Retry", () => {
  const connection = redisConnection();
  const queueName = `test-retry-${randomUUID()}`;

  const queue = new Queue(queueName, { connection });
  const events = new QueueEvents(queueName, { connection });

  let attempts = 0;
  const worker = new Worker(
    queueName,
    async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("fail-once");
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

  it("retries failed jobs and eventually succeeds", async () => {
    const job = await queue.add(
      "retry-me",
      { n: 1 },
      { attempts: 2, backoff: { type: "fixed", delay: 10 } }
    );

    const result = await job.waitUntilFinished(events);
    expect(result).toEqual({ ok: true });
    expect(attempts).toBe(2);
  });
});
