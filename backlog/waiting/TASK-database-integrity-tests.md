# Database Integrity Tests

## Priority: High

## Effort: Medium

## Summary

Add integration tests that verify actual database queries, constraints, and transactions work correctly. Current unit tests mock `withFirmDb`, so real SQL is untested.

## Tests Needed

### Foreign Key Constraints

- [ ] Cannot create matter with non-existent clientId
- [ ] Cannot create time entry with non-existent matterId
- [ ] Cannot create invoice with non-existent clientId
- [ ] Deleting client fails if matters exist (or cascades appropriately)
- [ ] Deleting matter fails if time entries exist (or cascades appropriately)

### Unique Constraints

- [ ] Duplicate client reference within same firm rejected
- [ ] Duplicate matter reference within same firm rejected
- [ ] Duplicate invoice number within same firm rejected
- [ ] Same reference allowed in different firms

### Transaction Rollback

- [ ] Partial failure in bulk task creation rolls back all
- [ ] Partial failure in invoice generation rolls back
- [ ] Approval execution failure rolls back status change

### Query Correctness

- [ ] Pagination returns correct slices (offset/limit)
- [ ] Filters correctly compose (AND logic)
- [ ] Search queries use proper indexing (ILIKE patterns)
- [ ] Date range queries handle timezone correctly

### Data Types

- [ ] Money fields store/retrieve with correct precision
- [ ] Timestamps preserve timezone information
- [ ] JSONB fields handle complex nested structures
- [ ] UUID generation is unique across high concurrency

## Files to Create

- `tests/integration/db/constraints.test.ts`
- `tests/integration/db/transactions.test.ts`
- `tests/integration/db/queries.test.ts`

## Acceptance Criteria

- Tests run against real PostgreSQL (via Docker)
- Each constraint type has explicit test coverage
