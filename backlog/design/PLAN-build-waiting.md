# PLAN — Build All Waiting Backlog Items

## Goal

Deliver all items in `backlog/waiting/` in a sequence that:

- Starts with PostgreSQL immediately and keeps schemas minimal.
- Enforces session-derived tenancy (no tenant id from request).
- Enforces “AI proposes, humans approve” via the central approval queue for any external-effect or autonomous AI actions.
- Keeps “code is the documentation” (schema + Zod/OpenAPI are source of truth).

## Global Definition Of Done (per item)

- DB: Drizzle schema added/updated in `lib/db/schema/*.ts` with `firmId` + minimal indexes; migrations generated.
- API: Zod request/response schemas in `lib/api/schemas/*.ts`; route handlers in `app/api/**`; errors via `withErrorHandler`.
- Tenancy: `firmId` derived from session (`getOrCreateFirmIdForUser`) and enforced with `withFirmDb` + explicit firm predicates.
- Approvals: AI drafts/proposals create `approval_requests`; writes happen only on approval where required.
- OpenAPI: `scripts/generate-openapi.ts` updated and `npm run docs:api` succeeds.
- Tests: route/unit tests added where patterns exist; `npm test` passes.

## Dependency Map (from waiting items)

- 015-email-integration → depends on 001-emails-schema-api
- 016-calendar-integration → depends on 004-calendar-events
- 017-payment-integration → depends on 009-payments-api
- 018-accounting-integration → depends on 008-invoice-generation + 009-payments-api
- 021-semantic-search-pgvector → depends on document chunking (already implemented)

## Build Sequence

### Phase 1 — Core Platform Foundations

1. 005-firm-settings — firm settings JSONB + settings endpoints (needed by billing, AI, integrations).
2. 006-user-roles-permissions — RBAC middleware + role schema (needed to lock down admin-only endpoints and approvals).
3. 003-timeline-events — append-only timeline + helper + wiring from existing routes (approvals, documents, matters, clients).
4. 014-notifications — in-app notifications + preferences (unblocks approval UX later; email/push can be deferred).

### Phase 2 — Work Management + Communications Core

5. 002-tasks-schema-api — tasks CRUD + AI proposals via approvals.
6. 001-emails-schema-api — email storage + endpoints + (basic) AI processing endpoint returning structured fields.
7. 010-document-ai-extraction — extraction/summarize/entities endpoints; enqueue jobs where possible; ensure re-chunking path.

### Phase 3 — Billing (Approval-Gated)

8. 007-time-entry-api — time entry CRUD + submit → approval_request → approve/reject transitions.
9. 008-invoice-generation — generate invoices from approved time entries + numbering allocator + send gated by approval.
10. 009-payments-api — payment recording + invoice recalculation in a single transaction.

### Phase 4 — Calendaring

11. 004-calendar-events — calendar events CRUD + upcoming endpoint; AI proposals via approvals.

### Phase 5 — Reuse + Automation Enablers

12. 013-templates — template CRUD + preview/generate endpoints; deterministic merge-field renderer; approval for AI-generated templates.
13. 021-semantic-search-pgvector — pgvector migration + embedding pipeline + semantic search endpoints; update matter ask to retrieve by similarity.

### Phase 6 — Intake + Compliance

14. 011-leads-quotes — leads/quotes CRUD + convert flow (transactional); AI proposals via approvals.
15. 012-conflict-checking — conflict search + persisted results; clear/waive gated by approvals.

### Phase 7 — External Integrations (after core stability)

16. 015-email-integration — Gmail/M365 OAuth + sync + idempotent ingestion + attachment handling.
17. 016-calendar-integration — Google/M365 calendar connections + push/pull strategy + webhook idempotency.
18. 017-payment-integration — Stripe/GoCardless webhooks + idempotency tables + auto-record payments.
19. 018-accounting-integration — Xero/QuickBooks sync jobs + mapping + “internal is source of truth”.
20. 019-esignature-integration — DocuSign/Adobe sign flows + webhook processing + send gated by approvals.

### Phase 8 — Real-time UX (Best-Effort Accelerator)

21. 020-websocket-realtime — WS server + auth + room model; emit events after commits; REST remains source of truth.

## Notes / Cross-Cutting TODOs

- If/when enabling Postgres RLS: ensure _every_ transaction sets `app.current_firm_id` (including workers) and add policies in migrations.
- Prefer background jobs for heavy work (document extraction, embedding, provider sync) with explicit job status visibility.
