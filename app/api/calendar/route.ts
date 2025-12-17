import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { calendarEvents, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CalendarQuerySchema, CreateCalendarEventSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("calendar:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = CalendarQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [
        eq(calendarEvents.firmId, firmId),
        gte(calendarEvents.startAt, new Date(query.from)),
        lte(calendarEvents.startAt, new Date(query.to)),
      ];
      if (query.matterId) whereClauses.push(eq(calendarEvents.matterId, query.matterId));
      if (query.eventType) whereClauses.push(eq(calendarEvents.eventType, query.eventType));
      if (query.status) whereClauses.push(eq(calendarEvents.status, query.status));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(calendarEvents)
          .where(where);

        const rows = await tx
          .select()
          .from(calendarEvents)
          .where(where)
          .orderBy(asc(calendarEvents.startAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        events: rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
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
    withPermission("calendar:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateCalendarEventSchema.parse(body);

      const startAt = new Date(data.startAt);
      const endAt = data.endAt ? new Date(data.endAt) : null;
      if (endAt && endAt.getTime() < startAt.getTime()) {
        throw new ValidationError("endAt must be after startAt");
      }

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        if (data.matterId) {
          const [matter] = await tx
            .select({ id: matters.id })
            .from(matters)
            .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
            .limit(1);
          if (!matter) throw new NotFoundError("Matter not found");
        }

        const [event] = await tx
          .insert(calendarEvents)
          .values({
            firmId,
            matterId: data.matterId ?? null,
            title: data.title,
            description: data.description ?? null,
            eventType: data.eventType,
            status: "scheduled",
            priority: "medium",
            startAt,
            endAt,
            allDay: data.allDay ?? false,
            location: data.location ?? null,
            attendees: data.attendees ?? null,
            reminderMinutes: data.reminderMinutes ?? null,
            recurrence: data.recurrence ?? null,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();

        if (event?.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: event.matterId,
            type: "calendar_event_created",
            title: "Calendar event created",
            actorType: "user",
            actorId: user.user.id,
            entityType: "calendar_event",
            entityId: event.id,
            occurredAt: new Date(),
            metadata: { eventType: event.eventType, startAt: event.startAt },
          });
        }

        return event ?? null;
      });

      if (!row) throw new ValidationError("Failed to create calendar event");
      return NextResponse.json(row, { status: 201 });
    })
  )
);
