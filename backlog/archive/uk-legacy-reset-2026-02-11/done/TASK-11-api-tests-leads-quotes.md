# TASK: Integration tests for Leads & Quotes API

## Priority: 11 (Standalone intake flow)

## Dependencies

- ✅ Clients API tests (complete) - leads convert to clients

## Endpoints to Test

### Leads

| Method | Endpoint                  | Current Coverage |
| ------ | ------------------------- | ---------------- |
| GET    | `/api/leads`              | ❌ Unit only     |
| POST   | `/api/leads`              | ❌ Unit only     |
| GET    | `/api/leads/[id]`         | ❌ None          |
| PATCH  | `/api/leads/[id]`         | ❌ None          |
| POST   | `/api/leads/[id]/convert` | ❌ None          |

### Quotes

| Method | Endpoint           | Current Coverage |
| ------ | ------------------ | ---------------- |
| GET    | `/api/quotes`      | ❌ Unit only     |
| POST   | `/api/quotes`      | ❌ Unit only     |
| GET    | `/api/quotes/[id]` | ❌ None          |
| PATCH  | `/api/quotes/[id]` | ❌ None          |

## Test Scenarios Required

### Lead CRUD

- [x] Create lead with contact info
- [x] Get lead by ID
- [x] Update lead status
- [x] List leads with filtering
- [x] Filter by status, source, date

### Lead Conversion

- [x] Convert lead to client
- [x] Conversion creates client record
- [x] Conversion creates matter if specified
- [x] Lead marked as converted

### Quote CRUD

- [x] Create quote for lead
- [x] Get quote by ID with line items
- [x] Update quote (items, amounts)
- [x] List quotes by lead/status

### Quote Workflow

- [x] Send quote to lead
- [x] Mark quote as accepted
- [x] Mark quote as rejected
- [x] Accepted quote triggers conversion

### Multi-tenancy

- [x] Leads/quotes isolated by firm
- [x] Cannot access other firm's data

## Test File Location

`tests/integration/intake/leads-quotes.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Lead → Client conversion verified
- [x] All tests pass with `npm run test:integration`

## Implementation Summary

- Created lead and quote factories at `tests/fixtures/factories/lead.ts` and `tests/fixtures/factories/quote.ts`
- Added 33 integration tests covering all CRUD operations, filtering, search, multi-tenancy, and conversion workflows
- All tests passing (33/33)
