import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { calendarEvents, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateCalendarEventSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("calendar:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Calendar event not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const row = await withFirmDb(firmId, async (tx) => {
        const [event] = await tx
          .select()
          .from(calendarEvents)
          .where(and(eq(calendarEvents.id, id), eq(calendarEvents.firmId, firmId)))
          .limit(1);
        return event ?? null;
      });

      if (!row) throw new NotFoundError("Calendar event not found");
      return NextResponse.json(row);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("calendar:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Calendar event not found");

      const body = await request.json().catch(() => ({}));
      const data = UpdateCalendarEventSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({
            matterId: calendarEvents.matterId,
            startAt: calendarEvents.startAt,
            endAt: calendarEvents.endAt,
          })
          .from(calendarEvents)
          .where(and(eq(calendarEvents.id, id), eq(calendarEvents.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Calendar event not found");

        const startAt = data.startAt ? new Date(data.startAt) : current.startAt;
        const endAt =
          data.endAt === null ? null : data.endAt ? new Date(data.endAt) : current.endAt;
        if (endAt && endAt.getTime() < startAt.getTime()) {
          throw new ValidationError("endAt must be after startAt");
        }

        if (data.matterId) {
          const [matter] = await tx
            .select({ id: matters.id })
            .from(matters)
            .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
            .limit(1);
          if (!matter) throw new NotFoundError("Matter not found");
        }

        const [row] = await tx
          .update(calendarEvents)
          .set({
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            eventType: data.eventType ?? undefined,
            status: data.status ?? undefined,
            priority: data.priority ?? undefined,
            startAt,
            endAt,
            allDay: data.allDay ?? undefined,
            location: data.location ?? undefined,
            attendees: data.attendees ?? undefined,
            reminderMinutes: data.reminderMinutes ?? undefined,
            recurrence: data.recurrence ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(calendarEvents.id, id), eq(calendarEvents.firmId, firmId)))
          .returning();

        if (current.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: current.matterId,
            type: "calendar_event_updated",
            title: "Calendar event updated",
            actorType: "user",
            actorId: user.user.id,
            entityType: "calendar_event",
            entityId: id,
            occurredAt: new Date(),
            metadata: {},
          });
        }

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Calendar event not found");
      return NextResponse.json(updated);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("calendar:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Calendar event not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ matterId: calendarEvents.matterId })
          .from(calendarEvents)
          .where(and(eq(calendarEvents.id, id), eq(calendarEvents.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Calendar event not found");

        await tx
          .delete(calendarEvents)
          .where(and(eq(calendarEvents.id, id), eq(calendarEvents.firmId, firmId)));

        if (current.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: current.matterId,
            type: "calendar_event_deleted",
            title: "Calendar event deleted",
            actorType: "user",
            actorId: user.user.id,
            entityType: "calendar_event",
            entityId: id,
            occurredAt: new Date(),
            metadata: {},
          });
        }
      });

      return NextResponse.json({ success: true });
    })
  )
);
