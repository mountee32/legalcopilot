# FEAT: Frontend — Global Search (Cmd+K)

## Goal

Fast, universal navigation + semantic search across firm data.

## Scope

- Cmd+K palette (recent + quick actions)
- Search results grouped by entity type (matters, clients, documents)
- “Search within matter” entry point (optional)

## Dependencies

- API: `GET /api/search/semantic`, `GET /api/matters/{id}/search`

## Acceptance Criteria

- Search is keyboard-first and routes reliably to selected result
- Results show enough snippet/context to reduce clicks

## References

- `docs/frontend-design.md` (Global Search)
- `docs/ideas.md` (AI-first retrieval)
