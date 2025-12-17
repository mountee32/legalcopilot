# Concurrent Access Tests

## Priority: Low

## Effort: High

## Summary

Add tests for race conditions and concurrent modifications to ensure data integrity under parallel access.

## Tests Needed

### Optimistic Locking

- [ ] Update with stale version returns 409 Conflict
- [ ] Update with current version succeeds
- [ ] Version number increments on each update
- [ ] Concurrent updates to same record - one fails

### Race Conditions

- [ ] Two users editing same matter - second save warned
- [ ] Two users approving same request - only one succeeds
- [ ] Concurrent invoice generation for same time entries
- [ ] Concurrent reference number generation is unique

### Deadlock Prevention

- [ ] Bulk operations acquire locks in consistent order
- [ ] Long-running transactions timeout appropriately
- [ ] Deadlock detection and retry

### Read Consistency

- [ ] List query during bulk update returns consistent state
- [ ] Pagination during concurrent inserts is stable
- [ ] Aggregate calculations (totals) are consistent

### Idempotency

- [ ] Duplicate POST with idempotency key returns same result
- [ ] Retry of failed request doesn't create duplicates
- [ ] Webhook replay doesn't duplicate side effects

## Files to Create

- `tests/integration/concurrency/optimistic-locking.test.ts`
- `tests/integration/concurrency/race-conditions.test.ts`
- `tests/integration/concurrency/idempotency.test.ts`

## Test Infrastructure

- Use Promise.all to simulate concurrent requests
- Add artificial delays to increase race window
- Run with multiple database connections

## Acceptance Criteria

- All concurrent modification scenarios tested
- No data corruption under parallel access
- Appropriate error messages for conflicts
