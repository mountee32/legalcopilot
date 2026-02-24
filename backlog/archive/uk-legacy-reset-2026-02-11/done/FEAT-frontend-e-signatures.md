# FEAT: Frontend — E-signatures (Signature Requests)

## Goal

Track signature requests and expose “send for signature” from documents/matters.

## Scope

- Signature requests list + detail (status, signers, reminders where supported)
- Entry points from matter documents (“Send for signature”)

## Dependencies

- API: `GET /api/signature-requests`, `GET /api/signature-requests/{id}`
- Backlog: `backlog/waiting/TASK-api-e-signature-send.md` (create/send/remind endpoints; currently not present)

## Acceptance Criteria

- Users can view all pending signatures and drill into a request
- Status updates are reflected accurately (polling or WS)

## References

- `docs/frontend-design.md` (Send for signature CTA)
- `docs/ideas.md` (Epic 17)
