/**
 * Email API Schemas
 *
 * @see lib/db/schema/emails.ts for database schema
 */

import {
  z,
  UuidSchema,
  DateTimeSchema,
  EmailSchema as EmailStringSchema,
  PaginationSchema,
  PaginationMetaSchema,
} from "./common";

export const EmailDirectionSchema = z.enum(["inbound", "outbound"]).openapi("EmailDirection");

export const EmailStatusSchema = z
  .enum(["draft", "pending", "sent", "delivered", "received", "failed", "bounced", "archived"])
  .openapi("EmailStatus");

export const EmailIntentSchema = z
  .enum([
    "request_information",
    "provide_information",
    "request_action",
    "status_update",
    "complaint",
    "deadline",
    "confirmation",
    "general",
  ])
  .openapi("EmailIntent");

export const EmailSentimentSchema = z
  .enum(["positive", "neutral", "negative", "frustrated"])
  .openapi("EmailSentiment");

export const EmailAddressSchema = z
  .object({
    email: EmailStringSchema,
    name: z.string().optional(),
  })
  .openapi("EmailAddress");

export const EmailMessageSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema.nullable(),
    direction: EmailDirectionSchema,

    fromAddress: EmailAddressSchema,
    toAddresses: z.array(EmailAddressSchema),
    ccAddresses: z.array(EmailAddressSchema).nullable(),
    bccAddresses: z.array(EmailAddressSchema).nullable(),

    subject: z.string(),
    bodyText: z.string().nullable(),
    bodyHtml: z.string().nullable(),

    messageId: z.string().nullable(),
    threadId: z.string().nullable(),
    inReplyTo: z.string().nullable(),

    hasAttachments: z.boolean(),
    attachmentCount: z.number().int(),
    attachmentIds: z.array(UuidSchema).nullable(),

    status: EmailStatusSchema,
    readAt: DateTimeSchema.nullable(),

    aiProcessed: z.boolean(),
    aiProcessedAt: DateTimeSchema.nullable(),
    aiIntent: EmailIntentSchema.nullable(),
    aiSentiment: EmailSentimentSchema.nullable(),
    aiUrgency: z.number().int().nullable(),
    aiSummary: z.string().nullable(),
    aiSuggestedResponse: z.string().nullable(),
    aiSuggestedTasks: z.array(z.string()).nullable(),
    aiMatchedMatterId: UuidSchema.nullable(),
    aiMatchConfidence: z.number().int().nullable(),

    createdBy: UuidSchema.nullable(),
    receivedAt: DateTimeSchema.nullable(),
    sentAt: DateTimeSchema.nullable(),

    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Email");

export const CreateEmailSchema = z
  .object({
    matterId: UuidSchema.optional(),
    direction: EmailDirectionSchema,
    fromAddress: EmailAddressSchema,
    toAddresses: z.array(EmailAddressSchema).min(1),
    ccAddresses: z.array(EmailAddressSchema).optional(),
    bccAddresses: z.array(EmailAddressSchema).optional(),
    subject: z.string().min(1).max(500),
    bodyText: z.string().optional(),
    bodyHtml: z.string().optional(),
    messageId: z.string().optional(),
    threadId: z.string().optional(),
    inReplyTo: z.string().optional(),
    attachmentIds: z.array(UuidSchema).optional(),
  })
  .openapi("CreateEmailRequest");

export const UpdateEmailSchema = z
  .object({
    matterId: UuidSchema.nullable().optional(),
    status: EmailStatusSchema.optional(),
    readAt: DateTimeSchema.nullable().optional(),
  })
  .openapi("UpdateEmailRequest");

export const EmailQuerySchema = PaginationSchema.extend({
  matterId: UuidSchema.optional(),
  direction: EmailDirectionSchema.optional(),
  status: EmailStatusSchema.optional(),
  aiProcessed: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    }, z.boolean())
    .optional(),
  search: z.string().optional(),
}).openapi("EmailQuery");

export const EmailListSchema = z
  .object({
    emails: z.array(EmailMessageSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("EmailListResponse");

export const EmailAIProcessResponseSchema = z
  .object({
    success: z.literal(true),
    email: EmailMessageSchema,
  })
  .openapi("EmailAIProcessResponse");

export const SendEmailRequestSchema = z
  .object({
    contentHash: z.string().optional(),
  })
  .openapi("SendEmailRequest");

export const SendEmailResponseSchema = z
  .object({
    approvalRequest: z.object({
      id: UuidSchema,
      status: z.string(),
      action: z.string(),
      summary: z.string(),
      createdAt: DateTimeSchema,
    }),
  })
  .openapi("SendEmailResponse");

export const AttachDocumentsRequestSchema = z
  .object({
    documentIds: z.array(UuidSchema).min(1).max(10),
  })
  .openapi("AttachDocumentsRequest");

export const AttachDocumentsResponseSchema = z
  .object({
    success: z.literal(true),
    email: EmailMessageSchema,
  })
  .openapi("AttachDocumentsResponse");

// ---------------------------------------------------------------------------
// Sprint 9: Response generation, task creation, thread
// ---------------------------------------------------------------------------

export const CreateEmailTasksSchema = z
  .object({
    tasks: z
      .array(
        z.object({
          title: z.string().min(1).max(500),
          description: z.string().max(2000).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          dueInDays: z.number().int().min(0).max(365).optional(),
          assigneeId: UuidSchema.optional(),
        })
      )
      .min(1)
      .max(20),
  })
  .openapi("CreateEmailTasksRequest");

export const GenerateResponseResponseSchema = z
  .object({
    response: z.string(),
    tokensUsed: z.number().int(),
  })
  .openapi("GenerateResponseResponse");

export const EmailThreadSchema = z
  .object({
    thread: z.array(EmailMessageSchema),
    currentEmailId: UuidSchema,
  })
  .openapi("EmailThread");
