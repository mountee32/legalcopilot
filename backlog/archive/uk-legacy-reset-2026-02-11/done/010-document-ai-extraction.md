# Document AI Extraction & Summarization

## Priority: MEDIUM

## Summary

Implement AI-powered document processing: text extraction, summarization, and entity extraction. Fields exist in schema, need implementation.

## Requirements

- Extract text from uploaded documents (PDF, Word, images)
- Generate AI summaries
- Extract key entities (dates, parties, amounts)
- Store for search and RAG

## Scope

### API Routes

- `POST /api/documents/[id]/extract` - Extract text from document
- `POST /api/documents/[id]/summarize` - Generate AI summary
- `POST /api/documents/[id]/entities` - Extract entities

### Extraction Service (`lib/documents/extraction.ts`)

- PDF text extraction (pdf-parse or similar)
- Word document extraction (mammoth or similar)
- OCR for images/scanned PDFs (future: external service)

### Summarization Service (`lib/documents/summarize.ts`)

```typescript
summarizeDocument({
  documentId: string,
  extractedText: string,
  documentType: string, // affects prompt
});
// Returns: { summary: string, keyPoints: string[] }
```

### Entity Extraction (`lib/documents/entities.ts`)

```typescript
extractEntities({
  text: string,
  documentType: string,
});
// Returns: { dates: [], parties: [], amounts: [], addresses: [] }
```

### Updates to Document

- Update document.extractedText after extraction
- Update document.aiSummary after summarization
- Store entities in document.metadata

### API Schemas

- ExtractDocumentResponseSchema
- SummarizeDocumentResponseSchema
- DocumentEntitiesSchema

## Design

### Tenancy & Auth

- All document processing endpoints are firm-scoped and must validate document ownership (firmId derived from session).

### Background Jobs (avoid premature optimisation, keep UI fast)

- Extraction/summarization/entity extraction should enqueue BullMQ jobs for heavy work; API returns 202 + job id (or a simple `{ success: true }` in MVP with synchronous fallback).

### Data Flow

- Extract → write `documents.extractedText`
- Chunking is a separate step (already implemented); ensure re-chunking happens after extraction if needed.
- Summarize → write `documents.aiSummary`
- Entity extraction → write structured results into `documents.metadata` (JSONB) until stable.

### AI Safety (drafts vs approvals)

- AI outputs that would create/modify other entities (tasks, parties, deadlines, billing) must be proposed via `approval_requests` and only applied on approval.

### Tests

- Validate “document has no extracted text”/missing file errors, firm isolation, and job enqueue behavior.

## Dependencies

- OpenRouter AI integration (existing)
- File storage access (existing)

## Out of Scope (Phase 2)

- OCR for scanned documents
- Handwriting recognition
- Multi-language support

## References

- lib/db/schema/documents.ts (aiSummary, extractedText fields)
- lib/ai/openrouter.ts (existing AI integration)
