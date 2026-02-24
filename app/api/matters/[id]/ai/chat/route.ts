/**
 * POST /api/matters/[id]/ai/chat
 *
 * Streaming conversational AI endpoint for case chat.
 * Creates/resumes conversations and streams AI responses.
 *
 * Cannot use withErrorHandler — streaming responses must return
 * toDataStreamResponse() immediately. Pre-stream errors return JSON.
 */

import { NextRequest } from "next/server";
import { eq, and, asc, desc } from "drizzle-orm";
import { streamText } from "ai";
import { z } from "zod";
import { openrouter, models } from "@/lib/ai/openrouter";
import { withAuth, type AuthenticatedRouteHandler } from "@/middleware/withAuth";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withFirmDb } from "@/lib/db/tenant";
import { matters, caseConversations, caseMessages } from "@/lib/db/schema";
import { CaseChatMessageSchema } from "@/lib/api/schemas/case-chat";
import { buildChatContext, buildChatSystemPrompt, formatChatHistory } from "@/lib/ai/chat-context";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

const CHAT_MODEL = process.env.CASE_CHAT_MODEL || models["claude-3-5-sonnet"];

const handler: AuthenticatedRouteHandler = async (request, { params, user }) => {
  try {
    const matterId = params ? (await params).id : undefined;
    if (!matterId) {
      return Response.json({ error: "Matter ID required" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = CaseChatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation Error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { message, conversationId } = parsed.data;
    const userId = user.user.id;
    const firmId = await getOrCreateFirmIdForUser(userId);

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
    }

    // Run all DB operations inside tenant transaction
    const { convId, systemPrompt, history, isNew } = await withFirmDb(firmId, async (tx) => {
      // Verify matter exists
      const [matterRow] = await tx
        .select({ id: matters.id })
        .from(matters)
        .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
        .limit(1);

      if (!matterRow) {
        throw new Error("MATTER_NOT_FOUND");
      }

      // Create or verify conversation
      let convId: string;
      let isNew = false;

      if (conversationId) {
        const [existing] = await tx
          .select({ id: caseConversations.id })
          .from(caseConversations)
          .where(
            and(
              eq(caseConversations.id, conversationId),
              eq(caseConversations.firmId, firmId),
              eq(caseConversations.matterId, matterId)
            )
          )
          .limit(1);

        if (!existing) {
          throw new Error("CONVERSATION_NOT_FOUND");
        }
        convId = conversationId;
      } else {
        // Create new conversation
        const title = message.length > 60 ? `${message.slice(0, 57)}...` : message;
        const [newConv] = await tx
          .insert(caseConversations)
          .values({ firmId, matterId, userId, title })
          .returning({ id: caseConversations.id });
        convId = newConv.id;
        isNew = true;

        // Timeline event for new conversation
        await createTimelineEvent(tx, {
          firmId,
          matterId,
          type: "ai_chat_started",
          title: "AI chat started",
          description: title,
          actorType: "user",
          actorId: userId,
          entityType: "case_conversation",
          entityId: convId,
          occurredAt: new Date(),
        });
      }

      // Insert user message
      await tx.insert(caseMessages).values({
        firmId,
        conversationId: convId,
        role: "user",
        content: message,
      });

      // Build context
      const chatContext = await buildChatContext(firmId, matterId, message, tx);
      const systemPrompt = buildChatSystemPrompt(chatContext);

      // Load conversation history (last 20 messages, excluding the one we just inserted)
      const historyRows = await tx
        .select({ role: caseMessages.role, content: caseMessages.content })
        .from(caseMessages)
        .where(eq(caseMessages.conversationId, convId))
        .orderBy(asc(caseMessages.createdAt))
        .limit(20);

      const history = formatChatHistory(historyRows);

      return { convId, systemPrompt, history, isNew };
    });

    // Stream AI response
    const result = streamText({
      model: openrouter(CHAT_MODEL),
      system: systemPrompt,
      messages: history,
      onFinish: async ({ text, usage }) => {
        // Persist assistant message
        try {
          await withFirmDb(firmId, async (tx) => {
            await tx.insert(caseMessages).values({
              firmId,
              conversationId: convId,
              role: "assistant",
              content: text,
              model: CHAT_MODEL,
              tokensUsed: usage?.totalTokens ?? null,
            });

            // Update conversation metadata
            await tx
              .update(caseConversations)
              .set({
                messageCount: history.length + 1, // +1 for this assistant message
                lastMessageAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(caseConversations.id, convId));
          });
        } catch (err) {
          console.error("Failed to persist assistant message:", err);
        }
      },
    });

    const response = result.toDataStreamResponse();

    // Attach conversationId as custom header
    response.headers.set("X-Conversation-Id", convId);

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MATTER_NOT_FOUND") {
        return Response.json({ error: "Matter not found" }, { status: 404 });
      }
      if (error.message === "CONVERSATION_NOT_FOUND") {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }
    }

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Validation Error", details: error.issues }, { status: 400 });
    }

    console.error("Case chat error:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
};

export const POST = withAuth(handler);
