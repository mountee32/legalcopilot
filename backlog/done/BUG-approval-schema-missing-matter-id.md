# BUG: ApprovalRequests Schema Missing Matter ID Field

## Summary

The `approval_requests` table schema is missing a direct `matterId` field for matter-level approval workflows.

## Missing Field

### `matterId` (required)

**User Story Reference**: "supervision ratios" - approvals often relate to specific matters for compliance tracking.

**Suggested Implementation**:

```typescript
matterId: uuid("matter_id").references(() => matters.id, { onDelete: "cascade" }),
```

## Current Schema Location

`lib/db/schema/approvals.ts`

## Workaround

Currently entity linkage is via `entityType`/`entityId`, but this doesn't provide:

- Direct matter querying
- Foreign key constraints
- Efficient matter-based approval filtering

## Impact

- Cannot efficiently query approvals by matter
- Cannot enforce referential integrity to matters
- More complex queries needed for matter-level approval dashboards
- Harder to implement "pending approvals for this matter" views

## Acceptance Criteria

- [ ] Add `matterId` foreign key field
- [ ] Index for matter-based queries
- [ ] Update approval API endpoints
- [ ] Add migration
