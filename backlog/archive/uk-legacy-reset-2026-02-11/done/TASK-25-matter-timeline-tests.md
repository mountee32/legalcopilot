# TASK-25: Integration Tests for Matter Timeline

## Priority: High

## Summary

Add integration tests for the matter timeline endpoint.

## Endpoint to Test

### `/api/matters/[id]/timeline` (GET)

- Return chronological activity feed for a matter
- Include: documents, emails, tasks, time entries, calendar events
- Support pagination
- Support filtering by activity type
- Multi-tenancy isolation

## Test Scenarios

1. Get timeline - empty matter (no activities)
2. Get timeline - with documents
3. Get timeline - with emails
4. Get timeline - with tasks
5. Get timeline - with time entries
6. Get timeline - with calendar events
7. Get timeline - mixed activities sorted by date
8. Get timeline - pagination (limit/offset)
9. Get timeline - filter by activity type
10. Get timeline - wrong firm matter (404)

## Acceptance Criteria

- [ ] 10+ tests covering timeline endpoint
- [ ] All activity types included in timeline
- [ ] Chronological ordering verified
- [ ] Pagination working correctly
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database

## Files to Create/Modify

- `tests/integration/matters/timeline.test.ts` (new)
