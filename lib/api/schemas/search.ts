/**
 * Semantic Search API Schemas
 */

import { z, UuidSchema } from "./common";

export const SemanticSearchRequestSchema = z
  .object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(50).optional(),
    matterId: UuidSchema.optional(),
  })
  .openapi("SemanticSearchRequest");

export const SemanticSearchResultSchema = z
  .object({
    documentId: UuidSchema,
    documentChunkId: UuidSchema,
    score: z.number(),
    text: z.string(),
  })
  .openapi("SemanticSearchResult");

export const SemanticSearchResponseSchema = z
  .object({
    results: z.array(SemanticSearchResultSchema),
  })
  .openapi("SemanticSearchResponse");

export const MatterSemanticSearchQuerySchema = z
  .object({
    q: z.string().min(1),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .openapi("MatterSemanticSearchQuery");
