import { Queue, QueueEvents } from "bullmq";

// Create a BullMQ connection from the existing Redis client
const connection = {
  host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Example: Email queue
export const emailQueue = new Queue("email", { connection });

// Example: Image processing queue
export const imageQueue = new Queue("image-processing", { connection });

// Example: Generic job queue
export const jobQueue = new Queue("jobs", { connection });

// Queue events for monitoring
export const emailQueueEvents = new QueueEvents("email", { connection });
export const imageQueueEvents = new QueueEvents("image-processing", { connection });
export const jobQueueEvents = new QueueEvents("jobs", { connection });

// Example job types
export interface EmailJob {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface ImageProcessingJob {
  imageUrl: string;
  operations: string[];
  outputFormat?: string;
}

export interface GenericJob {
  type: string;
  data: Record<string, unknown>;
}

// Helper functions to add jobs
export async function addEmailJob(data: EmailJob) {
  return await emailQueue.add("send-email", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}

export async function addImageProcessingJob(data: ImageProcessingJob) {
  return await imageQueue.add("process-image", data, {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

export async function addGenericJob(name: string, data: GenericJob) {
  return await jobQueue.add(name, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}
