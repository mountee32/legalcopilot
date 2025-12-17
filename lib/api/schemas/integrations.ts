/**
 * Integrations API Schemas
 *
 * Connection + webhook idempotency for external providers.
 *
 * @see lib/db/schema/integrations.ts
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

export const IntegrationConnectionStatusSchema = z
  .enum(["connected", "revoked", "error"])
  .openapi("IntegrationConnectionStatus");

// Email
export const EmailProviderSchema = z.enum(["google", "microsoft"]).openapi("EmailProvider");

export const EmailAccountSchema = z
  .object({
    id: UuidSchema,
    provider: EmailProviderSchema,
    emailAddress: z.string(),
    externalAccountId: z.string().nullable(),
    status: IntegrationConnectionStatusSchema,
    lastSyncAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("EmailAccount");

export const EmailAccountWithSecretSchema = EmailAccountSchema.extend({
  webhookSecret: z.string(),
}).openapi("EmailAccountWithSecret");

export const EmailAccountCreateResponseSchema = EmailAccountWithSecretSchema.extend({
  webhookPath: z.string(),
}).openapi("EmailAccountCreateResponse");

export const CreateEmailAccountSchema = z
  .object({
    provider: EmailProviderSchema,
    emailAddress: z.string(),
    externalAccountId: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    tokens: z.record(z.any()).optional(),
  })
  .openapi("CreateEmailAccountRequest");

export const EmailAccountQuerySchema = PaginationSchema.openapi("EmailAccountQuery");

export const EmailAccountListSchema = z
  .object({
    accounts: z.array(EmailAccountSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("EmailAccountListResponse");

// Calendar
export const CalendarProviderSchema = z.enum(["google", "microsoft"]).openapi("CalendarProvider");
export const SyncDirectionSchema = z.enum(["push", "pull", "both"]).openapi("SyncDirection");

export const CalendarAccountSchema = z
  .object({
    id: UuidSchema,
    provider: CalendarProviderSchema,
    externalAccountId: z.string().nullable(),
    status: IntegrationConnectionStatusSchema,
    syncDirection: SyncDirectionSchema,
    lastSyncAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("CalendarAccount");

export const CalendarAccountWithSecretSchema = CalendarAccountSchema.extend({
  webhookSecret: z.string(),
}).openapi("CalendarAccountWithSecret");

export const CalendarAccountCreateResponseSchema = CalendarAccountWithSecretSchema.extend({
  webhookPath: z.string(),
}).openapi("CalendarAccountCreateResponse");

export const CreateCalendarAccountSchema = z
  .object({
    provider: CalendarProviderSchema,
    externalAccountId: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    tokens: z.record(z.any()).optional(),
    syncDirection: SyncDirectionSchema.optional(),
  })
  .openapi("CreateCalendarAccountRequest");

export const CalendarAccountQuerySchema = PaginationSchema.openapi("CalendarAccountQuery");

export const CalendarAccountListSchema = z
  .object({
    accounts: z.array(CalendarAccountSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("CalendarAccountListResponse");

// Payment
export const PaymentProviderSchema = z.enum(["stripe", "gocardless"]).openapi("PaymentProvider");

export const PaymentProviderAccountSchema = z
  .object({
    id: UuidSchema,
    provider: PaymentProviderSchema,
    externalAccountId: z.string().nullable(),
    status: IntegrationConnectionStatusSchema,
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("PaymentProviderAccount");

export const PaymentProviderAccountWithSecretSchema = PaymentProviderAccountSchema.extend({
  webhookSecret: z.string(),
}).openapi("PaymentProviderAccountWithSecret");

export const PaymentProviderAccountCreateResponseSchema =
  PaymentProviderAccountWithSecretSchema.extend({
    webhookPath: z.string(),
  }).openapi("PaymentProviderAccountCreateResponse");

export const CreatePaymentProviderAccountSchema = z
  .object({
    provider: PaymentProviderSchema,
    externalAccountId: z.string().optional(),
    webhookSecret: z.string().optional(),
    config: z.record(z.any()).optional(),
  })
  .openapi("CreatePaymentProviderAccountRequest");

export const PaymentProviderAccountListSchema = z
  .object({
    accounts: z.array(PaymentProviderAccountSchema),
  })
  .openapi("PaymentProviderAccountListResponse");

// Accounting
export const AccountingProviderSchema = z
  .enum(["xero", "quickbooks"])
  .openapi("AccountingProvider");

export const AccountingConnectionSchema = z
  .object({
    id: UuidSchema,
    provider: AccountingProviderSchema,
    externalTenantId: z.string().nullable(),
    status: IntegrationConnectionStatusSchema,
    lastSyncAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("AccountingConnection");

export const AccountingConnectionWithSecretSchema = AccountingConnectionSchema.extend({
  webhookSecret: z.string(),
}).openapi("AccountingConnectionWithSecret");

export const AccountingConnectionCreateResponseSchema = AccountingConnectionWithSecretSchema.extend(
  {
    webhookPath: z.string(),
  }
).openapi("AccountingConnectionCreateResponse");

export const CreateAccountingConnectionSchema = z
  .object({
    provider: AccountingProviderSchema,
    externalTenantId: z.string().optional(),
    tokens: z.record(z.any()).optional(),
  })
  .openapi("CreateAccountingConnectionRequest");

export const AccountingConnectionListSchema = z
  .object({
    connections: z.array(AccountingConnectionSchema),
  })
  .openapi("AccountingConnectionListResponse");

// E-signature
export const EsignatureProviderSchema = z
  .enum(["docusign", "adobe_sign"])
  .openapi("EsignatureProvider");

export const SignatureRequestStatusSchema = z
  .enum([
    "draft",
    "pending_approval",
    "sent",
    "delivered",
    "completed",
    "declined",
    "voided",
    "failed",
  ])
  .openapi("SignatureRequestStatus");

export const SignatureRequestSchema = z
  .object({
    id: UuidSchema,
    documentId: UuidSchema,
    provider: EsignatureProviderSchema,
    externalId: z.string().nullable(),
    status: SignatureRequestStatusSchema,
    signers: z.array(z.record(z.any())).nullable(),
    sentAt: DateTimeSchema.nullable(),
    completedAt: DateTimeSchema.nullable(),
    signedDocumentId: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("SignatureRequest");

export const CreateSignatureRequestSchema = z
  .object({
    documentId: UuidSchema,
    provider: EsignatureProviderSchema,
    signers: z.array(z.record(z.any())),
  })
  .openapi("CreateSignatureRequestRequest");

export const CreateSignatureRequestResponseSchema = z
  .object({
    signatureRequest: SignatureRequestSchema,
    approvalRequestId: UuidSchema.nullable(),
  })
  .openapi("CreateSignatureRequestResponse");

export const SignatureRequestListSchema = z
  .object({
    requests: z.array(SignatureRequestSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("SignatureRequestListResponse");

export const SignatureRequestQuerySchema = PaginationSchema.extend({
  documentId: UuidSchema.optional(),
  status: SignatureRequestStatusSchema.optional(),
}).openapi("SignatureRequestQuery");

export const WebhookAcceptedSchema = z
  .object({
    accepted: z.boolean(),
  })
  .openapi("WebhookAcceptedResponse");
