import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("lib/documents/entities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid entities JSON", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        dates: ["1 January 2025"],
        parties: ["Alice", "Bob"],
        amounts: ["£100.00"],
        addresses: ["10 Downing Street, London"],
      }),
    } as any);

    const { extractEntities } = await import("@/lib/documents/entities");
    const entities = await extractEntities({ text: "Contract", documentType: "contract" });

    expect(entities.dates).toEqual(["1 January 2025"]);
    expect(entities.parties).toEqual(["Alice", "Bob"]);
    expect(entities.amounts).toEqual(["£100.00"]);
    expect(entities.addresses).toEqual(["10 Downing Street, London"]);
  });

  it("throws on malformed JSON", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValueOnce({ text: "not-json" } as any);

    const { extractEntities } = await import("@/lib/documents/entities");
    await expect(extractEntities({ text: "Contract" })).rejects.toThrow(
      "Model did not return valid entities JSON"
    );
  });

  it("throws on schema-mismatched JSON", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({ dates: "not-an-array" }),
    } as any);

    const { extractEntities } = await import("@/lib/documents/entities");
    await expect(extractEntities({ text: "Contract" })).rejects.toThrow(
      "Model did not return valid entities JSON"
    );
  });
});
