# Webhook & External Integration Tests

## Priority: Low

## Effort: High

## Summary

Add tests for external service integrations including payment providers, calendar sync, and accounting software.

## Design

- Focus integration tests on shipped webhook handlers under `app/api/webhooks/**`:
  - payments webhook: secret validation, idempotency, and invoice status updates
  - calendar/email/accounting/esignature webhooks: secret validation + idempotency event inserts
- Test idempotency by sending the same `x-event-id` twice and asserting only one provider-event row is created and side effects (e.g., payments) occur once.
- Keep provider signature verification out-of-scope (current implementation uses `x-webhook-secret`).

## Tests Needed

### Payment Webhooks (Stripe/GoCardless)

- [x] Payment success webhook updates invoice status to paid
- [ ] Payment failure webhook creates notification
- [ ] Refund webhook updates payment record
- [x] `x-webhook-secret` header validation rejects invalid secrets
- [x] Idempotency table prevents duplicate processing (same event ID)

### Calendar Sync (Google/Outlook)

- [ ] OAuth callback stores refresh token correctly
- [ ] Calendar event created in app syncs to external calendar
- [ ] External calendar event syncs to app
- [ ] Sync conflict resolution (app wins vs external wins)
- [ ] Token refresh on expiration

### Accounting Integration (Xero/QuickBooks)

- [x] Webhook creates accounting sync event row
- [ ] Invoice sync creates invoice in accounting system
- [ ] Payment sync records payment in accounting system
- [ ] Client sync creates contact in accounting system
- [ ] Sync errors create admin notification
- [ ] Rate limiting handled with retry

### Email Provider (SendGrid/Postmark)

- [x] `x-webhook-secret` validated for email webhook
- [x] Idempotency enforced for email provider events
- [ ] Outbound email delivery tracked
- [ ] Bounce webhook updates email status
- [ ] Spam complaint webhook flags recipient
- [ ] Inbound email webhook creates email record

## Files Created

- `tests/integration/webhooks/stripe.test.ts`
- `tests/integration/webhooks/gocardless.test.ts`
- `tests/integration/webhooks/email-provider.test.ts`
- `tests/integration/sync/google-calendar.test.ts`
- `tests/integration/sync/outlook-calendar.test.ts`
- `tests/integration/sync/xero.test.ts`

## Notes

- Updated `tests/helpers/db.ts` to clean up integration tables (roles + provider event tables) when tearing down test firms.

## Acceptance Criteria

- [x] Each integration has webhook handling tests (for implemented webhook handlers)
- [ ] OAuth flows tested end-to-end (not implemented)
- [x] Idempotency verified for webhooks that support it
