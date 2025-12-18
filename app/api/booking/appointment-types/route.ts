import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { appointmentTypes } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateAppointmentTypeSchema, PaginationSchema } from "@/lib/api/schemas/booking";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("settings:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = PaginationSchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const where = eq(appointmentTypes.firmId, firmId);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(appointmentTypes)
          .where(where);

        const rows = await tx
          .select()
          .from(appointmentTypes)
          .where(where)
          .orderBy(desc(appointmentTypes.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        appointmentTypes: rows,
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
    withPermission("settings:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateAppointmentTypeSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [appointmentType] = await tx
          .insert(appointmentTypes)
          .values({
            firmId,
            name: data.name,
            description: data.description ?? null,
            practiceArea: data.practiceArea ?? null,
            duration: data.duration,
            bufferAfter: data.bufferAfter ?? 0,
            isActive: data.isActive ?? true,
            maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? null,
            minNoticeHours: data.minNoticeHours ?? 24,
            settings: data.settings ?? null,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();
        return appointmentType ?? null;
      });

      return NextResponse.json(row, { status: 201 });
    })
  )
);
