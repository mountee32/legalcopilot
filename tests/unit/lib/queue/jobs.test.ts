import { describe, it, expect, vi, beforeEach } from "vitest";

type AddCall = { name: string; data: unknown; opts: any };

const addsByQueueName = new Map<string, AddCall[]>();

vi.mock("bullmq", () => {
  class Queue {
    name: string;
    constructor(name: string) {
      this.name = name;
      addsByQueueName.set(name, []);
    }
    add = vi.fn(async (name: string, data: unknown, opts: any) => {
      addsByQueueName.get(this.name)!.push({ name, data, opts });
      return { id: "job-1" };
    });
  }

  class QueueEvents {
    constructor(_name: string) {}
  }

  return { Queue, QueueEvents };
});

describe("lib/queue - job enqueueing", () => {
  beforeEach(() => {
    addsByQueueName.clear();
    vi.resetModules();
  });

  it("adds email job with retries + exponential backoff", async () => {
    const { addEmailJob } = await import("@/lib/queue");
    await addEmailJob({ to: "t@test.example.com", subject: "S", body: "B" });

    const calls = addsByQueueName.get("email") ?? [];
    expect(calls).toHaveLength(1);
    expect(calls[0]!.name).toBe("send-email");
    expect(calls[0]!.opts).toEqual(
      expect.objectContaining({
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      })
    );
  });

  it("adds generic job with retries + exponential backoff", async () => {
    const { addGenericJob } = await import("@/lib/queue");
    await addGenericJob("cleanup", { type: "cleanup", data: { dryRun: true } });

    const calls = addsByQueueName.get("jobs") ?? [];
    expect(calls).toHaveLength(1);
    expect(calls[0]!.name).toBe("cleanup");
    expect(calls[0]!.opts).toEqual(
      expect.objectContaining({
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      })
    );
  });
});
