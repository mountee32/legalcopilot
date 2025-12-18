import { NextResponse } from "next/server";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import { leaveRequests, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateLeaveRequestSchema, LeaveRequestQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/team/leave
 *
 * List leave requests with filters and pagination.
 * Requires leave:read permission.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("leave:read")(async (request, { user }) => {
      const { searchParams } = new URL(request.url);
      const query = LeaveRequestQuerySchema.parse({
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20",
        userId: searchParams.get("userId") || undefined,
        status: searchParams.get("status") || undefined,
        type: searchParams.get("type") || undefined,
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
      });

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const conditions = [eq(leaveRequests.firmId, firmId)];

        if (query.userId) {
          conditions.push(eq(leaveRequests.userId, query.userId));
        }
        if (query.status) {
          conditions.push(eq(leaveRequests.status, query.status));
        }
        if (query.type) {
          conditions.push(eq(leaveRequests.type, query.type));
        }
        if (query.startDate) {
          conditions.push(gte(leaveRequests.endDate, query.startDate));
        }
        if (query.endDate) {
          conditions.push(lte(leaveRequests.startDate, query.endDate));
        }

        const offset = (query.page - 1) * query.limit;

        const [items, [{ count }]] = await Promise.all([
          tx
            .select()
            .from(leaveRequests)
            .where(and(...conditions))
            .orderBy(desc(leaveRequests.startDate))
            .limit(query.limit)
            .offset(offset),
          tx
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(leaveRequests)
            .where(and(...conditions)),
        ]);

        const total = count ?? 0;
        const totalPages = Math.ceil(total / query.limit);

        return {
          leaveRequests: items,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);

/**
 * POST /api/team/leave
 *
 * Create a new leave request.
 * Requires leave:request permission.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("leave:request")(async (request, { user }) => {
      const body = await request.json();
      const data = CreateLeaveRequestSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      // Validate date range
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (endDate < startDate) {
        throw new ValidationError("End date must be on or after start date");
      }

      // Calculate working days (simple calculation - excludes weekends)
      let daysCount = 0;
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Not Sunday (0) or Saturday (6)
          daysCount++;
        }
        current.setDate(current.getDate() + 1);
      }

      if (daysCount === 0) {
        throw new ValidationError("Leave request must include at least one working day");
      }

      const created = await withFirmDb(firmId, async (tx) => {
        const [newRequest] = await tx
          .insert(leaveRequests)
          .values({
            firmId,
            userId: user.user.id,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            daysCount,
            reason: data.reason ?? null,
            status: "pending",
          })
          .returning();

        return newRequest;
      });

      return NextResponse.json(created, { status: 201 });
    })
  )
);
