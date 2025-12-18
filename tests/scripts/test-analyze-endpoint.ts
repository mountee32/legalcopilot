/**
 * Manual test script for document analyze endpoint
 *
 * Tests the analyze endpoint with real demo PDFs and actual OpenRouter API
 *
 * Usage: npx tsx tests/scripts/test-analyze-endpoint.ts
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { documents, uploads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { downloadFile } from "@/lib/storage/minio";
import { analyzeDocument } from "@/lib/documents/analyze";

const DEMO_DOC_IDS = {
  contract: "de000000-0000-4000-a008-000000000001", // Contract for Sale - 15 Willow Lane
  letter: "de000000-0000-4000-a008-000000000003", // Letter to Seller's Solicitor
  courtForm: "de000000-0000-4000-a008-000000000004", // Particulars of Claim
};

async function testDocument(docId: string, description: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`Document ID: ${docId}`);
  console.log("=".repeat(60));

  // Get document and upload info
  const [doc] = await db
    .select({
      id: documents.id,
      title: documents.title,
      uploadId: documents.uploadId,
    })
    .from(documents)
    .where(eq(documents.id, docId))
    .limit(1);

  if (!doc) {
    console.error("❌ Document not found");
    return;
  }

  console.log(`Found document: ${doc.title}`);

  if (!doc.uploadId) {
    console.error("❌ Document has no upload");
    return;
  }

  // Get upload record
  const [upload] = await db
    .select({
      bucket: uploads.bucket,
      path: uploads.path,
    })
    .from(uploads)
    .where(eq(uploads.id, doc.uploadId))
    .limit(1);

  if (!upload) {
    console.error("❌ Upload record not found");
    return;
  }

  console.log(`Downloading from MinIO: ${upload.bucket}/${upload.path}`);

  // Download PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await downloadFile(upload.bucket, upload.path);
    console.log(`✓ Downloaded PDF (${pdfBuffer.length} bytes)`);
  } catch (error) {
    console.error("❌ Failed to download PDF:", error);
    return;
  }

  // Analyze with Gemini Flash
  console.log("\nAnalyzing with Gemini Flash...");
  const startTime = Date.now();

  try {
    const result = await analyzeDocument(pdfBuffer);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✓ Analysis complete in ${duration}s`);
    console.log("\n--- RESULTS ---");
    console.log(`Suggested Title: ${result.suggestedTitle}`);
    console.log(`Document Type: ${result.documentType}`);
    console.log(`Document Date: ${result.documentDate || "Not found"}`);
    console.log(`Confidence: ${result.confidence}% (${result.confidenceLevel.toUpperCase()})`);
    console.log(`\nSummary: ${result.summary}`);

    console.log(`\nParties (${result.parties.length}):`);
    result.parties.forEach((p) => console.log(`  - ${p.name} (${p.role})`));

    console.log(`\nKey Dates (${result.keyDates.length}):`);
    result.keyDates.forEach((d) => console.log(`  - ${d.label}: ${d.date}`));

    console.log(`\nTokens Used: ${result.tokensUsed}`);
    console.log(`Model: ${result.model}`);

    return result;
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    return null;
  }
}

async function main() {
  console.log("Document Analyze Endpoint - Integration Test");
  console.log("============================================\n");

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY is not set");
    process.exit(1);
  }

  console.log("✓ OPENROUTER_API_KEY is configured");

  const results: Record<string, any> = {};

  // Test contract document
  results.contract = await testDocument(DEMO_DOC_IDS.contract, "Contract for Sale");

  // Test letter document
  results.letter = await testDocument(DEMO_DOC_IDS.letter, "Solicitor Letter");

  // Test court form document
  results.courtForm = await testDocument(DEMO_DOC_IDS.courtForm, "Particulars of Claim");

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = Object.values(results).filter((r) => r !== null).length;
  const total = Object.keys(results).length;

  console.log(`\nPassed: ${passed}/${total}`);

  if (passed === total) {
    console.log("\n✓ All tests passed!");
  } else {
    console.log("\n✗ Some tests failed");
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
