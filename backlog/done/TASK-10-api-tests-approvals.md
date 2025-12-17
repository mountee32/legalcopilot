# TASK: Integration tests for Approvals API

## Priority: 10 (Depends on Time Entries, Invoices)

## Dependencies

- TASK-04: Time Entries API tests
- TASK-08: Invoices API tests

## Endpoints to Test

| Method | Endpoint                      | Current Coverage |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/approvals`              | ❌ None          |
| GET    | `/api/approvals/[id]`         | ❌ None          |
| POST   | `/api/approvals/[id]/approve` | ❌ None          |
| POST   | `/api/approvals/[id]/reject`  | ❌ None          |
| POST   | `/api/approvals/bulk/approve` | ❌ None          |
| POST   | `/api/approvals/bulk/reject`  | ❌ None          |

## Test Scenarios Required

### List & Filter

- [ ] List pending approvals
- [ ] List approvals by type (time entry, invoice)
- [ ] Filter by status (pending, approved, rejected)
- [ ] Filter by submitter, date range

### Approval Actions

- [ ] Approve single item
- [ ] Reject single item with reason
- [ ] Bulk approve multiple items
- [ ] Bulk reject multiple items

### Approval Effects

- [ ] Approved time entry can be invoiced
- [ ] Rejected time entry returns to draft
- [ ] Approval creates audit trail

### Permission Checks

- [ ] Only approvers can approve
- [ ] Cannot approve own submissions
- [ ] Approval hierarchy respected

### Multi-tenancy

- [ ] Approvals isolated by firm
- [ ] Cannot access other firm's approvals

## Test File Location

`tests/integration/approvals/crud.test.ts`

## Acceptance Criteria

- [ ] All endpoints have integration tests
- [ ] Tests use real database (setupIntegrationSuite)
- [ ] Approval workflow verified end-to-end
- [ ] All tests pass with `npm run test:integration`
