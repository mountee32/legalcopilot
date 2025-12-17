/**
 * Templates Integration Tests
 *
 * Tests template CRUD operations, generation, preview, and propose against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createTemplate,
  createDocumentTemplate,
  createEmailTemplate,
  createManyTemplates,
  createSystemTemplate,
} from "@tests/fixtures/factories/template";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Templates Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a document template with required fields", async () => {
      const template = await createDocumentTemplate(ctx.firmId, {
        name: "Client Letter Template",
        content: "Dear {{clientName}},\n\nThis is a test letter.\n\nYours faithfully,",
      });

      expect(template.id).toBeDefined();
      expect(template.firmId).toBe(ctx.firmId);
      expect(template.type).toBe("document");
      expect(template.name).toBe("Client Letter Template");
      expect(template.content).toContain("Dear {{clientName}}");
      expect(template.isActive).toBe(true);
      expect(template.version).toBe(1);
      expect(template.parentId).toBeNull();
    });

    it("creates an email template", async () => {
      const template = await createEmailTemplate(ctx.firmId, {
        name: "Welcome Email",
        content: "Hello {{clientName}},\n\nWelcome to our firm.",
      });

      expect(template.type).toBe("email");
      expect(template.name).toBe("Welcome Email");
      expect(template.content).toContain("Hello {{clientName}}");
    });

    it("creates template with merge fields", async () => {
      const mergeFields = {
        clientName: { type: "string", required: true },
        matterReference: { type: "string", required: true },
        dueDate: { type: "date", required: false },
      };

      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Template with Merge Fields",
        type: "document",
        content: "Client: {{clientName}}, Matter: {{matterReference}}, Due: {{dueDate}}",
        mergeFields,
      });

      expect(template.mergeFields).toEqual(mergeFields);
    });

    it("creates template with category", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Litigation Letter",
        type: "document",
        content: "Content here",
        category: "litigation",
      });

      expect(template.category).toBe("litigation");
    });

    it("persists template data to database", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Persist Test",
        type: "email",
        content: "Test content",
        category: "general",
      });

      const [dbTemplate] = await db.select().from(templates).where(eq(templates.id, template.id));

      expect(dbTemplate).toBeDefined();
      expect(dbTemplate.name).toBe("Persist Test");
      expect(dbTemplate.type).toBe("email");
      expect(dbTemplate.content).toBe("Test content");
      expect(dbTemplate.category).toBe("general");
    });
  });

  describe("Read", () => {
    it("retrieves template by ID", async () => {
      const created = await createTemplate({
        firmId: ctx.firmId,
        name: "Retrieve Test",
        type: "document",
        content: "Content to retrieve",
      });

      const [retrieved] = await db.select().from(templates).where(eq(templates.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe("Retrieve Test");
    });

    it("lists templates for a firm", async () => {
      await createTemplate({ firmId: ctx.firmId, name: "List1", type: "document", content: "A" });
      await createTemplate({ firmId: ctx.firmId, name: "List2", type: "email", content: "B" });
      await createTemplate({ firmId: ctx.firmId, name: "List3", type: "document", content: "C" });

      const firmTemplates = await db
        .select()
        .from(templates)
        .where(eq(templates.firmId, ctx.firmId));

      expect(firmTemplates.length).toBeGreaterThanOrEqual(3);
    });

    it("retrieves both firm and system templates", async () => {
      const firmTemplate = await createTemplate({
        firmId: ctx.firmId,
        name: "Firm Template",
        type: "document",
        content: "Firm content",
      });

      const systemTemplate = await createSystemTemplate({
        name: "System Template",
        type: "document",
        content: "System content",
      });

      // Query for firm templates including system templates
      const results = await db
        .select()
        .from(templates)
        .where(or(eq(templates.firmId, ctx.firmId), isNull(templates.firmId))!);

      const firmIds = results.map((t) => t.id);
      expect(firmIds).toContain(firmTemplate.id);
      expect(firmIds).toContain(systemTemplate.id);

      // Cleanup system template
      await db.delete(templates).where(eq(templates.id, systemTemplate.id));
    });
  });

  describe("Update (Versioning)", () => {
    it("creates new version when updating template", async () => {
      const original = await createTemplate({
        firmId: ctx.firmId,
        name: "Original Name",
        type: "document",
        content: "Original content",
      });

      expect(original.version).toBe(1);
      expect(original.parentId).toBeNull();

      // Simulate update by creating new version (like API does)
      const parentId = original.parentId ?? original.id;
      const nextVersion = original.version + 1;

      // Deactivate old version
      await db
        .update(templates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(templates.id, original.id));

      // Create new version
      const [updated] = await db
        .insert(templates)
        .values({
          firmId: ctx.firmId,
          name: "Updated Name",
          type: original.type,
          category: original.category,
          content: "Updated content",
          mergeFields: original.mergeFields,
          isActive: true,
          parentId,
          version: nextVersion,
          createdById: original.createdById,
          updatedAt: new Date(),
        })
        .returning();

      expect(updated.name).toBe("Updated Name");
      expect(updated.content).toBe("Updated content");
      expect(updated.version).toBe(2);
      expect(updated.parentId).toBe(original.id);
      expect(updated.isActive).toBe(true);

      // Verify old version is inactive
      const [oldVersion] = await db.select().from(templates).where(eq(templates.id, original.id));
      expect(oldVersion.isActive).toBe(false);
    });

    it("maintains version history", async () => {
      const v1 = await createTemplate({
        firmId: ctx.firmId,
        name: "Version 1",
        type: "document",
        content: "Content v1",
      });

      // Create v2
      await db
        .update(templates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(templates.id, v1.id));

      const [v2] = await db
        .insert(templates)
        .values({
          firmId: ctx.firmId,
          name: "Version 2",
          type: v1.type,
          category: v1.category,
          content: "Content v2",
          mergeFields: v1.mergeFields,
          isActive: true,
          parentId: v1.id,
          version: 2,
          createdById: v1.createdById,
          updatedAt: new Date(),
        })
        .returning();

      // Create v3
      await db
        .update(templates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(templates.id, v2.id));

      const [v3] = await db
        .insert(templates)
        .values({
          firmId: ctx.firmId,
          name: "Version 3",
          type: v1.type,
          category: v1.category,
          content: "Content v3",
          mergeFields: v1.mergeFields,
          isActive: true,
          parentId: v1.id,
          version: 3,
          createdById: v1.createdById,
          updatedAt: new Date(),
        })
        .returning();

      // All versions should exist
      const versions = await db
        .select()
        .from(templates)
        .where(or(eq(templates.id, v1.id), eq(templates.parentId, v1.id))!);

      expect(versions.length).toBe(3);
      expect(versions.some((v) => v.version === 1)).toBe(true);
      expect(versions.some((v) => v.version === 2)).toBe(true);
      expect(versions.some((v) => v.version === 3)).toBe(true);

      // Only v3 should be active
      const activeVersions = versions.filter((v) => v.isActive);
      expect(activeVersions.length).toBe(1);
      expect(activeVersions[0].version).toBe(3);
    });
  });

  describe("Delete (Soft)", () => {
    it("deactivates template by setting isActive to false", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "To Deactivate",
        type: "document",
        content: "Content",
        isActive: true,
      });

      await db
        .update(templates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(templates.id, template.id));

      const [deactivated] = await db.select().from(templates).where(eq(templates.id, template.id));

      expect(deactivated.isActive).toBe(false);
    });
  });
});

describe("Templates Integration - Filtering", () => {
  const ctx = setupIntegrationSuite();

  it("filters by type", async () => {
    await createDocumentTemplate(ctx.firmId, { name: "Doc1" });
    await createDocumentTemplate(ctx.firmId, { name: "Doc2" });
    await createEmailTemplate(ctx.firmId, { name: "Email1" });

    const documentTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.firmId, ctx.firmId), eq(templates.type, "document")));

    const emailTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.firmId, ctx.firmId), eq(templates.type, "email")));

    expect(documentTemplates.length).toBeGreaterThanOrEqual(2);
    expect(emailTemplates.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by category", async () => {
    await createTemplate({
      firmId: ctx.firmId,
      name: "Lit Template",
      type: "document",
      content: "Content",
      category: "litigation",
    });

    await createTemplate({
      firmId: ctx.firmId,
      name: "Conveyancing Template",
      type: "document",
      content: "Content",
      category: "conveyancing",
    });

    const litigationTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.firmId, ctx.firmId), eq(templates.category, "litigation")));

    expect(litigationTemplates.length).toBeGreaterThanOrEqual(1);
    expect(litigationTemplates[0].category).toBe("litigation");
  });

  it("filters by active status", async () => {
    await createTemplate({
      firmId: ctx.firmId,
      name: "Active Template",
      type: "document",
      content: "Content",
      isActive: true,
    });

    const inactive = await createTemplate({
      firmId: ctx.firmId,
      name: "Inactive Template",
      type: "document",
      content: "Content",
      isActive: true,
    });

    // Deactivate one
    await db
      .update(templates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(templates.id, inactive.id));

    const activeTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.firmId, ctx.firmId), eq(templates.isActive, true)));

    const inactiveTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.firmId, ctx.firmId), eq(templates.isActive, false)));

    expect(activeTemplates.length).toBeGreaterThanOrEqual(1);
    expect(inactiveTemplates.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Templates Integration - Pagination", () => {
  const ctx = setupIntegrationSuite();

  it("paginates results correctly", async () => {
    // Create enough templates for pagination
    await createManyTemplates(ctx.firmId, 15);

    // First page
    const page1 = await db
      .select()
      .from(templates)
      .where(eq(templates.firmId, ctx.firmId))
      .limit(5)
      .offset(0);

    // Second page
    const page2 = await db
      .select()
      .from(templates)
      .where(eq(templates.firmId, ctx.firmId))
      .limit(5)
      .offset(5);

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);

    // Pages should have different templates
    const page1Ids = page1.map((t) => t.id);
    const page2Ids = page2.map((t) => t.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
});

describe("Templates Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates templates between firms", async () => {
    // Create template in first firm
    const template1 = await createTemplate({
      firmId: ctx.firmId,
      name: "Firm 1 Template",
      type: "document",
      content: "Firm 1 content",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create template in second firm
    const template2 = await createTemplate({
      firmId: firm2.id,
      name: "Firm 2 Template",
      type: "document",
      content: "Firm 2 content",
    });

    // Query templates for first firm
    const firm1Templates = await db
      .select()
      .from(templates)
      .where(eq(templates.firmId, ctx.firmId));

    // Query templates for second firm
    const firm2Templates = await db.select().from(templates).where(eq(templates.firmId, firm2.id));

    // Each firm should only see their own templates
    expect(firm1Templates.some((t) => t.id === template1.id)).toBe(true);
    expect(firm1Templates.some((t) => t.id === template2.id)).toBe(false);

    expect(firm2Templates.some((t) => t.id === template2.id)).toBe(true);
    expect(firm2Templates.some((t) => t.id === template1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(templates).where(eq(templates.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing templates from another firm by ID", async () => {
    // Create template in first firm
    const template1 = await createTemplate({
      firmId: ctx.firmId,
      name: "Isolated Template",
      type: "document",
      content: "Isolated content",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query template1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, template1.id), eq(templates.firmId, firm2.id)));

    // Should not find the template
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("system templates accessible to all firms", async () => {
    // Create system template
    const systemTemplate = await createSystemTemplate({
      name: "System Template for All",
      type: "document",
      content: "System content",
    });

    // First firm can access it
    const firm1Result = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.id, systemTemplate.id),
          or(eq(templates.firmId, ctx.firmId), isNull(templates.firmId))!
        )
      );

    expect(firm1Result.length).toBe(1);

    // Create second firm
    const firm2 = await createFirm({ name: "Second Firm System Test" });

    // Second firm can also access it
    const firm2Result = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.id, systemTemplate.id),
          or(eq(templates.firmId, firm2.id), isNull(templates.firmId))!
        )
      );

    expect(firm2Result.length).toBe(1);

    // Cleanup
    await db.delete(templates).where(eq(templates.id, systemTemplate.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Templates Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("enforces required fields", async () => {
    await expect(
      db.insert(templates).values({
        firmId: ctx.firmId,
        // Missing name - should fail
        type: "document",
        content: "Content",
        isActive: true,
        version: 1,
        parentId: null,
        createdById: null,
        updatedAt: new Date(),
      } as any)
    ).rejects.toThrow();
  });

  it("enforces type enum", async () => {
    await expect(
      db.insert(templates).values({
        firmId: ctx.firmId,
        name: "Invalid Type",
        type: "invalid_type" as any, // Invalid type
        content: "Content",
        isActive: true,
        version: 1,
        parentId: null,
        createdById: null,
        updatedAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("allows null category", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "No Category",
      type: "document",
      content: "Content",
      category: null,
    });

    expect(template.category).toBeNull();
  });

  it("stores merge fields as JSON", async () => {
    const mergeFields = {
      field1: { type: "string", required: true },
      field2: { type: "number", required: false },
      nested: { field3: { type: "date" } },
    };

    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "JSON Test",
      type: "document",
      content: "Content",
      mergeFields,
    });

    const [retrieved] = await db.select().from(templates).where(eq(templates.id, template.id));

    expect(retrieved.mergeFields).toEqual(mergeFields);
  });
});
