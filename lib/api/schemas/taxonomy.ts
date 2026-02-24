/**
 * Taxonomy Pack API Schemas
 *
 * Contract schemas for taxonomy pack listing, detail, and forking.
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";
import { PracticeAreaSchema } from "./matters";

export const TaxonomyFieldDataTypeSchema = z
  .enum(["text", "number", "date", "boolean", "currency", "percentage", "json"])
  .openapi("TaxonomyFieldDataType");

export const TaxonomyTriggerTypeSchema = z
  .enum(["deadline", "recommendation", "alert", "status_change"])
  .openapi("TaxonomyTriggerType");

export const TaxonomyConflictDetectionModeSchema = z
  .enum(["exact", "fuzzy_text", "fuzzy_number", "date_range", "semantic"])
  .openapi("TaxonomyConflictDetectionMode");

export const TaxonomyPromptTemplateTypeSchema = z
  .enum(["extraction", "classification", "action_generation", "summarization"])
  .openapi("TaxonomyPromptTemplateType");

export const TaxonomyFieldSchema = z
  .object({
    id: UuidSchema,
    categoryId: UuidSchema,
    key: z.string(),
    label: z.string(),
    description: z.string().nullable(),
    dataType: TaxonomyFieldDataTypeSchema,
    examples: z.array(z.unknown()).nullable(),
    confidenceThreshold: z.string(),
    requiresHumanReview: z.boolean(),
    sortOrder: z.number().int(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaxonomyField");

export const CreateTaxonomyFieldSchema = z
  .object({
    categoryId: UuidSchema,
    key: z
      .string()
      .regex(/^[a-z0-9_]{2,64}$/)
      .openapi({
        example: "mmi_date",
        description: "Stable machine key for the field",
      }),
    label: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    dataType: TaxonomyFieldDataTypeSchema,
    examples: z.array(z.unknown()).optional(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
    requiresHumanReview: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .openapi("CreateTaxonomyFieldRequest");

export const UpdateTaxonomyFieldSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
    requiresHumanReview: z.boolean().optional(),
  })
  .openapi("UpdateTaxonomyFieldRequest");

export const TaxonomyCategorySchema = z
  .object({
    id: UuidSchema,
    packId: UuidSchema,
    key: z.string(),
    label: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    color: z.string().nullable(),
    sortOrder: z.number().int(),
    createdAt: DateTimeSchema,
    fields: z.array(TaxonomyFieldSchema).optional(),
  })
  .openapi("TaxonomyCategory");

export const TaxonomyDocumentTypeSchema = z
  .object({
    id: UuidSchema,
    packId: UuidSchema,
    key: z.string(),
    label: z.string(),
    description: z.string().nullable(),
    activatedCategories: z.array(z.string()),
    classificationHints: z.string().nullable(),
    sortOrder: z.number().int(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaxonomyDocumentType");

export const TaxonomyActionTriggerSchema = z
  .object({
    id: UuidSchema,
    packId: UuidSchema,
    triggerType: TaxonomyTriggerTypeSchema,
    name: z.string(),
    description: z.string().nullable(),
    triggerCondition: z.record(z.unknown()),
    actionTemplate: z.record(z.unknown()),
    jurisdictionSpecific: z.boolean(),
    jurisdictionRules: z.record(z.unknown()).nullable(),
    isDeterministic: z.boolean(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaxonomyActionTrigger");

export const TaxonomyReconciliationRuleSchema = z
  .object({
    id: UuidSchema,
    packId: UuidSchema,
    fieldKey: z.string(),
    caseFieldMapping: z.string(),
    conflictDetectionMode: TaxonomyConflictDetectionModeSchema,
    autoApplyThreshold: z.string(),
    requiresHumanReview: z.boolean(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaxonomyReconciliationRule");

export const TaxonomyPromptTemplateSchema = z
  .object({
    id: UuidSchema,
    packId: UuidSchema,
    templateType: TaxonomyPromptTemplateTypeSchema,
    systemPrompt: z.string(),
    userPromptTemplate: z.string(),
    modelPreference: z.string().nullable(),
    temperature: z.string().nullable(),
    maxTokens: z.number().int().nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaxonomyPromptTemplate");

export const TaxonomyPackSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema.nullable(),
    key: z.string(),
    version: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    practiceArea: PracticeAreaSchema,
    isSystem: z.boolean(),
    isActive: z.boolean(),
    parentPackId: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("TaxonomyPack");

export const TaxonomyPackListItemSchema = TaxonomyPackSchema.extend({
  categoryCount: z.number().int(),
  fieldCount: z.number().int(),
}).openapi("TaxonomyPackListItem");

export const TaxonomyPackQuerySchema = PaginationSchema.extend({
  practiceArea: PracticeAreaSchema.optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  includeSystem: z
    .string()
    .transform((v) => v === "true")
    .optional()
    .default("true"),
}).openapi("TaxonomyPackQuery");

export const TaxonomyPackListSchema = z
  .object({
    packs: z.array(TaxonomyPackListItemSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TaxonomyPackListResponse");

export const TaxonomyPackDetailSchema = z
  .object({
    pack: TaxonomyPackSchema,
    categories: z.array(TaxonomyCategorySchema.extend({ fields: z.array(TaxonomyFieldSchema) })),
    documentTypes: z.array(TaxonomyDocumentTypeSchema),
    actionTriggers: z.array(TaxonomyActionTriggerSchema),
    reconciliationRules: z.array(TaxonomyReconciliationRuleSchema),
    promptTemplates: z.array(TaxonomyPromptTemplateSchema),
  })
  .openapi("TaxonomyPackDetailResponse");

export const ForkTaxonomyPackSchema = z
  .object({
    key: z
      .string()
      .regex(/^[a-z0-9-]{3,64}$/)
      .optional()
      .openapi({
        example: "workers-comp-custom",
        description: "Optional new key for the forked pack",
      }),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    version: z.string().max(50).optional(),
  })
  .openapi("ForkTaxonomyPackRequest");

export const ForkTaxonomyPackResponseSchema = z
  .object({
    pack: TaxonomyPackSchema,
    copied: z.object({
      categories: z.number().int(),
      fields: z.number().int(),
      documentTypes: z.number().int(),
      actionTriggers: z.number().int(),
      reconciliationRules: z.number().int(),
      promptTemplates: z.number().int(),
    }),
  })
  .openapi("ForkTaxonomyPackResponse");

// ---------------------------------------------------------------------------
// Pack CRUD schemas
// ---------------------------------------------------------------------------

export const CreateTaxonomyPackSchema = z
  .object({
    key: z
      .string()
      .regex(/^[a-z0-9-]{3,64}$/)
      .openapi({ example: "workers-comp-custom", description: "Stable machine key" }),
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    practiceArea: PracticeAreaSchema,
    version: z.string().max(50).optional(),
  })
  .openapi("CreateTaxonomyPackRequest");

export const UpdateTaxonomyPackSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    isActive: z.boolean().optional(),
    version: z.string().max(50).optional(),
  })
  .openapi("UpdateTaxonomyPackRequest");

// ---------------------------------------------------------------------------
// Category CRUD schemas
// ---------------------------------------------------------------------------

export const CreateTaxonomyCategorySchema = z
  .object({
    key: z
      .string()
      .regex(/^[a-z0-9_]{2,64}$/)
      .openapi({ example: "claimant_info", description: "Stable machine key" }),
    label: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    icon: z.string().max(64).optional(),
    color: z.string().max(32).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .openapi("CreateTaxonomyCategoryRequest");

export const UpdateTaxonomyCategorySchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    icon: z.string().max(64).nullable().optional(),
    color: z.string().max(32).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .openapi("UpdateTaxonomyCategoryRequest");

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type TaxonomyPackQuery = z.infer<typeof TaxonomyPackQuerySchema>;
export type ForkTaxonomyPack = z.infer<typeof ForkTaxonomyPackSchema>;
export type CreateTaxonomyPack = z.infer<typeof CreateTaxonomyPackSchema>;
export type UpdateTaxonomyPack = z.infer<typeof UpdateTaxonomyPackSchema>;
export type CreateTaxonomyCategory = z.infer<typeof CreateTaxonomyCategorySchema>;
export type UpdateTaxonomyCategory = z.infer<typeof UpdateTaxonomyCategorySchema>;
