# FEAT: Frontend — Client Portal (Magic Link + Case View + AI Chat)

## Goal

Provide clients a safe, branded portal with case status, documents, invoices, and AI Q&A within strict boundaries.

## Scope

- Magic-link login journey
- Client dashboard (case summary, key dates, outstanding actions)
- Client document upload + view
- Client AI chat with escalation to fee earner

## Dependencies

- Backlog: `backlog/waiting/TASK-api-client-portal.md` (client-scoped auth + client-safe endpoints + policy enforcement)

## Acceptance Criteria

- Clients only see their own data and only what the firm allows
- All AI answers and escalations are auditable

## References

- `docs/frontend-design.md` (Client Portal)
- `docs/ideas.md` (Epic 8)
