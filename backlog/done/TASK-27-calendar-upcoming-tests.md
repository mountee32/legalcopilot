# TASK-27: Integration Tests for Calendar Upcoming

## Priority: Medium

## Summary

Add integration tests for the upcoming calendar events endpoint.

## Endpoint to Test

### `/api/calendar/upcoming` (GET)

- Return events within specified time window (default: 7 days)
- Support custom date range
- Include all event types
- Sort by start date
- Multi-tenancy isolation

## Test Scenarios

1. Get upcoming - no events in window
2. Get upcoming - events in next 7 days
3. Get upcoming - custom date range
4. Get upcoming - verify chronological order
5. Get upcoming - exclude past events
6. Get upcoming - include recurring events
7. Get upcoming - filter by attendee (current user)
8. Get upcoming - multi-tenancy isolation

## Acceptance Criteria

- [ ] 8+ tests covering upcoming endpoint
- [ ] Date range filtering working
- [ ] Chronological ordering verified
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database

## Files to Create/Modify

- `tests/integration/calendar/upcoming.test.ts` (new)
