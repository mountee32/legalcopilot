/**
 * GET /api/matters/[id]/ai/chat/[conversationId]
 *
 * Load all messages for a conversation.
 */

import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { caseConversations, caseMessages } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const resolved = params ? await params : {};
    const matterId = resolved.id;
    const conversationId = resolved.conversationId;

    if (!matterId || !conversationId) {
      throw new NotFoundError("Conversation not found");
    }

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const result = await withFirmDb(firmId, async (tx) => {
      const [conversation] = await tx
        .select({
          id: caseConversations.id,
          title: caseConversations.title,
          messageCount: caseConversations.messageCount,
          lastMessageAt: caseConversations.lastMessageAt,
          createdAt: caseConversations.createdAt,
        })
        .from(caseConversations)
        .where(
          and(
            eq(caseConversations.id, conversationId),
            eq(caseConversations.firmId, firmId),
            eq(caseConversations.matterId, matterId)
          )
        )
        .limit(1);

      if (!conversation) throw new NotFoundError("Conversation not found");

      const messages = await tx
        .select({
          id: caseMessages.id,
          role: caseMessages.role,
          content: caseMessages.content,
          citations: caseMessages.citations,
          createdAt: caseMessages.createdAt,
        })
        .from(caseMessages)
        .where(eq(caseMessages.conversationId, conversationId))
        .orderBy(asc(caseMessages.createdAt));

      return { conversation, messages };
    });

    return NextResponse.json(result);
  })
);
