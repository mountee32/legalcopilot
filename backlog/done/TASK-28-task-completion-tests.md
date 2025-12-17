# TASK-28: Integration Tests for Task Completion

## Priority: Medium

## Summary

Add integration tests for task completion and bulk time entry submission endpoints.

## Endpoints to Test

### `/api/tasks/[id]/complete` (POST)

- Mark task as completed
- Set completion timestamp
- Optionally add completion notes
- Prevent completing already completed tasks
- Multi-tenancy isolation

### `/api/time-entries/bulk/submit` (POST)

- Submit multiple time entries at once
- Validate all entries before submission
- Atomic operation (all or nothing)
- Multi-tenancy isolation

## Test Scenarios

### Task Completion

1. Complete task - success
2. Complete task - add completion notes
3. Complete task - already completed (should fail)
4. Complete task - wrong firm (404)

### Bulk Time Entry Submission

1. Submit multiple entries - success
2. Submit - all entries updated to submitted status
3. Submit - one invalid entry fails entire batch
4. Submit - entries from wrong firm rejected
5. Submit - already submitted entries rejected

## Acceptance Criteria

- [ ] 8+ tests covering both endpoints
- [ ] Atomic bulk operations verified
- [ ] Status transitions enforced
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database

## Files to Create/Modify

- `tests/integration/tasks/completion.test.ts` (new)
- `tests/integration/time-entries/bulk.test.ts` (new)
