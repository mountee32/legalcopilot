export type Chunk = {
  text: string;
  charStart: number;
  charEnd: number;
};

export function chunkText(text: string, maxChars: number = 1200): Chunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/g).filter((paragraph) => paragraph.trim().length > 0);

  const chunks: Chunk[] = [];
  let buffer = "";
  let bufferStart = 0;
  let cursor = 0;

  const flush = () => {
    const trimmed = buffer.trim();
    if (!trimmed) return;
    const leadingWhitespace = buffer.length - buffer.trimStart().length;
    const start = bufferStart + leadingWhitespace;
    chunks.push({ text: trimmed, charStart: start, charEnd: start + trimmed.length });
  };

  for (const paragraphRaw of paragraphs) {
    const paragraph = paragraphRaw.trim();
    const foundAt = normalized.indexOf(paragraphRaw, cursor);
    const paragraphRawStart = foundAt >= 0 ? foundAt : cursor;
    cursor = paragraphRawStart + paragraphRaw.length;

    const leadingWhitespace = paragraphRaw.length - paragraphRaw.trimStart().length;
    const paragraphStart = paragraphRawStart + leadingWhitespace;

    if (!buffer) {
      buffer = paragraph;
      bufferStart = paragraphStart;
      continue;
    }

    const candidate = `${buffer}\n\n${paragraph}`;
    if (candidate.length <= maxChars) {
      buffer = candidate;
      continue;
    }

    flush();
    buffer = paragraph;
    bufferStart = paragraphStart;
  }

  flush();
  return chunks;
}

/**
 * Overlapping chunking for extraction pipelines.
 *
 * Produces fixed-size windows with overlap so that findings near chunk
 * boundaries are captured by at least one window fully.
 */
export function chunkTextOverlapping(
  text: string,
  maxChars: number = 2000,
  overlapChars: number = 400
): Chunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  if (normalized.length <= maxChars) {
    return [{ text: normalized, charStart: 0, charEnd: normalized.length }];
  }

  const chunks: Chunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);

    // Try to break at a paragraph or sentence boundary
    if (end < normalized.length) {
      const window = normalized.slice(start, end);
      const lastParagraph = window.lastIndexOf("\n\n");
      const lastSentence = window.lastIndexOf(". ");

      if (lastParagraph > maxChars * 0.5) {
        end = start + lastParagraph + 2;
      } else if (lastSentence > maxChars * 0.5) {
        end = start + lastSentence + 2;
      }
    }

    const chunkText = normalized.slice(start, end).trim();
    if (chunkText.length > 0) {
      const leadingWhitespace =
        normalized.slice(start, end).length - normalized.slice(start, end).trimStart().length;
      chunks.push({
        text: chunkText,
        charStart: start + leadingWhitespace,
        charEnd: start + leadingWhitespace + chunkText.length,
      });
    }

    // Advance by maxChars minus overlap
    const advance = Math.max(maxChars - overlapChars, 1);
    if (start + advance >= normalized.length) break;
    start += advance;
  }

  return chunks;
}
