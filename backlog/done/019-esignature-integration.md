# E-Signature Integration - DocuSign & Adobe Sign

## Priority: LOW (Phase 2)

## Summary

Integrate e-signature providers for document signing.

## Requirements

- Send documents for signature
- Track signature status
- Store signed documents
- Webhook notifications

## Scope

### Database Schema

- `signatureRequests` table: documentId, provider, externalId, status, signers, sentAt, completedAt

### DocuSign Integration

- Create envelopes
- Add signers
- Handle webhooks
- Download signed documents

### Adobe Sign Integration

- Similar flow to DocuSign

## Design

### Tenancy & Auth

- Signature requests are firm-scoped and tied to documents/matters; derive firm from session and validate ownership on every operation.

### Data Model

- Create `signature_requests` with provider ids, signers payload (JSONB), status timestamps, and a link to the resulting signed `document` (new version or new doc).
- Persist provider event ids for webhook idempotency.

### Webhooks

- Verify webhook signatures where supported; enqueue processing jobs; update request status in a transaction.

### Audit & Approvals

- Sending a document for signature is an external-effect action; require `approval_requests` (`action: "signature_request.send"`) before dispatching to provider.

### Tests

- Firm isolation, state transitions, and webhook idempotency.

## Dependencies

- Documents API (already complete)

## References

- docs/backend-design.md Section 2.23 (SignatureRequest entity)
