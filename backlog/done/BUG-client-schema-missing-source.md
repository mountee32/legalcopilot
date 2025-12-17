# BUG: Client Schema Missing Source Field

## Summary

The `clients` table schema is missing a `source` field required for lead tracking and marketing attribution.

## Missing Field

### `source` (required)

**User Story Reference**: "create the case once intake approved" - need to track where clients originated from.

**Suggested Implementation**:

```typescript
source: text("source"), // "website", "referral", "existing_client", "lead_conversion", etc.
// OR
sourceType: pgEnum("client_source_type", ["website", "referral", "walk_in", "lead", "other"]),
sourceId: uuid("source_id"), // optional: link to lead record if converted
```

## Current Schema Location

`lib/db/schema/clients.ts`

## Impact

- Cannot track client acquisition channels
- Cannot measure marketing ROI
- Cannot link converted leads to resulting clients
- Missing data for business intelligence

## Acceptance Criteria

- [ ] Add `source` field (text or enum)
- [ ] Consider adding `sourceId` to link to lead record
- [ ] Update client creation API
- [ ] Add migration
