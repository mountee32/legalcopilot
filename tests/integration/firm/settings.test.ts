/**
 * Firm Settings Integration Tests
 *
 * Tests firm settings CRUD operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { firms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Firm Settings Integration - Get Settings", () => {
  const ctx = setupIntegrationSuite();

  it("retrieves settings for a firm", async () => {
    // Get the firm's settings
    const [firm] = await db
      .select({ settings: firms.settings, updatedAt: firms.updatedAt })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    expect(firm).toBeDefined();
    expect(firm.settings).toBeDefined();
    expect(firm.updatedAt).toBeDefined();
  });

  it("returns empty object when no settings exist", async () => {
    // Create a firm with no settings
    const testFirm = await createFirm({ name: "No Settings Firm" });

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, testFirm.id))
      .limit(1);

    expect(firm.settings).toBeNull();

    // Cleanup
    await db.delete(firms).where(eq(firms.id, testFirm.id));
  });

  it("includes billing rates when present", async () => {
    // Update firm with billing settings
    const billingSettings = {
      billing: {
        defaultVatRate: 20,
        defaultPaymentTermsDays: 30,
        invoicePrefix: "INV",
        invoiceFooter: "Thank you for your business",
      },
    };

    await db
      .update(firms)
      .set({ settings: billingSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Retrieve settings
    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.billing).toBeDefined();
    expect(settings.billing.defaultVatRate).toBe(20);
    expect(settings.billing.defaultPaymentTermsDays).toBe(30);
    expect(settings.billing.invoicePrefix).toBe("INV");
    expect(settings.billing.invoiceFooter).toBe("Thank you for your business");
  });

  it("includes branding settings when present", async () => {
    // Update firm with branding settings
    const brandingSettings = {
      branding: {
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#3B82F6",
        portalName: "Client Portal",
      },
    };

    await db
      .update(firms)
      .set({ settings: brandingSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Retrieve settings
    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.branding).toBeDefined();
    expect(settings.branding.logoUrl).toBe("https://example.com/logo.png");
    expect(settings.branding.primaryColor).toBe("#3B82F6");
    expect(settings.branding.portalName).toBe("Client Portal");
  });

  it("includes all settings types when present", async () => {
    // Update firm with comprehensive settings
    const allSettings = {
      branding: {
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#3B82F6",
        portalName: "Legal Portal",
      },
      billing: {
        defaultVatRate: 20,
        defaultPaymentTermsDays: 14,
        invoicePrefix: "INV",
      },
      ai: {
        defaultModel: "gpt-4",
        autoApproveThreshold: 0.95,
        enabledFeatures: ["email-drafting", "document-analysis"],
      },
      features: {
        emailIntegration: true,
        calendarSync: true,
        clientPortal: true,
        eSignature: false,
      },
    };

    await db
      .update(firms)
      .set({ settings: allSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Retrieve settings
    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.branding).toBeDefined();
    expect(settings.billing).toBeDefined();
    expect(settings.ai).toBeDefined();
    expect(settings.features).toBeDefined();
  });
});

describe("Firm Settings Integration - Update Settings", () => {
  const ctx = setupIntegrationSuite();

  it("updates billing rates", async () => {
    const newBillingSettings = {
      billing: {
        defaultVatRate: 15,
        defaultPaymentTermsDays: 21,
      },
    };

    await db
      .update(firms)
      .set({ settings: newBillingSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.billing.defaultVatRate).toBe(15);
    expect(settings.billing.defaultPaymentTermsDays).toBe(21);
  });

  it("updates invoice defaults", async () => {
    const invoiceSettings = {
      billing: {
        invoicePrefix: "LEGAL",
        invoiceFooter: "Payment details: Bank Transfer to Account 12345678",
        defaultPaymentTermsDays: 7,
      },
    };

    await db
      .update(firms)
      .set({ settings: invoiceSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.billing.invoicePrefix).toBe("LEGAL");
    expect(settings.billing.invoiceFooter).toContain("Payment details");
    expect(settings.billing.defaultPaymentTermsDays).toBe(7);
  });

  it("updates branding settings (logo and colors)", async () => {
    const brandingUpdate = {
      branding: {
        logoUrl: "https://cdn.example.com/firm-logo.svg",
        primaryColor: "#10B981",
        portalName: "My Legal Portal",
      },
    };

    await db
      .update(firms)
      .set({ settings: brandingUpdate, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.branding.logoUrl).toBe("https://cdn.example.com/firm-logo.svg");
    expect(settings.branding.primaryColor).toBe("#10B981");
    expect(settings.branding.portalName).toBe("My Legal Portal");
  });

  it("updates feature flags", async () => {
    const featureSettings = {
      features: {
        emailIntegration: true,
        calendarSync: false,
        clientPortal: true,
        eSignature: true,
      },
    };

    await db
      .update(firms)
      .set({ settings: featureSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.features.emailIntegration).toBe(true);
    expect(settings.features.calendarSync).toBe(false);
    expect(settings.features.clientPortal).toBe(true);
    expect(settings.features.eSignature).toBe(true);
  });

  it("updates AI settings", async () => {
    const aiSettings = {
      ai: {
        defaultModel: "claude-3-opus",
        autoApproveThreshold: 0.9,
        enabledFeatures: ["email-drafting", "case-analysis", "document-review"],
      },
    };

    await db
      .update(firms)
      .set({ settings: aiSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.ai.defaultModel).toBe("claude-3-opus");
    expect(settings.ai.autoApproveThreshold).toBe(0.9);
    expect(settings.ai.enabledFeatures).toContain("email-drafting");
    expect(settings.ai.enabledFeatures).toContain("case-analysis");
    expect(settings.ai.enabledFeatures).toContain("document-review");
  });
});

describe("Firm Settings Integration - Settings Persistence", () => {
  const ctx = setupIntegrationSuite();

  it("persists settings across updates", async () => {
    // First update
    const initialSettings = {
      billing: {
        defaultVatRate: 20,
        invoicePrefix: "TEST",
      },
    };

    await db
      .update(firms)
      .set({ settings: initialSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Verify first update
    const [firm1] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    expect((firm1.settings as any).billing.defaultVatRate).toBe(20);

    // Second update
    const updatedSettings = {
      billing: {
        defaultVatRate: 15,
        invoicePrefix: "TEST",
      },
    };

    await db
      .update(firms)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Verify second update persisted
    const [firm2] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    expect((firm2.settings as any).billing.defaultVatRate).toBe(15);
    expect((firm2.settings as any).billing.invoicePrefix).toBe("TEST");
  });

  it("partial updates preserve existing settings", async () => {
    // Set initial comprehensive settings
    const initialSettings = {
      billing: {
        defaultVatRate: 20,
        invoicePrefix: "INV",
        defaultPaymentTermsDays: 30,
      },
      branding: {
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#3B82F6",
      },
    };

    await db
      .update(firms)
      .set({ settings: initialSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Get current settings
    const [current] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    // Partial update - only update branding
    const partialUpdate = {
      ...(current.settings as any),
      branding: {
        ...(current.settings as any).branding,
        primaryColor: "#10B981",
      },
    };

    await db
      .update(firms)
      .set({ settings: partialUpdate, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Verify billing settings are preserved
    const [updated] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = updated.settings as any;
    expect(settings.billing.defaultVatRate).toBe(20);
    expect(settings.billing.invoicePrefix).toBe("INV");
    expect(settings.branding.primaryColor).toBe("#10B981");
    expect(settings.branding.logoUrl).toBe("https://example.com/logo.png");
  });

  it("updates the updatedAt timestamp", async () => {
    const [before] = await db
      .select({ updatedAt: firms.updatedAt })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    await db
      .update(firms)
      .set({
        settings: { billing: { defaultVatRate: 20 } },
        updatedAt: new Date(),
      })
      .where(eq(firms.id, ctx.firmId));

    const [after] = await db
      .select({ updatedAt: firms.updatedAt })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });
});

describe("Firm Settings Integration - Multi-tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates settings between firms", async () => {
    // Set settings for first firm
    const firm1Settings = {
      billing: {
        defaultVatRate: 20,
        invoicePrefix: "FIRM1",
      },
      branding: {
        primaryColor: "#3B82F6",
      },
    };

    await db
      .update(firms)
      .set({ settings: firm1Settings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    // Create second firm with different settings
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const firm2Settings = {
      billing: {
        defaultVatRate: 15,
        invoicePrefix: "FIRM2",
      },
      branding: {
        primaryColor: "#10B981",
      },
    };

    await db
      .update(firms)
      .set({ settings: firm2Settings, updatedAt: new Date() })
      .where(eq(firms.id, firm2.id));

    // Verify each firm has their own settings
    const [f1] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const [f2] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, firm2.id))
      .limit(1);

    expect((f1.settings as any).billing.invoicePrefix).toBe("FIRM1");
    expect((f1.settings as any).billing.defaultVatRate).toBe(20);
    expect((f1.settings as any).branding.primaryColor).toBe("#3B82F6");

    expect((f2.settings as any).billing.invoicePrefix).toBe("FIRM2");
    expect((f2.settings as any).billing.defaultVatRate).toBe(15);
    expect((f2.settings as any).branding.primaryColor).toBe("#10B981");

    // Cleanup second firm
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot access other firm's settings", async () => {
    // Create two firms
    const firm2 = await createFirm({ name: "Isolated Firm" });
    const firm2Settings = {
      billing: {
        invoicePrefix: "SECRET",
        defaultVatRate: 99,
      },
    };

    await db
      .update(firms)
      .set({ settings: firm2Settings, updatedAt: new Date() })
      .where(eq(firms.id, firm2.id));

    // Query settings for first firm (ctx.firmId)
    const [firm1] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    // Should not contain second firm's settings
    const settings = firm1.settings as any;
    if (settings?.billing) {
      expect(settings.billing.invoicePrefix).not.toBe("SECRET");
      expect(settings.billing.defaultVatRate).not.toBe(99);
    }

    // Cleanup second firm
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("updates only affect the target firm", async () => {
    // Create second firm
    const firm2 = await createFirm({ name: "Update Test Firm" });

    // Set initial settings for both firms
    const initialSettings = {
      billing: { defaultVatRate: 20 },
    };

    await db
      .update(firms)
      .set({ settings: initialSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    await db
      .update(firms)
      .set({ settings: initialSettings, updatedAt: new Date() })
      .where(eq(firms.id, firm2.id));

    // Update only second firm
    const updatedSettings = {
      billing: { defaultVatRate: 10 },
    };

    await db
      .update(firms)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(firms.id, firm2.id));

    // Verify first firm unchanged
    const [firm1] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    expect((firm1.settings as any).billing.defaultVatRate).toBe(20);

    // Verify second firm updated
    const [firm2Updated] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, firm2.id))
      .limit(1);

    expect((firm2Updated.settings as any).billing.defaultVatRate).toBe(10);

    // Cleanup second firm
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Firm Settings Integration - Data Validation", () => {
  const ctx = setupIntegrationSuite();

  it("stores complex nested settings", async () => {
    const complexSettings = {
      billing: {
        defaultVatRate: 20,
        invoicePrefix: "INV",
        defaultPaymentTermsDays: 30,
        invoiceFooter: "Multi-line\nfooter\ntext",
      },
      branding: {
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#3B82F6",
        portalName: "Portal",
      },
      ai: {
        defaultModel: "gpt-4",
        autoApproveThreshold: 0.95,
        enabledFeatures: ["feature1", "feature2", "feature3"],
      },
      features: {
        emailIntegration: true,
        calendarSync: false,
        clientPortal: true,
        eSignature: false,
      },
    };

    await db
      .update(firms)
      .set({ settings: complexSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings).toEqual(complexSettings);
  });

  it("handles empty settings object", async () => {
    await db
      .update(firms)
      .set({ settings: {}, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    expect(firm.settings).toEqual({});
  });

  it("handles array values in settings", async () => {
    const settingsWithArrays = {
      ai: {
        enabledFeatures: ["email-drafting", "document-analysis", "case-research"],
      },
    };

    await db
      .update(firms)
      .set({ settings: settingsWithArrays, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(Array.isArray(settings.ai.enabledFeatures)).toBe(true);
    expect(settings.ai.enabledFeatures).toHaveLength(3);
    expect(settings.ai.enabledFeatures).toContain("email-drafting");
  });

  it("handles special characters in string values", async () => {
    const specialCharSettings = {
      billing: {
        invoiceFooter:
          'Payment terms:\n- Bank transfer: £1000\n- VAT: 20%\n"Please pay within 30 days"',
        invoicePrefix: "INV-2024-",
      },
      branding: {
        portalName: "Smith & Jones Legal Services",
      },
    };

    await db
      .update(firms)
      .set({ settings: specialCharSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.billing.invoiceFooter).toContain("£1000");
    expect(settings.billing.invoiceFooter).toContain("\n");
    expect(settings.branding.portalName).toContain("&");
  });

  it("handles numeric values correctly", async () => {
    const numericSettings = {
      billing: {
        defaultVatRate: 20.5,
        defaultPaymentTermsDays: 30,
      },
      ai: {
        autoApproveThreshold: 0.95,
      },
    };

    await db
      .update(firms)
      .set({ settings: numericSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.billing.defaultVatRate).toBe(20.5);
    expect(settings.billing.defaultPaymentTermsDays).toBe(30);
    expect(settings.ai.autoApproveThreshold).toBe(0.95);
  });

  it("handles boolean values correctly", async () => {
    const booleanSettings = {
      features: {
        emailIntegration: true,
        calendarSync: false,
        clientPortal: true,
        eSignature: false,
      },
    };

    await db
      .update(firms)
      .set({ settings: booleanSettings, updatedAt: new Date() })
      .where(eq(firms.id, ctx.firmId));

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId))
      .limit(1);

    const settings = firm.settings as any;
    expect(settings.features.emailIntegration).toBe(true);
    expect(settings.features.calendarSync).toBe(false);
    expect(settings.features.clientPortal).toBe(true);
    expect(settings.features.eSignature).toBe(false);
  });
});
