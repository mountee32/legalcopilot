/**
 * Taxonomy Pack Fields API
 *
 * POST /api/taxonomy/packs/:packId/fields - Create a field in a firm-owned taxonomy pack.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { taxonomyPacks, taxonomyCategories, taxonomyFields } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTaxonomyFieldSchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import {
  withErrorHandler,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ packId: string }>;
};

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaxonomyFieldSchema.parse(body);

      const field = await withFirmDb(firmId, async (tx) => {
        const [pack] = await tx
          .select()
          .from(taxonomyPacks)
          .where(eq(taxonomyPacks.id, packId))
          .limit(1);

        if (!pack) {
          throw new NotFoundError("Taxonomy pack not found");
        }

        if (pack.firmId !== firmId) {
          if (pack.firmId === null) {
            throw new ForbiddenError("Cannot modify system taxonomy packs; fork a pack first");
          }
          throw new NotFoundError("Taxonomy pack not found");
        }

        const [category] = await tx
          .select()
          .from(taxonomyCategories)
          .where(
            and(eq(taxonomyCategories.id, data.categoryId), eq(taxonomyCategories.packId, packId))
          )
          .limit(1);

        if (!category) {
          throw new ValidationError("Category does not belong to this taxonomy pack");
        }

        const [created] = await tx
          .insert(taxonomyFields)
          .values({
            categoryId: data.categoryId,
            key: data.key,
            label: data.label,
            description: data.description ?? null,
            dataType: data.dataType,
            examples: data.examples ?? null,
            confidenceThreshold:
              data.confidenceThreshold === undefined
                ? undefined
                : data.confidenceThreshold.toFixed(3),
            requiresHumanReview: data.requiresHumanReview ?? false,
            sortOrder: data.sortOrder ?? 0,
          })
          .returning();

        return created;
      });

      return NextResponse.json(field, { status: 201 });
    })
  )
);
