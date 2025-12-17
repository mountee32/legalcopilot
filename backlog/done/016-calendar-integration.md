# Calendar Integration - Google & Microsoft

## Priority: LOW (Phase 2)

## Summary

Two-way sync with Google Calendar and Microsoft 365 Calendar.

## Requirements

- OAuth connection to calendar providers
- Sync events bidirectionally
- Create events in external calendar
- Receive updates from external calendar

## Scope

### OAuth Setup

- Reuse OAuth from email integration where possible
- Calendar-specific scopes

### Sync Service

- Push Legal Copilot events to external calendar
- Pull external events (optional display)
- Handle conflicts and updates

## Design

### Tenancy & Auth

- Calendar connections are firm-scoped and user-owned; derive firm from session and enforce in all queries.

### Data Model

- Add `calendar_accounts` (provider, userId, firmId, externalAccountId, encrypted tokens, scopes, status, syncDirection).
- Store provider identifiers on `calendarEvents` (`externalId`, `externalSource`) for idempotency and updates.

### Sync Semantics

- For MVP, prefer “push our events out” + “pull read-only external events” (optional) before attempting full bidirectional conflict resolution.
- Webhook updates (Graph subscriptions) must be idempotent and resilient to retries.

### Approvals

- External calendar updates that affect case-critical deadlines should be proposed via `approval_requests` before mutating internal records (configurable per firm).

## Dependencies

- 004-calendar-events (must be complete first)

## References

- docs/backend-design.md Integration section
