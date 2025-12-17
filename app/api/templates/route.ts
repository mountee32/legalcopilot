import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { templates } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTemplateSchema, TemplateQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("templates:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = TemplateQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const firmScope = query.includeSystem
        ? or(eq(templates.firmId, firmId), isNull(templates.firmId))!
        : eq(templates.firmId, firmId);

      const whereClauses = [firmScope];
      if (query.type) whereClauses.push(eq(templates.type, query.type));
      if (query.activeOnly) whereClauses.push(eq(templates.isActive, true));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(templates)
          .where(where);

        const rows = await tx
          .select()
          .from(templates)
          .where(where)
          .orderBy(desc(templates.updatedAt))
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
    withPermission("templates:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateTemplateSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [template] = await tx
          .insert(templates)
          .values({
            firmId,
            name: data.name,
            type: data.type,
            category: data.category ?? null,
            content: data.content,
            mergeFields: data.mergeFields ?? null,
            isActive: data.isActive ?? true,
            parentId: null,
            version: 1,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();
        return template ?? null;
      });

      return NextResponse.json(row, { status: 201 });
    })
  )
);
