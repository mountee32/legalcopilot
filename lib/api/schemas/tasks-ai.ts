/**
 * AI Task Suggestion Schemas
 *
 * Zod schemas for the AI task suggestion and creation endpoints.
 */

import { z } from "./common";

export const SuggestTasksRequestSchema = z
  .object({
    goal: z.string().max(500).optional(),
  })
  .openapi("SuggestTasksRequest");

export const SuggestedTaskSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    dueInDays: z.number().int().min(0).max(365).optional(),
    rationale: z.string().max(500).optional(),
  })
  .openapi("SuggestedTask");

export const SuggestTasksResponseSchema = z
  .object({
    suggestions: z.array(SuggestedTaskSchema).max(20),
  })
  .openapi("SuggestTasksResponse");

export const CreateSuggestedTasksSchema = z
  .object({
    tasks: z
      .array(
        z.object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          dueInDays: z.number().int().min(0).max(365).optional(),
          assigneeId: z.string().uuid().optional(),
        })
      )
      .min(1)
      .max(20),
  })
  .openapi("CreateSuggestedTasksRequest");
