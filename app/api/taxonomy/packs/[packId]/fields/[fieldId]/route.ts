/**
 * Taxonomy Field Detail API
 *
 * PUT    /api/taxonomy/packs/:packId/fields/:fieldId - Update editable field attributes.
 * DELETE /api/taxonomy/packs/:packId/fields/:fieldId - Delete a field from a firm-owned pack.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { taxonomyPacks, taxonomyCategories, taxonomyFields } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaxonomyFieldSchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, ForbiddenError, NotFoundError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ packId: string; fieldId: string }>;
};

export const PUT = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId, fieldId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateTaxonomyFieldSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
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

        const [existingField] = await tx
          .select()
          .from(taxonomyFields)
          .where(eq(taxonomyFields.id, fieldId))
          .limit(1);

        if (!existingField) {
          throw new NotFoundError("Taxonomy field not found");
        }

        const [fieldCategory] = await tx
          .select()
          .from(taxonomyCategories)
          .where(
            and(
              eq(taxonomyCategories.id, existingField.categoryId),
              eq(taxonomyCategories.packId, packId)
            )
          )
          .limit(1);

        if (!fieldCategory) {
          throw new NotFoundError("Taxonomy field not found for this pack");
        }

        const [nextField] = await tx
          .update(taxonomyFields)
          .set({
            label: data.label ?? existingField.label,
            description:
              data.description === undefined
                ? existingField.description
                : (data.description ?? null),
            confidenceThreshold:
              data.confidenceThreshold === undefined
                ? existingField.confidenceThreshold
                : data.confidenceThreshold.toFixed(3),
            requiresHumanReview:
              data.requiresHumanReview === undefined
                ? existingField.requiresHumanReview
                : data.requiresHumanReview,
          })
          .where(eq(taxonomyFields.id, fieldId))
          .returning();

        return nextField;
      });

      return NextResponse.json(updated);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId, fieldId } = await rest.params;
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

        const [existingField] = await tx
          .select()
          .from(taxonomyFields)
          .where(eq(taxonomyFields.id, fieldId))
          .limit(1);

        if (!existingField) throw new NotFoundError("Taxonomy field not found");

        const [fieldCategory] = await tx
          .select()
          .from(taxonomyCategories)
          .where(
            and(
              eq(taxonomyCategories.id, existingField.categoryId),
              eq(taxonomyCategories.packId, packId)
            )
          )
          .limit(1);

        if (!fieldCategory) throw new NotFoundError("Taxonomy field not found for this pack");

        await tx.delete(taxonomyFields).where(eq(taxonomyFields.id, fieldId));
      });

      return NextResponse.json({ success: true }, { status: 200 });
    })
  )
);
