/**
 * Email Poll Queue
 *
 * Two queues for email ingestion:
 *   - email:scheduler — repeatable job that runs every 5 minutes
 *   - email:poll — one job per connected email account
 */

import { Queue } from "bullmq";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// ---------------------------------------------------------------------------
// Job data types
// ---------------------------------------------------------------------------

export interface EmailPollJobData {
  emailAccountId: string;
  firmId: string;
}

export interface EmailSchedulerJobData {
  triggeredAt: string;
}

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------

export const emailPollQueue = new Queue<EmailPollJobData>("email:poll", { connection });
export const emailSchedulerQueue = new Queue<EmailSchedulerJobData>("email:scheduler", {
  connection,
});

// ---------------------------------------------------------------------------
// Scheduler setup
// ---------------------------------------------------------------------------

/**
 * Add the repeatable scheduler job. Runs every 5 minutes.
 * Safe to call multiple times — BullMQ deduplicates repeatable jobs by key.
 */
export async function startEmailScheduler(): Promise<void> {
  await emailSchedulerQueue.add(
    "email:scheduler",
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { pattern: "*/5 * * * *" },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    }
  );
}
