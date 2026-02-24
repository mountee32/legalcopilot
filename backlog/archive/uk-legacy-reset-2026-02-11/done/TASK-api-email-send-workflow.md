# TASK: Email outbox/send workflow (approval-backed)

## Goal

Support “Compose/Send” UX safely: drafts, approvals, and final send with audit trail.

## Scope

- Define canonical email action model (draft → approval request → send)
- Implement endpoints (or approval actions) needed for:
  - create draft
  - edit draft
  - send after approval
  - attach documents
- Ensure idempotency and safe retries (no double-send)

## Acceptance Criteria

- Frontend can implement “Approve & Send” without direct SMTP access
- Every send is auditable (who approved, content hash, recipients, timestamps)

## References

- `docs/ideas.md` (Epic 5)
- `docs/backend-design.md` (audit + approvals)

## Design

### Workflow: Draft → Approval → Send

1. `POST /api/emails` (direction: outbound) → status = draft
2. `POST /api/emails/{id}/attachments` → attach documents
3. `POST /api/emails/{id}/send` → creates ApprovalRequest, status = pending
4. `POST /api/approvals/{id}/approve` → queues BullMQ job, status = sent

### New Endpoints

| Endpoint                            | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `POST /api/emails/[id]/send`        | Request approval to send                |
| `POST /api/emails/[id]/attachments` | Attach documents                        |
| `POST /api/emails/compose`          | Compose new (draft + optional approval) |

### Schema Changes

- Add `approvalRequestId` to emails table
- Add `contentHash` for idempotency verification

### Idempotency

- Only draft emails can be sent
- BullMQ job ID = emailId (deduplication)
- Approval execution checks status before sending

### Test Strategy

- Unit: draft validation, approval creation
- Integration: full draft→approve→send flow
- E2E: compose and send journey
