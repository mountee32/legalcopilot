import { NextResponse } from "next/server";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { leaveRequests, availabilityWindows, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { DateSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const AvailabilityQuerySchema = z.object({
  startDate: DateSchema,
  endDate: DateSchema,
});

/**
 * GET /api/team/availability
 *
 * Get team availability for a date range.
 * Returns availability windows and leave requests for all team members.
 * Requires team:read permission.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("team:read")(async (request, { user }) => {
      const { searchParams } = new URL(request.url);
      const query = AvailabilityQuerySchema.parse({
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
      });

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      if (endDate < startDate) {
        throw new ValidationError("End date must be on or after start date");
      }

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Get all users in the firm
        const firmUsers = await tx
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.firmId, firmId));

        // Get availability windows for all users
        const windows = await tx
          .select()
          .from(availabilityWindows)
          .where(eq(availabilityWindows.firmId, firmId));

        // Get leave requests that overlap with the date range
        const leaves = await tx
          .select()
          .from(leaveRequests)
          .where(
            and(
              eq(leaveRequests.firmId, firmId),
              or(
                and(
                  gte(leaveRequests.startDate, query.startDate),
                  lte(leaveRequests.startDate, query.endDate)
                ),
                and(
                  gte(leaveRequests.endDate, query.startDate),
                  lte(leaveRequests.endDate, query.endDate)
                ),
                and(
                  lte(leaveRequests.startDate, query.startDate),
                  gte(leaveRequests.endDate, query.endDate)
                )
              ),
              or(eq(leaveRequests.status, "approved"), eq(leaveRequests.status, "pending"))
            )
          );

        // Group by user
        const teamMembers = firmUsers.map((u) => ({
          userId: u.id,
          userName: u.name ?? "Unknown",
          userEmail: u.email,
          windows: windows.filter((w) => w.userId === u.id),
          leaveRequests: leaves.filter((l) => l.userId === u.id),
        }));

        return {
          startDate: query.startDate,
          endDate: query.endDate,
          teamMembers,
        };
      });

      return NextResponse.json(result);
    })
  )
);
