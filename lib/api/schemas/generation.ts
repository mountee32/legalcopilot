/**
 * Document Generation API Schemas
 */

import { z } from "zod";

/** Request body for POST /api/matters/[id]/generate */
export const GenerateDocumentSchema = z.object({
  templateId: z.string().uuid("Valid template ID required"),
  overrides: z.record(z.string()).optional(),
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;

/** Response from POST /api/matters/[id]/generate */
export const GenerateDocumentResponseSchema = z.object({
  document: z.object({
    id: z.string().uuid(),
    title: z.string(),
    type: z.string(),
    status: z.string(),
    filename: z.string(),
  }),
  aiSections: z.array(z.string()),
  missingFields: z.array(z.string()),
  tokensUsed: z.number(),
});

export type GenerateDocumentResponse = z.infer<typeof GenerateDocumentResponseSchema>;

/** Query params for GET /api/matters/[id]/export/findings */
export const ExportFindingsQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
});

export type ExportFindingsQuery = z.infer<typeof ExportFindingsQuerySchema>;
