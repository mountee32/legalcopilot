# TASK: E-signature send/create endpoints

## Goal

Allow the product to create and send signature requests (not just list/read them).

## Scope

- Create signature request (document(s), signers, order, reminders policy)
- Send/dispatch signature packet via provider (or internal signer flow)
- Status webhooks/polling model and idempotent updates
- Reminder/cancel flows (if in scope for Phase 2)

## Acceptance Criteria

- Frontend can create a signature request from a matter document and track status
- All actions are auditable and permission-checked

## References

- `docs/ideas.md` (Epic 17)
- `app/api/signature-requests/**`

## Design

### Current State

- Create/send flow exists via approval workflow (`signature_request.send` action)
- Schema supports full lifecycle: draft→pending→sent→completed

### Missing Endpoints

| Endpoint                                   | Purpose                       |
| ------------------------------------------ | ----------------------------- |
| `POST /api/signature-requests/[id]/send`   | Direct send (bypass approval) |
| `POST /api/signature-requests/[id]/void`   | Cancel/void request           |
| `POST /api/signature-requests/[id]/remind` | Send reminder to signers      |

### Schema Enhancements

- Add `SignerSchema` with proper Zod validation
- Add timeline event types: `signature_sent`, `signature_completed`, etc.

### Test Strategy

- Unit: permission checks, status transitions
- Integration: send flow, void flow
- E2E: full signature lifecycle
