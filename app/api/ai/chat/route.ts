import { streamAIText } from "@/lib/ai/openrouter";
import { NextRequest } from "next/server";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, model } = chatSchema.parse(body);

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const result = await streamAIText(message, model);

    return result.toDataStreamResponse();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }

    console.error("AI chat error:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
