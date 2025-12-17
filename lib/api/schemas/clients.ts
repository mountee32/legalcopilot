/**
 * Client API Schemas
 *
 * Zod schemas for client-related API endpoints.
 * Used for request validation and OpenAPI generation.
 *
 * @see lib/db/schema/clients.ts for database schema
 */

import { z, UuidSchema, EmailSchema, PhoneSchema, PostcodeSchema, DateTimeSchema } from "./common";

/**
 * Client type values.
 */
export const ClientTypeSchema = z
  .enum(["individual", "company", "trust", "estate", "charity", "government"])
  .openapi({
    example: "individual",
    description: "Type of client entity",
  });

/**
 * Client status values.
 */
export const ClientStatusSchema = z.enum(["prospect", "active", "dormant", "archived"]).openapi({
  example: "active",
  description: "Current status in client lifecycle",
});

/**
 * Client source values.
 */
export const ClientSourceSchema = z
  .enum([
    "website",
    "referral",
    "walk_in",
    "phone",
    "email",
    "lead_conversion",
    "existing_client",
    "partner_firm",
    "marketing",
    "social_media",
    "other",
  ])
  .openapi({
    example: "website",
    description: "How the client was acquired (for marketing attribution)",
  });

/**
 * Client entity for API responses.
 */
export const ClientSchema = z
  .object({
    id: UuidSchema,
    reference: z.string().openapi({ example: "CLI-2024-0042" }),
    type: ClientTypeSchema,
    status: ClientStatusSchema,

    // Acquisition tracking
    source: ClientSourceSchema.nullable(),
    sourceId: UuidSchema.nullable().openapi({
      description: "Link to source record (e.g., lead ID if converted from lead)",
    }),

    // Individual fields
    title: z.string().nullable().openapi({ example: "Mr" }),
    firstName: z.string().nullable().openapi({ example: "John" }),
    lastName: z.string().nullable().openapi({ example: "Smith" }),

    // Company fields
    companyName: z.string().nullable().openapi({ example: "Acme Ltd" }),
    companyNumber: z.string().nullable().openapi({ example: "12345678" }),

    // Contact
    email: EmailSchema.nullable(),
    phone: PhoneSchema.nullable(),
    mobile: PhoneSchema.nullable(),

    // Address
    addressLine1: z.string().nullable(),
    addressLine2: z.string().nullable(),
    city: z.string().nullable().openapi({ example: "London" }),
    county: z.string().nullable().openapi({ example: "Greater London" }),
    postcode: PostcodeSchema.nullable(),
    country: z.string().nullable().openapi({ example: "United Kingdom" }),

    // KYC
    idVerified: z.boolean(),
    idVerifiedAt: DateTimeSchema.nullable(),
    sofVerified: z.boolean(),
    sofVerifiedAt: DateTimeSchema.nullable(),

    notes: z.string().nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Client");

const ClientInputSchema = z.object({
  type: ClientTypeSchema.default("individual"),

  // Acquisition tracking
  source: ClientSourceSchema.optional(),
  sourceId: UuidSchema.optional(),

  // Individual fields (required if type is individual)
  title: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),

  // Company fields (required if type is company)
  companyName: z.string().optional(),
  companyNumber: z.string().optional(),

  // Contact (at least email required)
  email: EmailSchema,
  phone: z.string().optional(),
  mobile: z.string().optional(),

  // Address (optional)
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default("United Kingdom"),

  notes: z.string().optional(),
});

/**
 * Create client request body.
 */
export const CreateClientSchema = z
  .object(ClientInputSchema.shape)
  .refine(
    (data) => {
      if (data.type === "individual") {
        return data.firstName && data.lastName;
      }
      if (data.type === "company") {
        return data.companyName;
      }
      return true;
    },
    {
      message:
        "Individual clients require firstName and lastName. Company clients require companyName.",
    }
  )
  .openapi("CreateClientRequest");

/**
 * Update client request body.
 */
export const UpdateClientSchema = ClientInputSchema.partial()
  .omit({ type: true }) // Can't change type after creation
  .openapi("UpdateClientRequest");

/**
 * Client list response.
 */
export const ClientListSchema = z
  .object({
    clients: z.array(ClientSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("ClientListResponse");

/**
 * Client query parameters.
 */
export const ClientQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: ClientStatusSchema.optional(),
    type: ClientTypeSchema.optional(),
    search: z.string().optional().openapi({
      description: "Search by name, company name, or reference",
    }),
  })
  .openapi("ClientQuery");

// Type exports for TypeScript use
export type Client = z.infer<typeof ClientSchema>;
export type CreateClient = z.infer<typeof CreateClientSchema>;
export type UpdateClient = z.infer<typeof UpdateClientSchema>;
export type ClientQuery = z.infer<typeof ClientQuerySchema>;
