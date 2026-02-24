# BUG: Quote Schema Missing Type and Breakdown Fields

## Summary

The `quotes` table schema is missing fields required for proper quote generation and pricing breakdown as specified in Epic 0 user stories.

## Missing Fields

### 1. `type` (required)

**User Story Reference**: "get an instant quote" - quotes need to be categorized by matter type.

**Suggested Implementation**:

```typescript
type: practiceAreaEnum("type").notNull(), // conveyancing, litigation, etc.
```

### 2. `fees` / `disbursements` breakdown

**User Story Reference**: UK legal quotes must show separate fees and disbursements for SRA compliance.

**Suggested Implementation**:

```typescript
fees: jsonb("fees"), // Array of { description, amount } for professional fees
disbursements: jsonb("disbursements"), // Array of { description, amount } for third-party costs
// OR use a separate quote_line_items table similar to invoice_line_items
```

## Current Schema Location

`lib/db/schema/intake.ts`

## Impact

- Cannot categorize quotes by practice area
- Cannot provide breakdown required for SRA compliance
- Cannot show separate fees vs disbursements on client-facing quotes

## Acceptance Criteria

- [ ] Add `type` field (practiceAreaEnum or dedicated enum)
- [ ] Add fees/disbursements breakdown (jsonb or separate table)
- [ ] Update quote generation API
- [ ] Add migration
