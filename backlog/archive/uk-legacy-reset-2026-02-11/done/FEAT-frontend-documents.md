# FEAT: Frontend — Documents (Library + Viewer + AI Insights)

## Goal

Make documents first-class: upload, view, summarise/extract, and search.

## Scope

- Matter-scoped documents list + filters
- Document viewer (PDF/image/basic) + metadata panel
- AI actions: summarize/extract/entities; show chunks/snippets where applicable
- Upload flow wired to storage + document record creation

## Dependencies

- API: `GET/POST /api/documents`, document AI endpoints (`/summarize`, `/extract`, `/entities`, `/chunks`)
- Backlog: `backlog/waiting/TASK-api-documents-file-access.md` (downloads/presigned URLs + viewer-friendly access)
- Note: `POST /api/storage/upload` exists but is not in OpenAPI yet

## Acceptance Criteria

- Upload → document record → AI processing is clear and auditable
- Viewer works with typical PDFs and images without breaking navigation

## References

- `docs/frontend-design.md` (Documents tab patterns)
- `docs/ideas.md` (Epic 4)
