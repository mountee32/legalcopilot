/**
 * Taxonomy Packs Schema
 *
 * Configurable AI extraction/classification/action configuration per practice area.
 * System packs (firmId = null) can be forked into firm-owned packs for customization.
 */

import {
  AnyPgColumn,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  pgEnum,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { practiceAreaEnum } from "./matters";

export const taxonomyFieldDataTypeEnum = pgEnum("taxonomy_field_data_type", [
  "text",
  "number",
  "date",
  "boolean",
  "currency",
  "percentage",
  "json",
]);

export const taxonomyTriggerTypeEnum = pgEnum("taxonomy_trigger_type", [
  "deadline",
  "recommendation",
  "alert",
  "status_change",
]);

export const taxonomyConflictDetectionModeEnum = pgEnum("taxonomy_conflict_detection_mode", [
  "exact",
  "fuzzy_text",
  "fuzzy_number",
  "date_range",
  "semantic",
]);

export const taxonomyPromptTemplateTypeEnum = pgEnum("taxonomy_prompt_template_type", [
  "extraction",
  "classification",
  "action_generation",
  "summarization",
]);

export const taxonomyPacks = pgTable(
  "taxonomy_packs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Null = system pack, otherwise firm-specific pack */
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),

    /** Stable pack key e.g. "workers-comp" */
    key: text("key").notNull(),

    /** Semantic version string */
    version: text("version").notNull().default("1.0.0"),

    name: text("name").notNull(),
    description: text("description"),

    practiceArea: practiceAreaEnum("practice_area").notNull(),

    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),

    /** Parent pack for firm forks */
    parentPackId: uuid("parent_pack_id").references((): AnyPgColumn => taxonomyPacks.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmIdx: index("taxonomy_packs_firm_idx").on(t.firmId),
    practiceAreaIdx: index("taxonomy_packs_practice_area_idx").on(t.practiceArea),
    activeIdx: index("taxonomy_packs_active_idx").on(t.isActive),
    uniqueFirmPackVersion: uniqueIndex("taxonomy_packs_firm_key_version_unique").on(
      t.firmId,
      t.key,
      t.version
    ),
  })
);

export const taxonomyCategories = pgTable(
  "taxonomy_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    packId: uuid("pack_id")
      .notNull()
      .references(() => taxonomyPacks.id, { onDelete: "cascade" }),

    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    packSortIdx: index("taxonomy_categories_pack_sort_idx").on(t.packId, t.sortOrder),
    uniqueKeyPerPack: uniqueIndex("taxonomy_categories_pack_key_unique").on(t.packId, t.key),
  })
);

export const taxonomyFields = pgTable(
  "taxonomy_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => taxonomyCategories.id, { onDelete: "cascade" }),

    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    dataType: taxonomyFieldDataTypeEnum("data_type").notNull(),
    examples: jsonb("examples"),
    confidenceThreshold: numeric("confidence_threshold", { precision: 4, scale: 3 })
      .notNull()
      .default("0.800"),
    requiresHumanReview: boolean("requires_human_review").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    categorySortIdx: index("taxonomy_fields_category_sort_idx").on(t.categoryId, t.sortOrder),
    uniqueKeyPerCategory: uniqueIndex("taxonomy_fields_category_key_unique").on(
      t.categoryId,
      t.key
    ),
  })
);

export const taxonomyDocumentTypes = pgTable(
  "taxonomy_document_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    packId: uuid("pack_id")
      .notNull()
      .references(() => taxonomyPacks.id, { onDelete: "cascade" }),

    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    activatedCategories: jsonb("activated_categories").notNull(),
    classificationHints: text("classification_hints"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    packSortIdx: index("taxonomy_document_types_pack_sort_idx").on(t.packId, t.sortOrder),
    uniqueKeyPerPack: uniqueIndex("taxonomy_document_types_pack_key_unique").on(t.packId, t.key),
  })
);

export const taxonomyActionTriggers = pgTable(
  "taxonomy_action_triggers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    packId: uuid("pack_id")
      .notNull()
      .references(() => taxonomyPacks.id, { onDelete: "cascade" }),

    triggerType: taxonomyTriggerTypeEnum("trigger_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    /** Field key + condition descriptor */
    triggerCondition: jsonb("trigger_condition").notNull(),
    /** Action descriptor payload */
    actionTemplate: jsonb("action_template").notNull(),

    jurisdictionSpecific: boolean("jurisdiction_specific").notNull().default(false),
    jurisdictionRules: jsonb("jurisdiction_rules"),
    isDeterministic: boolean("is_deterministic").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    packIdx: index("taxonomy_action_triggers_pack_idx").on(t.packId),
  })
);

export const taxonomyReconciliationRules = pgTable(
  "taxonomy_reconciliation_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    packId: uuid("pack_id")
      .notNull()
      .references(() => taxonomyPacks.id, { onDelete: "cascade" }),

    fieldKey: text("field_key").notNull(),
    caseFieldMapping: text("case_field_mapping").notNull(),
    conflictDetectionMode: taxonomyConflictDetectionModeEnum("conflict_detection_mode").notNull(),
    autoApplyThreshold: numeric("auto_apply_threshold", { precision: 4, scale: 3 })
      .notNull()
      .default("0.850"),
    requiresHumanReview: boolean("requires_human_review").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    packIdx: index("taxonomy_reconciliation_rules_pack_idx").on(t.packId),
    uniqueFieldPerPack: uniqueIndex("taxonomy_reconciliation_rules_pack_field_unique").on(
      t.packId,
      t.fieldKey
    ),
  })
);

export const taxonomyPromptTemplates = pgTable(
  "taxonomy_prompt_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    packId: uuid("pack_id")
      .notNull()
      .references(() => taxonomyPacks.id, { onDelete: "cascade" }),

    templateType: taxonomyPromptTemplateTypeEnum("template_type").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    userPromptTemplate: text("user_prompt_template").notNull(),
    modelPreference: text("model_preference"),
    temperature: numeric("temperature", { precision: 4, scale: 3 }),
    maxTokens: integer("max_tokens"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    packTemplateTypeIdx: uniqueIndex("taxonomy_prompt_templates_pack_template_type_unique").on(
      t.packId,
      t.templateType
    ),
  })
);

export type TaxonomyPack = typeof taxonomyPacks.$inferSelect;
export type NewTaxonomyPack = typeof taxonomyPacks.$inferInsert;

export type TaxonomyCategory = typeof taxonomyCategories.$inferSelect;
export type NewTaxonomyCategory = typeof taxonomyCategories.$inferInsert;

export type TaxonomyField = typeof taxonomyFields.$inferSelect;
export type NewTaxonomyField = typeof taxonomyFields.$inferInsert;

export type TaxonomyDocumentType = typeof taxonomyDocumentTypes.$inferSelect;
export type NewTaxonomyDocumentType = typeof taxonomyDocumentTypes.$inferInsert;

export type TaxonomyActionTrigger = typeof taxonomyActionTriggers.$inferSelect;
export type NewTaxonomyActionTrigger = typeof taxonomyActionTriggers.$inferInsert;

export type TaxonomyReconciliationRule = typeof taxonomyReconciliationRules.$inferSelect;
export type NewTaxonomyReconciliationRule = typeof taxonomyReconciliationRules.$inferInsert;

export type TaxonomyPromptTemplate = typeof taxonomyPromptTemplates.$inferSelect;
export type NewTaxonomyPromptTemplate = typeof taxonomyPromptTemplates.$inferInsert;
