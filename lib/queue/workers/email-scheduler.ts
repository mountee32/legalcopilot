/**
 * Email Scheduler Worker
 *
 * Runs on the email:scheduler queue (every 5 minutes).
 * Fetches all connected email accounts and enqueues one email:poll job per account.
 * Uses jobId to prevent duplicate poll jobs for the same account.
 */

import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailAccounts } from "@/lib/db/schema";
import { emailPollQueue } from "@/lib/queue/email-poll";
import type { EmailSchedulerJobData } from "@/lib/queue/email-poll";

const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const emailSchedulerWorker = new Worker<EmailSchedulerJobData>(
  "email:scheduler",
  async (job) => {
    // Fetch all connected email accounts
    const accounts = await db
      .select({ id: emailAccounts.id, firmId: emailAccounts.firmId })
      .from(emailAccounts)
      .where(eq(emailAccounts.status, "connected"));

    let enqueued = 0;

    for (const account of accounts) {
      await emailPollQueue.add(
        "email:poll",
        {
          emailAccountId: account.id,
          firmId: account.firmId,
        },
        {
          jobId: `poll:${account.id}`,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        }
      );
      enqueued++;
    }

    return { accountsFound: accounts.length, enqueued };
  },
  {
    connection,
    concurrency: 1,
  }
);

emailSchedulerWorker.on("completed", (job) => {
  console.log(`[email:scheduler] Completed: ${JSON.stringify(job.returnvalue)}`);
});

emailSchedulerWorker.on("failed", (job, err) => {
  console.error(`[email:scheduler] Failed:`, err.message);
});
