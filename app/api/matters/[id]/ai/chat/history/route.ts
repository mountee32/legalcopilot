/**
 * GET /api/matters/[id]/ai/chat/history
 *
 * List conversations for a matter, most recent first.
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { caseConversations, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { CaseChatHistoryQuerySchema } from "@/lib/api/schemas/case-chat";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const matterId = params ? (await params).id : undefined;
    if (!matterId) throw new NotFoundError("Matter not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const url = new URL(request.url);
    const query = CaseChatHistoryQuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    const conversations = await withFirmDb(firmId, async (tx) => {
      // Verify matter exists
      const [matterRow] = await tx
        .select({ id: matters.id })
        .from(matters)
        .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
        .limit(1);

      if (!matterRow) throw new NotFoundError("Matter not found");

      return tx
        .select({
          id: caseConversations.id,
          title: caseConversations.title,
          messageCount: caseConversations.messageCount,
          lastMessageAt: caseConversations.lastMessageAt,
          createdAt: caseConversations.createdAt,
        })
        .from(caseConversations)
        .where(and(eq(caseConversations.firmId, firmId), eq(caseConversations.matterId, matterId)))
        .orderBy(desc(caseConversations.lastMessageAt))
        .limit(query.limit)
        .offset(query.offset);
    });

    return NextResponse.json({ conversations });
  })
);
