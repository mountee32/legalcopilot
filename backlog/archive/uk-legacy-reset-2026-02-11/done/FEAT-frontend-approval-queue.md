# FEAT: Frontend — Approval Queue

## Goal

Centralise review/approve/reject for all AI-generated actions.

## Scope

- Approval Queue list with filters (type, confidence, case/matter, urgency)
- Approval detail modal (preview, edit where supported, approve/reject + reason)
- Bulk approve/reject flows with safeguards

## Dependencies

- API: `GET /api/approvals`, `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/reject`, bulk endpoints

## Acceptance Criteria

- Users can approve/reject single and bulk requests with visible audit context
- UI clearly indicates confidence thresholds and what will happen on approval

## References

- `docs/frontend-design.md` (Approval Queue)
- `docs/ideas.md` (AI-first approvals)
