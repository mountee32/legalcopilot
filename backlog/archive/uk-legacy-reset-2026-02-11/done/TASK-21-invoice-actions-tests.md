# TASK-21: Integration Tests for Invoice Actions

## Priority: High

## Summary

Add integration tests for invoice action endpoints that are currently untested.

## Endpoints to Test

### `/api/invoices/[id]/send` (POST)

- Send draft invoice to client
- Validate invoice is in draft status before sending
- Update status to 'sent'
- Record sent timestamp
- Multi-tenancy: prevent sending another firm's invoice
- Validation: reject if already sent/paid/void

### `/api/invoices/[id]/void` (POST)

- Void an invoice
- Allow voiding draft or sent invoices
- Prevent voiding paid invoices (or require flag)
- Record void reason and timestamp
- Multi-tenancy isolation
- Validation: reject if already void

## Test Scenarios

1. Send invoice - success case
2. Send invoice - already sent (should fail)
3. Send invoice - wrong firm (404)
4. Void draft invoice - success
5. Void sent invoice - success
6. Void paid invoice - should fail or warn
7. Void already void invoice - should fail
8. Void wrong firm invoice (404)

## Acceptance Criteria

- [ ] 8+ tests covering send/void endpoints
- [ ] Multi-tenancy isolation verified
- [ ] Status transition rules enforced
- [ ] All tests use real database

## Files to Create/Modify

- `tests/integration/invoices/actions.test.ts` (new)
