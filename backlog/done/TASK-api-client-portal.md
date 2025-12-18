# TASK: Client portal API surface (auth + policy + scoping)

## Goal

Provide a client-safe API that enforces per-client visibility rules and AI boundaries.

## Scope

- Magic-link auth/session model for clients
- Client-scoped endpoints for:
  - case summary + key dates + outstanding actions
  - document list/download/upload
  - invoices + payments
  - portal AI chat with escalation workflow
- Enforce firm-configured policy (what AI can answer; what content is visible)

## Acceptance Criteria

- Client cannot access firm/staff endpoints or other clients’ data
- Portal AI is auditable and bounded by explicit policy checks

## References

- `docs/ideas.md` (Epic 8)
- `docs/backend-design.md` (tenancy + audit)

## Design

### New Schema (`lib/db/schema/portal.ts`)

- `clientPortalSessions`: magic-link sessions (separate from staff)
- `clientPortalTokens`: magic link generation/validation
- `portalAiConversations`: audit all portal AI interactions

### New Middleware (`middleware/withClientPortalAuth.ts`)

- Validates portal sessions, enforces client-scoped data access

### Endpoints

| Endpoint                                      | Purpose                      |
| --------------------------------------------- | ---------------------------- |
| `POST /api/portal/auth/request`               | Request magic link           |
| `POST /api/portal/auth/verify`                | Verify token, create session |
| `GET /api/portal/matters`                     | List client's matters        |
| `GET /api/portal/matters/[id]`                | Matter summary               |
| `GET/POST /api/portal/matters/[id]/documents` | Documents                    |
| `GET /api/portal/invoices`                    | Invoices                     |
| `POST /api/portal/matters/[id]/ai/chat`       | Policy-bounded AI            |

### Document Visibility

Add `visibility` enum to documents: `internal|client_visible|shared`

### Test Strategy

- Unit: withClientPortalAuth, policy validation
- Integration: magic link lifecycle, client-scoped queries
- E2E: full portal journey
