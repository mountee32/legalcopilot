/**
 * Pipeline Prompt Construction
 *
 * Builds classification and extraction prompts from taxonomy pack data.
 * These prompts drive the AI stages of the document processing pipeline.
 */

import type {
  TaxonomyDocumentType,
  TaxonomyField,
  TaxonomyCategory,
  TaxonomyPromptTemplate,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Classification prompt
// ---------------------------------------------------------------------------

export interface ClassificationPromptInput {
  documentTypes: TaxonomyDocumentType[];
  template: TaxonomyPromptTemplate | null;
  textSample: string;
  mimeType?: string;
  filename?: string;
}

export interface ClassificationPrompt {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Build a classification prompt from taxonomy document types and an optional
 * custom prompt template. Falls back to a sensible default prompt.
 */
export function buildClassificationPrompt(input: ClassificationPromptInput): ClassificationPrompt {
  const { documentTypes, template, textSample, mimeType, filename } = input;

  const docTypeList = documentTypes
    .map((dt) => {
      const hints = dt.classificationHints ? ` — ${dt.classificationHints}` : "";
      return `- "${dt.key}" (${dt.label})${hints}`;
    })
    .join("\n");

  const defaultSystem = `You are a legal document classifier. Given the text content of a document, classify it into one of the provided document types. Return a JSON object with "documentType" (the key) and "confidence" (0.0-1.0).`;

  const defaultUser = `Classify the following document into one of these types:

${docTypeList}

${mimeType ? `MIME type: ${mimeType}` : ""}
${filename ? `Filename: ${filename}` : ""}

Document text (first ~2000 characters):
---
${textSample.slice(0, 2000)}
---

Return ONLY a JSON object: {"documentType": "<key>", "confidence": <0.0-1.0>}`;

  if (template) {
    const userPrompt = template.userPromptTemplate
      .replace("{{document_types}}", docTypeList)
      .replace("{{text_sample}}", textSample.slice(0, 2000))
      .replace("{{mime_type}}", mimeType || "unknown")
      .replace("{{filename}}", filename || "unknown");

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      model: template.modelPreference || "google/gemini-2.0-flash-001",
      temperature: template.temperature ? parseFloat(template.temperature) : 0.1,
      maxTokens: template.maxTokens || 256,
    };
  }

  return {
    systemPrompt: defaultSystem,
    userPrompt: defaultUser,
    model: "google/gemini-2.0-flash-001",
    temperature: 0.1,
    maxTokens: 256,
  };
}

// ---------------------------------------------------------------------------
// Extraction prompt
// ---------------------------------------------------------------------------

export interface ExtractionPromptInput {
  categories: (TaxonomyCategory & { fields: TaxonomyField[] })[];
  template: TaxonomyPromptTemplate | null;
  chunkText: string;
  chunkIndex: number;
  totalChunks: number;
  documentType: string;
  matterContext?: string;
}

export interface ExtractionPrompt {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Build an extraction prompt from taxonomy categories/fields and an optional
 * custom prompt template. The prompt instructs the AI to extract all relevant
 * field values from the provided text chunk.
 */
export function buildExtractionPrompt(input: ExtractionPromptInput): ExtractionPrompt {
  const { categories, template, chunkText, chunkIndex, totalChunks, documentType } = input;

  const fieldDescriptions = categories
    .flatMap((cat) =>
      cat.fields.map((f) => {
        const examples = f.examples ? ` (examples: ${JSON.stringify(f.examples)})` : "";
        return `- ${cat.key}.${f.key} [${f.dataType}]: ${f.label}${examples}`;
      })
    )
    .join("\n");

  const defaultSystem = `You are a legal document extraction AI. Extract structured data points from the provided text. For each finding, provide the field key, extracted value, a direct quote from the source text, and your confidence (0.0-1.0). Only extract fields you find evidence for — do not guess.`;

  const defaultUser = `Document type: ${documentType}
Chunk ${chunkIndex + 1} of ${totalChunks}

Extract values for these fields where present:
${fieldDescriptions}

Text:
---
${chunkText}
---

Return ONLY a JSON array of findings:
[{"categoryKey": "<cat>", "fieldKey": "<field>", "value": "<extracted>", "sourceQuote": "<verbatim quote>", "confidence": <0.0-1.0>}]

If no relevant data is found in this chunk, return an empty array: []`;

  if (template) {
    const userPrompt = template.userPromptTemplate
      .replace("{{field_descriptions}}", fieldDescriptions)
      .replace("{{chunk_text}}", chunkText)
      .replace("{{chunk_index}}", String(chunkIndex + 1))
      .replace("{{total_chunks}}", String(totalChunks))
      .replace("{{document_type}}", documentType);

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      model: template.modelPreference || "google/gemini-2.0-flash-001",
      temperature: template.temperature ? parseFloat(template.temperature) : 0.1,
      maxTokens: template.maxTokens || 2048,
    };
  }

  return {
    systemPrompt: defaultSystem,
    userPrompt: defaultUser,
    model: "google/gemini-2.0-flash-001",
    temperature: 0.1,
    maxTokens: 2048,
  };
}
