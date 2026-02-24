# BUG: Invoice Schema Missing VAT Rate Field

## Summary

The `invoices` table schema is missing a `vatRate` field needed to store and display the VAT rate applied.

## Missing Field

### `vatRate` (required)

**User Story Reference**: UK invoices must show the VAT rate applied. Currently only `vatAmount` is stored.

**Suggested Implementation**:

```typescript
vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("20.00"), // Percentage
```

## Current Schema Location

`lib/db/schema/billing.ts`

## Impact

- Cannot display VAT rate on invoices
- Cannot handle different VAT rates (standard 20%, reduced 5%, zero-rated)
- Cannot recalculate VAT if needed
- Missing required information for UK tax compliance

## Acceptance Criteria

- [ ] Add `vatRate` numeric field (percentage)
- [ ] Update invoice generation to use rate
- [ ] Support different VAT rates (20%, 5%, 0%)
- [ ] Add migration
