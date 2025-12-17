import { NextRequest } from "next/server";
import { streamAIText } from "@/lib/ai/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI features are not configured. Please set OPENROUTER_API_KEY." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await streamAIText(prompt, model);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in AI endpoint:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate AI response",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
