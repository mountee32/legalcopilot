/**
 * AI Pipeline Evaluation Runner
 *
 * Runs classification and extraction against gold datasets,
 * computes metrics, and outputs reports.
 *
 * Usage: npx tsx tests/eval/runner.ts [--pack=workers-comp]
 */

import { buildClassificationPrompt, buildExtractionPrompt } from "@/lib/pipeline/prompts";
import { deduplicateFindings, type RawFinding } from "@/lib/pipeline/findings";
import { chunkTextOverlapping } from "@/lib/documents/chunking";
import { valuesMatch, calculateMetrics, formatReport } from "./metrics";
import type {
  GoldDataset,
  GoldDocument,
  ClassificationResult,
  ExtractionResult,
  EvalReport,
} from "./types";

// ---------------------------------------------------------------------------
// LLM caller (direct OpenRouter)
// ---------------------------------------------------------------------------

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; tokensUsed: number }> {
  const baseUrl =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to run eval");
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM call failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "{}",
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// ---------------------------------------------------------------------------
// Eval functions
// ---------------------------------------------------------------------------

/**
 * Load a gold dataset. Datasets are TypeScript modules in tests/eval/datasets/.
 */
async function loadDataset(packKey: string): Promise<GoldDataset> {
  try {
    const mod = await import(`./datasets/${packKey}.ts`);
    return mod.default || mod.dataset;
  } catch {
    throw new Error(
      `Dataset not found for pack "${packKey}". Create tests/eval/datasets/${packKey}.ts`
    );
  }
}

/**
 * Evaluate classification for a single document.
 */
async function evaluateClassification(
  doc: GoldDocument,
  docTypes: Array<{
    key: string;
    label: string;
    classificationHints: string | null;
    activatedCategories: unknown;
    id: string;
    packId: string;
    description: string | null;
    sortOrder: number;
    createdAt: Date;
  }>
): Promise<ClassificationResult> {
  const prompt = buildClassificationPrompt({
    documentTypes: docTypes as any,
    template: null,
    textSample: doc.text.slice(0, 2000),
  });

  try {
    const { content } = await callLLM(
      prompt.systemPrompt,
      prompt.userPrompt,
      prompt.model,
      prompt.temperature,
      prompt.maxTokens
    );

    const parsed = JSON.parse(content);
    const predictedType = parsed.documentType || null;
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;

    return {
      docId: doc.id,
      expectedType: doc.expectedDocType,
      predictedType,
      confidence,
      correct: predictedType === doc.expectedDocType,
    };
  } catch {
    return {
      docId: doc.id,
      expectedType: doc.expectedDocType,
      predictedType: null,
      confidence: 0,
      correct: false,
    };
  }
}

/**
 * Evaluate extraction for a single document.
 */
async function evaluateExtraction(
  doc: GoldDocument,
  categories: Array<{
    key: string;
    label: string;
    fields: Array<{
      key: string;
      label: string;
      dataType: string;
      examples: unknown;
      description: string | null;
      confidenceThreshold: string;
      requiresHumanReview: boolean;
      id: string;
      categoryId: string;
      sortOrder: number;
      createdAt: Date;
    }>;
    id: string;
    packId: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sortOrder: number;
    createdAt: Date;
  }>
): Promise<ExtractionResult[]> {
  const chunks = chunkTextOverlapping(doc.text, 2000, 400);
  const allRawFindings: RawFinding[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const prompt = buildExtractionPrompt({
      categories: categories as any,
      template: null,
      chunkText: chunks[i].text,
      chunkIndex: i,
      totalChunks: chunks.length,
      documentType: doc.expectedDocType,
    });

    try {
      const { content } = await callLLM(
        prompt.systemPrompt,
        prompt.userPrompt,
        prompt.model,
        prompt.temperature,
        prompt.maxTokens
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        continue;
      }

      const findings: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as Record<string, unknown>)?.findings)
          ? (parsed as Record<string, unknown[]>).findings
          : [];

      for (const f of findings) {
        if (typeof f === "object" && f !== null && "fieldKey" in f && "value" in f) {
          const finding = f as Record<string, unknown>;
          allRawFindings.push({
            categoryKey: String(finding.categoryKey || ""),
            fieldKey: String(finding.fieldKey || ""),
            value: String(finding.value || ""),
            confidence: Number(finding.confidence) || 0,
          });
        }
      }
    } catch {
      continue;
    }
  }

  const deduped = deduplicateFindings(allRawFindings);

  // Compare against gold findings
  const results: ExtractionResult[] = [];
  for (const gold of doc.expectedFindings) {
    const match = deduped.find(
      (f) =>
        f.categoryKey === gold.categoryKey &&
        f.fieldKey === gold.fieldKey &&
        valuesMatch(f.value, gold.value)
    );

    results.push({
      docId: doc.id,
      categoryKey: gold.categoryKey,
      fieldKey: gold.fieldKey,
      expectedValue: gold.value,
      extractedValue: match?.value || null,
      confidence: match?.confidence || 0,
      matched: !!match,
      required: gold.required ?? false,
    });
  }

  // Count false positives — extracted findings that don't match any gold finding
  const matchedKeys = new Set(doc.expectedFindings.map((g) => `${g.categoryKey}:${g.fieldKey}`));
  for (const f of deduped) {
    const key = `${f.categoryKey}:${f.fieldKey}`;
    if (!matchedKeys.has(key)) {
      results.push({
        docId: doc.id,
        categoryKey: f.categoryKey,
        fieldKey: f.fieldKey,
        expectedValue: "",
        extractedValue: f.value,
        confidence: f.confidence,
        matched: false,
        required: false,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export async function runEval(packKey: string): Promise<EvalReport> {
  console.log(`\nLoading dataset for pack: ${packKey}...`);
  const dataset = await loadDataset(packKey);
  console.log(`Found ${dataset.documents.length} test documents.`);

  // Load taxonomy seed for doc types and categories
  const seedMod = await import(`../fixtures/taxonomy-seeds/${packKey}.ts`);
  const seed = seedMod.workersCompSeed || seedMod.default;

  if (!seed) {
    throw new Error(`Taxonomy seed not found for pack "${packKey}"`);
  }

  const classificationResults: ClassificationResult[] = [];
  const extractionResults: ExtractionResult[] = [];

  // Build categories with fields for extraction
  const categoriesWithFields = seed.categories.map((cat: { id: string; key: string }) => ({
    ...cat,
    fields: seed.fields.filter((f: { categoryId: string }) => f.categoryId === cat.id),
  }));

  for (const doc of dataset.documents) {
    console.log(`  Evaluating: ${doc.id}...`);

    // Classification
    const classResult = await evaluateClassification(doc, seed.documentTypes);
    classificationResults.push(classResult);
    console.log(
      `    Classification: ${classResult.correct ? "PASS" : "FAIL"} ` +
        `(expected=${classResult.expectedType}, got=${classResult.predictedType}, ` +
        `conf=${(classResult.confidence * 100).toFixed(0)}%)`
    );

    // Extraction
    const extResults = await evaluateExtraction(doc, categoriesWithFields);
    extractionResults.push(...extResults);
    const matched = extResults.filter((r) => r.matched).length;
    const total = doc.expectedFindings.length;
    console.log(`    Extraction: ${matched}/${total} fields matched`);
  }

  const metrics = calculateMetrics(classificationResults, extractionResults);
  const report: EvalReport = {
    packKey,
    datasetName: dataset.name,
    timestamp: new Date().toISOString(),
    metrics,
    classificationResults,
    extractionResults,
  };

  console.log(formatReport(metrics, packKey));

  return report;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module || process.argv[1]?.includes("runner")) {
  const packArg = process.argv.find((a) => a.startsWith("--pack="));
  const packKey = packArg?.split("=")[1] || "workers-comp";

  runEval(packKey)
    .then((report) => {
      // Write JSON report to file
      const fs = require("fs");
      const outPath = `tests/eval/reports/${packKey}-${Date.now()}.json`;
      fs.mkdirSync("tests/eval/reports", { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${outPath}`);

      // Exit with failure if F1 < 0.6
      if (report.metrics.extraction.f1 < 0.6) {
        console.error(
          `\nFAIL: F1 score ${(report.metrics.extraction.f1 * 100).toFixed(1)}% is below 60% threshold`
        );
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Eval failed:", err);
      process.exit(1);
    });
}
