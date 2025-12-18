# FEAT: Frontend — Notifications Panel & Preferences

## Goal

Deliver a lightweight, high-signal notification surface.

## Scope

- Notifications panel (list, mark read, mark all read)
- Preferences page/section for notification types and channels

## Dependencies

- API: `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences`

## Acceptance Criteria

- Mark read actions are reliable and reflected immediately
- Preferences changes affect what the user sees (where applicable)

## References

- `docs/frontend-design.md` (Notifications Panel)
- `docs/ideas.md` (cross-cutting)
