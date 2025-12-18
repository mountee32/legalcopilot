import { NextResponse } from "next/server";
import { and, eq, gte, lte, or, sql } from "drizzle-orm";
import { users, matters, tasks, timeEntries, calendarEvents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { DateSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const WorkloadQuerySchema = z.object({
  startDate: DateSchema,
  endDate: DateSchema,
});

/**
 * GET /api/team/workload
 *
 * Get team workload distribution for a date range.
 * Calculates active matters, deadlines, tasks, and workload intensity.
 * Requires team:read permission.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("team:read")(async (request, { user }) => {
      const { searchParams } = new URL(request.url);
      const query = WorkloadQuerySchema.parse({
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

        // Get upcoming deadlines (calendar events in the date range)
        const upcomingDeadlinesPerUser = await tx
          .select({
            userId: calendarEvents.userId,
            count: sql<number>`count(*)::integer`,
          })
          .from(calendarEvents)
          .where(
            and(
              eq(calendarEvents.firmId, firmId),
              gte(calendarEvents.startTime, query.startDate),
              lte(calendarEvents.startTime, query.endDate),
              or(
                eq(calendarEvents.eventType, "deadline"),
                eq(calendarEvents.eventType, "court_hearing"),
                eq(calendarEvents.eventType, "filing_deadline")
              )
            )
          )
          .groupBy(calendarEvents.userId);

        // Get pending tasks per user
        const pendingTasksPerUser = await tx
          .select({
            assigneeId: tasks.assigneeId,
            count: sql<number>`count(*)::integer`,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.firmId, firmId),
              or(eq(tasks.status, "pending"), eq(tasks.status, "in_progress"))
            )
          )
          .groupBy(tasks.assigneeId);

        // Get time entries in the period to calculate hours scheduled
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

        // Calculate workload for each user
        const teamMembers = firmUsers.map((u) => {
          const matterCount = activeMattersPerUser.find((am) => am.feeEarnerId === u.id);
          const activeMatters = matterCount?.count ?? 0;

          const deadlineCount = upcomingDeadlinesPerUser.find((d) => d.userId === u.id);
          const upcomingDeadlines = deadlineCount?.count ?? 0;

          const taskCount = pendingTasksPerUser.find((t) => t.assigneeId === u.id);
          const pendingTasks = taskCount?.count ?? 0;

          const userTimeEntry = timeEntriesInPeriod.find((te) => te.feeEarnerId === u.id);
          const hoursScheduled = userTimeEntry
            ? Math.round((userTimeEntry.totalMinutes / 60) * 100) / 100
            : 0;

          // Calculate workload score (0-100)
          // Weighted combination of:
          // - Active matters (max 10 = 25 points)
          // - Upcoming deadlines (max 5 = 25 points)
          // - Pending tasks (max 20 = 25 points)
          // - Hours scheduled (max 200 hours = 25 points)
          const matterScore = Math.min((activeMatters / 10) * 25, 25);
          const deadlineScore = Math.min((upcomingDeadlines / 5) * 25, 25);
          const taskScore = Math.min((pendingTasks / 20) * 25, 25);
          const hoursScore = Math.min((hoursScheduled / 200) * 25, 25);
          const workloadScore = Math.round(matterScore + deadlineScore + taskScore + hoursScore);

          return {
            userId: u.id,
            userName: u.name ?? "Unknown",
            userEmail: u.email,
            activeMatters,
            upcomingDeadlines,
            pendingTasks,
            hoursScheduled,
            workloadScore: Math.min(100, workloadScore), // Cap at 100
          };
        });

        // Calculate summary
        const totalActiveMatters = teamMembers.reduce((sum, m) => sum + m.activeMatters, 0);
        const totalUpcomingDeadlines = teamMembers.reduce((sum, m) => sum + m.upcomingDeadlines, 0);
        const totalPendingTasks = teamMembers.reduce((sum, m) => sum + m.pendingTasks, 0);
        const averageWorkloadScore =
          teamMembers.length > 0
            ? Math.round(
                (teamMembers.reduce((sum, m) => sum + m.workloadScore, 0) / teamMembers.length) *
                  100
              ) / 100
            : 0;

        return {
          startDate: query.startDate,
          endDate: query.endDate,
          teamMembers,
          summary: {
            totalActiveMatters,
            totalUpcomingDeadlines,
            totalPendingTasks,
            averageWorkloadScore,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);
