/**
 * Task Templates API
 *
 * GET  /api/task-templates - List templates (system + firm)
 * POST /api/task-templates - Create firm template
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, or, isNull, sql, desc } from "drizzle-orm";
import { taskTemplates, taskTemplateItems } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import {
  TaskTemplateQuerySchema,
  CreateTaskTemplateSchema,
  CreateTaskTemplateItemSchema,
} from "@/lib/api/schemas/task-templates";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, ValidationError } from "@/middleware/withErrorHandler";
import { isValidSubType } from "@/lib/constants/practice-sub-types";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = TaskTemplateQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        // Build where clauses: show firm templates + system templates
        const whereClauses = [or(eq(taskTemplates.firmId, firmId), isNull(taskTemplates.firmId))];

        if (query.practiceArea) {
          whereClauses.push(eq(taskTemplates.practiceArea, query.practiceArea));
        }

        if (query.subType) {
          whereClauses.push(eq(taskTemplates.subType, query.subType));
        }

        if (query.isActive !== undefined) {
          whereClauses.push(eq(taskTemplates.isActive, query.isActive));
        }

        if (!query.includeSystem) {
          whereClauses.push(eq(taskTemplates.firmId, firmId));
        }

        const where = and(...whereClauses);

        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(taskTemplates)
          .where(where);

        const rows = await tx
          .select()
          .from(taskTemplates)
          .where(where)
          .orderBy(desc(taskTemplates.isDefault), taskTemplates.name)
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        templates: rows,
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
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaskTemplateSchema.parse(body);

      // Validate subType for practice area
      if (!isValidSubType(data.practiceArea, data.subType)) {
        throw new ValidationError(
          `Invalid subType '${data.subType}' for practice area '${data.practiceArea}'`
        );
      }

      const template = await withFirmDb(firmId, async (tx) => {
        // Create template
        const [template] = await tx
          .insert(taskTemplates)
          .values({
            firmId,
            name: data.name,
            description: data.description ?? null,
            practiceArea: data.practiceArea,
            subType: data.subType,
            isDefault: data.isDefault ?? false,
            isActive: data.isActive ?? true,
            createdById: user.user.id,
          })
          .returning();

        // Create items if provided
        if (data.items && data.items.length > 0) {
          const itemValues = data.items.map((item, index) => ({
            templateId: template.id,
            title: item.title,
            description: item.description ?? null,
            mandatory: item.mandatory ?? false,
            category: item.category,
            defaultPriority: item.defaultPriority ?? "medium",
            relativeDueDays: item.relativeDueDays ?? null,
            dueDateAnchor: item.dueDateAnchor ?? null,
            assigneeRole: item.assigneeRole ?? null,
            checklistItems: item.checklistItems ?? null,
            sortOrder: item.sortOrder ?? index,
          }));

          await tx.insert(taskTemplateItems).values(itemValues);
        }

        return template;
      });

      return NextResponse.json(template, { status: 201 });
    })
  )
);
