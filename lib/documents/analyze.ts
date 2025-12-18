/**
 * Document Analysis using Gemini Flash
 *
 * Analyzes PDF documents using multimodal AI to extract:
 * - Document type classification
 * - Parties involved
 * - Key dates
 * - Summary
 *
 * Uses direct OpenRouter API calls (not Vercel AI SDK) because
 * OpenRouter requires a specific format for PDF uploads that the SDK doesn't support.
 */

import { z } from "zod";

const ANALYZE_MODEL = "google/gemini-3-flash-preview";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Zod schema for AI response validation
 */
const AIAnalysisResponseSchema = z.object({
  suggestedTitle: z.string(),
  documentType: z.enum([
    "letter_in",
    "letter_out",
    "email_in",
    "email_out",
    "contract",
    "court_form",
    "evidence",
    "note",
    "id_document",
    "financial",
    "other",
  ]),
  documentDate: z.string().nullable(),
  parties: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
    })
  ),
  keyDates: z.array(
    z.object({
      label: z.string(),
      date: z.string(),
    })
  ),
  summary: z.string(),
  confidence: z.number().min(0).max(100),
});

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;

export type ConfidenceLevel = "green" | "amber" | "red";

export interface AnalyzeDocumentResult {
  suggestedTitle: string;
  documentType: AIAnalysisResponse["documentType"];
  documentDate: string | null;
  parties: Array<{ name: string; role: string }>;
  keyDates: Array<{ label: string; date: string }>;
  summary: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  tokensUsed: number;
  model: string;
}

/**
 * Map confidence score to RAG level
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return "green";
  if (confidence >= 50) return "amber";
  return "red";
}

/**
 * Build the analysis prompt for Gemini Flash
 */
export function buildAnalyzePrompt(): string {
  return `You are a legal document analyzer for a UK law firm. Analyze the provided PDF document and extract the following information. Return your response as valid JSON only, no markdown code blocks.

{
  "suggestedTitle": "A concise title for this document",
  "documentType": "one of: letter_in, letter_out, email_in, email_out, contract, court_form, evidence, note, id_document, financial, other",
  "documentDate": "YYYY-MM-DD format or null if not found",
  "parties": [
    { "name": "Full name", "role": "Role in document (e.g., Buyer, Seller, Claimant, Defendant, Witness, Solicitor)" }
  ],
  "keyDates": [
    { "label": "Description of date (e.g., Completion Date, Deadline, Hearing Date)", "date": "YYYY-MM-DD" }
  ],
  "summary": "2-3 sentence summary of the document's purpose and key points",
  "confidence": 0-100
}

Focus on UK legal terminology and conventions. Extract all parties mentioned by name. Include important deadlines and dates. Be concise but accurate.`;
}

/**
 * OpenRouter API response types
 */
interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Analyze a PDF document using Gemini Flash
 *
 * Uses direct OpenRouter API calls with the correct PDF format:
 * { type: "file", file: { filename, file_data } }
 *
 * @param pdfBuffer - The PDF file as a Buffer
 * @returns Analysis result with extracted metadata
 */
export async function analyzeDocument(pdfBuffer: Buffer): Promise<AnalyzeDocumentResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("PDF buffer is empty");
  }

  const base64Pdf = pdfBuffer.toString("base64");
  const prompt = buildAnalyzePrompt();

  // Make direct API call to OpenRouter with correct PDF format
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Legal Copilot Document Analysis",
    },
    body: JSON.stringify({
      model: ANALYZE_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "file",
              file: {
                filename: "document.pdf",
                file_data: `data:application/pdf;base64,${base64Pdf}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const result: OpenRouterResponse = await response.json();

  if (!result.choices || result.choices.length === 0) {
    throw new Error("OpenRouter returned no choices");
  }

  const responseText = result.choices[0].message.content;

  // Parse JSON response
  let parsed: unknown;
  try {
    // Remove markdown code blocks if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    parsed = JSON.parse(jsonText.trim());
  } catch {
    throw new Error("AI model did not return valid JSON");
  }

  // Validate against schema
  const validated = AIAnalysisResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`AI response validation failed: ${validated.error.message}`);
  }

  const data = validated.data;
  const tokensUsed = result.usage?.total_tokens ?? 0;

  return {
    suggestedTitle: data.suggestedTitle,
    documentType: data.documentType,
    documentDate: data.documentDate,
    parties: data.parties,
    keyDates: data.keyDates,
    summary: data.summary,
    confidence: data.confidence,
    confidenceLevel: getConfidenceLevel(data.confidence),
    tokensUsed,
    model: ANALYZE_MODEL,
  };
}
