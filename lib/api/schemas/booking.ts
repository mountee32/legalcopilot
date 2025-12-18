/**
 * Booking & Scheduling API Schemas
 *
 * @see lib/db/schema/booking.ts for database schema
 */

import {
  z,
  UuidSchema,
  DateTimeSchema,
  EmailSchema,
  PhoneSchema,
  PaginationSchema,
  PaginationMetaSchema,
} from "./common";
import { PracticeAreaSchema } from "./matters";

export const BookingStatusSchema = z
  .enum(["pending", "confirmed", "cancelled", "completed", "no_show"])
  .openapi("BookingStatus");

/**
 * Appointment Type Schemas
 */
export const AppointmentTypeSchema = z
  .object({
    id: UuidSchema,
    name: z.string(),
    description: z.string().nullable(),
    practiceArea: PracticeAreaSchema.nullable(),
    duration: z.number().int(),
    bufferAfter: z.number().int(),
    isActive: z.boolean(),
    maxAdvanceBookingDays: z.number().int().nullable(),
    minNoticeHours: z.number().int(),
    settings: z.record(z.unknown()).nullable(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("AppointmentType");

export const CreateAppointmentTypeSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    practiceArea: PracticeAreaSchema.optional(),
    duration: z.number().int().min(5).max(480),
    bufferAfter: z.number().int().min(0).max(120).default(0),
    isActive: z.boolean().default(true),
    maxAdvanceBookingDays: z.number().int().min(1).max(365).optional(),
    minNoticeHours: z.number().int().min(0).max(168).default(24),
    settings: z.record(z.unknown()).optional(),
  })
  .openapi("CreateAppointmentTypeRequest");

export const UpdateAppointmentTypeSchema = CreateAppointmentTypeSchema.partial().openapi(
  "UpdateAppointmentTypeRequest"
);

export const AppointmentTypeListSchema = z
  .object({
    appointmentTypes: z.array(AppointmentTypeSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("AppointmentTypeListResponse");

/**
 * Availability Rule Schemas
 */
export const AvailabilityRuleSchema = z
  .object({
    id: UuidSchema,
    userId: UuidSchema.nullable(),
    dayOfWeek: z.number().int().min(0).max(6).nullable(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    specificDate: DateTimeSchema.nullable(),
    isUnavailable: z.boolean(),
    appointmentTypeId: UuidSchema.nullable(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("AvailabilityRule");

export const CreateAvailabilityRuleSchema = z
  .object({
    userId: UuidSchema.optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    specificDate: DateTimeSchema.optional(),
    isUnavailable: z.boolean().default(false),
    appointmentTypeId: UuidSchema.optional(),
  })
  .refine(
    (data) => {
      // Either recurring (dayOfWeek + times) or specific date
      const hasRecurring = data.dayOfWeek !== undefined && data.startTime && data.endTime;
      const hasSpecific = data.specificDate !== undefined;
      return hasRecurring || hasSpecific;
    },
    {
      message: "Provide either recurring schedule (dayOfWeek, startTime, endTime) or specificDate",
    }
  )
  .openapi("CreateAvailabilityRuleRequest");

export const UpdateAvailabilityRuleSchema = z
  .object({
    userId: UuidSchema.optional(),
    dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .optional(),
    specificDate: DateTimeSchema.nullable().optional(),
    isUnavailable: z.boolean().optional(),
    appointmentTypeId: UuidSchema.nullable().optional(),
  })
  .openapi("UpdateAvailabilityRuleRequest");

export const AvailabilityRuleListSchema = z
  .object({
    availabilityRules: z.array(AvailabilityRuleSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("AvailabilityRuleListResponse");

/**
 * Booking Schemas
 */
export const BookingSchema = z
  .object({
    id: UuidSchema,
    appointmentTypeId: UuidSchema,
    assignedTo: UuidSchema.nullable(),
    leadId: UuidSchema.nullable(),
    matterId: UuidSchema.nullable(),
    calendarEventId: UuidSchema.nullable(),
    status: BookingStatusSchema,
    startAt: DateTimeSchema,
    endAt: DateTimeSchema,
    clientName: z.string(),
    clientEmail: z.string().email(),
    clientPhone: z.string().nullable(),
    notes: z.string().nullable(),
    internalNotes: z.string().nullable(),
    cancellationReason: z.string().nullable(),
    cancelledBy: z.string().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Booking");

export const CreateBookingSchema = z
  .object({
    appointmentTypeId: UuidSchema,
    assignedTo: UuidSchema.optional(),
    leadId: UuidSchema.optional(),
    matterId: UuidSchema.optional(),
    startAt: DateTimeSchema,
    clientName: z.string().min(1).max(200),
    clientEmail: EmailSchema,
    clientPhone: PhoneSchema.optional(),
    notes: z.string().max(1000).optional(),
    internalNotes: z.string().max(1000).optional(),
  })
  .openapi("CreateBookingRequest");

export const UpdateBookingSchema = z
  .object({
    appointmentTypeId: UuidSchema.optional(),
    assignedTo: UuidSchema.nullable().optional(),
    leadId: UuidSchema.nullable().optional(),
    matterId: UuidSchema.nullable().optional(),
    status: BookingStatusSchema.optional(),
    startAt: DateTimeSchema.optional(),
    clientName: z.string().min(1).max(200).optional(),
    clientEmail: EmailSchema.optional(),
    clientPhone: PhoneSchema.nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    internalNotes: z.string().max(1000).nullable().optional(),
    cancellationReason: z.string().max(500).nullable().optional(),
  })
  .openapi("UpdateBookingRequest");

export const BookingQuerySchema = PaginationSchema.extend({
  status: BookingStatusSchema.optional(),
  assignedTo: UuidSchema.optional(),
  startFrom: DateTimeSchema.optional(),
  startTo: DateTimeSchema.optional(),
}).openapi("BookingQuery");

export const BookingListSchema = z
  .object({
    bookings: z.array(BookingSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("BookingListResponse");

/**
 * Public Booking Schemas (for client-facing booking pages)
 */
export const PublicAppointmentTypeSchema = z
  .object({
    id: UuidSchema,
    name: z.string(),
    description: z.string().nullable(),
    practiceArea: PracticeAreaSchema.nullable(),
    duration: z.number().int(),
    minNoticeHours: z.number().int(),
    maxAdvanceBookingDays: z.number().int().nullable(),
  })
  .openapi("PublicAppointmentType");

export const AvailableSlotSchema = z
  .object({
    startAt: DateTimeSchema,
    endAt: DateTimeSchema,
    appointmentTypeId: UuidSchema,
    assignedTo: UuidSchema.nullable(),
  })
  .openapi("AvailableSlot");

export const AvailabilityQuerySchema = z
  .object({
    appointmentTypeId: UuidSchema,
    startDate: DateTimeSchema,
    endDate: DateTimeSchema,
    userId: UuidSchema.optional(),
  })
  .openapi("AvailabilityQuery");

export const AvailabilityResponseSchema = z
  .object({
    slots: z.array(AvailableSlotSchema),
  })
  .openapi("AvailabilityResponse");

export const PublicCreateBookingSchema = z
  .object({
    appointmentTypeId: UuidSchema,
    startAt: DateTimeSchema,
    clientName: z.string().min(1).max(200),
    clientEmail: EmailSchema,
    clientPhone: PhoneSchema.optional(),
    notes: z.string().max(1000).optional(),
    captchaToken: z.string().optional(),
  })
  .openapi("PublicCreateBookingRequest");

export const PublicBookingResponseSchema = z
  .object({
    success: z.literal(true),
    bookingId: UuidSchema,
    message: z.string(),
  })
  .openapi("PublicBookingResponse");
