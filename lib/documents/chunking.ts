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
