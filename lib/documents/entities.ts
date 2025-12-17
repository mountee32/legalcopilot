import { z } from "zod";
import { generateText } from "ai";
import { openrouter, models } from "@/lib/ai/openrouter";

const EntitiesSchema = z.object({
  dates: z.array(z.string()).optional(),
  parties: z.array(z.string()).optional(),
  amounts: z.array(z.string()).optional(),
  addresses: z.array(z.string()).optional(),
});

export type DocumentEntities = z.infer<typeof EntitiesSchema>;

export async function extractEntities(options: {
  text: string;
  documentType?: string | null;
}): Promise<DocumentEntities> {
  const prompt = [
    "You are Legal Copilot.",
    "Extract key entities from the document.",
    "Return JSON only (no markdown) with shape:",
    `{"dates":["..."],"parties":["..."],"amounts":["..."],"addresses":["..."]}`,
    "Rules:",
    "- Include only entities that appear explicitly in the text.",
    "- Prefer exact snippets; do not normalise dates/amounts unless explicit.",
    "- Do not infer or add missing parties/addresses.",
    "",
    `DOCUMENT_TYPE: ${options.documentType ?? "unknown"}`,
    "DOCUMENT_TEXT:",
    options.text.slice(0, 30_000),
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

  const parsed = EntitiesSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Model did not return valid entities JSON");
  }

  return parsed.data;
}
