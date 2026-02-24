/**
 * Email Send Queue
 *
 * Background job queue for sending emails via Graph API after approval.
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

export interface EmailSendJobData {
  emailId: string;
  firmId: string;
  approvalRequestId: string;
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export const emailSendQueue = new Queue<EmailSendJobData>("email:send", { connection });
