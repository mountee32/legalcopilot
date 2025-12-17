# Conflict Checking - Schema & API

## Priority: LOW (Phase 2)

## Summary

Implement conflict of interest checking when opening new matters.

## Requirements

- Search existing clients/matters for conflicts
- Record conflict check results
- Require sign-off before proceeding
- Support waiver documentation

## Scope

### Database Schema

- `conflictChecks` table: matterId, searchTerms, results, status, decidedBy, waiverReason

### API Routes

- `POST /api/conflicts/search` - Run conflict search
- `GET /api/conflicts/[matterId]` - Get conflict check for matter
- `POST /api/conflicts/[id]/clear` - Mark conflict cleared
- `POST /api/conflicts/[id]/waive` - Record waiver

### Search Logic

- Search clients by name, company name
- Search matters by parties, title
- Return potential matches with confidence score

## Design

### Tenancy & Auth

- Conflict checks are firm-scoped; derive `firmId` from session and only search within the firm’s clients/matters.

### Data Model

- Store search terms and results as JSONB for MVP; results schema can evolve without migrations.
- Persist decision metadata (`decidedBy`, `decisionReason`) and keep an append-only trail if results are updated.

### Approval Enforcement

- Clearing/waiving a potential conflict should create an `approval_requests` item (e.g. `action: "conflict_check.clear"` / `"conflict_check.waive"`) to ensure partner sign-off is enforceable in backend code.

### API Shape

- `POST /api/conflicts/search` returns matches + creates (or updates) the `conflictChecks` record.
- Clear/waive endpoints update status only after approval decision.

### Tests

- Firm isolation, basic search matching, and approval-gated clear/waive transitions.

## References

- docs/backend-design.md Section 2.20 (ConflictCheck entity)
