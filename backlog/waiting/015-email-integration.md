# Email Integration - Gmail & Office 365

## Priority: LOW (Phase 2)

## Summary

Integrate with Gmail and Microsoft 365 for automatic email sync.

## Requirements

- OAuth connection to email providers
- Sync emails to/from matters
- Send emails through provider
- Real-time webhook notifications

## Scope

### OAuth Setup

- Google OAuth for Gmail API
- Microsoft OAuth for Graph API
- Store tokens securely

### Sync Service

- Fetch emails from connected accounts
- Match to matters using AI
- Store in emails table
- Handle attachments

### Send Service

- Send emails through provider
- Track sent emails
- Handle bounces/failures

## Design

### Tenancy & Auth

- Provider connections are firm-scoped and user-owned; never accept `firmId` from requests, derive from session.

### Data Model

- Add `email_accounts` (provider, userId, firmId, externalAccountId, encrypted tokens, scopes, status, lastSyncAt).
- Add `email_sync_logs` for audit/debug (optional in MVP).

### Sync Strategy

- Webhook-driven where possible (Gmail push notifications / Microsoft subscriptions), with periodic backfill jobs as a safety net.
- Ingestion is idempotent by `(provider, messageId)`; store raw provider ids on the `emails` rows.

### Attachments

- Store attachments as `documents` + link from `emails` via `attachmentIds`; avoid duplicating blobs.

### AI & Approvals

- AI can suggest matter matching / draft replies, but sending or mutating case state must go through `approval_requests`.

## Dependencies

- 001-emails-schema-api (must be complete first)

## References

- docs/backend-design.md Integration section
