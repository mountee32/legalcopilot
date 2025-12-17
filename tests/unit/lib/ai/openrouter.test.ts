import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => (model: string) => ({ model }),
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

describe("lib/ai/openrouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when OPENROUTER_API_KEY is missing", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const { generateAIText } = await import("@/lib/ai/openrouter");
    await expect(generateAIText("hi")).rejects.toThrow("OPENROUTER_API_KEY is not configured");

    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });

  it("returns generated text for valid configuration", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValueOnce({ text: "hello" } as any);

    const { generateAIText } = await import("@/lib/ai/openrouter");
    const text = await generateAIText("prompt", "openai/gpt-4o");

    expect(text).toBe("hello");
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "prompt",
      })
    );
  });
});
