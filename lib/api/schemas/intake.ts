/**
 * Intake API Schemas (Leads & Quotes)
 *
 * @see lib/db/schema/intake.ts for database schema
 */

import {
  z,
  UuidSchema,
  DateSchema,
  DateTimeSchema,
  EmailSchema,
  PhoneSchema,
  MoneySchema,
  PaginationSchema,
  PaginationMetaSchema,
} from "./common";

export const LeadStatusSchema = z
  .enum(["new", "contacted", "qualified", "won", "lost", "archived"])
  .openapi("LeadStatus");

export const LeadSchema = z
  .object({
    id: UuidSchema,
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    companyName: z.string().nullable(),
    email: EmailSchema.nullable(),
    phone: PhoneSchema.nullable(),
    source: z.string().nullable(),
    status: LeadStatusSchema,
    score: z.number().int().nullable(),
    notes: z.string().nullable(),
    convertedToClientId: UuidSchema.nullable(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Lead");

const LeadInputSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  source: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const CreateLeadSchema = LeadInputSchema.refine(
  (d) => !!d.email || (!!d.firstName && !!d.lastName) || !!d.companyName,
  {
    message: "Provide at least an email, a full name, or a companyName",
  }
).openapi("CreateLeadRequest");

export const UpdateLeadSchema = LeadInputSchema.partial()
  .extend({ status: LeadStatusSchema.optional() })
  .openapi("UpdateLeadRequest");

export const LeadQuerySchema = PaginationSchema.extend({
  status: LeadStatusSchema.optional(),
  search: z.string().optional(),
}).openapi("LeadQuery");

export const LeadListSchema = z
  .object({
    leads: z.array(LeadSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("LeadListResponse");

export const QuoteStatusSchema = z
  .enum(["draft", "sent", "accepted", "rejected", "expired", "converted"])
  .openapi("QuoteStatus");

export const QuoteSchema = z
  .object({
    id: UuidSchema,
    leadId: UuidSchema,
    status: QuoteStatusSchema,
    items: z.array(z.unknown()).nullable(),
    subtotal: MoneySchema,
    vatAmount: MoneySchema,
    total: MoneySchema,
    validUntil: DateSchema.nullable(),
    notes: z.string().nullable(),
    convertedToMatterId: UuidSchema.nullable(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Quote");

export const CreateQuoteSchema = z
  .object({
    leadId: UuidSchema,
    items: z.array(z.unknown()).optional(),
    subtotal: MoneySchema.optional(),
    vatAmount: MoneySchema.optional(),
    total: MoneySchema,
    validUntil: DateSchema.optional(),
    notes: z.string().optional(),
  })
  .openapi("CreateQuoteRequest");

export const UpdateQuoteSchema = z
  .object({
    status: QuoteStatusSchema.optional(),
    items: z.array(z.unknown()).nullable().optional(),
    subtotal: MoneySchema.optional(),
    vatAmount: MoneySchema.optional(),
    total: MoneySchema.optional(),
    validUntil: DateSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .openapi("UpdateQuoteRequest");

export const QuoteQuerySchema = PaginationSchema.extend({
  leadId: UuidSchema.optional(),
  status: QuoteStatusSchema.optional(),
}).openapi("QuoteQuery");

export const QuoteListSchema = z
  .object({
    quotes: z.array(QuoteSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("QuoteListResponse");

export const ConvertLeadSchema = z
  .object({
    clientType: z.enum(["individual", "company"]).default("individual"),
    matterTitle: z.string().min(1).max(200),
    practiceArea: z
      .enum([
        "conveyancing",
        "litigation",
        "family",
        "probate",
        "employment",
        "immigration",
        "personal_injury",
        "commercial",
        "criminal",
        "ip",
        "insolvency",
        "other",
      ])
      .default("other"),
  })
  .openapi("ConvertLeadRequest");

export const ConvertLeadResponseSchema = z
  .object({
    success: z.literal(true),
    clientId: UuidSchema,
    matterId: UuidSchema,
  })
  .openapi("ConvertLeadResponse");
