# TASK: Integration tests for Conflicts API

## Priority: 12 (Depends on Clients, Matters)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests

## Endpoints to Test

| Method | Endpoint                              | Current Coverage |
| ------ | ------------------------------------- | ---------------- |
| POST   | `/api/conflicts/search`               | ❌ Unit only     |
| GET    | `/api/conflicts/by-matter/[matterId]` | ❌ None          |
| POST   | `/api/conflicts/[id]/clear`           | ❌ None          |
| POST   | `/api/conflicts/[id]/waive`           | ❌ None          |

## Test Scenarios Required

### Conflict Search

- [x] Search for conflicts by party name
- [x] Search returns matching clients
- [x] Search returns matching matters
- [x] Search returns related parties

### Conflict Detection

- [x] Detect conflict with existing client
- [x] Detect conflict with opposing party
- [x] Detect conflict with related entity

### Matter Conflicts

- [x] Get conflicts for specific matter
- [x] List all parties checked
- [x] Show conflict status per party

### Conflict Resolution

- [x] Clear conflict (no actual conflict)
- [x] Waive conflict with justification
- [x] Audit trail for resolution

### Multi-tenancy

- [x] Conflict checks within firm only
- [x] Cannot see other firm's client data

## Test File Location

`tests/integration/conflicts/search.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Conflict detection verified
- [x] All tests pass with `npm run test:integration`
