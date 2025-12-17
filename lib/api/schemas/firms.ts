/**
 * Firm API Schemas
 *
 * @see lib/db/schema/firms.ts for database schema
 */

import { z, DateTimeSchema } from "./common";

export const FirmSettingsSchema = z
  .object({
    branding: z
      .object({
        logoUrl: z.string().url().optional(),
        primaryColor: z.string().optional(),
        portalName: z.string().optional(),
      })
      .optional(),
    billing: z
      .object({
        defaultVatRate: z.number().min(0).max(100).optional(),
        defaultPaymentTermsDays: z.number().int().min(1).max(365).optional(),
        invoicePrefix: z.string().min(1).max(20).optional(),
        invoiceFooter: z.string().max(5000).optional(),
      })
      .optional(),
    ai: z
      .object({
        defaultModel: z.string().optional(),
        autoApproveThreshold: z.number().min(0).max(1).optional(),
        enabledFeatures: z.array(z.string()).optional(),
      })
      .optional(),
    features: z
      .object({
        emailIntegration: z.boolean().optional(),
        calendarSync: z.boolean().optional(),
        clientPortal: z.boolean().optional(),
        eSignature: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough()
  .openapi("FirmSettings");

export const FirmSettingsResponseSchema = z
  .object({
    settings: FirmSettingsSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("FirmSettingsResponse");

export const UpdateFirmSettingsSchema = FirmSettingsSchema.partial().openapi(
  "UpdateFirmSettingsRequest"
);

export type FirmSettings = z.infer<typeof FirmSettingsSchema>;
