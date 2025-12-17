# Database Integrity Tests

## Priority: High

## Effort: Medium

## Summary

Add integration tests that verify actual database queries, constraints, and transactions work correctly. Current unit tests mock `withFirmDb`, so real SQL is untested.

## Design

- Run against real Postgres via Docker (`npm run test:integration`), with schema ensured by running Drizzle migrations at test startup.
- Use existing factories in `tests/fixtures/factories/*` to create baseline firm/client/matter data; assert DB-level behavior (FK/unique/transaction semantics), not mocked helpers.
- Keep tests deterministic by using per-test or per-suite firm IDs (`setupIntegrationSuite()` / `setupFreshFirmPerTest()`), and by cleaning up created rows in teardown.
- Focus on constraints that exist today in Drizzle migrations (FKs, unique indexes) and query correctness that maps to shipped endpoints (pagination/filter/search).

## Tests Needed

### Foreign Key Constraints

- [x] Cannot create matter with non-existent clientId
- [x] Cannot create time entry with non-existent matterId
- [x] Cannot create invoice with non-existent clientId
- [x] Deleting client fails if matters exist (or cascades appropriately)
- [x] Deleting matter fails if time entries exist (or cascades appropriately)

### Unique Constraints

- [x] Duplicate client reference within same firm rejected
- [x] Duplicate matter reference within same firm rejected
- [x] Duplicate invoice number within same firm rejected
- [x] Same reference allowed in different firms

### Transaction Rollback

- [x] Partial failure rolls back writes (generic rollback)
- [x] Dependent insert failure rolls back (invoice + line items)
- [ ] Approval execution failure rolls back status change

### Query Correctness

- [x] Pagination returns correct slices (offset/limit)
- [x] Filters correctly compose (AND logic)
- [x] Search queries support ILIKE patterns
- [ ] Date range queries handle timezone correctly

### Data Types

- [x] Money fields store/retrieve with correct precision
- [ ] Timestamps preserve timezone information
- [ ] JSONB fields handle complex nested structures
- [ ] UUID generation is unique across high concurrency

## Files Created

- `tests/integration/db/constraints.test.ts`
- `tests/integration/db/transactions.test.ts`
- `tests/integration/db/queries.test.ts`

## Acceptance Criteria

- [x] Tests run against real PostgreSQL (via Docker)
- [x] Each constraint type has explicit test coverage
- [x] Run via `npm run test:integration` (not part of default `npm test`)

## Notes

Tested 2025-12-17: All constraint, transaction, and query tests pass (15/15).
