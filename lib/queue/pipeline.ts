/**
 * Pipeline Queue Orchestrator
 *
 * Manages 6 named BullMQ queues that form the document processing pipeline:
 *   intake → ocr → classify → extract → reconcile → actions
 *
 * Each stage is an independent queue with its own concurrency and retry settings.
 * The orchestrator advances a pipeline run through stages sequentially.
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
// Stage definitions
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES = [
  "intake",
  "ocr",
  "classify",
  "extract",
  "reconcile",
  "actions",
] as const;

export type PipelineStageName = (typeof PIPELINE_STAGES)[number];

// ---------------------------------------------------------------------------
// Queue configuration per stage
// ---------------------------------------------------------------------------

interface StageConfig {
  concurrency: number;
  attempts: number;
  backoffDelay: number;
  timeoutMs: number;
}

export const STAGE_CONFIG: Record<PipelineStageName, StageConfig> = {
  intake: { concurrency: 10, attempts: 3, backoffDelay: 1000, timeoutMs: 30_000 },
  ocr: { concurrency: 5, attempts: 3, backoffDelay: 2000, timeoutMs: 300_000 },
  classify: { concurrency: 5, attempts: 3, backoffDelay: 2000, timeoutMs: 300_000 },
  extract: { concurrency: 3, attempts: 3, backoffDelay: 3000, timeoutMs: 300_000 },
  reconcile: { concurrency: 5, attempts: 2, backoffDelay: 2000, timeoutMs: 60_000 },
  actions: { concurrency: 5, attempts: 2, backoffDelay: 2000, timeoutMs: 60_000 },
};

// ---------------------------------------------------------------------------
// Job data types
// ---------------------------------------------------------------------------

export interface PipelineJobData {
  pipelineRunId: string;
  firmId: string;
  matterId: string;
  documentId: string;
  triggeredBy: string | null;
}

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------

export const intakeQueue = new Queue<PipelineJobData>("pipeline:intake", { connection });
export const ocrQueue = new Queue<PipelineJobData>("pipeline:ocr", { connection });
export const classifyQueue = new Queue<PipelineJobData>("pipeline:classify", { connection });
export const extractQueue = new Queue<PipelineJobData>("pipeline:extract", { connection });
export const reconcileQueue = new Queue<PipelineJobData>("pipeline:reconcile", { connection });
export const actionsQueue = new Queue<PipelineJobData>("pipeline:actions", { connection });

const STAGE_QUEUES: Record<PipelineStageName, Queue<PipelineJobData>> = {
  intake: intakeQueue,
  ocr: ocrQueue,
  classify: classifyQueue,
  extract: extractQueue,
  reconcile: reconcileQueue,
  actions: actionsQueue,
};

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Enqueue the first stage (intake) for a pipeline run.
 */
export async function startPipeline(data: PipelineJobData) {
  return enqueueStage("intake", data);
}

/**
 * Advance a pipeline run to the next stage.
 * Called by each worker after completing its stage successfully.
 * Returns the next stage name, or null if the pipeline is complete.
 */
export async function advanceToNextStage(
  currentStage: PipelineStageName,
  data: PipelineJobData
): Promise<PipelineStageName | null> {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= PIPELINE_STAGES.length) {
    return null; // Pipeline complete
  }

  const nextStage = PIPELINE_STAGES[nextIndex];
  await enqueueStage(nextStage, data);
  return nextStage;
}

/**
 * Retry a pipeline run from a specific stage.
 */
export async function retryFromStage(stage: PipelineStageName, data: PipelineJobData) {
  return enqueueStage(stage, data);
}

/**
 * Enqueue a job for a specific stage.
 */
async function enqueueStage(stage: PipelineStageName, data: PipelineJobData) {
  const queue = STAGE_QUEUES[stage];
  const config = STAGE_CONFIG[stage];

  return queue.add(`pipeline:${stage}`, data, {
    attempts: config.attempts,
    backoff: {
      type: "exponential",
      delay: config.backoffDelay,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });
}

/**
 * Get the next stage name after the given stage, or null if at end.
 */
export function getNextStage(current: PipelineStageName): PipelineStageName | null {
  const idx = PIPELINE_STAGES.indexOf(current);
  return idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : null;
}
