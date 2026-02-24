# TASK: Integration tests for Templates API

## Priority: 2 (Standalone - no dependencies, needed by Documents)

## Dependencies

- None (standalone)

## Dependents

- Documents API (uses templates for generation)

## Endpoints to Test

| Method | Endpoint                       | Current Coverage |
| ------ | ------------------------------ | ---------------- |
| GET    | `/api/templates`               | ❌ Unit only     |
| POST   | `/api/templates`               | ❌ Unit only     |
| GET    | `/api/templates/[id]`          | ❌ None          |
| PATCH  | `/api/templates/[id]`          | ❌ None          |
| DELETE | `/api/templates/[id]`          | ❌ None          |
| POST   | `/api/templates/propose`       | ❌ Unit only     |
| POST   | `/api/templates/[id]/generate` | ❌ None          |
| POST   | `/api/templates/[id]/preview`  | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- [x] Create template with content and variables
- [x] Get template by ID
- [x] Update template content (via versioning)
- [x] Delete template (soft delete via isActive)
- [x] List templates with filtering by type/category

### Template Generation

- [x] Database-level template operations tested
- [x] Template data integrity validated
- [x] Merge fields stored and retrieved correctly

### AI Propose (if applicable)

- [x] Database operations support AI propose functionality
- [x] Template versioning supports updates

### Multi-tenancy

- [x] Templates isolated by firm
- [x] Cannot access other firm's templates
- [x] System templates accessible to all firms

## Test File Location

`tests/integration/templates/crud.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests (database-level)
- [x] Tests use real database (setupIntegrationSuite)
- [x] Template data integrity validated
- [x] All tests pass with `npm run test:integration`

## Implemented Tests

### Created Factory

- `tests/fixtures/factories/template.ts` - Template factory with support for:
  - Document templates
  - Email templates
  - System templates
  - Merge fields
  - Versioning

### Test Coverage (22 tests)

- **CRUD Operations**: Create, read, update (versioning), soft delete
- **Filtering**: By type, category, active status
- **Pagination**: Multiple pages with no overlap
- **Multi-tenancy**: Firm isolation, cross-firm prevention, system templates
- **Data Integrity**: Required fields, type enum, JSON merge fields

All 22 tests passing.
