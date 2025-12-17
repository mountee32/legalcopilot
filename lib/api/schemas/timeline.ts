/**
 * Timeline API Schemas
 *
 * @see lib/db/schema/timeline.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

export const TimelineEventTypeSchema = z
  .enum([
    "matter_created",
    "matter_updated",
    "matter_archived",
    "document_uploaded",
    "document_chunked",
    "email_received",
    "email_sent",
    "task_created",
    "task_completed",
    "approval_decided",
    "note_added",
  ])
  .openapi("TimelineEventType");

export const TimelineActorTypeSchema = z
  .enum(["user", "system", "ai"])
  .openapi("TimelineActorType");

export const TimelineEventSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema,
    type: TimelineEventTypeSchema,
    title: z.string(),
    description: z.string().nullable(),
    actorType: TimelineActorTypeSchema,
    actorId: UuidSchema.nullable(),
    entityType: z.string().nullable(),
    entityId: UuidSchema.nullable(),
    metadata: z.record(z.unknown()).nullable(),
    occurredAt: DateTimeSchema,
    createdAt: DateTimeSchema,
  })
  .openapi("TimelineEvent");

export const TimelineQuerySchema = PaginationSchema.extend({
  type: TimelineEventTypeSchema.optional(),
  entityType: z.string().optional(),
  entityId: UuidSchema.optional(),
  from: DateTimeSchema.optional(),
  to: DateTimeSchema.optional(),
}).openapi("TimelineQuery");

export const TimelineListSchema = z
  .object({
    events: z.array(TimelineEventSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TimelineListResponse");

export const CreateTimelineEventSchema = z
  .object({
    type: TimelineEventTypeSchema.default("note_added"),
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).optional(),
    occurredAt: DateTimeSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .openapi("CreateTimelineEventRequest");
