# Webhook & External Integration Tests

## Priority: Low

## Effort: High

## Summary

Add tests for external service integrations including payment providers, calendar sync, and accounting software.

## Tests Needed

### Payment Webhooks (Stripe/GoCardless)

- [ ] Payment success webhook updates invoice status to paid
- [ ] Payment failure webhook creates notification
- [ ] Refund webhook updates payment record
- [ ] Webhook signature verification rejects invalid signatures
- [ ] Duplicate webhook (same event ID) is idempotent

### Calendar Sync (Google/Outlook)

- [ ] OAuth callback stores refresh token correctly
- [ ] Calendar event created in app syncs to external calendar
- [ ] External calendar event syncs to app
- [ ] Sync conflict resolution (app wins vs external wins)
- [ ] Token refresh on expiration

### Accounting Integration (Xero/QuickBooks)

- [ ] Invoice sync creates invoice in accounting system
- [ ] Payment sync records payment in accounting system
- [ ] Client sync creates contact in accounting system
- [ ] Sync errors create admin notification
- [ ] Rate limiting handled with retry

### Email Provider (SendGrid/Postmark)

- [ ] Outbound email delivery tracked
- [ ] Bounce webhook updates email status
- [ ] Spam complaint webhook flags recipient
- [ ] Inbound email webhook creates email record

## Files to Create

- `tests/integration/webhooks/stripe.test.ts`
- `tests/integration/webhooks/gocardless.test.ts`
- `tests/integration/sync/google-calendar.test.ts`
- `tests/integration/sync/outlook-calendar.test.ts`
- `tests/integration/sync/xero.test.ts`
- `tests/integration/webhooks/email-provider.test.ts`

## Mocking Strategy

- Use `nock` or `msw` to intercept external API calls
- Create webhook payload fixtures from real provider examples
- Test signature verification with known-good signatures

## Acceptance Criteria

- Each integration has webhook handling tests
- OAuth flows tested end-to-end
- Idempotency verified for all webhooks
