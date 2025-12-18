# TASK: Integrations connection lifecycle (connect/disconnect/health)

## Goal

Move from “read status” to a full lifecycle needed by an admin UI.

## Scope

- Endpoints for connect/reauthorise/disconnect per integration category
- Persist and expose health (last sync, last error, token expiry)
- Provider-agnostic model for integration accounts

## Acceptance Criteria

- Admin UI can connect and disconnect integrations without manual DB changes
- Error states are inspectable (without leaking secrets)

## References

- `app/api/integrations/**`
- `docs/ideas.md` (Epic 15)

## Design

### New Endpoints (per integration category)

| Endpoint                                                  | Purpose                               |
| --------------------------------------------------------- | ------------------------------------- |
| `GET /api/integrations/:category/accounts/:id/health`     | Status, lastSync, errors, tokenExpiry |
| `POST /api/integrations/:category/accounts/:id/reconnect` | Re-auth with new tokens               |
| `POST /api/integrations/:category/connect`                | Initiate OAuth flow                   |
| `GET /api/integrations/:category/callback`                | OAuth callback handler                |

### Schema Changes

Add to each integration account table:

- `lastError` (text): sanitized error message
- `lastErrorAt` (timestamp): when error occurred
- `tokenExpiresAt` (timestamp): OAuth token expiry
- Add `pending` to status enum

### Health Response (no secrets)

```json
{ "status", "lastSyncAt", "lastError", "tokenExpiresAt", "webhookActive" }
```

### Test Strategy

- Unit: health returns correct fields, never secrets
- Integration: reconnect clears error, restores connected
- E2E: admin connects/disconnects integration
