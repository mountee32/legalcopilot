# FEAT: Frontend — AI Inbox (Email Triage)

## Goal

Make email the primary work surface: AI processes, humans approve.

## Scope

- AI Inbox list view (priority, intent, sentiment, case match, summary, draft)
- Email detail view (thread, attachments, draft, suggested actions)
- “Process with AI” trigger + re-run (where needed)

## Dependencies

- API: `GET /api/emails`, `GET /api/emails/{id}`, `POST /api/emails/{id}/ai/process`
- Backlog: `backlog/waiting/TASK-api-email-send-workflow.md` (compose/send policy + approvals-backed sending)

## Acceptance Criteria

- Users can triage and drive actions via approvals without “starting from blank”
- Case reassignment UX exists (if required, add API support)

## References

- `docs/frontend-design.md` (AI Inbox)
- `docs/ideas.md` (Epic 5)
