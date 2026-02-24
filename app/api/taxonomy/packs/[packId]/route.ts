/**
 * Taxonomy Pack Detail API
 *
 * GET   /api/taxonomy/packs/:packId - Full pack detail for system or firm packs.
 * PATCH /api/taxonomy/packs/:packId - Update a firm-owned pack.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import {
  taxonomyPacks,
  taxonomyCategories,
  taxonomyFields,
  taxonomyDocumentTypes,
  taxonomyActionTriggers,
  taxonomyReconciliationRules,
  taxonomyPromptTemplates,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaxonomyPackSchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ForbiddenError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ packId: string }>;
};

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [pack] = await tx
          .select()
          .from(taxonomyPacks)
          .where(
            and(
              eq(taxonomyPacks.id, packId),
              or(eq(taxonomyPacks.firmId, firmId), isNull(taxonomyPacks.firmId))
            )
          )
          .limit(1);

        if (!pack) {
          throw new NotFoundError("Taxonomy pack not found");
        }

        const categories = await tx
          .select()
          .from(taxonomyCategories)
          .where(eq(taxonomyCategories.packId, packId))
          .orderBy(asc(taxonomyCategories.sortOrder), taxonomyCategories.label);

        const categoryIds = categories.map((category) => category.id);
        const fields =
          categoryIds.length === 0
            ? []
            : await tx
                .select()
                .from(taxonomyFields)
                .where(inArray(taxonomyFields.categoryId, categoryIds))
                .orderBy(asc(taxonomyFields.sortOrder), taxonomyFields.label);

        const documentTypes = await tx
          .select()
          .from(taxonomyDocumentTypes)
          .where(eq(taxonomyDocumentTypes.packId, packId))
          .orderBy(asc(taxonomyDocumentTypes.sortOrder), taxonomyDocumentTypes.label);

        const actionTriggers = await tx
          .select()
          .from(taxonomyActionTriggers)
          .where(eq(taxonomyActionTriggers.packId, packId))
          .orderBy(asc(taxonomyActionTriggers.name));

        const reconciliationRules = await tx
          .select()
          .from(taxonomyReconciliationRules)
          .where(eq(taxonomyReconciliationRules.packId, packId))
          .orderBy(asc(taxonomyReconciliationRules.fieldKey));

        const promptTemplates = await tx
          .select()
          .from(taxonomyPromptTemplates)
          .where(eq(taxonomyPromptTemplates.packId, packId))
          .orderBy(asc(taxonomyPromptTemplates.templateType));

        return {
          pack,
          categories,
          fields,
          documentTypes,
          actionTriggers,
          reconciliationRules,
          promptTemplates,
        };
      });

      const fieldsByCategory = new Map<string, (typeof result.fields)[number][]>();
      for (const field of result.fields) {
        const bucket = fieldsByCategory.get(field.categoryId);
        if (bucket) {
          bucket.push(field);
        } else {
          fieldsByCategory.set(field.categoryId, [field]);
        }
      }

      const categories = result.categories.map((category) => ({
        ...category,
        fields: fieldsByCategory.get(category.id) ?? [],
      }));

      return NextResponse.json({
        pack: result.pack,
        categories,
        documentTypes: result.documentTypes,
        actionTriggers: result.actionTriggers,
        reconciliationRules: result.reconciliationRules,
        promptTemplates: result.promptTemplates,
      });
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateTaxonomyPackSchema.parse(body);

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

        const [result] = await tx
          .update(taxonomyPacks)
          .set({
            name: data.name ?? pack.name,
            description:
              data.description === undefined ? pack.description : (data.description ?? null),
            isActive: data.isActive ?? pack.isActive,
            version: data.version ?? pack.version,
            updatedAt: new Date(),
          })
          .where(eq(taxonomyPacks.id, packId))
          .returning();

        return result;
      });

      return NextResponse.json(updated);
    })
  )
);
