import type { Buffer } from "buffer";

function normalizeMimeType(mimeType?: string | null): string | null {
  if (!mimeType) return null;
  const trimmed = mimeType.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export async function extractTextFromBuffer(options: {
  buffer: Buffer;
  mimeType?: string | null;
  filename?: string | null;
}): Promise<string> {
  const mimeType = normalizeMimeType(options.mimeType);
  const filename = options.filename?.toLowerCase() ?? null;

  const isPdf = mimeType === "application/pdf" || (!!filename && filename.endsWith(".pdf"));
  if (isPdf) {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(options.buffer);
    return (result.text ?? "").trim();
  }

  const isDocx =
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    (!!filename && filename.endsWith(".docx"));
  if (isDocx) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: options.buffer });
    return (result.value ?? "").trim();
  }

  const isText =
    (mimeType?.startsWith("text/") ?? false) ||
    mimeType === "application/json" ||
    mimeType === "application/xml";
  if (isText) {
    return options.buffer.toString("utf8").trim();
  }

  throw new Error(`Unsupported document type for extraction: ${mimeType ?? "unknown"}`);
}
