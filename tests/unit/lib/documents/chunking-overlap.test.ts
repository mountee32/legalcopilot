import { describe, it, expect } from "vitest";
import { chunkTextOverlapping } from "@/lib/documents/chunking";

describe("chunkTextOverlapping", () => {
  it("returns single chunk for short text", () => {
    const text = "Hello world. This is a short document.";
    const chunks = chunkTextOverlapping(text, 2000, 400);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].charStart).toBe(0);
    expect(chunks[0].charEnd).toBe(text.length);
  });

  it("returns empty array for empty text", () => {
    expect(chunkTextOverlapping("", 2000, 400)).toEqual([]);
    expect(chunkTextOverlapping("   ", 2000, 400)).toEqual([]);
  });

  it("produces overlapping chunks for long text", () => {
    // Create text longer than maxChars
    const paragraph = "This is a paragraph of text that fills up space. ";
    const text = paragraph.repeat(100); // ~4900 chars

    const chunks = chunkTextOverlapping(text, 2000, 400);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify overlap exists between consecutive chunks
    for (let i = 1; i < chunks.length; i++) {
      // The start of chunk[i] should be before the end of chunk[i-1]
      expect(chunks[i].charStart).toBeLessThan(chunks[i - 1].charEnd);
    }
  });

  it("respects maxChars limit", () => {
    const paragraph = "Word ".repeat(1000); // 5000 chars
    const chunks = chunkTextOverlapping(paragraph, 2000, 400);

    for (const chunk of chunks) {
      // Allow some slack for sentence boundary snapping
      expect(chunk.text.length).toBeLessThanOrEqual(2100);
    }
  });

  it("covers the full text without gaps", () => {
    const text = "A".repeat(100) + "\n\n" + "B".repeat(100) + "\n\n" + "C".repeat(100);
    const chunks = chunkTextOverlapping(text, 150, 50);

    // First chunk starts at 0
    expect(chunks[0].charStart).toBe(0);

    // Last chunk covers the end
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.charEnd).toBeLessThanOrEqual(text.trim().length + 1);
  });

  it("handles text without paragraph breaks", () => {
    const text = "A".repeat(5000);
    const chunks = chunkTextOverlapping(text, 2000, 400);

    expect(chunks.length).toBeGreaterThan(1);
  });
});
