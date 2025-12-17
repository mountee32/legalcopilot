# Accounting Integration - Xero & QuickBooks

## Priority: LOW (Phase 2)

## Summary

Sync invoices and payments with accounting software.

## Requirements

- Push invoices to accounting system
- Sync payments bidirectionally
- Map chart of accounts
- Reconciliation support

## Scope

### Xero Integration

- OAuth connection
- Create invoices in Xero
- Sync payments
- Contact sync

### QuickBooks Integration

- OAuth connection
- Invoice sync
- Payment sync

## Design

### Tenancy & Auth

- Accounting connections are firm-scoped; require admin permission to connect/disconnect.

### Sync Model

- Use background jobs for all sync (push invoices, pull payments, reconcile).
- Track sync state and failures explicitly to make operations observable and retryable.

### Data Model (minimal MVP)

- `accounting_connections` (provider, firmId, encrypted tokens, status)
- `accounting_sync_events` (provider, firmId, entityType, entityId, externalId, status, error)

### Consistency & Approvals

- Internal invoice/payment records remain the source of truth; external sync should not silently modify internal totals.
- Any external-driven adjustments should be proposed via `approval_requests` before applying.

## Dependencies

- 008-invoice-generation (must be complete first)
- 009-payments-api (must be complete first)

## References

- docs/backend-design.md Integration section
