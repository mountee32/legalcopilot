# TASK-23: Integration Tests for Lead Conversion

## Priority: High

## Summary

Add integration tests for the lead conversion endpoint.

## Endpoint to Test

### `/api/leads/[id]/convert` (POST)

- Convert lead to client
- Optionally create matter during conversion
- Copy lead data to new client record
- Update lead status to 'converted'
- Link new client back to lead for audit trail
- Multi-tenancy isolation

## Test Scenarios

1. Convert lead to individual client - success
2. Convert lead to company client - success
3. Convert with matter creation - success
4. Convert - lead already converted (should fail)
5. Convert - lead archived (should fail)
6. Convert - wrong firm lead (404)
7. Convert - verify lead data copied to client
8. Convert - verify lead status updated
9. Convert with quote - verify quote linked to new client

## Acceptance Criteria

- [ ] 8+ tests covering conversion endpoint
- [ ] Data integrity between lead and client verified
- [ ] Status transitions enforced
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database

## Files to Create/Modify

- `tests/integration/intake/conversion.test.ts` (new)
