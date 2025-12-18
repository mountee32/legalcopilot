# TASK: Payments & collections APIs (beyond listing)

## Goal

Enable pay-links, direct debit mandates, and collections workflows.

## Scope

- Create payment intent/link for an invoice
- Optional: Direct Debit mandate lifecycle (GoCardless)
- Dunning schedules and reminder history (if automated collections are in scope)

## Acceptance Criteria

- Client portal can present a “Pay now” experience without exposing secrets
- Payment reconciliation updates invoice status deterministically

## References

- `docs/ideas.md` (Epic 16)

## Design

### New Endpoints

| Endpoint                                | Purpose                               |
| --------------------------------------- | ------------------------------------- |
| `POST /api/invoices/{id}/pay-link`      | Generate payment link                 |
| `GET /api/public/pay/{token}`           | Public payment page (unauthenticated) |
| `POST /api/invoices/{id}/setup-mandate` | GoCardless Direct Debit (optional)    |

### Schema Changes

Add to invoices table:

- `paymentLink` (text): short-lived signed URL
- `paymentLinkExpiresAt` (timestamp)

Or create `payment_links` table for auditability

### Flow

1. Generate pay-link with signed token
2. Client accesses public payment page
3. Redirect to Stripe Checkout or GoCardless mandate
4. Webhook updates invoice status on completion

### Dunning (Optional)

- `dunning_schedules` table for reminder intervals
- `reminder_history` for tracking sent reminders
- BullMQ jobs for automated reminders

### Test Strategy

- Unit: token generation/validation
- Integration: pay-link creation, webhook reconciliation
- E2E: complete payment flow (mocked providers)
