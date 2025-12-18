# FEAT: Frontend — Calendar

## Goal

Show upcoming events, deadlines, and AI-suggested calendar actions.

## Scope

- Calendar views (agenda/week basic)
- Event detail (links to matter, briefing, attachments where present)
- “Suggest calendar items” from matter and review/apply flow

## Dependencies

- API: `GET /api/calendar`, `GET /api/calendar/{id}`, `GET /api/calendar/upcoming`, `POST /api/matters/{id}/ai/suggest-calendar`
- Backlog: `backlog/waiting/FEAT-frontend-integrations-setup.md` (calendar accounts connection UX)

## Acceptance Criteria

- Users can navigate between events and linked matters reliably
- AI suggestions are clear about what will be created/changed

## References

- `docs/frontend-design.md` (Calendar)
- `docs/ideas.md` (Epic 13)
