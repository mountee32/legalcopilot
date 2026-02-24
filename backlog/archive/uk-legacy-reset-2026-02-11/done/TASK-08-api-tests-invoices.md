# TASK: Integration tests for Invoices API

## Priority: 8 (Depends on Time Entries)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests
- TASK-04: Time Entries API tests

## Dependents

- Payments API (payments applied to invoices)
- Approvals API (invoices may need approval)

## Endpoints to Test

| Method | Endpoint                  | Current Coverage |
| ------ | ------------------------- | ---------------- |
| GET    | `/api/invoices`           | ❌ Unit only     |
| POST   | `/api/invoices`           | ❌ None          |
| GET    | `/api/invoices/[id]`      | ❌ None          |
| PATCH  | `/api/invoices/[id]`      | ❌ None          |
| POST   | `/api/invoices/generate`  | ❌ Unit only     |
| POST   | `/api/invoices/[id]/send` | ❌ None          |
| POST   | `/api/invoices/[id]/void` | ❌ None          |

## Test Scenarios Required

### Invoice Generation

- [ ] Generate invoice from unbilled time entries
- [ ] Generate invoice for specific matter
- [ ] Generate invoice for date range
- [ ] Invoice includes all line items
- [ ] Invoice calculates totals correctly

### CRUD Operations

- [ ] Get invoice by ID with line items
- [ ] Update invoice (adjust amounts, add notes)
- [ ] List invoices with filtering
- [ ] Filter by client, matter, status, date

### Invoice Actions

- [ ] Send invoice (mark as sent)
- [ ] Void invoice (with reason)
- [ ] Cannot void paid invoice

### Invoice Status Flow

- [ ] Draft → Sent → Paid
- [ ] Draft → Sent → Void
- [ ] Time entries marked as billed

### Multi-tenancy

- [ ] Invoices isolated by firm
- [ ] Cannot access other firm's invoices

## Test File Location

`tests/integration/invoices/crud.test.ts`

## Acceptance Criteria

- [ ] All endpoints have integration tests
- [ ] Tests use real database (setupIntegrationSuite)
- [ ] Invoice generation verified end-to-end
- [ ] All tests pass with `npm run test:integration`
