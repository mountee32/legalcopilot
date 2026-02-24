/**
 * AI Pipeline Evaluation Types
 *
 * Types for gold datasets, evaluation results, and metric calculations.
 */

export interface GoldFinding {
  categoryKey: string;
  fieldKey: string;
  value: string;
  /** If true, this field must be found for the eval to pass */
  required?: boolean;
}

export interface GoldDocument {
  /** Unique identifier for this test case */
  id: string;
  /** Document text content */
  text: string;
  /** Expected classification */
  expectedDocType: string;
  /** Expected findings */
  expectedFindings: GoldFinding[];
  /** Taxonomy pack key */
  packKey: string;
}

export interface GoldDataset {
  name: string;
  packKey: string;
  documents: GoldDocument[];
}

export interface ClassificationResult {
  docId: string;
  expectedType: string;
  predictedType: string | null;
  confidence: number;
  correct: boolean;
}

export interface ExtractionResult {
  docId: string;
  categoryKey: string;
  fieldKey: string;
  expectedValue: string;
  extractedValue: string | null;
  confidence: number;
  /** Whether the extracted value matches the expected value */
  matched: boolean;
  /** Whether this finding was required */
  required: boolean;
}

export interface EvalMetrics {
  /** Total documents evaluated */
  totalDocuments: number;
  /** Classification metrics */
  classification: {
    correct: number;
    total: number;
    accuracy: number;
    avgConfidence: number;
  };
  /** Extraction metrics */
  extraction: {
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1: number;
    avgConfidence: number;
  };
  /** Per-field breakdown */
  fieldBreakdown: Record<
    string,
    {
      expected: number;
      found: number;
      matched: number;
      precision: number;
      recall: number;
    }
  >;
}

export interface EvalReport {
  packKey: string;
  datasetName: string;
  timestamp: string;
  metrics: EvalMetrics;
  classificationResults: ClassificationResult[];
  extractionResults: ExtractionResult[];
}
