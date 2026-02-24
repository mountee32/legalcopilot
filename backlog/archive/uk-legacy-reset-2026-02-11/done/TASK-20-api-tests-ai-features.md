# TASK: Integration tests for AI Features API

## Priority: 20 (Final - depends on base entities)

## Dependencies

- TASK-01: Matters API tests
- TASK-03: Documents API tests
- TASK-07: Emails API tests

## Endpoints to Test

### Matter AI

| Method | Endpoint                                | Current Coverage |
| ------ | --------------------------------------- | ---------------- |
| POST   | `/api/matters/[id]/ai/ask`              | ❌ Unit only     |
| POST   | `/api/matters/[id]/ai/generate-tasks`   | ❌ Unit only     |
| POST   | `/api/matters/[id]/ai/suggest-calendar` | ❌ Unit only     |

### Document AI

| Method | Endpoint                      | Current Coverage |
| ------ | ----------------------------- | ---------------- |
| POST   | `/api/documents/ai/summarize` | ❌ Unit only     |
| POST   | `/api/documents/ai/extract`   | ❌ Unit only     |
| POST   | `/api/documents/ai/entities`  | ❌ Unit only     |

### Email AI

| Method | Endpoint                      | Current Coverage |
| ------ | ----------------------------- | ---------------- |
| POST   | `/api/emails/[id]/ai/process` | ❌ Unit only     |

## Test Scenarios Required

### Matter AI - Ask

- [ ] Ask question about matter
- [ ] Response includes context
- [ ] Response is relevant to matter

### Matter AI - Generate Tasks

- [ ] Generate tasks from matter details
- [ ] Tasks are actionable
- [ ] Tasks have reasonable due dates

### Matter AI - Suggest Calendar

- [ ] Suggest calendar events
- [ ] Events based on matter type
- [ ] Key dates identified

### Document AI - Summarize

- [ ] Summarize document content
- [ ] Summary captures key points
- [ ] Handle different document types

### Document AI - Extract

- [ ] Extract key information
- [ ] Extract dates, parties, amounts
- [ ] Structured output format

### Document AI - Entities

- [ ] Extract named entities
- [ ] People, organizations, locations
- [ ] Entity linking to database

### Email AI - Process

- [ ] Classify email intent
- [ ] Extract action items
- [ ] Suggest matter linking

### AI Audit

- [ ] All AI calls logged
- [ ] Input/output recorded
- [ ] Cost tracking

## Test File Location

`tests/integration/ai/features.test.ts`

## Note

These tests will call real AI APIs (OpenRouter). Consider:

- Using test API keys with spending limits
- Mocking for CI, real for staging
- Snapshot testing for consistency

## Acceptance Criteria

- [ ] All AI endpoints have integration tests
- [ ] Tests verify AI responses are reasonable
- [ ] Tests verify audit logging
- [ ] All tests pass with `npm run test:integration`
