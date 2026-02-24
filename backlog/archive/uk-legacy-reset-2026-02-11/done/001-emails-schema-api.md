# Emails - Schema & API

## Priority: HIGH

## Summary

Implement email tracking for legal matters. Emails are critical for legal practice - most client communication and work intake happens via email.

## Requirements

- Store incoming/outgoing emails linked to matters
- Track AI processing (intent, sentiment, urgency, suggested actions)
- Support draft responses
- Enable email-to-matter matching

---

## Design

### Files to Create

| File                                          | Purpose                          |
| --------------------------------------------- | -------------------------------- |
| `lib/db/schema/emails.ts`                     | Database schema for emails table |
| `lib/api/schemas/emails.ts`                   | Zod validation schemas           |
| `app/api/emails/route.ts`                     | GET (list), POST (create)        |
| `app/api/emails/[id]/route.ts`                | GET (single), PATCH (update)     |
| `app/api/emails/[id]/ai/process/route.ts`     | POST (AI processing)             |
| `__tests__/app/api/emails/route.test.ts`      | API route tests                  |
| `__tests__/app/api/emails/[id]/route.test.ts` | Single email route tests         |

### Files to Modify

| File                          | Change                           |
| ----------------------------- | -------------------------------- |
| `lib/db/schema/index.ts`      | Add `export * from "./emails"`   |
| `lib/api/schemas/index.ts`    | Add `export * from "./emails"`   |
| `scripts/generate-openapi.ts` | Register email schemas and paths |

---

## Database Schema

### `lib/db/schema/emails.ts`

```typescript
/**
 * Email Schema
 *
 * Tracks all email communications related to matters.
 * Supports AI processing for intent, urgency, and suggested actions.
 *
 * @see docs/backend-design.md Section 7 (Email entity)
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

export const emailDirectionEnum = pgEnum("email_direction", ["inbound", "outbound"]);

export const emailStatusEnum = pgEnum("email_status", [
  "draft",
  "pending",
  "sent",
  "delivered",
  "received",
  "failed",
  "bounced",
  "archived",
]);

export const emailIntentEnum = pgEnum("email_intent", [
  "request_information",
  "provide_information",
  "request_action",
  "status_update",
  "complaint",
  "deadline",
  "confirmation",
  "general",
]);

export const emailSentimentEnum = pgEnum("email_sentiment", [
  "positive",
  "neutral",
  "negative",
  "frustrated",
]);

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    matterId: uuid("matter_id").references(() => matters.id, { onDelete: "set null" }),

    direction: emailDirectionEnum("direction").notNull(),

    // Addresses as JSONB: { email: string, name?: string }
    fromAddress: jsonb("from_address").notNull(),
    toAddresses: jsonb("to_addresses").notNull(),
    ccAddresses: jsonb("cc_addresses"),
    bccAddresses: jsonb("bcc_addresses"),

    subject: text("subject").notNull(),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),

    // Threading
    messageId: text("message_id"),
    threadId: text("thread_id"),
    inReplyTo: text("in_reply_to"),

    // Attachments
    hasAttachments: boolean("has_attachments").default(false),
    attachmentCount: integer("attachment_count").default(0),
    attachmentIds: jsonb("attachment_ids"), // Document IDs

    status: emailStatusEnum("status").notNull().default("received"),
    readAt: timestamp("read_at"),

    // AI Processing
    aiProcessed: boolean("ai_processed").default(false),
    aiProcessedAt: timestamp("ai_processed_at"),
    aiIntent: emailIntentEnum("ai_intent"),
    aiSentiment: emailSentimentEnum("ai_sentiment"),
    aiUrgency: integer("ai_urgency"), // 1-5
    aiSummary: text("ai_summary"),
    aiSuggestedResponse: text("ai_suggested_response"),
    aiSuggestedTasks: jsonb("ai_suggested_tasks"), // string[]
    aiMatchedMatterId: uuid("ai_matched_matter_id").references(() => matters.id, {
      onDelete: "set null",
    }),
    aiMatchConfidence: integer("ai_match_confidence"), // 0-100

    createdBy: uuid("created_by").references(() => users.id),
    receivedAt: timestamp("received_at"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmMatterIdx: index("emails_firm_matter_idx").on(t.firmId, t.matterId),
    firmStatusIdx: index("emails_firm_status_idx").on(t.firmId, t.status),
    threadIdx: index("emails_thread_idx").on(t.threadId),
  })
);

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

export interface EmailAddress {
  email: string;
  name?: string;
}
```

---

## API Schemas

### `lib/api/schemas/emails.ts`

Key schemas:

- `EmailAddressSchema` - { email, name? }
- `EmailSchema` - Full email object for responses
- `CreateEmailSchema` - Required: direction, fromAddress, toAddresses, subject
- `UpdateEmailSchema` - Optional: matterId, status, readAt
- `EmailQuerySchema` - Filters: matterId, direction, status, aiProcessed, search
- `EmailListSchema` - Paginated response
- `EmailAIProcessResponseSchema` - AI processing result

---

## API Routes

### `GET /api/emails`

- Auth required via `withAuth`
- Tenant isolation via `withFirmDb`
- Query params: page, limit, matterId, direction, status, aiProcessed, search
- Search matches subject (case-insensitive ILIKE)
- Returns `{ emails, pagination }`

### `POST /api/emails`

- Validate with `CreateEmailSchema`
- Set `firmId` from session
- Calculate `attachmentCount` from `attachmentIds.length`
- Returns created email (201)

### `GET /api/emails/[id]`

- Verify email exists and belongs to firm
- Returns email or 404

### `PATCH /api/emails/[id]`

- Validate with `UpdateEmailSchema`
- Allowed updates: matterId, status, readAt
- Returns updated email

### `POST /api/emails/[id]/ai/process`

- Fetch email and firm's matters
- Call AI service with email content
- Update AI fields (intent, sentiment, urgency, summary, suggestedResponse, suggestedTasks)
- Attempt matter matching by subject/content similarity
- Returns `{ success: true, email }`

---

## AI Processing

### Prompt Strategy

```
Analyze this email and provide:
1. Intent: one of [request_information, provide_information, request_action, status_update, complaint, deadline, confirmation, general]
2. Sentiment: one of [positive, neutral, negative, frustrated]
3. Urgency: 1-5 (1=not urgent, 5=critical)
4. Summary: 1-2 sentence summary
5. Suggested response: Brief response draft (if action needed)
6. Suggested tasks: Array of follow-up actions

Email:
Subject: {subject}
From: {from}
Body: {bodyText}
```

Use OpenRouter with `response_format: { type: "json_object" }` for structured output.

---

## Test Strategy

### Unit Tests `__tests__/app/api/emails/route.test.ts`

- [ ] GET - returns paginated list of emails
- [ ] GET - filters by matterId correctly
- [ ] GET - filters by direction (inbound/outbound)
- [ ] GET - filters by status
- [ ] GET - search by subject works
- [ ] POST - creates email with valid data
- [ ] POST - rejects missing required fields (400)
- [ ] POST - rejects invalid email address format
- [ ] POST - sets firmId from session automatically

### Unit Tests `__tests__/app/api/emails/[id]/route.test.ts`

- [ ] GET - returns email by ID
- [ ] GET - returns 404 for non-existent email
- [ ] GET - returns 404 for email from different firm (tenant isolation)
- [ ] PATCH - updates matterId successfully
- [ ] PATCH - updates status successfully
- [ ] PATCH - rejects invalid status value

### Unit Tests `__tests__/app/api/emails/[id]/ai/process/route.test.ts`

- [ ] POST - processes email and updates AI fields
- [ ] POST - handles missing email (404)
- [ ] POST - handles AI service errors (500)

---

## Assumptions

1. Email body stored directly in DB (not MinIO) - typically <1MB
2. Attachments stored as Documents, linked via `attachmentIds`
3. AI processing triggered manually via endpoint (not automatic)
4. No SMTP sending in this phase - storage only
5. Thread grouping is UI logic using `threadId`

---

## Out of Scope (Phase 2)

- Gmail/Office 365 sync
- SMTP sending
- Email thread reconstruction API
- Attachment extraction/processing

---

## References

- docs/backend-design.md Section 7 (Email entity)
- lib/db/schema/documents.ts (pattern reference)
- app/api/documents/route.ts (route pattern)
- lib/api/schemas/documents.ts (schema pattern)
