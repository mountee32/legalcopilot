/**
 * Invoice API Schemas
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

export const InvoiceStatusSchema = z
  .enum(["draft", "sent", "viewed", "partially_paid", "paid", "overdue", "written_off"])
  .openapi("InvoiceStatus");

export const InvoiceSchema = z
  .object({
    id: UuidSchema,
    invoiceNumber: z.string(),
    clientId: UuidSchema,
    matterId: UuidSchema.nullable(),
    status: InvoiceStatusSchema,
    invoiceDate: DateSchema,
    dueDate: DateSchema,
    subtotal: MoneySchema,
    vatAmount: MoneySchema,
    vatRate: MoneySchema,
    total: MoneySchema,
    paidAmount: MoneySchema.nullable(),
    balanceDue: MoneySchema,
    terms: z.string().nullable(),
    notes: z.string().nullable(),
    sentAt: DateTimeSchema.nullable(),
    viewedAt: DateTimeSchema.nullable(),
    paidAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Invoice");

export const InvoiceLineItemSchema = z
  .object({
    id: UuidSchema,
    invoiceId: UuidSchema,
    description: z.string(),
    amount: MoneySchema,
    sourceType: z.string().nullable(),
    sourceId: UuidSchema.nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("InvoiceLineItem");

export const InvoiceWithItemsSchema = z
  .object({
    invoice: InvoiceSchema,
    items: z.array(InvoiceLineItemSchema),
  })
  .openapi("InvoiceWithItemsResponse");

export const InvoiceQuerySchema = PaginationSchema.extend({
  clientId: UuidSchema.optional(),
  matterId: UuidSchema.optional(),
  status: InvoiceStatusSchema.optional(),
}).openapi("InvoiceQuery");

export const InvoiceListSchema = z
  .object({
    invoices: z.array(InvoiceSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("InvoiceListResponse");

export const GenerateInvoiceSchema = z
  .object({
    clientId: UuidSchema,
    matterId: UuidSchema.optional(),
    timeEntryIds: z.array(UuidSchema).min(1).max(500),
    additionalItems: z
      .array(
        z.object({
          description: z.string().min(1).max(5000),
          amount: MoneySchema,
        })
      )
      .optional(),
    notes: z.string().optional(),
    invoiceDate: DateSchema.optional(),
    dueDate: DateSchema.optional(),
    vatRate: MoneySchema.optional(),
  })
  .openapi("GenerateInvoiceRequest");

export const UpdateInvoiceSchema = z
  .object({
    dueDate: DateSchema.optional(),
    terms: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    vatRate: MoneySchema.optional(),
  })
  .openapi("UpdateInvoiceRequest");

export const PaymentLinkResponseSchema = z
  .object({
    paymentUrl: z.string().url(),
    token: z.string(),
    expiresAt: DateTimeSchema,
  })
  .openapi("PaymentLinkResponse");

export const PublicInvoiceSchema = z
  .object({
    invoiceNumber: z.string(),
    invoiceDate: DateSchema,
    dueDate: DateSchema,
    total: MoneySchema,
    balanceDue: MoneySchema,
    status: InvoiceStatusSchema,
    firmName: z.string(),
    firmEmail: z.string().email().nullable(),
    items: z.array(
      z.object({
        description: z.string(),
        amount: MoneySchema,
      })
    ),
  })
  .openapi("PublicInvoice");
