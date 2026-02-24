/**
 * Taxonomy Pack Fork API
 *
 * POST /api/taxonomy/packs/:packId/fork - Clone a system (or readable) pack into a firm pack.
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
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
import { ForkTaxonomyPackSchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ packId: string }>;
};

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const rawBody = await request.json().catch(() => ({}));
      const data = ForkTaxonomyPackSchema.parse(rawBody);

      const result = await withFirmDb(firmId, async (tx) => {
        const [sourcePack] = await tx
          .select()
          .from(taxonomyPacks)
          .where(
            and(
              eq(taxonomyPacks.id, packId),
              or(eq(taxonomyPacks.firmId, firmId), isNull(taxonomyPacks.firmId))
            )
          )
          .limit(1);

        if (!sourcePack) {
          throw new NotFoundError("Taxonomy pack not found");
        }

        const keySuffix = randomUUID().slice(0, 8);
        const generatedKey = `${sourcePack.key}-fork-${keySuffix}`.slice(0, 64);

        const [forkedPack] = await tx
          .insert(taxonomyPacks)
          .values({
            firmId,
            key: data.key ?? generatedKey,
            version: data.version ?? sourcePack.version,
            name: data.name ?? `${sourcePack.name} (Firm Copy)`,
            description: data.description ?? sourcePack.description,
            practiceArea: sourcePack.practiceArea,
            isSystem: false,
            isActive: true,
            parentPackId: sourcePack.id,
          })
          .returning();

        const sourceCategories = await tx
          .select()
          .from(taxonomyCategories)
          .where(eq(taxonomyCategories.packId, sourcePack.id));

        const sourceCategoryIds = sourceCategories.map((category) => category.id);
        const sourceFields =
          sourceCategoryIds.length === 0
            ? []
            : await tx
                .select()
                .from(taxonomyFields)
                .where(inArray(taxonomyFields.categoryId, sourceCategoryIds));

        const sourceDocumentTypes = await tx
          .select()
          .from(taxonomyDocumentTypes)
          .where(eq(taxonomyDocumentTypes.packId, sourcePack.id));

        const sourceActionTriggers = await tx
          .select()
          .from(taxonomyActionTriggers)
          .where(eq(taxonomyActionTriggers.packId, sourcePack.id));

        const sourceReconciliationRules = await tx
          .select()
          .from(taxonomyReconciliationRules)
          .where(eq(taxonomyReconciliationRules.packId, sourcePack.id));

        const sourcePromptTemplates = await tx
          .select()
          .from(taxonomyPromptTemplates)
          .where(eq(taxonomyPromptTemplates.packId, sourcePack.id));

        const categoryIdMap = new Map<string, string>();
        for (const sourceCategory of sourceCategories) {
          const [insertedCategory] = await tx
            .insert(taxonomyCategories)
            .values({
              packId: forkedPack.id,
              key: sourceCategory.key,
              label: sourceCategory.label,
              description: sourceCategory.description,
              icon: sourceCategory.icon,
              color: sourceCategory.color,
              sortOrder: sourceCategory.sortOrder,
            })
            .returning();

          categoryIdMap.set(sourceCategory.id, insertedCategory.id);
        }

        let copiedFields = 0;
        for (const sourceField of sourceFields) {
          const targetCategoryId = categoryIdMap.get(sourceField.categoryId);
          if (!targetCategoryId) {
            continue;
          }

          await tx.insert(taxonomyFields).values({
            categoryId: targetCategoryId,
            key: sourceField.key,
            label: sourceField.label,
            description: sourceField.description,
            dataType: sourceField.dataType,
            examples: sourceField.examples,
            confidenceThreshold: sourceField.confidenceThreshold,
            requiresHumanReview: sourceField.requiresHumanReview,
            sortOrder: sourceField.sortOrder,
          });

          copiedFields += 1;
        }

        for (const sourceDocumentType of sourceDocumentTypes) {
          await tx.insert(taxonomyDocumentTypes).values({
            packId: forkedPack.id,
            key: sourceDocumentType.key,
            label: sourceDocumentType.label,
            description: sourceDocumentType.description,
            activatedCategories: sourceDocumentType.activatedCategories,
            classificationHints: sourceDocumentType.classificationHints,
            sortOrder: sourceDocumentType.sortOrder,
          });
        }

        for (const sourceActionTrigger of sourceActionTriggers) {
          await tx.insert(taxonomyActionTriggers).values({
            packId: forkedPack.id,
            triggerType: sourceActionTrigger.triggerType,
            name: sourceActionTrigger.name,
            description: sourceActionTrigger.description,
            triggerCondition: sourceActionTrigger.triggerCondition,
            actionTemplate: sourceActionTrigger.actionTemplate,
            jurisdictionSpecific: sourceActionTrigger.jurisdictionSpecific,
            jurisdictionRules: sourceActionTrigger.jurisdictionRules,
            isDeterministic: sourceActionTrigger.isDeterministic,
          });
        }

        for (const sourceRule of sourceReconciliationRules) {
          await tx.insert(taxonomyReconciliationRules).values({
            packId: forkedPack.id,
            fieldKey: sourceRule.fieldKey,
            caseFieldMapping: sourceRule.caseFieldMapping,
            conflictDetectionMode: sourceRule.conflictDetectionMode,
            autoApplyThreshold: sourceRule.autoApplyThreshold,
            requiresHumanReview: sourceRule.requiresHumanReview,
          });
        }

        for (const sourcePromptTemplate of sourcePromptTemplates) {
          await tx.insert(taxonomyPromptTemplates).values({
            packId: forkedPack.id,
            templateType: sourcePromptTemplate.templateType,
            systemPrompt: sourcePromptTemplate.systemPrompt,
            userPromptTemplate: sourcePromptTemplate.userPromptTemplate,
            modelPreference: sourcePromptTemplate.modelPreference,
            temperature: sourcePromptTemplate.temperature,
            maxTokens: sourcePromptTemplate.maxTokens,
          });
        }

        return {
          pack: forkedPack,
          copied: {
            categories: sourceCategories.length,
            fields: copiedFields,
            documentTypes: sourceDocumentTypes.length,
            actionTriggers: sourceActionTriggers.length,
            reconciliationRules: sourceReconciliationRules.length,
            promptTemplates: sourcePromptTemplates.length,
          },
        };
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
