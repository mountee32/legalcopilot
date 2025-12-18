/**
 * Team & Resource Management API Schemas
 *
 * Validation schemas for leave requests, availability, and capacity endpoints.
 *
 * @see lib/db/schema/team.ts for database schema
 */

import { z, UuidSchema, DateSchema, DateTimeSchema, PaginationSchema } from "./common";

/**
 * Leave type enumeration.
 */
export const LeaveTypeSchema = z.enum(["annual", "sick", "parental", "unpaid", "other"]).openapi({
  example: "annual",
  description: "Type of leave being requested",
});

/**
 * Leave status enumeration.
 */
export const LeaveStatusSchema = z.enum(["pending", "approved", "rejected", "cancelled"]).openapi({
  example: "pending",
  description: "Leave request status",
});

/**
 * Day of week enumeration.
 */
export const DayOfWeekSchema = z
  .enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
  .openapi({
    example: "monday",
    description: "Day of the week",
  });

/**
 * Leave request entity.
 */
export const LeaveRequestSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    userId: UuidSchema,
    type: LeaveTypeSchema,
    startDate: DateSchema,
    endDate: DateSchema,
    daysCount: z.number().int().positive().openapi({
      example: 5,
      description: "Number of working days",
    }),
    reason: z.string().nullable(),
    status: LeaveStatusSchema,
    decidedBy: UuidSchema.nullable(),
    decidedAt: DateTimeSchema.nullable(),
    decisionReason: z.string().nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("LeaveRequest");

/**
 * Create leave request payload.
 */
export const CreateLeaveRequestSchema = z
  .object({
    type: LeaveTypeSchema,
    startDate: DateSchema,
    endDate: DateSchema,
    reason: z.string().optional(),
  })
  .openapi("CreateLeaveRequest");

/**
 * Leave request query parameters.
 */
export const LeaveRequestQuerySchema = PaginationSchema.extend({
  userId: UuidSchema.optional(),
  status: LeaveStatusSchema.optional(),
  type: LeaveTypeSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
}).openapi("LeaveRequestQuery");

/**
 * Leave request list response.
 */
export const LeaveRequestListSchema = z
  .object({
    leaveRequests: z.array(LeaveRequestSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("LeaveRequestListResponse");

/**
 * Approve/reject decision payload.
 */
export const LeaveDecisionSchema = z
  .object({
    decisionReason: z.string().optional(),
  })
  .openapi("LeaveDecision");

/**
 * Availability window entity.
 */
export const AvailabilityWindowSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    userId: UuidSchema,
    dayOfWeek: DayOfWeekSchema,
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .openapi({
        example: "09:00:00",
        description: "Start time in HH:MM:SS format",
      }),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .openapi({
        example: "17:30:00",
        description: "End time in HH:MM:SS format",
      }),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("AvailabilityWindow");

/**
 * Team member availability response.
 */
export const TeamMemberAvailabilitySchema = z
  .object({
    userId: UuidSchema,
    userName: z.string(),
    userEmail: z.string().email(),
    windows: z.array(AvailabilityWindowSchema),
    leaveRequests: z.array(LeaveRequestSchema),
  })
  .openapi("TeamMemberAvailability");

/**
 * Team availability response.
 */
export const TeamAvailabilitySchema = z
  .object({
    startDate: DateSchema,
    endDate: DateSchema,
    teamMembers: z.array(TeamMemberAvailabilitySchema),
  })
  .openapi("TeamAvailabilityResponse");

/**
 * Team member capacity summary.
 */
export const TeamMemberCapacitySchema = z
  .object({
    userId: UuidSchema,
    userName: z.string(),
    userEmail: z.string().email(),
    totalHoursAvailable: z.number().openapi({
      example: 160,
      description: "Total available hours in period",
    }),
    hoursScheduled: z.number().openapi({
      example: 120,
      description: "Hours with scheduled work",
    }),
    hoursRemaining: z.number().openapi({
      example: 40,
      description: "Remaining available hours",
    }),
    utilization: z.number().min(0).max(100).openapi({
      example: 75,
      description: "Utilization percentage",
    }),
    activeMatters: z.number().int().openapi({
      example: 5,
      description: "Number of active matters",
    }),
  })
  .openapi("TeamMemberCapacity");

/**
 * Team capacity response.
 */
export const TeamCapacitySchema = z
  .object({
    startDate: DateSchema,
    endDate: DateSchema,
    teamMembers: z.array(TeamMemberCapacitySchema),
    summary: z.object({
      totalCapacity: z.number(),
      totalScheduled: z.number(),
      totalRemaining: z.number(),
      averageUtilization: z.number().min(0).max(100),
    }),
  })
  .openapi("TeamCapacityResponse");

/**
 * Team member workload summary.
 */
export const TeamMemberWorkloadSchema = z
  .object({
    userId: UuidSchema,
    userName: z.string(),
    userEmail: z.string().email(),
    activeMatters: z.number().int().openapi({
      example: 5,
      description: "Number of active matters",
    }),
    upcomingDeadlines: z.number().int().openapi({
      example: 3,
      description: "Number of upcoming deadlines",
    }),
    pendingTasks: z.number().int().openapi({
      example: 12,
      description: "Number of pending tasks",
    }),
    hoursScheduled: z.number().openapi({
      example: 120,
      description: "Hours scheduled in period",
    }),
    workloadScore: z.number().min(0).max(100).openapi({
      example: 75,
      description: "Workload intensity score (0-100)",
    }),
  })
  .openapi("TeamMemberWorkload");

/**
 * Team workload response.
 */
export const TeamWorkloadSchema = z
  .object({
    startDate: DateSchema,
    endDate: DateSchema,
    teamMembers: z.array(TeamMemberWorkloadSchema),
    summary: z.object({
      totalActiveMatters: z.number().int(),
      totalUpcomingDeadlines: z.number().int(),
      totalPendingTasks: z.number().int(),
      averageWorkloadScore: z.number().min(0).max(100),
    }),
  })
  .openapi("TeamWorkloadResponse");

// Type exports
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;
export type CreateLeaveRequest = z.infer<typeof CreateLeaveRequestSchema>;
export type LeaveRequestQuery = z.infer<typeof LeaveRequestQuerySchema>;
export type LeaveDecision = z.infer<typeof LeaveDecisionSchema>;
export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;
export type TeamMemberAvailability = z.infer<typeof TeamMemberAvailabilitySchema>;
export type TeamAvailability = z.infer<typeof TeamAvailabilitySchema>;
export type TeamMemberCapacity = z.infer<typeof TeamMemberCapacitySchema>;
export type TeamCapacity = z.infer<typeof TeamCapacitySchema>;
export type TeamMemberWorkload = z.infer<typeof TeamMemberWorkloadSchema>;
export type TeamWorkload = z.infer<typeof TeamWorkloadSchema>;
