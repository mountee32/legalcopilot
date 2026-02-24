import { z } from "zod";
import { generateText } from "ai";
import { openrouter, models } from "@/lib/ai/openrouter";

const SummarySchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).optional(),
});

export type DocumentSummary = z.infer<typeof SummarySchema>;

export async function summarizeDocument(options: {
  extractedText: string;
  documentType?: string | null;
}): Promise<DocumentSummary> {
  const prompt = [
    "You are Legal Copilot.",
    "Summarize the document for a US law firm user.",
    "Return JSON only (no markdown) with shape:",
    `{"summary":"...","keyPoints":["..."]}`,
    "Keep the summary factual and avoid inventing details.",
    "",
    `DOCUMENT_TYPE: ${options.documentType ?? "unknown"}`,
    "DOCUMENT_TEXT:",
    options.extractedText.slice(0, 30_000),
  ].join("\n");

  const result = await generateText({
    model: openrouter(models["claude-3-5-sonnet"]),
    prompt,
  });

  let json: unknown = null;
  try {
    json = JSON.parse(result.text);
  } catch {
    json = null;
  }

  const parsed = SummarySchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Model did not return valid summary JSON");
  }

  return parsed.data;
}
