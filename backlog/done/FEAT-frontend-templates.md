# FEAT: Frontend — Templates (Library, Preview, Generate)

## Goal

Manage firm templates and generate documents/emails from them with AI assistance.

## Scope

- Templates list + detail
- Preview + generate flows (select matter/client, merge fields)
- “Propose template” flow (AI-assisted) where enabled

## Dependencies

- API: templates endpoints (`/api/templates*`)
- Optional: versioning/permissions enhancements if required

## Acceptance Criteria

- Users can preview and generate a document from a template reliably
- Generated outputs attach to a matter (if supported) or are downloadable

## References

- `docs/frontend-design.md` (Templates referenced in Settings)
- `docs/ideas.md` (Epic 14)
