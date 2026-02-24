# FEAT: Frontend — Time, Billing & Invoicing

## Goal

Enable AI-assisted time capture, invoice generation, and basic collections workflows.

## Scope

- Time entries list + “AI suggested time entries” review/submit (bulk)
- Invoice list + invoice detail + generate invoice flow
- Invoice actions: send/void, record payment where supported

## Dependencies

- API: time entries endpoints, invoices endpoints, payments endpoints
- Backlog: `backlog/waiting/FEAT-frontend-integrations-setup.md` (payments accounts)

## Acceptance Criteria

- Time suggestions are reviewable and bulk-submittable with clear audit trail
- Invoice generation and sending works end-to-end for a matter

## References

- `docs/frontend-design.md` (Time & Billing)
- `docs/ideas.md` (Epic 7, 16)
