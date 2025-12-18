import { NextResponse } from "next/server";
import { and, eq, gte, lte, or, sql } from "drizzle-orm";
import { leaveRequests, users, matters, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { DateSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const CapacityQuerySchema = z.object({
  startDate: DateSchema,
  endDate: DateSchema,
});

/**
 * GET /api/team/capacity
 *
 * Get team capacity and utilization summary for a date range.
 * Calculates available hours, scheduled hours, and utilization metrics.
 * Requires team:read permission.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("team:read")(async (request, { user }) => {
      const { searchParams } = new URL(request.url);
      const query = CapacityQuerySchema.parse({
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

        // Calculate working days in the period (excluding weekends)
        let workingDays = 0;
        const current = new Date(startDate);
        while (current <= endDate) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
          }
          current.setDate(current.getDate() + 1);
        }

        // Standard working hours per day (8 hours)
        const standardHoursPerDay = 8;
        const standardHoursTotal = workingDays * standardHoursPerDay;

        // Get approved leave that overlaps with the date range
        const leaves = await tx
          .select()
          .from(leaveRequests)
          .where(
            and(
              eq(leaveRequests.firmId, firmId),
              eq(leaveRequests.status, "approved"),
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
              )
            )
          );

        // Get time entries in the period
        const timeEntriesInPeriod = await tx
          .select({
            feeEarnerId: timeEntries.feeEarnerId,
            totalMinutes: sql<number>`sum(${timeEntries.durationMinutes})::integer`,
          })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.firmId, firmId),
              gte(timeEntries.workDate, query.startDate),
              lte(timeEntries.workDate, query.endDate)
            )
          )
          .groupBy(timeEntries.feeEarnerId);

        // Get active matters per user
        const activeMattersPerUser = await tx
          .select({
            feeEarnerId: matters.feeEarnerId,
            count: sql<number>`count(*)::integer`,
          })
          .from(matters)
          .where(
            and(
              eq(matters.firmId, firmId),
              or(eq(matters.status, "active"), eq(matters.status, "lead"))
            )
          )
          .groupBy(matters.feeEarnerId);

        // Calculate capacity for each user
        const teamMembers = firmUsers.map((u) => {
          // Calculate leave days for this user
          const userLeaves = leaves.filter((l) => l.userId === u.id);
          let leaveDays = 0;
          for (const leave of userLeaves) {
            const leaveStart = new Date(
              leave.startDate > query.startDate ? leave.startDate : query.startDate
            );
            const leaveEnd = new Date(
              leave.endDate < query.endDate ? leave.endDate : query.endDate
            );
            const current = new Date(leaveStart);
            while (current <= leaveEnd) {
              const dayOfWeek = current.getDay();
              if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                leaveDays++;
              }
              current.setDate(current.getDate() + 1);
            }
          }

          const leaveHours = leaveDays * standardHoursPerDay;
          const totalHoursAvailable = standardHoursTotal - leaveHours;

          // Get time entries for this user
          const userTimeEntry = timeEntriesInPeriod.find((te) => te.feeEarnerId === u.id);
          const hoursScheduled = userTimeEntry
            ? Math.round((userTimeEntry.totalMinutes / 60) * 100) / 100
            : 0;

          const hoursRemaining = Math.max(0, totalHoursAvailable - hoursScheduled);
          const utilization =
            totalHoursAvailable > 0
              ? Math.round((hoursScheduled / totalHoursAvailable) * 100 * 100) / 100
              : 0;

          // Get active matters count
          const matterCount = activeMattersPerUser.find((am) => am.feeEarnerId === u.id);
          const activeMatters = matterCount?.count ?? 0;

          return {
            userId: u.id,
            userName: u.name ?? "Unknown",
            userEmail: u.email,
            totalHoursAvailable,
            hoursScheduled,
            hoursRemaining,
            utilization: Math.min(100, utilization), // Cap at 100%
            activeMatters,
          };
        });

        // Calculate summary
        const totalCapacity = teamMembers.reduce((sum, m) => sum + m.totalHoursAvailable, 0);
        const totalScheduled = teamMembers.reduce((sum, m) => sum + m.hoursScheduled, 0);
        const totalRemaining = teamMembers.reduce((sum, m) => sum + m.hoursRemaining, 0);
        const averageUtilization =
          teamMembers.length > 0
            ? Math.round(
                (teamMembers.reduce((sum, m) => sum + m.utilization, 0) / teamMembers.length) * 100
              ) / 100
            : 0;

        return {
          startDate: query.startDate,
          endDate: query.endDate,
          teamMembers,
          summary: {
            totalCapacity: Math.round(totalCapacity * 100) / 100,
            totalScheduled: Math.round(totalScheduled * 100) / 100,
            totalRemaining: Math.round(totalRemaining * 100) / 100,
            averageUtilization,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);
