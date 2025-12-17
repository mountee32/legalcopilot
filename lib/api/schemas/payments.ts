/**
 * Payment API Schemas
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

export const PaymentMethodSchema = z
  .enum(["bank_transfer", "card", "cheque", "cash", "client_account"])
  .openapi("PaymentMethod");

export const PaymentSchema = z
  .object({
    id: UuidSchema,
    invoiceId: UuidSchema,
    amount: MoneySchema,
    method: PaymentMethodSchema,
    paymentDate: DateSchema,
    reference: z.string().nullable(),
    notes: z.string().nullable(),
    recordedBy: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("Payment");

export const CreatePaymentSchema = z
  .object({
    invoiceId: UuidSchema,
    amount: MoneySchema,
    method: PaymentMethodSchema,
    paymentDate: DateSchema,
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .openapi("CreatePaymentRequest");

export const PaymentQuerySchema = PaginationSchema.extend({
  invoiceId: UuidSchema.optional(),
  method: PaymentMethodSchema.optional(),
  from: DateSchema.optional(),
  to: DateSchema.optional(),
}).openapi("PaymentQuery");

export const PaymentListSchema = z
  .object({
    payments: z.array(PaymentSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("PaymentListResponse");
