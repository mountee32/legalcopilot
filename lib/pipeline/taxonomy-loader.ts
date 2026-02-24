/**
 * Taxonomy Loader
 *
 * Loads the taxonomy pack for a matter based on its practice area.
 * Used by pipeline workers to know which fields to extract and how to classify.
 */

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matters,
  taxonomyPacks,
  taxonomyCategories,
  taxonomyFields,
  taxonomyDocumentTypes,
  taxonomyPromptTemplates,
  taxonomyReconciliationRules,
  taxonomyActionTriggers,
  type TaxonomyPack,
  type TaxonomyCategory,
  type TaxonomyField,
  type TaxonomyDocumentType,
  type TaxonomyPromptTemplate,
  type TaxonomyReconciliationRule,
  type TaxonomyActionTrigger,
} from "@/lib/db/schema";

export interface LoadedPack {
  pack: TaxonomyPack;
  categories: (TaxonomyCategory & { fields: TaxonomyField[] })[];
  documentTypes: TaxonomyDocumentType[];
  promptTemplates: TaxonomyPromptTemplate[];
  reconciliationRules: TaxonomyReconciliationRule[];
  actionTriggers: TaxonomyActionTrigger[];
  /** Flat map of "categoryKey:fieldKey" → TaxonomyField */
  fieldMap: Map<string, TaxonomyField>;
  /** Map of fieldKey → reconciliation rule */
  reconciliationRuleMap: Map<string, TaxonomyReconciliationRule>;
}

/**
 * Load the most relevant taxonomy pack for a matter.
 *
 * Resolution order:
 * 1. Firm-specific active pack for the matter's practice area
 * 2. System pack for the matter's practice area
 * 3. null if no pack exists
 */
export async function loadPackForMatter(
  firmId: string,
  matterId: string
): Promise<LoadedPack | null> {
  // Get the matter's practice area
  const [matter] = await db
    .select({ practiceArea: matters.practiceArea })
    .from(matters)
    .where(eq(matters.id, matterId))
    .limit(1);

  if (!matter) return null;

  // Find the best matching pack: firm-specific first, then system
  const packs = await db
    .select()
    .from(taxonomyPacks)
    .where(
      and(
        eq(taxonomyPacks.practiceArea, matter.practiceArea),
        eq(taxonomyPacks.isActive, true),
        or(eq(taxonomyPacks.firmId, firmId), isNull(taxonomyPacks.firmId))
      )
    )
    .orderBy(taxonomyPacks.firmId); // firm-specific (non-null) sorts after null in pg, we'll pick manually

  if (packs.length === 0) return null;

  // Prefer firm-specific pack, fall back to system pack
  const pack = packs.find((p) => p.firmId === firmId) || packs[0];

  return loadPackById(pack.id);
}

/**
 * Load a full taxonomy pack by ID with all its children.
 */
export async function loadPackById(packId: string): Promise<LoadedPack | null> {
  const [pack] = await db.select().from(taxonomyPacks).where(eq(taxonomyPacks.id, packId)).limit(1);

  if (!pack) return null;

  const categories = await db
    .select()
    .from(taxonomyCategories)
    .where(eq(taxonomyCategories.packId, packId))
    .orderBy(asc(taxonomyCategories.sortOrder));

  const categoryIds = categories.map((c) => c.id);
  const fields =
    categoryIds.length === 0
      ? []
      : await db
          .select()
          .from(taxonomyFields)
          .where(inArray(taxonomyFields.categoryId, categoryIds))
          .orderBy(asc(taxonomyFields.sortOrder));

  const documentTypes = await db
    .select()
    .from(taxonomyDocumentTypes)
    .where(eq(taxonomyDocumentTypes.packId, packId))
    .orderBy(asc(taxonomyDocumentTypes.sortOrder));

  const promptTemplates = await db
    .select()
    .from(taxonomyPromptTemplates)
    .where(eq(taxonomyPromptTemplates.packId, packId));

  const reconciliationRules = await db
    .select()
    .from(taxonomyReconciliationRules)
    .where(eq(taxonomyReconciliationRules.packId, packId));

  const actionTriggers = await db
    .select()
    .from(taxonomyActionTriggers)
    .where(eq(taxonomyActionTriggers.packId, packId));

  // Group fields by category
  const fieldsByCategory = new Map<string, TaxonomyField[]>();
  for (const field of fields) {
    const bucket = fieldsByCategory.get(field.categoryId) || [];
    bucket.push(field);
    fieldsByCategory.set(field.categoryId, bucket);
  }

  const categoriesWithFields = categories.map((cat) => ({
    ...cat,
    fields: fieldsByCategory.get(cat.id) || [],
  }));

  // Build flat field map for quick lookup
  const fieldMap = new Map<string, TaxonomyField>();
  for (const cat of categoriesWithFields) {
    for (const field of cat.fields) {
      fieldMap.set(`${cat.key}:${field.key}`, field);
    }
  }

  // Build reconciliation rule map for quick lookup
  const reconciliationRuleMap = new Map<string, TaxonomyReconciliationRule>();
  for (const rule of reconciliationRules) {
    reconciliationRuleMap.set(rule.fieldKey, rule);
  }

  return {
    pack,
    categories: categoriesWithFields,
    documentTypes,
    promptTemplates,
    reconciliationRules,
    actionTriggers,
    fieldMap,
    reconciliationRuleMap,
  };
}
