/**
 * Pipeline Dead-Letter Queue (DLQ) Monitoring
 *
 * Tracks jobs that have exhausted all BullMQ retry attempts.
 * Provides event handlers to attach to workers and utilities to query DLQ state.
 */

import type { Worker, Job } from "bullmq";
import type { PipelineJobData, PipelineStageName } from "./pipeline";
import { markPipelineFailed } from "./workers/pipeline-helpers";

// ---------------------------------------------------------------------------
// In-memory DLQ tracking (for monitoring dashboard)
// ---------------------------------------------------------------------------

export interface DlqEntry {
  jobId: string;
  stage: PipelineStageName;
  pipelineRunId: string;
  matterId: string;
  firmId: string;
  error: string;
  failedAt: Date;
  attemptsMade: number;
}

const MAX_DLQ_ENTRIES = 500;
const dlqEntries: DlqEntry[] = [];

/** Get current DLQ entries, optionally filtered by stage. */
export function getDlqEntries(stage?: PipelineStageName): DlqEntry[] {
  if (stage) return dlqEntries.filter((e) => e.stage === stage);
  return [...dlqEntries];
}

/** Get DLQ summary counts by stage. */
export function getDlqSummary(): Record<PipelineStageName, number> {
  const counts: Record<string, number> = {};
  for (const entry of dlqEntries) {
    counts[entry.stage] = (counts[entry.stage] || 0) + 1;
  }
  return counts as Record<PipelineStageName, number>;
}

/** Clear DLQ entries (e.g. after admin review). */
export function clearDlqEntries(stage?: PipelineStageName): number {
  if (stage) {
    const before = dlqEntries.length;
    const filtered = dlqEntries.filter((e) => e.stage !== stage);
    dlqEntries.length = 0;
    dlqEntries.push(...filtered);
    return before - dlqEntries.length;
  }
  const count = dlqEntries.length;
  dlqEntries.length = 0;
  return count;
}

// ---------------------------------------------------------------------------
// Worker event handler
// ---------------------------------------------------------------------------

/**
 * Attach DLQ monitoring to a pipeline worker.
 * Call this after creating each worker to track permanent failures.
 */
export function attachDlqMonitoring(
  worker: Worker<PipelineJobData>,
  stage: PipelineStageName
): void {
  worker.on("failed", async (job: Job<PipelineJobData> | undefined, err: Error) => {
    if (!job) return;

    const attemptsMade = job.attemptsMade ?? 0;
    const maxAttempts = job.opts?.attempts ?? 1;

    // Only track permanently failed jobs (all retries exhausted)
    if (attemptsMade < maxAttempts) return;

    const entry: DlqEntry = {
      jobId: job.id || "unknown",
      stage,
      pipelineRunId: job.data.pipelineRunId,
      matterId: job.data.matterId,
      firmId: job.data.firmId,
      error: err.message || "Unknown error",
      failedAt: new Date(),
      attemptsMade,
    };

    // Add to in-memory DLQ
    dlqEntries.push(entry);
    if (dlqEntries.length > MAX_DLQ_ENTRIES) {
      dlqEntries.shift(); // Drop oldest
    }

    // Mark pipeline run as permanently failed
    try {
      await markPipelineFailed(
        job.data.pipelineRunId,
        stage,
        `Permanently failed after ${attemptsMade} attempts: ${err.message}`
      );
    } catch (dbErr) {
      console.error(`[DLQ] Failed to update pipeline run ${job.data.pipelineRunId}:`, dbErr);
    }

    console.error(
      `[DLQ] Pipeline ${job.data.pipelineRunId} permanently failed at stage ${stage}` +
        ` after ${attemptsMade} attempts: ${err.message}`
    );
  });
}
