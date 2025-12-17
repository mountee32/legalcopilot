import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("⚠️ OPENROUTER_API_KEY is not set - AI features will be disabled");
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Common models you might use
export const models = {
  "gpt-4o": "openai/gpt-4o",
  "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet",
  "claude-3-opus": "anthropic/claude-3-opus",
  "llama-3-70b": "meta-llama/llama-3-70b-instruct",
  "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",
};

// Helper function for text generation
export async function generateAIText(prompt: string, model: string = models["claude-3-5-sonnet"]) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const result = await generateText({
    model: openrouter(model),
    prompt,
  });

  return result.text;
}

// Helper function for streaming text
export async function streamAIText(prompt: string, model: string = models["claude-3-5-sonnet"]) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const result = await streamText({
    model: openrouter(model),
    prompt,
  });

  return result;
}

export { openrouter };
