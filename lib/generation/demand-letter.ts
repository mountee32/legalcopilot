/**
 * Demand Letter Generator
 *
 * Two-step generation:
 * 1. Deterministic merge of {{merge.fields}} via renderTemplate
 * 2. AI narrative generation for {{AI:section_name}} markers
 *
 * Produces a text letter and can convert to PDF with letterhead.
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import { renderTemplate } from "@/lib/templates/render";
import { callAi } from "@/lib/pipeline/ai-client";
import type { GenerationContext } from "./context-builder";

const AI_SECTION_REGEX = /\{\{AI:([a-zA-Z_]+)\}\}/g;
const AI_MODEL = "anthropic/claude-3.5-sonnet";

export interface DemandLetterResult {
  content: string;
  tokensUsed: number;
  aiSections: string[];
  missing: string[];
}

/**
 * Build a context-aware prompt for an AI narrative section.
 */
export function buildSectionPrompt(sectionKey: string, context: GenerationContext): string {
  const findingsSummary = Object.entries(context.findings)
    .map(([key, val]) => `- ${key}: ${val}`)
    .join("\n");

  const sectionInstructions: Record<string, string> = {
    liability_narrative:
      "Write a concise liability narrative establishing the defendant's fault. " +
      "Reference specific facts from the extracted findings about the incident circumstances, " +
      "defendant's duty of care, and breach. Use formal legal language.",
    injury_narrative:
      "Write a narrative describing the claimant's injuries and their impact. " +
      "Reference specific medical findings, treatment history, and prognosis from the extracted data. " +
      "Describe the physical, emotional, and lifestyle impact.",
    damages_narrative:
      "Write a damages calculation narrative. Reference specific financial losses, " +
      "medical costs, lost earnings, and future care needs from the extracted findings. " +
      "Present a structured breakdown supporting the total demand amount.",
  };

  const instruction =
    sectionInstructions[sectionKey] ||
    `Write a professional legal narrative for the "${sectionKey.replace(/_/g, " ")}" section. ` +
      "Reference only facts from the extracted findings.";

  return [
    "You are a senior personal injury attorney drafting a formal demand letter.",
    "",
    `Matter: ${context.matter.reference} — ${context.matter.title}`,
    `Client: ${context.client.name}`,
    `Practice Area: ${context.matter.practiceArea}`,
    "",
    "Extracted Findings:",
    findingsSummary || "(No findings extracted)",
    "",
    `Section: ${sectionKey.replace(/_/g, " ")}`,
    "",
    instruction,
    "",
    "Constraints:",
    "- Only reference facts from the extracted findings above",
    "- Maximum 400 words",
    "- Formal legal tone appropriate for a demand letter",
    "- Do not include section headings — the text will be inserted inline",
  ].join("\n");
}

/**
 * Generate a demand letter by merging template fields and generating AI sections.
 */
export async function generateDemandLetter(
  context: GenerationContext,
  templateContent: string
): Promise<DemandLetterResult> {
  // Step 1: Deterministic merge of {{merge.fields}}
  const mergeData: Record<string, unknown> = {
    matter: context.matter,
    client: context.client,
    firm: context.firm,
    feeEarner: context.feeEarner,
    findings: context.findings,
    today: context.today,
  };
  const { content: merged, missing } = renderTemplate(templateContent, mergeData);

  // Step 2: Find and process {{AI:section_name}} markers
  const aiSections: string[] = [];
  let totalTokens = 0;
  let finalContent = merged;

  // Collect all AI markers
  const markers: Array<{ fullMatch: string; sectionKey: string }> = [];
  let match;
  const regex = new RegExp(AI_SECTION_REGEX.source, "g");
  while ((match = regex.exec(merged)) !== null) {
    markers.push({ fullMatch: match[0], sectionKey: match[1] });
  }

  // Generate AI content for each section
  for (const marker of markers) {
    const prompt = buildSectionPrompt(marker.sectionKey, context);

    const result = await callAi({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      maxTokens: 1024,
      timeoutMs: 60_000,
    });

    finalContent = finalContent.replace(marker.fullMatch, result.content);
    totalTokens += result.tokensUsed;
    aiSections.push(marker.sectionKey);
  }

  return {
    content: finalContent,
    tokensUsed: totalTokens,
    aiSections,
    missing,
  };
}

/**
 * Convert plain text letter to PDF with firm letterhead.
 */
export async function textToPdf(text: string, firmName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pages: PDFPage[] = [];
  let currentPage = doc.addPage([595, 842]); // A4
  pages.push(currentPage);

  const { width } = currentPage.getSize();

  // Letterhead
  let y = currentPage.getSize().height - 50;
  currentPage.drawText(firmName, { x: 50, y, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
  y -= 25;
  currentPage.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 30;

  // Body text
  const lines = text.split("\n");
  for (const line of lines) {
    if (y < 80) {
      currentPage = doc.addPage([595, 842]);
      pages.push(currentPage);
      y = 790;
    }

    if (line.trim() === "") {
      y -= 12;
      continue;
    }

    y = addWrappedTextForLetter(currentPage, line, 50, y, 495, font, 10, 14);
    y -= 4;
  }

  // Footers
  for (let i = 0; i < pages.length; i++) {
    pages[i].drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width - 110,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    pages[i].drawText("Confidential", {
      x: 50,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return doc.save();
}

function addWrappedTextForLetter(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color: rgb(0, 0, 0) });
      currentY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color: rgb(0, 0, 0) });
    currentY -= lineHeight;
  }

  return currentY;
}
