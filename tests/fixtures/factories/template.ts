/**
 * Template factory for creating test templates
 */
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type TemplateType = "document" | "email";

export interface TemplateFactoryOptions {
  id?: string;
  firmId: string;
  name?: string;
  type?: TemplateType;
  category?: string | null;
  content?: string;
  mergeFields?: Record<string, unknown> | null;
  isActive?: boolean;
  parentId?: string | null;
  version?: number;
  createdById?: string | null;
}

export interface TestTemplate {
  id: string;
  firmId: string;
  name: string;
  type: string;
  category: string | null;
  content: string;
  mergeFields: Record<string, unknown> | null;
  isActive: boolean;
  parentId: string | null;
  version: number;
  createdById: string | null;
}

/**
 * Create a test template in the database
 */
export async function createTemplate(options: TemplateFactoryOptions): Promise<TestTemplate> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const templateData = {
    id,
    firmId: options.firmId,
    name: options.name || `Test Template ${suffix}`,
    type: options.type || "document",
    category: options.category ?? null,
    content: options.content || `This is a test template content.\n\n{{clientName}}`,
    mergeFields: options.mergeFields ?? null,
    isActive: options.isActive ?? true,
    parentId: options.parentId ?? null,
    version: options.version ?? 1,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [template] = await db.insert(templates).values(templateData).returning();

  return {
    id: template.id,
    firmId: template.firmId!,
    name: template.name,
    type: template.type,
    category: template.category,
    content: template.content,
    mergeFields: template.mergeFields as Record<string, unknown> | null,
    isActive: template.isActive,
    parentId: template.parentId,
    version: template.version,
    createdById: template.createdById,
  };
}

/**
 * Create a document template
 */
export async function createDocumentTemplate(
  firmId: string,
  options: Partial<TemplateFactoryOptions> = {}
): Promise<TestTemplate> {
  return createTemplate({
    ...options,
    firmId,
    type: "document",
    name: options.name || `Document Template ${Date.now().toString(36)}`,
    content:
      options.content ||
      `Dear {{clientName}},\n\nRe: {{matterReference}}\n\nThis is a document template.\n\nYours faithfully,\n{{feeEarnerName}}`,
  });
}

/**
 * Create an email template
 */
export async function createEmailTemplate(
  firmId: string,
  options: Partial<TemplateFactoryOptions> = {}
): Promise<TestTemplate> {
  return createTemplate({
    ...options,
    firmId,
    type: "email",
    name: options.name || `Email Template ${Date.now().toString(36)}`,
    content:
      options.content ||
      `Hello {{clientName}},\n\nThis is an email template regarding {{matterReference}}.\n\nBest regards,\n{{feeEarnerName}}`,
  });
}

/**
 * Create multiple templates
 */
export async function createManyTemplates(
  firmId: string,
  count: number,
  options: Partial<TemplateFactoryOptions> = {}
): Promise<TestTemplate[]> {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      createTemplate({
        ...options,
        firmId,
        name: options.name || `Test Template ${i + 1} ${Date.now().toString(36)}`,
      })
    );
  }
  return Promise.all(promises);
}

/**
 * Create a system template (firmId = null)
 */
export async function createSystemTemplate(
  options: Partial<Omit<TemplateFactoryOptions, "firmId">> = {}
): Promise<TestTemplate> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const templateData = {
    id,
    firmId: null,
    name: options.name || `System Template ${suffix}`,
    type: options.type || "document",
    category: options.category ?? "system",
    content: options.content || `This is a system template.\n\n{{placeholder}}`,
    mergeFields: options.mergeFields ?? null,
    isActive: options.isActive ?? true,
    parentId: options.parentId ?? null,
    version: options.version ?? 1,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [template] = await db.insert(templates).values(templateData).returning();

  return {
    id: template.id,
    firmId: template.firmId!,
    name: template.name,
    type: template.type,
    category: template.category,
    content: template.content,
    mergeFields: template.mergeFields as Record<string, unknown> | null,
    isActive: template.isActive,
    parentId: template.parentId,
    version: template.version,
    createdById: template.createdById,
  };
}
