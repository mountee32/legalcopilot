/**
 * Compliance Tasks API
 *
 * GET /api/compliance/tasks - Get overdue mandatory tasks across matters
 */

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, lt, sql, or } from "drizzle-orm";
import { tasks, matters, users, clients } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const ComplianceQuerySchema = z.object({
  practiceArea: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  minDaysOverdue: z.coerce.number().int().min(0).optional(),
  maxDaysOverdue: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = ComplianceQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;
      const now = new Date();

      const result = await withFirmDb(firmId, async (tx) => {
        // Base conditions: mandatory tasks that are not completed/cancelled/skipped
        const baseConditions = [
          eq(tasks.firmId, firmId),
          eq(tasks.isMandatory, true),
          or(eq(tasks.status, "pending"), eq(tasks.status, "in_progress")),
        ];

        // Practice area filter (join with matters)
        if (query.practiceArea) {
          baseConditions.push(eq(matters.practiceArea, query.practiceArea));
        }

        // Assignee filter
        if (query.assigneeId) {
          baseConditions.push(eq(tasks.assigneeId, query.assigneeId));
        }

        // Due date filtering for overdue
        // Tasks with due date in the past, or no due date but mandatory
        const overdueCondition = lt(tasks.dueDate, now);

        // Build where clause
        const whereClause = and(...baseConditions, overdueCondition);

        // Get total count
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(tasks)
          .innerJoin(matters, eq(tasks.matterId, matters.id))
          .where(whereClause);

        // Get tasks with matter, client, and assignee info
        const rows = await tx
          .select({
            task: tasks,
            matter: {
              id: matters.id,
              reference: matters.reference,
              title: matters.title,
              practiceArea: matters.practiceArea,
              status: matters.status,
            },
            client: {
              id: clients.id,
              name: clients.name,
            },
            assignee: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(tasks)
          .innerJoin(matters, eq(tasks.matterId, matters.id))
          .leftJoin(clients, eq(matters.clientId, clients.id))
          .leftJoin(users, eq(tasks.assigneeId, users.id))
          .where(whereClause)
          .orderBy(desc(tasks.dueDate)) // Most overdue first
          .limit(query.limit)
          .offset(offset);

        // Calculate compliance stats
        const [stats] = await tx
          .select({
            totalOverdue: sql<number>`count(*)`,
            overdueByPriority: sql<string>`
              json_build_object(
                'urgent', count(*) filter (where ${tasks.priority} = 'urgent'),
                'high', count(*) filter (where ${tasks.priority} = 'high'),
                'medium', count(*) filter (where ${tasks.priority} = 'medium'),
                'low', count(*) filter (where ${tasks.priority} = 'low')
              )
            `,
            avgDaysOverdue: sql<number>`
              coalesce(avg(extract(day from (now() - ${tasks.dueDate}))), 0)
            `,
          })
          .from(tasks)
          .innerJoin(matters, eq(tasks.matterId, matters.id))
          .where(whereClause);

        // Get count by practice area
        const practiceAreaCounts = await tx
          .select({
            practiceArea: matters.practiceArea,
            count: sql<number>`count(*)`,
          })
          .from(tasks)
          .innerJoin(matters, eq(tasks.matterId, matters.id))
          .where(whereClause)
          .groupBy(matters.practiceArea);

        // Get count by assignee
        const assigneeCounts = await tx
          .select({
            assigneeId: tasks.assigneeId,
            assigneeName: users.name,
            count: sql<number>`count(*)`,
          })
          .from(tasks)
          .innerJoin(matters, eq(tasks.matterId, matters.id))
          .leftJoin(users, eq(tasks.assigneeId, users.id))
          .where(whereClause)
          .groupBy(tasks.assigneeId, users.name);

        return {
          total: Number(countRow?.total ?? 0),
          rows,
          stats: {
            totalOverdue: Number(stats?.totalOverdue ?? 0),
            overdueByPriority: stats?.overdueByPriority
              ? JSON.parse(stats.overdueByPriority)
              : { urgent: 0, high: 0, medium: 0, low: 0 },
            avgDaysOverdue: Math.round(Number(stats?.avgDaysOverdue ?? 0)),
          },
          byPracticeArea: practiceAreaCounts.map((p) => ({
            practiceArea: p.practiceArea,
            count: Number(p.count),
          })),
          byAssignee: assigneeCounts.map((a) => ({
            assigneeId: a.assigneeId,
            assigneeName: a.assigneeName,
            count: Number(a.count),
          })),
        };
      });

      // Transform results
      const tasksWithDetails = result.rows.map((row) => ({
        ...row.task,
        daysOverdue: row.task.dueDate
          ? Math.floor(
              (now.getTime() - new Date(row.task.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
        matter: row.matter,
        client: row.client,
        assignee: row.assignee,
      }));

      const totalPages = Math.max(1, Math.ceil(result.total / query.limit));

      return NextResponse.json({
        tasks: tasksWithDetails,
        stats: result.stats,
        byPracticeArea: result.byPracticeArea,
        byAssignee: result.byAssignee,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);
