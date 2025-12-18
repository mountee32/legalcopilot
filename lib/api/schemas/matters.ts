/**
 * Matter API Schemas
 *
 * Zod schemas for matter/case-related API endpoints.
 * Used for request validation and OpenAPI generation.
 *
 * @see lib/db/schema/matters.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, MoneySchema } from "./common";

/**
 * Matter status values.
 */
export const MatterStatusSchema = z
  .enum(["lead", "active", "on_hold", "closed", "archived"])
  .openapi({
    example: "active",
    description: "Current status in matter lifecycle",
  });

/**
 * Practice area values.
 */
export const PracticeAreaSchema = z
  .enum([
    "conveyancing",
    "litigation",
    "family",
    "probate",
    "employment",
    "immigration",
    "personal_injury",
    "commercial",
    "criminal",
    "ip",
    "insolvency",
    "other",
  ])
  .openapi({
    example: "conveyancing",
    description: "Legal practice area",
  });

/**
 * Billing type values.
 */
export const BillingTypeSchema = z
  .enum(["hourly", "fixed_fee", "conditional", "legal_aid", "pro_bono"])
  .openapi({
    example: "hourly",
    description: "Billing arrangement type",
  });

/**
 * Matter entity for API responses.
 */
export const MatterSchema = z
  .object({
    id: UuidSchema,
    reference: z.string().openapi({ example: "SMI-2024-0042" }),
    title: z.string().openapi({ example: "Smith v Jones - Property Dispute" }),
    description: z.string().nullable(),

    clientId: UuidSchema,
    feeEarnerId: UuidSchema.nullable(),
    supervisorId: UuidSchema.nullable(),

    status: MatterStatusSchema,
    practiceArea: PracticeAreaSchema,
    subType: z.string().nullable().openapi({
      description: "Sub-type within practice area e.g. freehold_purchase",
      example: "freehold_purchase",
    }),
    billingType: BillingTypeSchema,

    hourlyRate: MoneySchema.nullable(),
    fixedFee: MoneySchema.nullable(),
    estimatedValue: MoneySchema.nullable(),

    openedAt: DateTimeSchema.nullable(),
    closedAt: DateTimeSchema.nullable(),
    keyDeadline: DateTimeSchema.nullable(),

    notes: z.string().nullable(),

    riskScore: z.number().int().min(0).max(100).nullable().openapi({
      description: "AI-calculated risk score (0-100, higher = more risky)",
      example: 35,
    }),
    riskFactors: z
      .array(z.any())
      .nullable()
      .openapi({
        description: "AI risk assessment factors for explainability",
        example: [
          { factor: "tight_deadline", weight: 0.4 },
          { factor: "high_value", weight: 0.3 },
        ],
      }),
    riskAssessedAt: DateTimeSchema.nullable().openapi({
      description: "When AI last calculated the risk score",
    }),

    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Matter");

/**
 * Create matter request body.
 */
export const CreateMatterSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),

    clientId: UuidSchema,
    feeEarnerId: UuidSchema.optional(),
    supervisorId: UuidSchema.optional(),

    practiceArea: PracticeAreaSchema,
    subType: z.string().max(100).optional().openapi({
      description: "Sub-type within practice area",
      example: "freehold_purchase",
    }),
    billingType: BillingTypeSchema.default("hourly"),

    hourlyRate: z.string().optional(),
    fixedFee: z.string().optional(),
    estimatedValue: z.string().optional(),

    keyDeadline: z.string().datetime().optional(),
    notes: z.string().optional(),
  })
  .openapi("CreateMatterRequest");

/**
 * Update matter request body.
 */
export const UpdateMatterSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().nullable().optional(),

    feeEarnerId: UuidSchema.nullable().optional(),
    supervisorId: UuidSchema.nullable().optional(),

    status: MatterStatusSchema.optional(),
    subType: z.string().max(100).nullable().optional(),
    billingType: BillingTypeSchema.optional(),

    hourlyRate: z.string().nullable().optional(),
    fixedFee: z.string().nullable().optional(),
    estimatedValue: z.string().nullable().optional(),

    keyDeadline: z.string().datetime().nullable().optional(),
    notes: z.string().nullable().optional(),

    riskScore: z.number().int().min(0).max(100).nullable().optional(),
    riskFactors: z.array(z.any()).nullable().optional(),
    riskAssessedAt: z.string().datetime().nullable().optional(),
  })
  .openapi("UpdateMatterRequest");

/**
 * Matter list response.
 */
export const MatterListSchema = z
  .object({
    matters: z.array(MatterSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("MatterListResponse");

/**
 * Matter query parameters.
 */
export const MatterQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: MatterStatusSchema.optional(),
    practiceArea: PracticeAreaSchema.optional(),
    clientId: UuidSchema.optional(),
    feeEarnerId: UuidSchema.optional(),
    search: z.string().optional().openapi({
      description: "Search by reference or title",
    }),
  })
  .openapi("MatterQuery");

// Type exports
export type Matter = z.infer<typeof MatterSchema>;
export type CreateMatter = z.infer<typeof CreateMatterSchema>;
export type UpdateMatter = z.infer<typeof UpdateMatterSchema>;
export type MatterQuery = z.infer<typeof MatterQuerySchema>;
