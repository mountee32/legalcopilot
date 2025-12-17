/**
 * Time Entry API Schemas
 *
 * @see lib/db/schema/billing.ts for database schema
 */

import {
  z,
  UuidSchema,
  DateSchema,
  DateTimeSchema,
  MoneySchema,
  PaginationSchema,
  PaginationMetaSchema,
} from "./common";

export const TimeEntryStatusSchema = z
  .enum(["draft", "submitted", "approved", "billed", "written_off"])
  .openapi("TimeEntryStatus");

export const TimeEntrySourceSchema = z
  .enum(["manual", "ai_suggested", "email_inferred", "document_activity", "calendar"])
  .openapi("TimeEntrySource");

export const TimeEntrySchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema,
    feeEarnerId: UuidSchema,
    workDate: DateSchema,
    description: z.string(),
    durationMinutes: z.number().int(),
    hourlyRate: MoneySchema,
    amount: MoneySchema,
    status: TimeEntryStatusSchema,
    source: TimeEntrySourceSchema,
    isBillable: z.boolean(),
    invoiceId: UuidSchema.nullable(),
    activityCode: z.string().nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("TimeEntry");

export const CreateTimeEntrySchema = z
  .object({
    matterId: UuidSchema,
    feeEarnerId: UuidSchema.optional(),
    workDate: DateSchema,
    description: z.string().min(1).max(5000),
    durationMinutes: z
      .number()
      .int()
      .min(6)
      .max(24 * 60)
      .refine((n) => n % 6 === 0, "Duration must be in 6-minute units"),
    hourlyRate: MoneySchema,
    source: TimeEntrySourceSchema.optional(),
    isBillable: z.boolean().optional(),
    activityCode: z.string().optional(),
  })
  .openapi("CreateTimeEntryRequest");

export const UpdateTimeEntrySchema = z
  .object({
    workDate: DateSchema.optional(),
    description: z.string().min(1).max(5000).optional(),
    durationMinutes: z
      .number()
      .int()
      .min(6)
      .max(24 * 60)
      .refine((n) => n % 6 === 0, "Duration must be in 6-minute units")
      .optional(),
    hourlyRate: MoneySchema.optional(),
    source: TimeEntrySourceSchema.optional(),
    isBillable: z.boolean().optional(),
    activityCode: z.string().nullable().optional(),
  })
  .openapi("UpdateTimeEntryRequest");

export const TimeEntryQuerySchema = PaginationSchema.extend({
  matterId: UuidSchema.optional(),
  feeEarnerId: UuidSchema.optional(),
  status: TimeEntryStatusSchema.optional(),
  from: DateSchema.optional(),
  to: DateSchema.optional(),
}).openapi("TimeEntryQuery");

export const TimeEntryListSchema = z
  .object({
    timeEntries: z.array(TimeEntrySchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TimeEntryListResponse");

export const BulkSubmitTimeEntriesSchema = z
  .object({
    ids: z.array(UuidSchema).min(1).max(200),
  })
  .openapi("BulkSubmitTimeEntriesRequest");

export const BulkSubmitTimeEntriesResponseSchema = z
  .object({
    success: z.literal(true),
    approvalRequestIds: z.array(UuidSchema),
  })
  .openapi("BulkSubmitTimeEntriesResponse");
