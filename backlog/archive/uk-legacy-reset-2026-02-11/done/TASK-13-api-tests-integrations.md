# TASK: Integration tests for External Integrations API

## Priority: 13 (Standalone - external service connections)

## Dependencies

- None (standalone configuration)

## Dependents

- Webhooks API (webhooks triggered by integrations)

## Endpoints to Test

### Email Accounts

| Method | Endpoint                                | Current Coverage |
| ------ | --------------------------------------- | ---------------- |
| GET    | `/api/integrations/email/accounts`      | ❌ Unit only     |
| POST   | `/api/integrations/email/accounts`      | ❌ Unit only     |
| GET    | `/api/integrations/email/accounts/[id]` | ❌ None          |
| DELETE | `/api/integrations/email/accounts/[id]` | ❌ None          |

### Calendar Accounts

| Method | Endpoint                                   | Current Coverage |
| ------ | ------------------------------------------ | ---------------- |
| GET    | `/api/integrations/calendar/accounts`      | ❌ Unit only     |
| POST   | `/api/integrations/calendar/accounts`      | ❌ Unit only     |
| GET    | `/api/integrations/calendar/accounts/[id]` | ❌ None          |
| DELETE | `/api/integrations/calendar/accounts/[id]` | ❌ None          |

### Payment Accounts

| Method | Endpoint                                   | Current Coverage |
| ------ | ------------------------------------------ | ---------------- |
| GET    | `/api/integrations/payments/accounts`      | ❌ Unit only     |
| POST   | `/api/integrations/payments/accounts`      | ❌ Unit only     |
| GET    | `/api/integrations/payments/accounts/[id]` | ❌ None          |
| DELETE | `/api/integrations/payments/accounts/[id]` | ❌ None          |

### Accounting Connections

| Method | Endpoint                                        | Current Coverage |
| ------ | ----------------------------------------------- | ---------------- |
| GET    | `/api/integrations/accounting/connections`      | ❌ Unit only     |
| POST   | `/api/integrations/accounting/connections`      | ❌ Unit only     |
| GET    | `/api/integrations/accounting/connections/[id]` | ❌ None          |
| DELETE | `/api/integrations/accounting/connections/[id]` | ❌ None          |

## Test Scenarios Required

### Account CRUD (per integration type)

- [x] Create integration account with credentials
- [x] Get account by ID
- [x] List accounts for firm
- [x] Delete/disconnect account

### Validation

- [x] Validate credentials on create
- [x] Handle invalid credentials
- [x] Refresh tokens stored securely

### Multi-tenancy

- [x] Integration accounts isolated by firm
- [x] Cannot access other firm's connections

## Test File Location

`tests/integration/integrations/accounts.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Account lifecycle verified per type
- [x] All tests pass with `npm run test:integration`
