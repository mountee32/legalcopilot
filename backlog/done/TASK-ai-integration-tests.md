# AI Integration Tests

## Priority: Medium

## Effort: Medium

## Summary

Add tests for AI-powered features using mocked OpenRouter responses. Current tests only verify "API key missing" errors.

## Design

- Keep all AI tests fully offline:
  - mock `generateText` from `ai` for completion-style flows
  - mock `globalThis.fetch` for embeddings (`lib/ai/embeddings.ts`)
- Prefer testing the smallest seam that owns parsing/validation:
  - `lib/documents/entities.ts` and `lib/documents/summarize.ts` for JSON parsing + schema validation
  - route-level tests for flows that also mutate the DB (e.g. `app/api/emails/[id]/ai/process/route.ts`)
- Cover malformed/empty responses explicitly and assert the system returns a safe error (or fallback) without persisting partial state.

## Tests Needed

### Document AI Extraction

- [x] Extracts entities from contract document (parties, dates, amounts)
- [x] Handles malformed AI response gracefully
- [ ] Extracts entities from court form (case number, parties, court)
- [ ] Handles documents with no extractable entities gracefully
- [ ] Rate limiting returns 429 with retry-after header

### Email AI Processing

- [x] Handles malformed AI response gracefully (invalid JSON returns 400)
- [x] Happy-path parses valid model JSON
- [ ] Classifies email intent correctly (inquiry, complaint, urgent)
- [ ] Extracts action items from email body
- [ ] Links email to correct matter based on content
- [ ] Handles non-English emails appropriately

### Calendar Event Suggestions

- [x] Creates approval request from suggested events (existing route tests)
- [ ] Does not suggest events for closed matters
- [ ] Handles matters with no relevant dates

### AI Response Handling

- [x] Malformed JSON response handled gracefully
- [ ] Empty response handled gracefully
- [ ] Model unavailable returns 503
- [ ] Timeout after 30 seconds returns appropriate error

### Audit Logging

- [ ] All AI requests logged with request ID
- [ ] Token usage recorded for billing
- [ ] Model selection logged for each request

## Files Created / Updated

- `tests/unit/lib/ai/openrouter.test.ts`
- `tests/unit/lib/documents/entities.test.ts`
- `tests/unit/lib/documents/summarize.test.ts`
- `tests/unit/app/api/emails/ai-process/route.test.ts` (adds malformed/valid JSON coverage)

## Acceptance Criteria

- [x] Tests run without external API calls
- [x] Each AI feature has happy path + error handling coverage (for implemented features)
