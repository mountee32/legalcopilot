/**
 * Taxonomy Packs API
 *
 * GET  /api/taxonomy/packs - List available system + firm packs.
 * POST /api/taxonomy/packs - Create a new firm-owned pack.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { taxonomyPacks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { TaxonomyPackQuerySchema, CreateTaxonomyPackSchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const url = new URL(request.url);
      const query = TaxonomyPackQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        let where = query.includeSystem
          ? or(eq(taxonomyPacks.firmId, firmId), isNull(taxonomyPacks.firmId))
          : eq(taxonomyPacks.firmId, firmId);

        if (query.practiceArea) {
          where = and(where, eq(taxonomyPacks.practiceArea, query.practiceArea));
        }

        if (query.isActive !== undefined) {
          where = and(where, eq(taxonomyPacks.isActive, query.isActive));
        }

        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(taxonomyPacks)
          .where(where);

        const rows = await tx
          .select({
            id: taxonomyPacks.id,
            firmId: taxonomyPacks.firmId,
            key: taxonomyPacks.key,
            version: taxonomyPacks.version,
            name: taxonomyPacks.name,
            description: taxonomyPacks.description,
            practiceArea: taxonomyPacks.practiceArea,
            isSystem: taxonomyPacks.isSystem,
            isActive: taxonomyPacks.isActive,
            parentPackId: taxonomyPacks.parentPackId,
            createdAt: taxonomyPacks.createdAt,
            updatedAt: taxonomyPacks.updatedAt,
            categoryCount: sql<number>`(
              select count(*)::int
              from taxonomy_categories tc
              where tc.pack_id = taxonomy_packs.id
            )`,
            fieldCount: sql<number>`(
              select count(*)::int
              from taxonomy_fields tf
              inner join taxonomy_categories tc2 on tc2.id = tf.category_id
              where tc2.pack_id = taxonomy_packs.id
            )`,
          })
          .from(taxonomyPacks)
          .where(where)
          .orderBy(desc(taxonomyPacks.isSystem), taxonomyPacks.name)
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const packs = rows.map((row) => ({
        ...row,
        categoryCount: Number(row.categoryCount ?? 0),
        fieldCount: Number(row.fieldCount ?? 0),
      }));

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        packs,
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
    withPermission("ai:configure")(async (request: NextRequest, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaxonomyPackSchema.parse(body);

      const pack = await withFirmDb(firmId, async (tx) => {
        const [created] = await tx
          .insert(taxonomyPacks)
          .values({
            firmId,
            key: data.key,
            name: data.name,
            description: data.description ?? null,
            practiceArea: data.practiceArea,
            version: data.version || "1.0.0",
            isSystem: false,
            isActive: true,
          })
          .returning();

        return created;
      });

      return NextResponse.json(pack, { status: 201 });
    })
  )
);
