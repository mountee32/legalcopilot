# Time Entries - API Routes

## Priority: MEDIUM

## Summary

Implement API routes for time entry management. Schema exists, need CRUD endpoints and approval workflow.

## Requirements

- CRUD for time entries
- Filter by matter, fee earner, date range, status
- Submit for approval workflow
- Bulk operations

## Scope

### API Routes

- `GET /api/time-entries` - List time entries with filters
- `POST /api/time-entries` - Create time entry
- `GET /api/time-entries/[id]` - Get time entry details
- `PATCH /api/time-entries/[id]` - Update time entry
- `DELETE /api/time-entries/[id]` - Delete draft time entry
- `POST /api/time-entries/[id]/submit` - Submit for approval
- `POST /api/time-entries/bulk/submit` - Bulk submit

### Approval Integration

- When submitted, create approval request
- On approval, status changes to 'approved'
- On rejection, status returns to 'draft' with feedback

### API Schemas (`lib/api/schemas/time-entries.ts`)

- TimeEntrySchema, CreateTimeEntrySchema, UpdateTimeEntrySchema
- TimeEntryQuerySchema, TimeEntryListSchema
- SubmitTimeEntrySchema

### Business Rules

- Duration in 6-minute units (0.1 hours)
- Amount = (durationMinutes / 60) \* hourlyRate
- Can only edit/delete draft entries
- Submitted entries require approval to modify

## Design

### Tenancy & Auth

- Time entries are firm-scoped and must never accept `firmId` from the request body/query; derive from session and enforce via `withFirmDb`.

### Approval Enforcement (no silent AI actions)

- Submitting a time entry creates an `approval_requests` row (e.g. `action: "time_entry.approve"`) with a payload snapshot of the entry.
- Only an approval decision transitions status to `approved`; rejection returns to `draft` with feedback (`decisionReason`).

### Consistency & Transactions

- All invoice/payment/approval side-effects should be transactionally consistent (time entry status + approval request updates).

### API Shape

- Add `lib/api/schemas/time-entries.ts` and OpenAPI registration; implement routes under `app/api/time-entries/*` following the existing list/create/get/update patterns.

### Tests

- Validate state transitions (draft → submitted → approved/rejected), firm isolation, and bulk submit behavior.

## References

- lib/db/schema/billing.ts (existing timeEntries table)
- docs/backend-design.md Section 2.13 (TimeEntry entity)
