/**
 * Embeddings helper
 *
 * Uses OpenRouter's embeddings endpoint when configured.
 * Keep this minimal; callers can decide whether to require embeddings or treat as optional.
 */

type OpenRouterEmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

function getOpenRouterEmbeddingModel(): string {
  return process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const model = getOpenRouterEmbeddingModel();

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: texts }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Embeddings request failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as OpenRouterEmbeddingResponse;
  const data = Array.isArray(json.data) ? json.data : [];
  const embeddings = data.map((d) => (Array.isArray(d.embedding) ? d.embedding : null));

  if (embeddings.length !== texts.length || embeddings.some((e) => !e)) {
    throw new Error("Embeddings response did not include all embeddings");
  }

  return embeddings as number[][];
}
