# FEAT: Frontend — Clients

## Goal

Provide client directory + client detail pages supporting matter workflows.

## Scope

- Clients list with search/filter
- Client detail (contacts, notes, linked matters, recent activity)
- Client CRUD (create/update/archive where supported)

## Dependencies

- API: `GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/{id}`
- Backlog: `backlog/waiting/TASK-api-openapi-parity.md` (OpenAPI gaps for `/api/clients/{id}`)

## Acceptance Criteria

- Users can find a client quickly and jump to active matters
- Client updates are validated and permission-checked

## References

- `docs/frontend-design.md` (Clients)
- `docs/ideas.md` (cross-cutting)
