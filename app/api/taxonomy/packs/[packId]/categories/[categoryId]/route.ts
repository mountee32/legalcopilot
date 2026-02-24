/**
 * Taxonomy Category Detail API
 *
 * PATCH  /api/taxonomy/packs/:packId/categories/:categoryId - Update a category.
 * DELETE /api/taxonomy/packs/:packId/categories/:categoryId - Delete a category and its fields.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { taxonomyPacks, taxonomyCategories } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaxonomyCategorySchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, ForbiddenError, NotFoundError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ packId: string; categoryId: string }>;
};

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId, categoryId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateTaxonomyCategorySchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [pack] = await tx
          .select()
          .from(taxonomyPacks)
          .where(eq(taxonomyPacks.id, packId))
          .limit(1);

        if (!pack) throw new NotFoundError("Taxonomy pack not found");

        if (pack.firmId !== firmId) {
          if (pack.firmId === null) {
            throw new ForbiddenError("Cannot modify system taxonomy packs; fork a pack first");
          }
          throw new NotFoundError("Taxonomy pack not found");
        }

        const [existing] = await tx
          .select()
          .from(taxonomyCategories)
          .where(and(eq(taxonomyCategories.id, categoryId), eq(taxonomyCategories.packId, packId)))
          .limit(1);

        if (!existing) throw new NotFoundError("Category not found");

        const [result] = await tx
          .update(taxonomyCategories)
          .set({
            label: data.label ?? existing.label,
            description:
              data.description === undefined ? existing.description : (data.description ?? null),
            icon: data.icon === undefined ? existing.icon : (data.icon ?? null),
            color: data.color === undefined ? existing.color : (data.color ?? null),
            sortOrder: data.sortOrder ?? existing.sortOrder,
          })
          .where(eq(taxonomyCategories.id, categoryId))
          .returning();

        return result;
      });

      return NextResponse.json(updated);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId, categoryId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        const [pack] = await tx
          .select()
          .from(taxonomyPacks)
          .where(eq(taxonomyPacks.id, packId))
          .limit(1);

        if (!pack) throw new NotFoundError("Taxonomy pack not found");

        if (pack.firmId !== firmId) {
          if (pack.firmId === null) {
            throw new ForbiddenError("Cannot modify system taxonomy packs; fork a pack first");
          }
          throw new NotFoundError("Taxonomy pack not found");
        }

        const [existing] = await tx
          .select()
          .from(taxonomyCategories)
          .where(and(eq(taxonomyCategories.id, categoryId), eq(taxonomyCategories.packId, packId)))
          .limit(1);

        if (!existing) throw new NotFoundError("Category not found");

        // Cascade delete handles fields automatically via FK constraint
        await tx.delete(taxonomyCategories).where(eq(taxonomyCategories.id, categoryId));
      });

      return NextResponse.json({ success: true }, { status: 200 });
    })
  )
);
