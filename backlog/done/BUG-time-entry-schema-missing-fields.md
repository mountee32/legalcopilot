# BUG: TimeEntry Schema Missing Source and Billable Fields

## Summary

The `time_entries` table schema is missing fields required for AI-assisted time capture and write-off tracking.

## Missing Fields

### 1. `source` (required)

**User Story Reference**: "capture time from emails, documents" - need to track how time entry was created.

**Suggested Implementation**:

```typescript
source: pgEnum("time_entry_source", ["manual", "ai_suggested", "email_inferred", "document_activity", "calendar"]),
```

### 2. `isBillable` (required)

**User Story Reference**: Need to distinguish billable vs non-billable time for write-off tracking.

**Suggested Implementation**:

```typescript
isBillable: boolean("is_billable").notNull().default(true),
```

## Current Schema Location

`lib/db/schema/billing.ts`

## Impact

- Cannot track AI vs manual time entry creation
- Cannot measure AI time capture effectiveness
- Cannot properly handle non-billable time / write-offs
- Missing audit trail for AI-suggested entries

## Acceptance Criteria

- [ ] Add `source` enum field
- [ ] Add `isBillable` boolean field
- [ ] Update time entry API
- [ ] Add migration
