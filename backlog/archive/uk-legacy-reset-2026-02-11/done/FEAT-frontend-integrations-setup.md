# FEAT: Frontend — Integrations Setup (Email, Calendar, Payments, Accounting)

## Goal

Allow firm admins to connect/monitor integrations required for core workflows.

## Scope

- Integrations settings page showing connection status + last sync/health
- Connect/disconnect/reauthorise flows per provider (as supported)

## Dependencies

- API: current read-only endpoints under `/api/integrations/*`
- Backlog: `backlog/waiting/TASK-api-integrations-connect-lifecycle.md` (connect/disconnect lifecycle endpoints + OAuth UX support)

## Acceptance Criteria

- Admin can see what’s connected and what features are blocked when disconnected
- Connection errors are visible and actionable

## References

- `docs/frontend-design.md` (Settings: Integrations tab)
- `docs/ideas.md` (Epic 15)
