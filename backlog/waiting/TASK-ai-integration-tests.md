# AI Integration Tests

## Priority: Medium

## Effort: Medium

## Summary

Add tests for AI-powered features using mocked OpenRouter responses. Current tests only verify "API key missing" errors.

## Tests Needed

### Document AI Extraction

- [ ] Extracts entities from contract document (parties, dates, amounts)
- [ ] Extracts entities from court form (case number, parties, court)
- [ ] Handles documents with no extractable entities gracefully
- [ ] Handles malformed AI response gracefully
- [ ] Rate limiting returns 429 with retry-after header

### Email AI Processing

- [ ] Classifies email intent correctly (inquiry, complaint, urgent)
- [ ] Extracts action items from email body
- [ ] Links email to correct matter based on content
- [ ] Handles non-English emails appropriately

### Calendar Event Suggestions

- [ ] Suggests deadlines from matter type (conveyancing timeline)
- [ ] Suggests follow-up dates based on matter activity
- [ ] Does not suggest events for closed matters
- [ ] Handles matters with no relevant dates

### AI Response Handling

- [ ] Timeout after 30 seconds returns appropriate error
- [ ] Malformed JSON response handled gracefully
- [ ] Empty response handled gracefully
- [ ] Model unavailable returns 503

### Audit Logging

- [ ] All AI requests logged with request ID
- [ ] Token usage recorded for billing
- [ ] Model selection logged for each request

## Files to Create

- `tests/unit/lib/ai/openrouter.test.ts`
- `tests/unit/app/api/documents/ai/extraction.test.ts`
- `tests/unit/app/api/emails/ai/classification.test.ts`
- `tests/unit/app/api/matters/ai/suggestions.test.ts`

## Mocking Strategy

Use `vi.mock` to intercept OpenRouter SDK calls and return fixture responses representing various AI outputs.

## Acceptance Criteria

- Tests run without external API calls
- Each AI feature has happy path + error handling coverage
