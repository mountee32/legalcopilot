# FEAT: AI-Powered Document Upload

**Status:** DONE (Phase 1 Complete)
**QA:** APPROVED 2024-12-18

## Overview

Redesign document upload to use multimodal AI (Gemini Flash) for intelligent document processing. AI reads PDFs directly, extracts metadata, classifies type, identifies entities, and generates summaries.

## Approach

Use `google/gemini-3-flash-preview` via OpenRouter - multimodal model that can read PDFs directly. No traditional OCR needed.

**Note:** Uses direct OpenRouter API calls (not Vercel AI SDK) because OpenRouter requires a specific format for PDF uploads:

```typescript
{
  type: "file",
  file: {
    filename: "document.pdf",
    file_data: "data:application/pdf;base64,..."
  }
}
```

---

## Phase 1: Backend API (Prove it works)

Build and test the AI document processing pipeline using existing demo PDFs.

### Step 1: Schema Migration

Add new columns to `lib/db/schema/documents.ts`:

```typescript
// AI analysis fields
aiConfidence: integer("ai_confidence"),           // 0-100 score
extractedParties: jsonb("extracted_parties"),     // [{name, role}]
extractedDates: jsonb("extracted_dates"),         // [{label, date}]
analyzedAt: timestamp("analyzed_at"),             // when AI analysis completed
aiTokensUsed: integer("ai_tokens_used"),          // for cost tracking
aiModel: text("ai_model"),                        // model used for analysis
```

Also make `matterId` nullable so documents can be uploaded before assigning to a matter:

```typescript
matterId: uuid("matter_id").references(() => matters.id),  // remove .notNull()
```

Make `type` nullable with default so AI can set it:

```typescript
type: documentTypeEnum("type").default("other"),  // remove .notNull(), AI will set
```

Run `npm run db:push` to apply.

### Step 2: Gemini Flash Integration

Create new module `lib/documents/analyze.ts`:

```typescript
interface AnalyzeDocumentResult {
  suggestedTitle: string;
  documentType: DocumentType;
  documentDate: string | null;
  parties: Array<{ name: string; role: string }>;
  keyDates: Array<{ label: string; date: string }>;
  summary: string;
  confidence: number;
  confidenceLevel: "green" | "amber" | "red";
  tokensUsed: number;
  model: string;
}
```

Implementation:

- Download PDF from MinIO as Buffer
- Convert to base64 data URL
- Call OpenRouter with `google/gemini-3-flash-preview`
- Send PDF in message content as `image_url` with `data:application/pdf;base64,...`
- Structured prompt requesting JSON output
- Parse response with Zod validation
- Map confidence to RAG levels:
  - Green: 80-100 (high confidence)
  - Amber: 50-79 (medium confidence, review recommended)
  - Red: 0-49 (low confidence, manual review required)
- Extract token usage from response for cost tracking

### Step 3: API Endpoint

Create `app/api/documents/[id]/analyze/route.ts`:

```
POST /api/documents/[id]/analyze
```

**Request body:** `{ force?: boolean }` (optional, to re-analyze)

**Response:**

```json
{
  "success": true,
  "analysis": {
    "suggestedTitle": "Contract for Sale - 15 Willow Lane",
    "documentType": "contract",
    "documentDate": "2024-11-15",
    "parties": [
      { "name": "Margaret Thompson", "role": "Buyer" },
      { "name": "David Davidson", "role": "Seller" }
    ],
    "keyDates": [
      { "label": "Completion Date", "date": "2024-12-20" },
      { "label": "Contract Date", "date": "2024-11-15" }
    ],
    "summary": "Standard contract for sale of freehold residential property at 15 Willow Lane, Richmond for £850,000. Completion scheduled for 20th December 2024.",
    "confidence": 92,
    "confidenceLevel": "green"
  },
  "usage": {
    "tokensUsed": 1847,
    "model": "google/gemini-2.0-flash-001"
  }
}
```

**Behaviour:**

- Requires `documents:write` + `ai:use` permissions
- Returns cached result if `analyzedAt` exists (unless `force: true`)
- Saves all extracted fields to document record
- Updates document `type` field based on AI classification
- Creates timeline event `document_analyzed`
- Logs token usage to document record

### Step 4: Async Job Support

Add async mode for background processing:

```
POST /api/documents/[id]/analyze?async=true
```

Returns immediately:

```json
{ "accepted": true, "jobId": "uuid" }
```

- Registers job in `jobs` table with name `document:analyze`
- BullMQ worker processes in background
- Client polls `/api/jobs/[id]` for status and result

### Step 5: Unit Tests

Create `tests/unit/lib/documents/analyze.test.ts`:

- Test prompt construction
- Test response parsing with valid JSON
- Test response parsing with malformed JSON
- Test confidence level mapping (green/amber/red thresholds)
- Test error handling (API errors, timeouts)
- Test token usage extraction
- Mock OpenRouter responses

### Step 6: Integration Test

Create `tests/integration/documents/analyze.test.ts`:

- Test with real demo PDFs from MinIO
- Test contract document (doc1 - property contract)
- Test letter document (doc3 - solicitor letter)
- Test court form document (doc4 - particulars of claim)
- Verify extracted data saved to database
- Verify timeline event created
- Verify token usage logged

**Test data:** Use existing demo PDFs generated by `tests/fixtures/demo-data/demo-documents.ts`

### Acceptance Criteria

- [x] Schema migration applied with new columns
- [x] `matterId` nullable on documents table
- [x] `type` has default value, AI sets it
- [x] New `/api/documents/[id]/analyze` endpoint working
- [x] Uses Gemini Flash via OpenRouter
- [x] Returns structured JSON with all extracted fields
- [x] Confidence shown as RAG (red/amber/green)
- [x] Saves results to document record
- [x] Token usage tracked per document
- [x] Works with existing demo PDFs
- [x] Async mode with job tracking
- [x] Unit tests passing (26 tests)
- [x] Integration tests passing (3/3 demo PDFs)

### Test Results

| Document             | Type       | Confidence   | Tokens | Time  |
| -------------------- | ---------- | ------------ | ------ | ----- |
| Contract for Sale    | contract   | 100% (GREEN) | 2145   | 3.16s |
| Solicitor Letter     | letter_out | 100% (GREEN) | 1161   | 3.97s |
| Particulars of Claim | court_form | 95% (GREEN)  | 1073   | 3.31s |

---

## Phase 2: Upload Flow Integration

Wire analysis into upload flow - analyze runs automatically after upload.

**Changes:**

- After file upload completes, automatically trigger analyze
- Support async mode (returns job ID, polls for completion)
- Document starts with `type: null`, AI sets it

**Acceptance criteria:**

- [ ] Upload -> analyze runs automatically
- [ ] Async processing with job tracking
- [ ] Timeline event created for analysis

---

## Phase 3: Frontend Upload Wizard

New multi-step upload modal with AI-assisted metadata.

**Steps:**

1. Upload File (drag/drop) - no matter selection required yet
2. AI Processing (progress indicator)
3. Review & Edit (AI-populated fields, user can override)
4. Assign to Matter (search and select, or create new)

**Acceptance criteria:**

- [ ] 4-step wizard modal
- [ ] Drag-drop file upload
- [ ] Processing state with visual feedback
- [ ] Confidence shown as RAG colours
- [ ] Editable review form with AI suggestions
- [ ] Matter search with instant results
- [ ] Save creates document with all metadata

---

## Phase 4: Document List Improvements

Enhanced filtering and detail view.

**Features:**

- Case filter (instant search, not dropdown)
- Type and status dropdown filters
- Active filter chips with clear
- Document detail slide-in panel
- URL-persisted filters (shareable)

---

## Technical Notes

### Gemini Flash Prompt

```
You are a legal document analyzer for a UK law firm. Analyze the provided PDF document and extract the following information. Return your response as valid JSON only, no markdown.

{
  "suggestedTitle": "A concise title for this document",
  "documentType": "one of: letter_in, letter_out, email_in, email_out, contract, court_form, evidence, note, id_document, financial, other",
  "documentDate": "YYYY-MM-DD format or null if not found",
  "parties": [
    { "name": "Full name", "role": "Role in document (e.g., Buyer, Seller, Claimant, Defendant, Witness)" }
  ],
  "keyDates": [
    { "label": "Description of date (e.g., Completion Date, Deadline)", "date": "YYYY-MM-DD" }
  ],
  "summary": "2-3 sentence summary of the document's purpose and key points",
  "confidence": 0-100
}

Focus on UK legal terminology and conventions.
```

### Model Configuration

- **Model:** `google/gemini-3-flash-preview` via OpenRouter
- **Max tokens:** 2000 (response only)
- **Temperature:** 0.1 (low for consistency)
- Supports PDF input directly as base64

### Existing Infrastructure

| Component           | Location                                     | Status       |
| ------------------- | -------------------------------------------- | ------------ |
| OpenRouter client   | `lib/ai/openrouter.ts`                       | Ready        |
| MinIO file download | `lib/storage/minio.ts`                       | Ready        |
| BullMQ jobs         | `lib/queue/`                                 | Ready        |
| Jobs table          | `lib/db/schema/jobs.ts`                      | Ready        |
| Timeline events     | `lib/timeline/createEvent.ts`                | Ready        |
| Demo PDFs           | `tests/fixtures/demo-data/demo-documents.ts` | 12 documents |

### Cost Tracking

Token usage logged to `documents.aiTokensUsed` for each analysis. Can aggregate for billing/monitoring:

```sql
SELECT
  DATE(analyzed_at) as date,
  COUNT(*) as documents_analyzed,
  SUM(ai_tokens_used) as total_tokens
FROM documents
WHERE analyzed_at IS NOT NULL
GROUP BY DATE(analyzed_at);
```

---

## Solution Design

### Existing Code to Reuse

| Component         | Location                                  | Reuse                                            |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| OpenRouter client | `lib/ai/openrouter.ts`                    | Extend `models` object, use `generateText`       |
| MinIO download    | `lib/storage/minio.ts` → `downloadFile()` | Direct reuse                                     |
| Document schema   | `lib/db/schema/documents.ts`              | Modify (add columns)                             |
| API schemas       | `lib/api/schemas/documents.ts`            | Extend with analyze schemas                      |
| Summarize pattern | `lib/documents/summarize.ts`              | Copy pattern for JSON parsing                    |
| Test mocks        | `tests/helpers/mocks.ts`                  | Use `mockWithFirmDbSuccess`, `createMockRequest` |

### Files to Create

| File                                                      | Purpose                                      |
| --------------------------------------------------------- | -------------------------------------------- |
| `lib/documents/analyze.ts`                                | Core AI analysis function using Gemini Flash |
| `app/api/documents/[id]/analyze/route.ts`                 | API endpoint                                 |
| `lib/api/schemas/analyze.ts`                              | Zod schemas for request/response             |
| `tests/unit/lib/documents/analyze.test.ts`                | Unit tests                                   |
| `tests/unit/app/api/documents/[id]/analyze/route.test.ts` | API route tests                              |
| `tests/integration/documents/analyze.test.ts`             | Integration tests with real PDFs             |

### Files to Modify

| File                           | Change                                      |
| ------------------------------ | ------------------------------------------- |
| `lib/db/schema/documents.ts`   | Add 6 new columns, make `matterId` nullable |
| `lib/ai/openrouter.ts`         | Add `gemini-flash` to models object         |
| `lib/api/schemas/documents.ts` | Export new analyze schemas                  |
| `lib/api/schemas/index.ts`     | Re-export analyze schemas                   |

### API Schema Additions

```typescript
// lib/api/schemas/documents.ts - add these

export const AnalyzeDocumentRequestSchema = z
  .object({
    force: z.boolean().optional(),
  })
  .openapi("AnalyzeDocumentRequest");

export const ExtractedPartySchema = z
  .object({
    name: z.string(),
    role: z.string(),
  })
  .openapi("ExtractedParty");

export const ExtractedDateSchema = z
  .object({
    label: z.string(),
    date: z.string(), // YYYY-MM-DD
  })
  .openapi("ExtractedDate");

export const ConfidenceLevelSchema = z.enum(["green", "amber", "red"]).openapi("ConfidenceLevel");

export const DocumentAnalysisSchema = z
  .object({
    suggestedTitle: z.string(),
    documentType: DocumentTypeSchema,
    documentDate: z.string().nullable(),
    parties: z.array(ExtractedPartySchema),
    keyDates: z.array(ExtractedDateSchema),
    summary: z.string(),
    confidence: z.number().int().min(0).max(100),
    confidenceLevel: ConfidenceLevelSchema,
  })
  .openapi("DocumentAnalysis");

export const AnalyzeDocumentResponseSchema = z
  .object({
    success: z.literal(true),
    analysis: DocumentAnalysisSchema,
    usage: z.object({
      tokensUsed: z.number().int(),
      model: z.string(),
    }),
  })
  .openapi("AnalyzeDocumentResponse");
```

---

## Test Strategy

### Unit Tests

#### `tests/unit/lib/documents/analyze.test.ts`

- [ ] `analyzeDocument` - returns analysis for valid PDF buffer
- [ ] `analyzeDocument` - throws when PDF is empty/corrupted
- [ ] `analyzeDocument` - handles malformed JSON from model gracefully
- [ ] `analyzeDocument` - maps confidence 80-100 to "green"
- [ ] `analyzeDocument` - maps confidence 50-79 to "amber"
- [ ] `analyzeDocument` - maps confidence 0-49 to "red"
- [ ] `analyzeDocument` - extracts token usage from response
- [ ] `buildAnalyzePrompt` - constructs correct prompt structure

#### `tests/unit/app/api/documents/[id]/analyze/route.test.ts`

- [ ] POST - returns analysis for document with upload
- [ ] POST - returns cached result when `analyzedAt` exists
- [ ] POST - re-analyzes when `force: true` passed
- [ ] POST - returns 404 for non-existent document
- [ ] POST - returns 400 for document without upload
- [ ] POST - returns 401 for unauthenticated request
- [ ] POST - returns 403 without `documents:write` permission
- [ ] POST - returns 403 without `ai:use` permission
- [ ] POST - saves analysis to document record
- [ ] POST - creates timeline event

### Integration Tests

#### `tests/integration/documents/analyze.test.ts`

- [ ] Analyzes property contract PDF (doc1) - extracts buyer/seller parties
- [ ] Analyzes solicitor letter PDF (doc3) - extracts recipient/sender
- [ ] Analyzes court form PDF (doc4) - extracts claimant/defendant
- [ ] Saves extracted data to database correctly
- [ ] Creates timeline event with correct metadata
- [ ] Logs token usage to document record
- [ ] Handles async mode - creates job and processes

### Mock Patterns

```typescript
// Mock global fetch for unit tests (direct OpenRouter API calls)
function mockFetchResponse(responseData: object, status = 200) {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
  };
  global.fetch = vi.fn().mockResolvedValue(mockResponse);
}

// Create OpenRouter API response
function createOpenRouterResponse(content: string, totalTokens = 1500) {
  return {
    id: "gen-123",
    choices: [{ message: { content } }],
    usage: { total_tokens: totalTokens },
  };
}

// Example usage
mockFetchResponse(createOpenRouterResponse(JSON.stringify({
  suggestedTitle: "Test Document",
  documentType: "contract",
  documentDate: "2024-01-15",
  parties: [{ name: "Test Party", role: "Buyer" }],
  keyDates: [{ label: "Completion", date: "2024-02-15" }],
  summary: "Test summary",
  confidence: 85,
})));

// Mock MinIO download
vi.mock("@/lib/storage/minio", () => ({
  downloadFile: vi.fn().mockResolvedValue(Buffer.from("mock pdf content")),
}));

// Use withFirmDb helpers from tests/helpers/mocks.ts
vi.mocked(withFirmDb).mockImplementation(
  mockWithFirmDbSuccess({ id: "doc-1", uploadId: "upload-1", ... })
);
```

---

## Out of Scope (for now)

- Related document matching
- Image file support (JPG, PNG)
- Document versioning UI
- Batch upload
- Re-analysis scheduling
