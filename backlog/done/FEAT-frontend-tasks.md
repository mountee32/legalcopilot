# FEAT: Frontend — Tasks

## Goal

Provide a tasks surface that supports AI task generation and execution.

## Scope

- Tasks list with filters (assignee, due, status, matter)
- Task detail (context, links, completion, comments if supported)
- “Generate tasks from matter” entry point + review flow

## Dependencies

- API: `GET/POST /api/tasks`, `GET /api/tasks/{id}`, `POST /api/tasks/{id}/complete`, `POST /api/matters/{id}/ai/generate-tasks`

## Acceptance Criteria

- Completing a task updates UI and reflects in matter timeline (if implemented)
- AI-generated tasks route through approvals if policy requires it

## References

- `docs/frontend-design.md` (Tasks)
- `docs/ideas.md` (Epic 12 baseline)
