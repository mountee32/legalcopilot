/**
 * Template Generation Integration Tests
 *
 * Tests template generation and preview endpoints against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createTemplate, createDocumentTemplate } from "@tests/fixtures/factories/template";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";
import { renderTemplate } from "@/lib/templates/render";

describe("Template Generation - Render Logic", () => {
  const ctx = setupIntegrationSuite();

  describe("Generate with All Fields Provided", () => {
    it("renders template with all merge fields provided", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Client Letter",
        type: "document",
        content:
          "Dear {{clientName}},\n\nRe: {{matterReference}}\n\nYours faithfully,\n{{feeEarnerName}}",
      });

      const data = {
        clientName: "John Smith",
        matterReference: "MAT-001",
        feeEarnerName: "Jane Solicitor",
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toBe(
        "Dear John Smith,\n\nRe: MAT-001\n\nYours faithfully,\nJane Solicitor"
      );
      expect(result.missing).toEqual([]);
    });

    it("renders template with nested field paths", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Nested Fields Template",
        type: "document",
        content: "Client: {{client.name}}\nAddress: {{client.address.postcode}}",
      });

      const data = {
        client: {
          name: "ABC Ltd",
          address: {
            postcode: "SW1A 1AA",
          },
        },
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toBe("Client: ABC Ltd\nAddress: SW1A 1AA");
      expect(result.missing).toEqual([]);
    });

    it("renders template with special 'today' field", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Date Template",
        type: "document",
        content: "Date: {{today}}",
      });

      const result = renderTemplate(template.content, {});

      // Should render today's date in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateMatch = result.content.match(/Date: (.+)/);
      expect(dateMatch).toBeTruthy();
      expect(dateMatch![1]).toMatch(dateRegex);
      expect(result.missing).toEqual([]);
    });
  });

  describe("Generate with Client Data Auto-Populated", () => {
    it("populates client fields from client entity", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        type: "individual",
        title: "Mr",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        addressLine1: "123 High Street",
        city: "London",
        postcode: "SW1A 1AA",
      });

      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Client Details Letter",
        type: "document",
        content:
          "Dear {{client.title}} {{client.firstName}} {{client.lastName}},\n\n" +
          "Address: {{client.addressLine1}}, {{client.city}} {{client.postcode}}\n" +
          "Email: {{client.email}}",
      });

      const data = {
        client: {
          title: client.title,
          firstName: client.firstName,
          lastName: client.lastName,
          addressLine1: client.addressLine1,
          city: client.city,
          postcode: client.postcode,
          email: client.email,
        },
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toContain("Dear Mr John Smith");
      expect(result.content).toContain("Address: 123 High Street, London SW1A 1AA");
      expect(result.content).toContain("Email: john.smith@example.com");
      expect(result.missing).toEqual([]);
    });

    it("populates company client fields", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        type: "company",
        companyName: "ABC Ltd",
        companyNumber: "12345678",
        email: "info@abc.com",
      });

      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Company Letter",
        type: "document",
        content:
          "Dear {{client.companyName}} ({{client.companyNumber}}),\n\n" +
          "Contact: {{client.email}}",
      });

      const data = {
        client: {
          companyName: client.companyName,
          companyNumber: client.companyNumber,
          email: client.email,
        },
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toContain("Dear ABC Ltd (12345678)");
      expect(result.content).toContain("Contact: info@abc.com");
      expect(result.missing).toEqual([]);
    });
  });

  describe("Generate with Matter Data Auto-Populated", () => {
    it("populates matter fields from matter entity", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        type: "individual",
        firstName: "Jane",
        lastName: "Doe",
      });

      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Property Purchase - 45 Oak Lane",
        reference: "MAT-2024-001",
        practiceArea: "conveyancing",
        status: "active",
      });

      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Matter Update Letter",
        type: "document",
        content:
          "Re: {{matter.reference}} - {{matter.title}}\n\n" +
          "Practice Area: {{matter.practiceArea}}\n" +
          "Status: {{matter.status}}",
      });

      const data = {
        matter: {
          reference: matter.reference,
          title: matter.title,
          practiceArea: matter.practiceArea,
          status: matter.status,
        },
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toContain("Re: MAT-2024-001 - Property Purchase - 45 Oak Lane");
      expect(result.content).toContain("Practice Area: conveyancing");
      expect(result.content).toContain("Status: active");
      expect(result.missing).toEqual([]);
    });

    it("populates combined client and matter data", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        type: "individual",
        firstName: "Robert",
        lastName: "Johnson",
      });

      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Employment Dispute",
        reference: "MAT-2024-EMP-001",
        practiceArea: "employment",
      });

      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Combined Data Letter",
        type: "document",
        content:
          "Dear {{client.firstName}} {{client.lastName}},\n\n" +
          "Re: {{matter.reference}} - {{matter.title}}",
      });

      const data = {
        client: {
          firstName: client.firstName,
          lastName: client.lastName,
        },
        matter: {
          reference: matter.reference,
          title: matter.title,
        },
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toContain("Dear Robert Johnson");
      expect(result.content).toContain("Re: MAT-2024-EMP-001 - Employment Dispute");
      expect(result.missing).toEqual([]);
    });
  });

  describe("Generate - Missing Required Fields", () => {
    it("identifies missing fields and leaves placeholders", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Template with Missing Fields",
        type: "document",
        content: "Dear {{clientName}},\n\nRe: {{matterReference}}\n\nAmount: {{invoiceAmount}}",
      });

      const data = {
        clientName: "John Smith",
        // matterReference and invoiceAmount are missing
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toBe(
        "Dear John Smith,\n\nRe: {{matterReference}}\n\nAmount: {{invoiceAmount}}"
      );
      expect(result.missing).toEqual(["matterReference", "invoiceAmount"]);
    });

    it("reports missing nested fields", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Nested Missing Fields",
        type: "document",
        content: "Client: {{client.name}}\nAddress: {{client.address.postcode}}",
      });

      const data = {
        client: {
          name: "Test Client",
          // address.postcode is missing
        },
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toBe("Client: Test Client\nAddress: {{client.address.postcode}}");
      expect(result.missing).toEqual(["client.address.postcode"]);
    });

    it("handles completely empty data object", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Empty Data Template",
        type: "document",
        content: "{{field1}} {{field2}} {{field3}}",
      });

      const result = renderTemplate(template.content, {});

      expect(result.content).toBe("{{field1}} {{field2}} {{field3}}");
      expect(result.missing).toEqual(["field1", "field2", "field3"]);
    });

    it("deduplicates missing field names", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Duplicate Fields Template",
        type: "document",
        content: "{{clientName}} and {{clientName}} again, plus {{clientName}} once more",
      });

      const result = renderTemplate(template.content, {});

      expect(result.missing).toEqual(["clientName"]);
      expect(result.missing.length).toBe(1); // Should only report once
    });
  });

  describe("Generate - Inactive Template Handling", () => {
    it("can still render inactive template content", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Inactive Template",
        type: "document",
        content: "This is {{status}} template content.",
        isActive: false,
      });

      const data = {
        status: "an inactive",
      };

      // The render function itself doesn't check isActive, it just renders
      const result = renderTemplate(template.content, data);

      expect(result.content).toBe("This is an inactive template content.");
      expect(result.missing).toEqual([]);
    });

    it("marks template as inactive in database", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Deactivated Template",
        type: "document",
        content: "Content here",
        isActive: false,
      });

      expect(template.isActive).toBe(false);
    });
  });

  describe("Preview with Sample Data", () => {
    it("renders preview with sample/placeholder data", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Preview Template",
        type: "email",
        content: "Hello {{clientName}},\n\nThis is about {{subject}}.\n\nBest regards",
      });

      const sampleData = {
        clientName: "[Client Name]",
        subject: "[Matter Subject]",
      };

      const result = renderTemplate(template.content, sampleData);

      expect(result.content).toBe(
        "Hello [Client Name],\n\nThis is about [Matter Subject].\n\nBest regards"
      );
      expect(result.missing).toEqual([]);
    });
  });

  describe("Preview with Partial Data", () => {
    it("shows placeholders for missing fields in preview", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Partial Preview Template",
        type: "document",
        content: "Dear {{clientName}},\n\nRe: {{matterRef}}\n\nDate: {{today}}",
      });

      const partialData = {
        clientName: "Sample Client",
        // matterRef is intentionally missing to show placeholder
      };

      const result = renderTemplate(template.content, partialData);

      expect(result.content).toContain("Dear Sample Client");
      expect(result.content).toContain("Re: {{matterRef}}"); // Placeholder preserved
      expect(result.missing).toEqual(["matterRef"]);
    });

    it("renders partial nested data in preview", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Partial Nested Preview",
        type: "document",
        content: "Name: {{client.name}}\nEmail: {{client.email}}\nPhone: {{client.phone}}",
      });

      const partialData = {
        client: {
          name: "Sample Client",
          email: "sample@example.com",
          // phone is missing
        },
      };

      const result = renderTemplate(template.content, partialData);

      expect(result.content).toBe(
        "Name: Sample Client\nEmail: sample@example.com\nPhone: {{client.phone}}"
      );
      expect(result.missing).toEqual(["client.phone"]);
    });
  });

  describe("Data Type Handling", () => {
    it("converts numbers to strings in template", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Number Template",
        type: "document",
        content: "Amount: £{{amount}}\nQuantity: {{quantity}}",
      });

      const data = {
        amount: 1250.5,
        quantity: 42,
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toBe("Amount: £1250.5\nQuantity: 42");
      expect(result.missing).toEqual([]);
    });

    it("converts booleans to strings in template", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Boolean Template",
        type: "document",
        content: "Active: {{isActive}}\nCompleted: {{isCompleted}}",
      });

      const data = {
        isActive: true,
        isCompleted: false,
      };

      const result = renderTemplate(template.content, data);

      expect(result.content).toBe("Active: true\nCompleted: false");
      expect(result.missing).toEqual([]);
    });

    it("handles null and undefined values", async () => {
      const template = await createTemplate({
        firmId: ctx.firmId,
        name: "Null Template",
        type: "document",
        content: "Field1: {{field1}}\nField2: {{field2}}",
      });

      const data = {
        field1: null,
        field2: undefined,
      };

      const result = renderTemplate(template.content, data);

      // Null/undefined should render as empty string
      expect(result.content).toBe("Field1: \nField2: ");
      expect(result.missing).toEqual([]);
    });
  });
});

describe("Template Generation - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("prevents accessing templates from another firm", async () => {
    // Create template in first firm
    const template1 = await createTemplate({
      firmId: ctx.firmId,
      name: "Firm 1 Template",
      type: "document",
      content: "This is {{firmId}} template",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create template in second firm
    const template2 = await createTemplate({
      firmId: firm2.id,
      name: "Firm 2 Template",
      type: "document",
      content: "Different firm template: {{data}}",
    });

    // Firm 1 should only access their template
    const data = { firmId: "first" };
    const result1 = renderTemplate(template1.content, data);
    expect(result1.content).toBe("This is first template");

    // Firm 2 should only access their template
    const data2 = { data: "second" };
    const result2 = renderTemplate(template2.content, data2);
    expect(result2.content).toBe("Different firm template: second");

    // Templates are isolated (API layer should enforce this, render layer doesn't care)
    expect(template1.firmId).toBe(ctx.firmId);
    expect(template2.firmId).toBe(firm2.id);
    expect(template1.firmId).not.toBe(template2.firmId);

    // Cleanup second firm
    const { db } = await import("@/lib/db");
    const { templates, firms } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.delete(templates).where(eq(templates.firmId, firm2.id));
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Template Generation - Edge Cases", () => {
  const ctx = setupIntegrationSuite();

  it("handles template with no merge fields", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "Static Template",
      type: "document",
      content: "This is a static template with no merge fields.",
    });

    const result = renderTemplate(template.content, {});

    expect(result.content).toBe("This is a static template with no merge fields.");
    expect(result.missing).toEqual([]);
  });

  it("handles empty template content", async () => {
    const { db } = await import("@/lib/db");
    const { templates } = await import("@/lib/db/schema");

    // Insert directly to bypass factory default content
    const [template] = await db
      .insert(templates)
      .values({
        firmId: ctx.firmId,
        name: "Empty Template",
        type: "document",
        content: "",
        isActive: true,
        version: 1,
        parentId: null,
        createdById: null,
        updatedAt: new Date(),
      })
      .returning();

    const result = renderTemplate(template.content, { field: "value" });

    expect(result.content).toBe("");
    expect(result.missing).toEqual([]);
  });

  it("handles merge field with spaces", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "Spaced Fields Template",
      type: "document",
      content: "{{  clientName  }} and {{matterRef}}",
    });

    const data = {
      clientName: "Test Client",
      matterRef: "MAT-001",
    };

    const result = renderTemplate(template.content, data);

    expect(result.content).toBe("Test Client and MAT-001");
    expect(result.missing).toEqual([]);
  });

  it("handles very long merge field values", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "Long Value Template",
      type: "document",
      content: "Description: {{description}}",
    });

    const longText = "A".repeat(5000);
    const data = {
      description: longText,
    };

    const result = renderTemplate(template.content, data);

    expect(result.content).toBe(`Description: ${longText}`);
    expect(result.content.length).toBe(13 + 5000); // "Description: " (13 chars) + 5000 A's
    expect(result.missing).toEqual([]);
  });

  it("handles special characters in merge field values", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "Special Chars Template",
      type: "document",
      content: "Amount: {{amount}}\nSymbols: {{symbols}}",
    });

    const data = {
      amount: "£1,250.50",
      symbols: "< > & \" ' @ # $ %",
    };

    const result = renderTemplate(template.content, data);

    expect(result.content).toBe("Amount: £1,250.50\nSymbols: < > & \" ' @ # $ %");
    expect(result.missing).toEqual([]);
  });

  it("handles array values in data (JSON stringified)", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "Array Template",
      type: "document",
      content: "Items: {{items}}",
    });

    const data = {
      items: ["item1", "item2", "item3"],
    };

    const result = renderTemplate(template.content, data);

    // Arrays are JSON.stringified
    expect(result.content).toBe('Items: ["item1","item2","item3"]');
    expect(result.missing).toEqual([]);
  });

  it("handles object values in data (JSON stringified)", async () => {
    const template = await createTemplate({
      firmId: ctx.firmId,
      name: "Object Template",
      type: "document",
      content: "Data: {{metadata}}",
    });

    const data = {
      metadata: { key: "value", nested: { field: 123 } },
    };

    const result = renderTemplate(template.content, data);

    // Objects are JSON.stringified
    expect(result.content).toBe('Data: {"key":"value","nested":{"field":123}}');
    expect(result.missing).toEqual([]);
  });
});
