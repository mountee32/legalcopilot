/**
 * Compliance API Schemas
 *
 * Zod schemas for compliance and risk management API endpoints.
 * Used for request validation and OpenAPI generation.
 *
 * @see lib/db/schema/compliance.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema } from "./common";

/**
 * Risk severity levels.
 */
export const RiskSeveritySchema = z.enum(["low", "medium", "high", "critical"]).openapi({
  example: "medium",
  description: "Risk severity classification",
});

/**
 * Compliance rule types.
 */
export const RuleTypeSchema = z
  .enum(["deadline", "workload", "supervision", "conflict", "document", "billing", "custom"])
  .openapi({
    example: "deadline",
    description: "Type of compliance rule",
  });

/**
 * Alert status values.
 */
export const AlertStatusSchema = z
  .enum(["pending", "acknowledged", "resolved", "dismissed"])
  .openapi({
    example: "pending",
    description: "Current status of the alert",
  });

/**
 * Alert priority levels.
 */
export const AlertPrioritySchema = z.enum(["info", "warning", "urgent", "critical"]).openapi({
  example: "warning",
  description: "Priority level of the alert",
});

/**
 * Risk factor item.
 */
export const RiskFactorSchema = z
  .object({
    factor: z.string().openapi({
      example: "tight_deadline",
      description: "Risk factor identifier",
    }),
    weight: z.number().min(0).max(1).openapi({
      example: 0.4,
      description: "Weight of this factor (0-1)",
    }),
    evidence: z.string().optional().openapi({
      example: "Completion due in 3 days",
      description: "Evidence supporting this factor",
    }),
  })
  .openapi("RiskFactor");

/**
 * Risk evaluation entity for API responses.
 */
export const RiskEvaluationSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    matterId: UuidSchema,
    score: z.number().int().min(0).max(100).openapi({
      example: 65,
      description: "Overall risk score (0-100, higher = more risky)",
    }),
    severity: RiskSeveritySchema,
    factors: z.array(RiskFactorSchema),
    recommendations: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ["Schedule supervision meeting", "Review deadline feasibility"],
      }),
    aiModel: z.string().openapi({ example: "gpt-4" }),
    evaluatedAt: DateTimeSchema,
    evaluatedBy: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("RiskEvaluation");

/**
 * Compliance rule entity for API responses.
 */
export const ComplianceRuleSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    name: z.string().openapi({
      example: "Conveyancing Deadline Warning",
    }),
    description: z.string().nullable(),
    type: RuleTypeSchema,
    isActive: z.boolean(),
    condition: z.record(z.unknown()).openapi({
      example: {
        warningDays: 7,
        criticalDays: 2,
        practiceAreas: ["conveyancing"],
      },
    }),
    alertPriority: AlertPrioritySchema,
    alertTemplate: z.string().openapi({
      example: "Matter {matterReference} has {daysRemaining} days until deadline",
    }),
    checkInterval: z.number().int().nullable(),
    lastCheckedAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
    createdBy: UuidSchema.nullable(),
  })
  .openapi("ComplianceRule");

/**
 * Compliance alert entity for API responses.
 */
export const ComplianceAlertSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    ruleId: UuidSchema,
    matterId: UuidSchema.nullable(),
    userId: UuidSchema.nullable(),
    priority: AlertPrioritySchema,
    status: AlertStatusSchema,
    title: z.string().openapi({
      example: "Approaching deadline",
    }),
    message: z.string().openapi({
      example: "Matter SMI-2024-0042 has 2 days until completion deadline",
    }),
    context: z.record(z.unknown()).nullable(),
    triggeredAt: DateTimeSchema,
    acknowledgedAt: DateTimeSchema.nullable(),
    acknowledgedBy: UuidSchema.nullable(),
    resolvedAt: DateTimeSchema.nullable(),
    resolvedBy: UuidSchema.nullable(),
    resolutionNotes: z.string().nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("ComplianceAlert");

/**
 * Supervision metric entity for API responses.
 */
export const SupervisionMetricSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    userId: UuidSchema,
    supervisorId: UuidSchema.nullable(),
    periodStart: DateTimeSchema,
    periodEnd: DateTimeSchema,
    activeMatters: z.number().int(),
    mattersOpened: z.number().int(),
    mattersClosed: z.number().int(),
    billableHours: z.number().int(),
    revenue: z.number().int(),
    overdueTasks: z.number().int(),
    highRiskMatters: z.number().int(),
    additionalMetrics: z.record(z.unknown()).nullable(),
    calculatedAt: DateTimeSchema,
    createdAt: DateTimeSchema,
  })
  .openapi("SupervisionMetric");

/**
 * Risk score summary for dashboard.
 */
export const RiskScoreSummarySchema = z
  .object({
    matterId: UuidSchema,
    matterReference: z.string(),
    matterTitle: z.string(),
    score: z.number().int().min(0).max(100),
    severity: RiskSeveritySchema,
    evaluatedAt: DateTimeSchema,
    topFactors: z.array(RiskFactorSchema).max(3),
  })
  .openapi("RiskScoreSummary");

/**
 * Create risk evaluation request.
 */
export const CreateRiskEvaluationSchema = z
  .object({
    matterId: UuidSchema,
    aiModel: z.string().optional().default("gpt-4"),
  })
  .openapi("CreateRiskEvaluationRequest");

/**
 * Create compliance rule request.
 */
export const CreateComplianceRuleSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    type: RuleTypeSchema,
    isActive: z.boolean().default(true),
    condition: z.record(z.unknown()),
    alertPriority: AlertPrioritySchema.default("warning"),
    alertTemplate: z.string().min(1),
    checkInterval: z.number().int().min(60).optional(), // At least 1 minute
  })
  .openapi("CreateComplianceRuleRequest");

/**
 * Update compliance rule request.
 */
export const UpdateComplianceRuleSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    condition: z.record(z.unknown()).optional(),
    alertPriority: AlertPrioritySchema.optional(),
    alertTemplate: z.string().min(1).optional(),
    checkInterval: z.number().int().min(60).nullable().optional(),
  })
  .openapi("UpdateComplianceRuleRequest");

/**
 * Update alert request.
 */
export const UpdateAlertSchema = z
  .object({
    status: AlertStatusSchema,
    resolutionNotes: z.string().optional(),
  })
  .openapi("UpdateAlertRequest");

/**
 * Risk scores list response.
 */
export const RiskScoresListSchema = z
  .object({
    riskScores: z.array(RiskScoreSummarySchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("RiskScoresListResponse");

/**
 * Compliance alerts list response.
 */
export const AlertsListSchema = z
  .object({
    alerts: z.array(ComplianceAlertSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("AlertsListResponse");

/**
 * Compliance rules list response.
 */
export const RulesListSchema = z
  .object({
    rules: z.array(ComplianceRuleSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("RulesListResponse");

/**
 * Query parameters for risk scores endpoint.
 */
export const RiskScoresQuerySchema = PaginationSchema.extend({
  severity: RiskSeveritySchema.optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  practiceArea: z.string().optional(),
}).openapi("RiskScoresQuery");

/**
 * Query parameters for alerts endpoint.
 */
export const AlertsQuerySchema = PaginationSchema.extend({
  status: AlertStatusSchema.optional(),
  priority: AlertPrioritySchema.optional(),
  matterId: UuidSchema.optional(),
  userId: UuidSchema.optional(),
  ruleId: UuidSchema.optional(),
}).openapi("AlertsQuery");

/**
 * Query parameters for rules endpoint.
 */
export const RulesQuerySchema = PaginationSchema.extend({
  type: RuleTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
}).openapi("RulesQuery");

// Type exports
export type RiskEvaluation = z.infer<typeof RiskEvaluationSchema>;
export type RiskFactor = z.infer<typeof RiskFactorSchema>;
export type ComplianceRule = z.infer<typeof ComplianceRuleSchema>;
export type ComplianceAlert = z.infer<typeof ComplianceAlertSchema>;
export type SupervisionMetric = z.infer<typeof SupervisionMetricSchema>;
export type RiskScoreSummary = z.infer<typeof RiskScoreSummarySchema>;
export type CreateRiskEvaluation = z.infer<typeof CreateRiskEvaluationSchema>;
export type CreateComplianceRule = z.infer<typeof CreateComplianceRuleSchema>;
export type UpdateComplianceRule = z.infer<typeof UpdateComplianceRuleSchema>;
export type UpdateAlert = z.infer<typeof UpdateAlertSchema>;
export type RiskScoresQuery = z.infer<typeof RiskScoresQuerySchema>;
export type AlertsQuery = z.infer<typeof AlertsQuerySchema>;
export type RulesQuery = z.infer<typeof RulesQuerySchema>;
