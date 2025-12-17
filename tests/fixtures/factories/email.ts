/**
 * Email factory for creating test emails
 */
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type EmailDirection = "inbound" | "outbound";
export type EmailStatus =
  | "draft"
  | "pending"
  | "sent"
  | "delivered"
  | "received"
  | "failed"
  | "bounced"
  | "archived";
export type EmailIntent =
  | "request_information"
  | "provide_information"
  | "request_action"
  | "status_update"
  | "complaint"
  | "deadline"
  | "confirmation"
  | "general";
export type EmailSentiment = "positive" | "neutral" | "negative" | "frustrated";

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailFactoryOptions {
  id?: string;
  firmId: string;
  matterId?: string;
  direction?: EmailDirection;
  status?: EmailStatus;

  // Email addresses
  fromAddress?: EmailAddress;
  toAddresses?: EmailAddress[];
  ccAddresses?: EmailAddress[];
  bccAddresses?: EmailAddress[];

  // Content
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;

  // Metadata
  messageId?: string;
  threadId?: string;
  inReplyTo?: string;

  // Attachments
  hasAttachments?: boolean;
  attachmentCount?: number;
  attachmentIds?: string[];

  // Timestamps
  readAt?: Date | null;
  receivedAt?: Date;
  sentAt?: Date;

  // AI processing
  aiProcessed?: boolean;
  aiProcessedAt?: Date | null;
  aiIntent?: EmailIntent;
  aiSentiment?: EmailSentiment;
  aiUrgency?: number;
  aiSummary?: string;
  aiSuggestedResponse?: string;
  aiSuggestedTasks?: any[];
  aiMatchedMatterId?: string;
  aiMatchConfidence?: number;

  createdBy?: string;
}

export interface TestEmail {
  id: string;
  firmId: string;
  matterId: string | null;
  direction: string;
  status: string;
  fromAddress: any;
  toAddresses: any;
  ccAddresses: any;
  bccAddresses: any;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  messageId: string | null;
  threadId: string | null;
  inReplyTo: string | null;
  hasAttachments: boolean;
  attachmentCount: number;
  attachmentIds: any;
  readAt: Date | null;
  receivedAt: Date | null;
  sentAt: Date | null;
  aiProcessed: boolean;
  aiProcessedAt: Date | null;
  aiIntent: string | null;
  aiSentiment: string | null;
  aiUrgency: number | null;
  aiSummary: string | null;
  aiSuggestedResponse: string | null;
  aiSuggestedTasks: any;
  aiMatchedMatterId: string | null;
  aiMatchConfidence: number | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a test email in the database
 */
export async function createEmail(options: EmailFactoryOptions): Promise<TestEmail> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);
  const direction = options.direction || "inbound";

  const emailData = {
    id,
    firmId: options.firmId,
    matterId: options.matterId ?? null,
    direction,
    status: options.status || (direction === "inbound" ? "received" : "draft"),

    // Default addresses based on direction
    fromAddress:
      options.fromAddress ||
      (direction === "inbound"
        ? { name: "Test Client", address: `client-${suffix}@example.com` }
        : { name: "Test Lawyer", address: `lawyer-${suffix}@example.com` }),

    toAddresses:
      options.toAddresses ||
      (direction === "inbound"
        ? [{ name: "Test Lawyer", address: `lawyer-${suffix}@example.com` }]
        : [{ name: "Test Client", address: `client-${suffix}@example.com` }]),

    ccAddresses: options.ccAddresses ?? null,
    bccAddresses: options.bccAddresses ?? null,

    // Content
    subject: options.subject || `Test Email ${suffix}`,
    bodyText: options.bodyText ?? `This is a test email message ${suffix}`,
    bodyHtml: options.bodyHtml ?? null,

    // Metadata
    messageId: options.messageId ?? `<${suffix}@test.example.com>`,
    threadId: options.threadId ?? null,
    inReplyTo: options.inReplyTo ?? null,

    // Attachments
    hasAttachments: options.hasAttachments ?? false,
    attachmentCount: options.attachmentCount ?? 0,
    attachmentIds: options.attachmentIds ?? null,

    // Read status
    readAt: options.readAt === undefined ? null : options.readAt,

    // Timestamps
    receivedAt: options.receivedAt ?? (direction === "inbound" ? new Date() : null),
    sentAt:
      options.sentAt ?? (direction === "outbound" && options.status === "sent" ? new Date() : null),

    // AI processing
    aiProcessed: options.aiProcessed ?? false,
    aiProcessedAt: options.aiProcessedAt === undefined ? null : options.aiProcessedAt,
    aiIntent: options.aiIntent ?? null,
    aiSentiment: options.aiSentiment ?? null,
    aiUrgency: options.aiUrgency ?? null,
    aiSummary: options.aiSummary ?? null,
    aiSuggestedResponse: options.aiSuggestedResponse ?? null,
    aiSuggestedTasks: options.aiSuggestedTasks ?? null,
    aiMatchedMatterId: options.aiMatchedMatterId ?? null,
    aiMatchConfidence: options.aiMatchConfidence ?? null,

    createdBy: options.createdBy ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [email] = await db.insert(emails).values(emailData).returning();

  return {
    id: email.id,
    firmId: email.firmId,
    matterId: email.matterId,
    direction: email.direction,
    status: email.status,
    fromAddress: email.fromAddress,
    toAddresses: email.toAddresses,
    ccAddresses: email.ccAddresses,
    bccAddresses: email.bccAddresses,
    subject: email.subject,
    bodyText: email.bodyText,
    bodyHtml: email.bodyHtml,
    messageId: email.messageId,
    threadId: email.threadId,
    inReplyTo: email.inReplyTo,
    hasAttachments: email.hasAttachments,
    attachmentCount: email.attachmentCount,
    attachmentIds: email.attachmentIds,
    readAt: email.readAt,
    receivedAt: email.receivedAt,
    sentAt: email.sentAt,
    aiProcessed: email.aiProcessed,
    aiProcessedAt: email.aiProcessedAt,
    aiIntent: email.aiIntent,
    aiSentiment: email.aiSentiment,
    aiUrgency: email.aiUrgency,
    aiSummary: email.aiSummary,
    aiSuggestedResponse: email.aiSuggestedResponse,
    aiSuggestedTasks: email.aiSuggestedTasks,
    aiMatchedMatterId: email.aiMatchedMatterId,
    aiMatchConfidence: email.aiMatchConfidence,
    createdBy: email.createdBy,
    createdAt: email.createdAt,
    updatedAt: email.updatedAt,
  };
}

/**
 * Build email data without inserting into database
 */
export function buildEmailData(
  firmId: string,
  options: Partial<EmailFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);
  const direction = options.direction || "inbound";

  return {
    firmId,
    direction,
    status: options.status || (direction === "inbound" ? "received" : "draft"),
    fromAddress:
      options.fromAddress ||
      (direction === "inbound"
        ? { name: "Test Client", address: `client-${suffix}@example.com` }
        : { name: "Test Lawyer", address: `lawyer-${suffix}@example.com` }),
    toAddresses:
      options.toAddresses ||
      (direction === "inbound"
        ? [{ name: "Test Lawyer", address: `lawyer-${suffix}@example.com` }]
        : [{ name: "Test Client", address: `client-${suffix}@example.com` }]),
    subject: options.subject || `Test Email ${suffix}`,
    bodyText: options.bodyText ?? `This is a test email message ${suffix}`,
    messageId: options.messageId ?? `<${suffix}@test.example.com>`,
    matterId: options.matterId,
  };
}

/**
 * Create an inbound email (received from client)
 */
export async function createInboundEmail(
  firmId: string,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail> {
  return createEmail({
    ...options,
    firmId,
    direction: "inbound",
    status: options.status || "received",
  });
}

/**
 * Create an outbound email (sent to client)
 */
export async function createOutboundEmail(
  firmId: string,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail> {
  return createEmail({
    ...options,
    firmId,
    direction: "outbound",
    status: options.status || "draft",
  });
}

/**
 * Create a draft email
 */
export async function createDraftEmail(
  firmId: string,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail> {
  return createEmail({
    ...options,
    firmId,
    direction: "outbound",
    status: "draft",
    sentAt: undefined,
  });
}

/**
 * Create a sent email
 */
export async function createSentEmail(
  firmId: string,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail> {
  return createEmail({
    ...options,
    firmId,
    direction: "outbound",
    status: "sent",
    sentAt: options.sentAt || new Date(),
  });
}

/**
 * Create an email with AI processing completed
 */
export async function createProcessedEmail(
  firmId: string,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail> {
  return createEmail({
    ...options,
    firmId,
    aiProcessed: true,
    aiProcessedAt: new Date(),
    aiIntent: options.aiIntent || "request_information",
    aiSentiment: options.aiSentiment || "neutral",
    aiUrgency: options.aiUrgency ?? 5,
    aiSummary: options.aiSummary || "AI summary of the email content",
  });
}

/**
 * Create multiple emails for testing
 */
export async function createManyEmails(
  firmId: string,
  count: number,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail[]> {
  const emailsList: TestEmail[] = [];
  for (let i = 0; i < count; i++) {
    const email = await createEmail({
      ...options,
      firmId,
      subject: options.subject || `Test Email ${i}`,
    });
    emailsList.push(email);
  }
  return emailsList;
}

/**
 * Create an email thread (multiple emails with same threadId)
 */
export async function createEmailThread(
  firmId: string,
  count: number,
  options: Partial<EmailFactoryOptions> = {}
): Promise<TestEmail[]> {
  const threadId = options.threadId || `thread-${Date.now().toString(36)}`;
  const emailsList: TestEmail[] = [];

  for (let i = 0; i < count; i++) {
    const email = await createEmail({
      ...options,
      firmId,
      threadId,
      subject: options.subject || `Re: Test Thread`,
      inReplyTo: i > 0 ? emailsList[i - 1].messageId : undefined,
    });
    emailsList.push(email);
  }

  return emailsList;
}
