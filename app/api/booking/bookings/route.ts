import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { bookings, appointmentTypes } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateBookingSchema, BookingQuerySchema } from "@/lib/api/schemas/booking";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("intake:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = BookingQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(bookings.firmId, firmId)];
      if (query.status) whereClauses.push(eq(bookings.status, query.status));
      if (query.assignedTo) whereClauses.push(eq(bookings.assignedTo, query.assignedTo));
      if (query.startFrom) whereClauses.push(gte(bookings.startAt, new Date(query.startFrom)));
      if (query.startTo) whereClauses.push(lte(bookings.startAt, new Date(query.startTo)));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(bookings)
          .where(where);

        const rows = await tx
          .select()
          .from(bookings)
          .where(where)
          .orderBy(desc(bookings.startAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        bookings: rows,
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
    withPermission("intake:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateBookingSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        // Get appointment type to calculate end time
        const [appointmentType] = await tx
          .select()
          .from(appointmentTypes)
          .where(
            and(
              eq(appointmentTypes.id, data.appointmentTypeId),
              eq(appointmentTypes.firmId, firmId)
            )
          )
          .limit(1);

        if (!appointmentType) {
          throw new Error("Appointment type not found");
        }

        const startAt = new Date(data.startAt);
        const endAt = new Date(startAt.getTime() + appointmentType.duration * 60 * 1000);

        const [booking] = await tx
          .insert(bookings)
          .values({
            firmId,
            appointmentTypeId: data.appointmentTypeId,
            assignedTo: data.assignedTo ?? null,
            leadId: data.leadId ?? null,
            matterId: data.matterId ?? null,
            calendarEventId: null,
            status: "pending",
            startAt,
            endAt,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            clientPhone: data.clientPhone ?? null,
            notes: data.notes ?? null,
            internalNotes: data.internalNotes ?? null,
            cancellationReason: null,
            cancelledBy: null,
            metadata: null,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();
        return booking ?? null;
      });

      return NextResponse.json(row, { status: 201 });
    })
  )
);
