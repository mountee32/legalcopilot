/**
 * Reports API Schemas
 *
 * Schemas for reporting and analytics endpoints.
 */

import { z, UuidSchema, DateSchema, MoneySchema } from "./common";
import { practiceAreaEnum, matterStatusEnum } from "@/lib/db/schema/matters";
import { leadStatusEnum } from "@/lib/db/schema/intake";

/**
 * Common query parameters for reports
 */
export const ReportQuerySchema = z
  .object({
    from: DateSchema.optional().openapi({
      description: "Start date for report period (ISO 8601)",
      example: "2024-01-01",
    }),
    to: DateSchema.optional().openapi({
      description: "End date for report period (ISO 8601)",
      example: "2024-12-31",
    }),
    practiceArea: z.enum(practiceAreaEnum.enumValues).optional().openapi({
      description: "Filter by practice area",
    }),
  })
  .openapi("ReportQuery");

/**
 * Dashboard KPIs response
 */
export const DashboardReportSchema = z
  .object({
    activeMatters: z.number().int().openapi({
      description: "Number of active matters",
      example: 42,
    }),
    totalRevenue: MoneySchema.openapi({
      description: "Total revenue for period",
      example: "125000.00",
    }),
    totalWip: MoneySchema.openapi({
      description: "Total work in progress (unbilled time)",
      example: "35000.00",
    }),
    pendingTasks: z.number().int().openapi({
      description: "Number of pending tasks",
      example: 18,
    }),
    overdueTasks: z.number().int().openapi({
      description: "Number of overdue tasks",
      example: 3,
    }),
    outstandingInvoices: z.number().int().openapi({
      description: "Number of unpaid invoices",
      example: 12,
    }),
    overdueDebt: MoneySchema.openapi({
      description: "Total value of overdue invoices",
      example: "15000.00",
    }),
  })
  .openapi("DashboardReport");

/**
 * Billing report response
 */
export const BillingReportSchema = z
  .object({
    wip: z
      .object({
        total: MoneySchema.openapi({
          description: "Total WIP value",
          example: "35000.00",
        }),
        draft: MoneySchema.openapi({
          description: "Draft time entries",
          example: "5000.00",
        }),
        submitted: MoneySchema.openapi({
          description: "Submitted time entries",
          example: "15000.00",
        }),
        approved: MoneySchema.openapi({
          description: "Approved time entries",
          example: "15000.00",
        }),
      })
      .openapi({
        description: "Work in progress breakdown",
      }),
    agedDebt: z
      .object({
        current: MoneySchema.openapi({
          description: "0-30 days",
          example: "10000.00",
        }),
        days31to60: MoneySchema.openapi({
          description: "31-60 days",
          example: "5000.00",
        }),
        days61to90: MoneySchema.openapi({
          description: "61-90 days",
          example: "3000.00",
        }),
        days90plus: MoneySchema.openapi({
          description: "90+ days",
          example: "2000.00",
        }),
        total: MoneySchema.openapi({
          description: "Total outstanding",
          example: "20000.00",
        }),
      })
      .openapi({
        description: "Aged debt analysis",
      }),
    revenue: z
      .object({
        total: MoneySchema.openapi({
          description: "Total revenue for period",
          example: "125000.00",
        }),
        paid: MoneySchema.openapi({
          description: "Revenue from paid invoices",
          example: "100000.00",
        }),
        outstanding: MoneySchema.openapi({
          description: "Revenue from unpaid invoices",
          example: "25000.00",
        }),
      })
      .openapi({
        description: "Revenue breakdown",
      }),
  })
  .openapi("BillingReport");

/**
 * Funnel report response
 */
export const FunnelReportSchema = z
  .object({
    byStatus: z.array(
      z.object({
        status: z.enum(leadStatusEnum.enumValues).openapi({
          description: "Lead status",
        }),
        count: z.number().int().openapi({
          description: "Number of leads",
          example: 15,
        }),
        percentage: z.number().openapi({
          description: "Percentage of total leads",
          example: 25.5,
        }),
      })
    ),
    conversionRate: z.number().openapi({
      description: "Overall conversion rate (won / total)",
      example: 0.35,
    }),
    avgTimeToConvert: z.number().openapi({
      description: "Average days from new to won",
      example: 14.5,
    }),
    totalLeads: z.number().int().openapi({
      description: "Total leads in period",
      example: 100,
    }),
    wonLeads: z.number().int().openapi({
      description: "Successfully converted leads",
      example: 35,
    }),
    lostLeads: z.number().int().openapi({
      description: "Lost leads",
      example: 20,
    }),
  })
  .openapi("FunnelReport");

/**
 * Productivity report query
 */
export const ProductivityQuerySchema = ReportQuerySchema.extend({
  feeEarnerId: UuidSchema.optional().openapi({
    description: "Filter by specific fee earner",
  }),
}).openapi("ProductivityQuery");

/**
 * Productivity report response
 */
export const ProductivityReportSchema = z
  .object({
    feeEarners: z.array(
      z.object({
        feeEarnerId: UuidSchema,
        feeEarnerName: z.string().openapi({
          description: "Fee earner name",
          example: "Jane Smith",
        }),
        totalHours: z.number().openapi({
          description: "Total hours logged",
          example: 160.5,
        }),
        billableHours: z.number().openapi({
          description: "Billable hours",
          example: 145.0,
        }),
        nonBillableHours: z.number().openapi({
          description: "Non-billable hours",
          example: 15.5,
        }),
        utilisation: z.number().openapi({
          description: "Utilisation rate (billable / total)",
          example: 0.903,
        }),
        revenue: MoneySchema.openapi({
          description: "Revenue generated",
          example: "25000.00",
        }),
        activeMatters: z.number().int().openapi({
          description: "Number of active matters",
          example: 12,
        }),
      })
    ),
    summary: z.object({
      totalHours: z.number(),
      totalBillableHours: z.number(),
      avgUtilisation: z.number(),
      totalRevenue: MoneySchema,
    }),
  })
  .openapi("ProductivityReport");

/**
 * Matter summary report response
 */
export const MatterSummaryReportSchema = z
  .object({
    byStatus: z.array(
      z.object({
        status: z.enum(matterStatusEnum.enumValues),
        count: z.number().int(),
        percentage: z.number(),
      })
    ),
    byPracticeArea: z.array(
      z.object({
        practiceArea: z.enum(practiceAreaEnum.enumValues),
        count: z.number().int(),
        percentage: z.number(),
        revenue: MoneySchema,
      })
    ),
    total: z.number().int().openapi({
      description: "Total matters",
      example: 150,
    }),
  })
  .openapi("MatterSummaryReport");
