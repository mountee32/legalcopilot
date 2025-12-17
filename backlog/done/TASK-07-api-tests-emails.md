# TASK: Integration tests for Emails API

## Priority: 7 (Depends on Clients, Matters)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests

## Endpoints to Test

| Method | Endpoint                      | Current Coverage |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/emails`                 | ❌ Unit only     |
| POST   | `/api/emails`                 | ❌ Unit only     |
| GET    | `/api/emails/[id]`            | ❌ None          |
| PATCH  | `/api/emails/[id]`            | ❌ None          |
| POST   | `/api/emails/[id]/ai/process` | ❌ Unit only     |

## Test Scenarios Required

### CRUD Operations

- [x] Create email record (inbound)
- [x] Create email draft (outbound)
- [x] Get email by ID with full content
- [x] Update email (link to matter, mark read)
- [x] List emails with filtering
- [x] Filter by matter, client, direction, date

### Email Linking

- [x] Link email to matter
- [x] Link email to client
- [x] Auto-link based on sender/recipient (AI-suggested matter link)

### AI Processing

- [x] Process email to extract intent
- [x] Classify email type (AI intent/sentiment)
- [x] Extract action items (AI suggested tasks)

### Multi-tenancy

- [x] Emails isolated by firm
- [x] Cannot access other firm's emails

## Test File Location

`tests/integration/emails/crud.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Email linking verified
- [x] All tests pass with `npm run test:integration`

## Implementation Summary

✅ **Completed** - All 38 tests passing

### Files Created

1. `tests/fixtures/factories/email.ts` - Email factory with helpers for creating test emails
2. `tests/integration/emails/crud.test.ts` - Comprehensive integration tests

### Test Coverage

- **CRUD Operations**: Create (inbound/outbound/draft), Read, Update, Soft Delete
- **Email Filtering**: By direction, status, matter, date range, subject, read status, AI processing
- **Email Linking**: Link to matters, AI-suggested links, unlink, retrieve by matter
- **Email Threads**: Thread creation, reply linking, thread retrieval
- **Pagination**: Standard pagination with offset/limit
- **Multi-Tenancy**: Firm isolation, cross-firm access prevention
- **AI Processing**: Intent classification, sentiment analysis, urgency scoring, task suggestions
- **Data Integrity**: Matter deletion handling, duplicate handling

### Factory Functions

- `createEmail()` - Generic email creation
- `createInboundEmail()` - Received emails
- `createOutboundEmail()` - Sent emails
- `createDraftEmail()` - Draft emails
- `createSentEmail()` - Sent emails with timestamp
- `createProcessedEmail()` - AI-processed emails
- `createManyEmails()` - Bulk creation for pagination
- `createEmailThread()` - Email thread with replies
