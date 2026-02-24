# TASK: Integration tests for Time Entries API

## Priority: 4 (Depends on Matters)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests

## Dependents

- Invoices API (invoices generated from time entries)
- Approvals API (time entries need approval)

## Endpoints to Test

| Method | Endpoint                        | Current Coverage |
| ------ | ------------------------------- | ---------------- |
| GET    | `/api/time-entries`             | ❌ Unit only     |
| POST   | `/api/time-entries`             | ❌ Unit only     |
| GET    | `/api/time-entries/[id]`        | ❌ None          |
| PATCH  | `/api/time-entries/[id]`        | ❌ None          |
| DELETE | `/api/time-entries/[id]`        | ❌ None          |
| POST   | `/api/time-entries/[id]/submit` | ❌ None          |
| POST   | `/api/time-entries/bulk/submit` | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- [x] Create time entry for matter
- [x] Get time entry by ID
- [x] Update time entry (hours, description, rate)
- [x] Delete draft time entry
- [x] List time entries with filtering
- [x] Filter by matter, user, date range, status

### Submission Workflow

- [x] Submit single time entry for approval
- [x] Bulk submit multiple time entries
- [x] Cannot edit submitted time entry
- [x] Cannot delete submitted time entry

### Validation

- [x] Requires valid matter reference
- [x] Requires positive hours
- [x] Rate defaults from user/matter settings

### Multi-tenancy

- [x] Time entries isolated by firm
- [x] Cannot access other firm's entries

## Test File Location

`tests/integration/time-entries/crud.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Submission workflow verified
- [x] All tests pass with `npm run test:integration`

## Completion Summary

- Created comprehensive integration tests with 36 test cases covering:
  - CRUD operations (create, read, update, delete)
  - Submission workflow (draft → submitted → approved → billed)
  - Filtering by matter, fee earner, status, and date ranges
  - Validation of matter/fee earner references
  - Multi-tenancy isolation between firms
- All 36 tests passing
- Tests follow existing patterns from clients integration tests
- Uses setupIntegrationSuite() for proper test isolation
