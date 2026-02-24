/**
 * Case Chat API Schemas
 *
 * Validation schemas for the conversational AI chat endpoints.
 */

import { z } from "zod";

export const CaseChatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  conversationId: z.string().uuid().optional(),
});

export type CaseChatMessage = z.infer<typeof CaseChatMessageSchema>;

export const CaseChatHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CaseChatHistoryQuery = z.infer<typeof CaseChatHistoryQuerySchema>;

export const CaseChatConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  messageCount: z.number(),
  lastMessageAt: z.string().nullable(),
  createdAt: z.string(),
});

export const CaseChatMessageResponseSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  citations: z.any().nullable(),
  createdAt: z.string(),
});
