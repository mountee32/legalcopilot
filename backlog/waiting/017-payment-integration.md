# Payment Integration - Stripe & GoCardless

## Priority: LOW (Phase 2)

## Summary

Integrate payment processors for online invoice payments.

## Requirements

- Stripe for card payments
- GoCardless for direct debit (UK)
- Payment links on invoices
- Automatic payment recording

## Scope

### Stripe Integration

- Create payment intents
- Handle webhooks
- Record successful payments

### GoCardless Integration

- Set up mandates
- Collect direct debits
- Handle payment notifications

## Design

### Tenancy & Auth

- Payment processor connections are firm-scoped; store credentials/tokens securely and never accept firm identifiers from webhook payloads without verification.

### Webhooks & Idempotency

- All webhooks must be idempotent (provider event id) and verified (Stripe signature / GoCardless webhook signature).
- Webhooks should enqueue a job that applies DB mutations in `withFirmDb` to avoid long-running HTTP handlers.

### Data Model

- Add `payment_provider_accounts` and `payment_provider_events` tables for connection state + webhook idempotency (minimal fields in MVP).
- Map successful provider payments to `payments` rows via a stable external id.

### Approval & Audit

- Gateway payments can record automatically (system source); any refunds/voids or invoice adjustments should require `approval_requests`.

## Dependencies

- 009-payments-api (must be complete first)

## References

- docs/backend-design.md Integration section
