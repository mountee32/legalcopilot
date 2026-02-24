import { describe, it, expect } from "vitest";
import { buildClassificationPrompt, buildExtractionPrompt } from "@/lib/pipeline/prompts";

describe("buildClassificationPrompt", () => {
  const sampleDocTypes = [
    {
      id: "dt-1",
      packId: "pack-1",
      key: "medical_report",
      label: "Medical Report",
      description: null,
      activatedCategories: ["injury_details"],
      classificationHints: "Contains medical diagnoses and treatment",
      sortOrder: 0,
      createdAt: new Date(),
    },
    {
      id: "dt-2",
      packId: "pack-1",
      key: "wage_statement",
      label: "Wage Statement",
      description: null,
      activatedCategories: ["financial"],
      classificationHints: null,
      sortOrder: 1,
      createdAt: new Date(),
    },
  ];

  it("builds prompt with default template when no custom template provided", () => {
    const prompt = buildClassificationPrompt({
      documentTypes: sampleDocTypes as any,
      template: null,
      textSample: "Patient: John Smith. Diagnosis: lumbar disc herniation.",
    });

    expect(prompt.systemPrompt).toContain("legal document classifier");
    expect(prompt.userPrompt).toContain("medical_report");
    expect(prompt.userPrompt).toContain("wage_statement");
    expect(prompt.userPrompt).toContain("John Smith");
    expect(prompt.model).toBeDefined();
    expect(prompt.temperature).toBeLessThan(1);
    expect(prompt.maxTokens).toBeGreaterThan(0);
  });

  it("includes classification hints in prompt", () => {
    const prompt = buildClassificationPrompt({
      documentTypes: sampleDocTypes as any,
      template: null,
      textSample: "Some text",
    });

    expect(prompt.userPrompt).toContain("medical diagnoses and treatment");
  });

  it("uses custom template when provided", () => {
    const template = {
      id: "t-1",
      packId: "pack-1",
      templateType: "classification" as const,
      systemPrompt: "Custom system prompt",
      userPromptTemplate: "Classify: {{document_types}}\n\nText: {{text_sample}}",
      modelPreference: "anthropic/claude-3-haiku",
      temperature: "0.2",
      maxTokens: 512,
      createdAt: new Date(),
    };

    const prompt = buildClassificationPrompt({
      documentTypes: sampleDocTypes as any,
      template: template as any,
      textSample: "Some document text",
    });

    expect(prompt.systemPrompt).toBe("Custom system prompt");
    expect(prompt.model).toBe("anthropic/claude-3-haiku");
    expect(prompt.temperature).toBe(0.2);
    expect(prompt.maxTokens).toBe(512);
  });

  it("truncates text sample to 2000 chars", () => {
    const longText = "A".repeat(5000);
    const prompt = buildClassificationPrompt({
      documentTypes: sampleDocTypes as any,
      template: null,
      textSample: longText,
    });

    // The prompt should not contain the full 5000 chars
    expect(prompt.userPrompt.length).toBeLessThan(5000);
  });
});

describe("buildExtractionPrompt", () => {
  const sampleCategories = [
    {
      id: "cat-1",
      packId: "pack-1",
      key: "claimant_info",
      label: "Claimant Information",
      description: null,
      icon: null,
      color: null,
      sortOrder: 0,
      createdAt: new Date(),
      fields: [
        {
          id: "f-1",
          categoryId: "cat-1",
          key: "claimant_name",
          label: "Claimant Name",
          description: null,
          dataType: "text" as const,
          examples: ["John Smith", "Jane Doe"],
          confidenceThreshold: "0.800",
          requiresHumanReview: false,
          sortOrder: 0,
          createdAt: new Date(),
        },
        {
          id: "f-2",
          categoryId: "cat-1",
          key: "date_of_birth",
          label: "Date of Birth",
          description: null,
          dataType: "date" as const,
          examples: null,
          confidenceThreshold: "0.850",
          requiresHumanReview: false,
          sortOrder: 1,
          createdAt: new Date(),
        },
      ],
    },
  ];

  it("builds extraction prompt with field descriptions", () => {
    const prompt = buildExtractionPrompt({
      categories: sampleCategories as any,
      template: null,
      chunkText: "Claimant: John Smith, DOB: 1985-03-15",
      chunkIndex: 0,
      totalChunks: 3,
      documentType: "medical_report",
    });

    expect(prompt.systemPrompt).toContain("extraction");
    expect(prompt.userPrompt).toContain("claimant_info.claimant_name");
    expect(prompt.userPrompt).toContain("claimant_info.date_of_birth");
    expect(prompt.userPrompt).toContain("Chunk 1 of 3");
    expect(prompt.userPrompt).toContain("John Smith, DOB");
  });

  it("includes field examples in prompt", () => {
    const prompt = buildExtractionPrompt({
      categories: sampleCategories as any,
      template: null,
      chunkText: "Some text",
      chunkIndex: 0,
      totalChunks: 1,
      documentType: "medical_report",
    });

    expect(prompt.userPrompt).toContain("John Smith");
  });
});
