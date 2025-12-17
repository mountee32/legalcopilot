/**
 * Common API Schemas
 *
 * Shared schemas used across multiple endpoints.
 * Extended with OpenAPI metadata for documentation generation.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Standard UUID format used for all entity IDs.
 */
export const UuidSchema = z.string().uuid().openapi({
  example: "123e4567-e89b-12d3-a456-426614174000",
  description: "Unique identifier in UUID v4 format",
});

/**
 * ISO 8601 date-time string.
 */
export const DateTimeSchema = z.string().datetime().openapi({
  example: "2024-12-17T10:30:00Z",
  description: "ISO 8601 date-time string",
});

/**
 * ISO 8601 date string (no time).
 */
export const DateSchema = z.string().date().openapi({
  example: "2024-12-17",
  description: "ISO 8601 date string",
});

/**
 * UK postcode format.
 */
export const PostcodeSchema = z
  .string()
  .regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i)
  .openapi({
    example: "SW1A 1AA",
    description: "UK postcode",
  });

/**
 * UK phone number.
 */
export const PhoneSchema = z.string().openapi({
  example: "+44 20 7946 0958",
  description: "Phone number in E.164 or UK format",
});

/**
 * Email address.
 */
export const EmailSchema = z.string().email().openapi({
  example: "john.smith@example.com",
  description: "Email address",
});

/**
 * Money amount (decimal with 2 places).
 */
export const MoneySchema = z
  .string()
  .regex(/^\d+\.\d{2}$/)
  .openapi({
    example: "1250.00",
    description: "Monetary amount with 2 decimal places",
  });

/**
 * Standard pagination parameters.
 */
export const PaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({
      example: 1,
      description: "Page number (1-indexed)",
    }),
    limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
      example: 20,
      description: "Items per page (max 100)",
    }),
  })
  .openapi("Pagination");

/**
 * Standard pagination response metadata.
 */
export const PaginationMetaSchema = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  })
  .openapi("PaginationMeta");

/**
 * Standard error response.
 */
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: "Validation failed",
      description: "Error message",
    }),
    code: z.string().optional().openapi({
      example: "VALIDATION_ERROR",
      description: "Machine-readable error code",
    }),
    details: z.record(z.unknown()).optional().openapi({
      description: "Additional error details",
    }),
  })
  .openapi("ErrorResponse");

/**
 * Standard success response wrapper.
 */
export const SuccessResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string().optional(),
  })
  .openapi("SuccessResponse");

// Export extended Zod for use in other schema files
export { z };
