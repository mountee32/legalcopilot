import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { availabilityRules } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateAvailabilityRuleSchema, PaginationSchema } from "@/lib/api/schemas/booking";
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

      const where = eq(availabilityRules.firmId, firmId);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(availabilityRules)
          .where(where);

        const rows = await tx
          .select()
          .from(availabilityRules)
          .where(where)
          .orderBy(desc(availabilityRules.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        availabilityRules: rows,
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
      const data = CreateAvailabilityRuleSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [availabilityRule] = await tx
          .insert(availabilityRules)
          .values({
            firmId,
            userId: data.userId ?? null,
            dayOfWeek: data.dayOfWeek ?? null,
            startTime: data.startTime ?? null,
            endTime: data.endTime ?? null,
            specificDate: data.specificDate ?? null,
            isUnavailable: data.isUnavailable ?? false,
            appointmentTypeId: data.appointmentTypeId ?? null,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();
        return availabilityRule ?? null;
      });

      return NextResponse.json(row, { status: 201 });
    })
  )
);
