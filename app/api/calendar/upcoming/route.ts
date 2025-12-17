import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { calendarEvents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpcomingCalendarQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("calendar:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = UpcomingCalendarQuerySchema.parse(
        Object.fromEntries(url.searchParams.entries())
      );

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const from = new Date();
      const to = new Date(from.getTime() + query.days * 86400_000);

      const whereClauses = [
        eq(calendarEvents.firmId, firmId),
        gte(calendarEvents.startAt, from),
        lte(calendarEvents.startAt, to),
      ];
      if (query.matterId) whereClauses.push(eq(calendarEvents.matterId, query.matterId));

      const events = await withFirmDb(firmId, (tx) =>
        tx
          .select()
          .from(calendarEvents)
          .where(and(...whereClauses))
          .orderBy(asc(calendarEvents.startAt))
          .limit(query.limit)
      );

      return NextResponse.json({ events });
    })
  )
);
