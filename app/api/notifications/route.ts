import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { notifications } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { NotificationQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { user }) => {
    const url = new URL(request.url);
    const query = NotificationQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const userId = user.user.id;

    const whereClauses = [eq(notifications.firmId, firmId), eq(notifications.userId, userId)];
    if (query.type) whereClauses.push(eq(notifications.type, query.type));
    if (typeof query.read === "boolean") whereClauses.push(eq(notifications.read, query.read));

    const where = and(...whereClauses);
    const offset = (query.page - 1) * query.limit;

    const { total, rows } = await withFirmDb(firmId, async (tx) => {
      const [countRow] = await tx
        .select({ total: sql<number>`count(*)` })
        .from(notifications)
        .where(where);

      const rows = await tx
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(query.limit)
        .offset(offset);

      return { total: Number(countRow?.total ?? 0), rows };
    });

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return NextResponse.json({
      notifications: rows,
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
);
