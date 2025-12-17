# Payments - API Routes

## Priority: MEDIUM

## Summary

Implement payment recording for invoices. Schema exists, need CRUD endpoints.

## Requirements

- Record payments against invoices
- Update invoice paid amount and status
- Support partial payments
- Multiple payment methods

## Scope

### API Routes

- `GET /api/payments` - List payments with filters
- `POST /api/payments` - Record payment
- `GET /api/payments/[id]` - Get payment details
- `DELETE /api/payments/[id]` - Delete payment (with invoice recalc)

### Payment Recording Logic

When payment recorded:

1. Create payment record
2. Update invoice.paidAmount += payment.amount
3. Update invoice.balanceDue = total - paidAmount
4. Update invoice.status:
   - If balanceDue === 0: 'paid'
   - If balanceDue < total: 'partially_paid'
5. Create timeline event

### API Schemas (`lib/api/schemas/payments.ts`)

- PaymentSchema, CreatePaymentSchema
- PaymentQuerySchema, PaymentListSchema

### Validation Rules

- Payment amount must be > 0
- Payment amount cannot exceed balance due
- Payment date cannot be in future

## Design

### Tenancy & Auth

- Payments are firm-scoped; derive `firmId` from session and enforce firm predicates in all queries.

### Consistency & Transactions

- Record payment + recalculate invoice totals/status in a single transaction to prevent drift.
- For future gateway/webhook flows, store an idempotency key (provider + externalId) to prevent duplicate payments.

### API Shape

- Add `lib/api/schemas/payments.ts` and register in `scripts/generate-openapi.ts`.
- Implement `app/api/payments/*` routes with strict validation and clear error messages (overpayment, missing invoice, etc.).

### Audit/Timeline

- Create a timeline/audit entry when a payment is recorded or deleted.

### Tests

- Cover partial payments, overpayment rejection, deletion rollback, and firm isolation.

## Out of Scope (Phase 2)

- Payment gateway integration (Stripe, GoCardless)
- Automatic bank reconciliation
- Refunds

## References

- lib/db/schema/billing.ts (existing payments table)
- docs/backend-design.md Section 2.15 (Payment entity)
