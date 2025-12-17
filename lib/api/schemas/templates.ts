/**
 * Template API Schemas
 *
 * @see lib/db/schema/templates.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

export const TemplateTypeSchema = z.enum(["document", "email"]).openapi("TemplateType");

export const TemplateSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema.nullable(),
    name: z.string(),
    type: TemplateTypeSchema,
    category: z.string().nullable(),
    content: z.string(),
    mergeFields: z.record(z.unknown()).nullable(),
    isActive: z.boolean(),
    parentId: UuidSchema.nullable(),
    version: z.number().int(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Template");

export const CreateTemplateSchema = z
  .object({
    name: z.string().min(1).max(200),
    type: TemplateTypeSchema,
    category: z.string().optional(),
    content: z.string().min(1),
    mergeFields: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("CreateTemplateRequest");

export const UpdateTemplateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    category: z.string().nullable().optional(),
    content: z.string().min(1).optional(),
    mergeFields: z.record(z.unknown()).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateTemplateRequest");

export const TemplateQuerySchema = PaginationSchema.extend({
  type: TemplateTypeSchema.optional(),
  includeSystem: z.coerce.boolean().default(true),
  activeOnly: z.coerce.boolean().default(true),
}).openapi("TemplateQuery");

export const TemplateListSchema = z
  .object({
    templates: z.array(TemplateSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TemplateListResponse");

export const PreviewTemplateSchema = z
  .object({
    data: z.record(z.unknown()),
  })
  .openapi("PreviewTemplateRequest");

export const TemplateRenderedSchema = z
  .object({
    content: z.string(),
    missing: z.array(z.string()).default([]),
  })
  .openapi("TemplateRendered");

export const PreviewTemplateResponseSchema = z
  .object({
    success: z.literal(true),
    rendered: TemplateRenderedSchema,
  })
  .openapi("PreviewTemplateResponse");

export const GenerateTemplateResponseSchema = z
  .object({
    success: z.literal(true),
    rendered: TemplateRenderedSchema,
  })
  .openapi("GenerateTemplateResponse");

export const ProposeTemplateSchema = z
  .object({
    action: z.enum(["template.create", "template.update"]),
    templateId: UuidSchema.optional(),
    draft: CreateTemplateSchema.partial().extend({
      type: TemplateTypeSchema.optional(),
      content: z.string().optional(),
    }),
  })
  .openapi("ProposeTemplateRequest");
