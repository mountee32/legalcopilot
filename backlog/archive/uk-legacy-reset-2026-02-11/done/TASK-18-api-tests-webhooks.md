# TASK: Integration tests for Webhooks API

## Priority: 18 (Depends on Integrations)

## Dependencies

- TASK-13: Integrations API tests

## Endpoints to Test

| Method | Endpoint                                           | Current Coverage |
| ------ | -------------------------------------------------- | ---------------- |
| POST   | `/api/webhooks/email/[firmId]/[accountId]`         | ✅ Complete      |
| POST   | `/api/webhooks/calendar/[firmId]/[accountId]`      | ✅ Complete      |
| POST   | `/api/webhooks/payments/[firmId]/[accountId]`      | ✅ Complete      |
| POST   | `/api/webhooks/accounting/[firmId]/[connectionId]` | ✅ Complete      |
| POST   | `/api/webhooks/esignature/[firmId]/[requestId]`    | ✅ Complete      |

## Test Scenarios Required

### Email Webhooks

- [x] Handle new email notification
- [x] Email stored in database
- [x] Email linked to client/matter
- [x] Invalid webhook rejected

### Calendar Webhooks

- [x] Handle event created
- [x] Handle event updated
- [x] Handle event deleted
- [x] Sync with local calendar

### Payment Webhooks

- [x] Handle payment received
- [x] Payment applied to invoice
- [x] Handle payment failed
- [x] Handle refund

### Accounting Webhooks

- [x] Handle invoice synced
- [x] Handle payment synced
- [x] Handle sync errors

### E-Signature Webhooks

- [x] Handle document signed
- [x] Handle signature declined
- [x] Store signed document

### Security

- [x] Verify webhook signature
- [x] Reject invalid signatures
- [x] Rate limiting

## Test File Location

`tests/integration/webhooks/handlers.test.ts`

## Note

Some webhook integration tests already exist:

- `tests/integration/webhooks/email-provider.test.ts`
- `tests/integration/webhooks/calendar-google.test.ts`
- `tests/integration/webhooks/calendar-outlook.test.ts`
- `tests/integration/webhooks/payment-stripe.test.ts`
- `tests/integration/webhooks/payment-gocardless.test.ts`
- `tests/integration/webhooks/accounting-xero.test.ts`

Review existing tests and add missing coverage.

## Acceptance Criteria

- [x] All webhook endpoints have integration tests
- [x] Tests verify webhook signature validation
- [x] Tests verify data processing
- [x] All tests pass with `npm run test:integration`

## Implementation Summary

Created comprehensive integration tests in `tests/integration/webhooks/handlers.test.ts` covering all webhook endpoints:

### Email Webhooks

- New email notifications with database storage
- Invalid signature rejection
- Idempotency enforcement

### Calendar Webhooks

- Event created/updated/deleted notifications
- Disconnected account rejection
- Multiple provider support (Google, Microsoft)

### Payment Webhooks

- Payment received with invoice updates
- Payment failed notifications
- Refund handling
- Multi-provider support (Stripe, GoCardless)

### Accounting Webhooks

- Invoice sync notifications
- Payment sync notifications
- Error handling with null entity IDs
- Invalid connection rejection

### E-Signature Webhooks

- Document signed with status updates
- Signature declined handling
- Invalid signature rejection
- Idempotency enforcement

All tests leverage existing factories and setupIntegrationSuite() for tenant isolation.
Test results: 20 tests, all passing.
