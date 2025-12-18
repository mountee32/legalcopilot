# FEAT: Frontend — Matters (Cases)

## Goal

Deliver matter list + detail views that act as the operational hub for a case.

## Scope

- Matters list with filters/search
- Matter detail tabs: Overview, Timeline, Documents, Emails, Tasks, Billing
- Matter actions: edit fields, archive, “Ask AI about this case”, “Generate tasks”, “Suggest calendar items”

## Dependencies

- API: `GET/POST /api/matters`, `GET/PATCH/DELETE /api/matters/{id}`, `GET /api/matters/{id}/timeline`, `POST /api/matters/{id}/ai/ask`, `POST /api/matters/{id}/ai/generate-tasks`, `POST /api/matters/{id}/ai/suggest-calendar`, `GET /api/matters/{id}/search`
- Backlog: `backlog/waiting/TASK-api-openapi-parity.md` (OpenAPI currently missing `/api/matters/{id}`)

## Acceptance Criteria

- Users can view and edit a matter safely with clear audit/timeline feedback
- “Ask AI” shows citations/links where available (fallback to “no sources” UX)

## References

- `docs/frontend-design.md` (Cases)
- `docs/ideas.md` (Epics 1, 2, 6)
