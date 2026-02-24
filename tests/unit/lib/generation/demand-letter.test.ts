/**
 * Tests for Demand Letter Generator
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI client
vi.mock("@/lib/pipeline/ai-client", () => ({
  callAi: vi.fn(),
}));

// Mock renderTemplate
vi.mock("@/lib/templates/render", () => ({
  renderTemplate: vi.fn(),
}));

import { callAi } from "@/lib/pipeline/ai-client";
import { renderTemplate } from "@/lib/templates/render";
import type { GenerationContext } from "@/lib/generation/context-builder";

function makeContext(): GenerationContext {
  return {
    matter: {
      id: "m-1",
      reference: "MAT-001",
      title: "Smith v Jones RTA",
      practiceArea: "personal_injury",
      status: "active",
      description: null,
      subType: "rta",
    },
    client: {
      name: "John Smith",
      firstName: "John",
      lastName: "Smith",
      companyName: null,
      type: "individual",
      email: "john@test.com",
      phone: "555-1234",
      address: "123 Main St",
    },
    firm: { name: "Harrison & Clarke" },
    feeEarner: { name: "James Clarke", email: "james@firm.com" },
    findings: {
      defendant_name: "Jones Transport Ltd",
      incident_date: "2024-06-15",
      total_demand: "£50,000",
    },
    findingsByCategory: {},
    statusCounts: { pending: 2, accepted: 3, rejected: 0, auto_applied: 1, conflict: 0 },
    today: "2025-01-15",
  };
}

describe("buildSectionPrompt", () => {
  it("should include findings context in the prompt", async () => {
    const { buildSectionPrompt } = await import("@/lib/generation/demand-letter");
    const context = makeContext();
    const prompt = buildSectionPrompt("liability_narrative", context);

    expect(prompt).toContain("defendant_name: Jones Transport Ltd");
    expect(prompt).toContain("incident_date: 2024-06-15");
    expect(prompt).toContain("total_demand: £50,000");
    expect(prompt).toContain("senior personal injury attorney");
    expect(prompt).toContain("liability");
    expect(prompt).toContain("Maximum 400 words");
  });
});

describe("generateDemandLetter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should merge deterministic fields first, then process AI sections", async () => {
    const { generateDemandLetter } = await import("@/lib/generation/demand-letter");
    const context = makeContext();

    // renderTemplate should handle {{merge.fields}} and leave {{AI:...}} untouched
    vi.mocked(renderTemplate).mockReturnValue({
      content: "Dear John,\n\nLiability: {{AI:liability_narrative}}\n\nSincerely,\nJames Clarke",
      missing: ["some.missing.field"],
    });

    vi.mocked(callAi).mockResolvedValue({
      content: "The defendant was clearly negligent in this matter.",
      tokensUsed: 150,
      model: "anthropic/claude-3.5-sonnet",
      wasRetried: false,
    });

    const result = await generateDemandLetter(context, "template content");

    // renderTemplate should be called first with the full data context
    expect(renderTemplate).toHaveBeenCalledWith(
      "template content",
      expect.objectContaining({
        matter: context.matter,
        client: context.client,
        firm: context.firm,
        findings: context.findings,
      })
    );

    // callAi should be called for the AI section
    expect(callAi).toHaveBeenCalledOnce();
    expect(callAi).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.2,
        maxTokens: 1024,
      })
    );

    expect(result.content).toContain("The defendant was clearly negligent");
    expect(result.content).not.toContain("{{AI:");
    expect(result.aiSections).toEqual(["liability_narrative"]);
    expect(result.tokensUsed).toBe(150);
    expect(result.missing).toEqual(["some.missing.field"]);
  });

  it("should call callAi for each AI section", async () => {
    const { generateDemandLetter } = await import("@/lib/generation/demand-letter");
    const context = makeContext();

    vi.mocked(renderTemplate).mockReturnValue({
      content:
        "{{AI:liability_narrative}} ... {{AI:injury_narrative}} ... {{AI:damages_narrative}}",
      missing: [],
    });

    vi.mocked(callAi)
      .mockResolvedValueOnce({
        content: "Liability section",
        tokensUsed: 100,
        model: "test",
        wasRetried: false,
      })
      .mockResolvedValueOnce({
        content: "Injury section",
        tokensUsed: 120,
        model: "test",
        wasRetried: false,
      })
      .mockResolvedValueOnce({
        content: "Damages section",
        tokensUsed: 130,
        model: "test",
        wasRetried: false,
      });

    const result = await generateDemandLetter(context, "template");

    expect(callAi).toHaveBeenCalledTimes(3);
    expect(result.aiSections).toEqual([
      "liability_narrative",
      "injury_narrative",
      "damages_narrative",
    ]);
    expect(result.tokensUsed).toBe(350);
    expect(result.content).toContain("Liability section");
    expect(result.content).toContain("Injury section");
    expect(result.content).toContain("Damages section");
  });

  it("should report missing merge fields", async () => {
    const { generateDemandLetter } = await import("@/lib/generation/demand-letter");
    const context = makeContext();

    vi.mocked(renderTemplate).mockReturnValue({
      content: "No AI sections here",
      missing: ["findings.missing_field", "client.unknown"],
    });

    const result = await generateDemandLetter(context, "template");

    expect(result.missing).toEqual(["findings.missing_field", "client.unknown"]);
    expect(result.aiSections).toEqual([]);
    expect(result.tokensUsed).toBe(0);
  });
});

describe("textToPdf", () => {
  it("should produce a valid PDF buffer", async () => {
    const { textToPdf } = await import("@/lib/generation/demand-letter");

    const pdf = await textToPdf(
      "Dear Sir,\n\nThis is a test letter.\n\nYours faithfully,\nJames",
      "Test Firm"
    );

    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(100);

    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  });
});
