# FEAT: Frontend — Leads, Intake & Quotes

## Goal

Support AI-first lead capture through quote and conversion to matter.

## Scope

- Leads pipeline + list view
- Lead detail (AI extracted data, conflict check status, activity log)
- Quote creation/view and lead → matter conversion flow

## Dependencies

- API: `GET/POST /api/leads`, `GET /api/leads/{id}`, `POST /api/leads/{id}/convert`
- API: `GET/POST /api/quotes`, `GET /api/quotes/{id}`
- API: conflicts endpoints

## Acceptance Criteria

- Users can progress a lead through a simple pipeline and convert to a matter
- Conflict check is surfaced early with clear next actions

## References

- `docs/frontend-design.md` (Leads & CRM)
- `docs/ideas.md` (Epic 0)
