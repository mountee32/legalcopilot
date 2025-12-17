# TASK: Integration tests for Signature Requests API

## Priority: 17 (Depends on Documents)

## Dependencies

- TASK-03: Documents API tests

## Endpoints to Test

| Method | Endpoint                       | Current Coverage |
| ------ | ------------------------------ | ---------------- |
| GET    | `/api/signature-requests`      | ❌ Unit only     |
| POST   | `/api/signature-requests`      | ❌ Unit only     |
| GET    | `/api/signature-requests/[id]` | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- [ ] Create signature request for document
- [ ] Get signature request by ID
- [ ] List signature requests
- [ ] Filter by status, document, signer

### Signature Workflow

- [ ] Request sent to signer
- [ ] Track signature status
- [ ] Handle signed document
- [ ] Handle declined signature

### Multiple Signers

- [ ] Request with multiple signers
- [ ] Track per-signer status
- [ ] Order of signing (if required)

### Document Integration

- [ ] Link to source document
- [ ] Store signed document
- [ ] Update matter with signed doc

### Multi-tenancy

- [ ] Requests isolated by firm
- [ ] Cannot access other firm's requests

## Test File Location

`tests/integration/signatures/requests.test.ts`

## Acceptance Criteria

- [ ] All endpoints have integration tests
- [ ] Tests use real database (setupIntegrationSuite)
- [ ] Signature workflow verified
- [ ] All tests pass with `npm run test:integration`
