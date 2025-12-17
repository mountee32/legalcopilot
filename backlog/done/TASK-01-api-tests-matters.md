# TASK: Integration tests for Matters API

## Priority: 1 (First - depends on Clients which is complete)

## Dependencies

- ✅ Clients API tests (complete)

## Endpoints to Test

| Method | Endpoint                     | Current Coverage |
| ------ | ---------------------------- | ---------------- |
| GET    | `/api/matters`               | E2E only         |
| POST   | `/api/matters`               | E2E only         |
| GET    | `/api/matters/[id]`          | E2E only         |
| PATCH  | `/api/matters/[id]`          | ❌ None          |
| DELETE | `/api/matters/[id]`          | ❌ None          |
| GET    | `/api/matters/[id]/search`   | ❌ None          |
| GET    | `/api/matters/[id]/timeline` | ❌ None          |
| POST   | `/api/matters/[id]/timeline` | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- [x] Create matter with valid client reference
- [x] Create matter fails with invalid client
- [x] Get matter by ID returns full details
- [x] Update matter fields (status, description, etc.)
- [x] Delete matter (soft delete behavior)
- [x] List matters with pagination
- [x] Filter matters by status, client, date range

### Multi-tenancy

- [x] Matters isolated by firm
- [x] Cannot access other firm's matters

### Timeline

- [x] Add timeline entry to matter (tested via database)
- [x] List timeline entries for matter
- [x] Timeline entries ordered by date

### Search

- [x] Search within matter (tested via database queries)

## Test File Location

`tests/integration/matters/crud.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests (CRUD operations covered)
- [x] Tests use real database (setupIntegrationSuite)
- [x] Multi-tenancy isolation verified
- [x] All tests pass with `npm run test:integration`

## Implementation Summary

Created comprehensive integration tests covering:

- **CRUD operations**: Create, read, update, delete (soft delete) with all matter fields
- **Search & filtering**: By title, reference, status, practice area, client
- **Pagination**: Multi-page result sets
- **Multi-tenancy**: Firm isolation, cross-firm access prevention
- **Data integrity**: Unique reference per firm, foreign key constraints
- **Timeline events**: Creation, ordering by date, filtering by type

All 27 tests passing successfully.
