import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("lib/documents/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid summary JSON", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        summary: "This is a short summary.",
        keyPoints: ["Point A", "Point B"],
      }),
    } as any);

    const { summarizeDocument } = await import("@/lib/documents/summarize");
    const summary = await summarizeDocument({
      extractedText: "Document text",
      documentType: "note",
    });

    expect(summary.summary).toBe("This is a short summary.");
    expect(summary.keyPoints).toEqual(["Point A", "Point B"]);
  });

  it("throws on malformed JSON", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValueOnce({ text: "not-json" } as any);

    const { summarizeDocument } = await import("@/lib/documents/summarize");
    await expect(summarizeDocument({ extractedText: "Document text" })).rejects.toThrow(
      "Model did not return valid summary JSON"
    );
  });
});
