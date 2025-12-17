import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { matters, timelineEvents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTimelineEventSchema, TimelineQuerySchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { params, user }) => {
      const matterId = params?.id;
      if (!matterId) throw new NotFoundError("Matter not found");

      const url = new URL(request.url);
      const query = TimelineQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const offset = (query.page - 1) * query.limit;

      const result = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);
        if (!matter) throw new NotFoundError("Matter not found");

        const whereClauses = [
          eq(timelineEvents.firmId, firmId),
          eq(timelineEvents.matterId, matterId),
        ];
        if (query.type) whereClauses.push(eq(timelineEvents.type, query.type));
        if (query.entityType) whereClauses.push(eq(timelineEvents.entityType, query.entityType));
        if (query.entityId) whereClauses.push(eq(timelineEvents.entityId, query.entityId));
        if (query.from) whereClauses.push(gte(timelineEvents.occurredAt, new Date(query.from)));
        if (query.to) whereClauses.push(lte(timelineEvents.occurredAt, new Date(query.to)));

        const where = and(...whereClauses);

        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(timelineEvents)
          .where(where);

        const rows = await tx
          .select()
          .from(timelineEvents)
          .where(where)
          .orderBy(desc(timelineEvents.occurredAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(result.total / query.limit));

      return NextResponse.json({
        events: result.rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const matterId = params?.id;
      if (!matterId) throw new NotFoundError("Matter not found");

      const body = await request.json();
      const data = CreateTimelineEventSchema.parse(body);
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const event = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);
        if (!matter) throw new NotFoundError("Matter not found");

        return createTimelineEvent(tx, {
          firmId,
          matterId,
          type: data.type,
          title: data.title,
          description: data.description ?? null,
          actorType: "user",
          actorId: user.user.id,
          occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
          metadata: data.metadata ?? null,
        });
      });

      return NextResponse.json(event, { status: 201 });
    })
  )
);
