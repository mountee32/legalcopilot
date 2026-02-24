# Leads & Quotes - Schema & API

## Priority: LOW (Phase 2)

## Summary

Implement lead tracking and quote generation for new business intake.

## Requirements

- Track leads/enquiries before they become matters
- Generate quotes for potential work
- Convert leads to clients/matters
- Lead scoring and source tracking

## Scope

### Database Schema

- `leads` table: contact info, source, status, score, notes, convertedToClientId
- `quotes` table: leadId, items, total, validUntil, status, convertedToMatterId
- `referralSources` table: name, type, stats

### API Routes

- `/api/leads/*` - Lead CRUD
- `/api/quotes/*` - Quote CRUD
- `/api/leads/[id]/convert` - Convert to client/matter

## Design

### Tenancy & Auth

- Leads/quotes are firm-scoped; derive `firmId` from session and enforce via `withFirmDb` + explicit `firmId` filters.

### Data Model

- Keep MVP minimal: store quote line items as JSONB and promote to a relational line-items table only if reporting/queries demand it.
- Preserve provenance (who created, when converted) for auditability.

### Conversion Flow

- `/api/leads/[id]/convert` is transactional: create client + matter + link back to lead/quote, and emit a timeline event.
- Any AI-suggested conversions should go via `approval_requests` (no silent create).

### Tests

- Firm isolation, conversion idempotency (don’t convert twice), and validation of required lead fields.

## References

- docs/backend-design.md Section 2.17-2.19
