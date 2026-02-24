# Legal Copilot - Backend Design (US Direction)

## Purpose

This document defines backend architecture principles and target-state design for the US-first product direction.

Use this as an intent and invariants document.

Source-of-truth for implementation remains:

- Database schema: `lib/db/schema/*.ts` (re-exported via `lib/db/schema/index.ts`)
- API contracts: `lib/api/schemas/*.ts`
- API routes: `app/api/**/route.ts`
- Generated OpenAPI: `docs/api/openapi.yaml`

---

## 1. Architecture Goals

1. Multi-tenant isolation by firm.
2. AI-native case operations with auditable outputs.
3. Policy-governed autonomy (human approval for high-risk actions).
4. Jurisdiction-aware legal workflows.
5. Production-grade reliability and observability.

---

## 2. Core System Components

### Application Layer

- Next.js App Router for UI + API handlers.
- REST endpoints grouped by legal domain.

### Data Layer

- PostgreSQL + Drizzle ORM.
- JSONB for flexible practice and AI metadata.
- pgvector for semantic retrieval use cases.

### Async Processing

- BullMQ for background jobs and multi-stage pipelines.
- Redis for queue state and caching.

### Storage

- S3-compatible object storage (MinIO locally; managed object storage in production).

### AI Layer

- OpenRouter via Vercel AI SDK.
- Prompted extraction/classification/recommendation tasks.
- Structured outputs persisted with confidence and provenance.

### Security + Auth

- Better Auth + role-based authorization.
- Tenant scoping for all business data.

---

## 3. Existing Domain Coverage

Current schema and API surface already include major domains:

- Firms/tenancy
- Users/roles/RBAC
- Clients/matters
- Documents and extraction metadata
- Timeline/events
- Tasks and templates
- Approvals
- Email/calendar/integrations
- Time/billing/invoices/payments
- Compliance, conflicts, notifications
- Portal and public booking/pay flows

This breadth allows the US pivot to be domain migration and enhancement, not full re-platforming.

---

## 4. US Pivot Design Changes

### 4.1 Replace UK-Coupled Assumptions

Required migration areas:

- UK regulator references and workflow assumptions.
- UK-specific practice modules and calculators.
- UK validation/defaults (address, phone, tax, locale).
- UK demo/test fixtures and prompt language.

### 4.2 Jurisdiction-Aware Rule Model

Target rule layering:

1. Federal baseline
2. State overlays
3. Firm-specific policies

Rules must be versioned, effective-dated, and auditable.

### 4.3 Billing and Tax Model

Target billing model:

- Default currency: USD
- Sales-tax aware configuration (optional and jurisdiction-dependent)
- Preserve multi-currency and flexible rate structures
- Preserve trust-accounting and auditability requirements

---

## 5. Target New Domain: Taxonomy + Pipeline

### 5.1 Taxonomy Pack Model

Target entities:

- `taxonomy_packs`
- `taxonomy_categories`
- `taxonomy_fields`
- `taxonomy_document_types`
- `taxonomy_action_triggers`
- `taxonomy_reconciliation_rules`
- `taxonomy_prompt_templates`

Purpose:

- Configure extraction/classification/action behavior without code changes.
- Support practice-area and jurisdiction specialization.

### 5.2 Document Intelligence Pipeline Model

Target entities:

- `pipeline_runs`
- `pipeline_findings`
- `pipeline_actions`

Pipeline stages:

1. Intake and validation
2. OCR/text extraction
3. Document classification
4. Structured extraction
5. Reconciliation with case data
6. Action generation

Each stage must persist status, timings, confidence, and traceability.

---

## 6. API Design Standards

### 6.1 General

- RESTful routes under `app/api/*`.
- Zod request/response schemas.
- Uniform error envelope and status semantics.
- Pagination on list endpoints.

### 6.2 Security

- Auth required except explicit public/portal endpoints.
- Tenant scope validation on every data access path.
- Permission checks via role/capability middleware.

### 6.3 Auditability

- Track actor, origin (user/system/AI), timestamp, and entity context for mutating actions.
- For AI outputs, store:
  - model/provider
  - confidence
  - source artifacts
  - decision status (accepted/rejected/edited)

---

## 7. AI Output Safety Model

### 7.1 Action Policies

Each AI action type must support policy modes:

- `auto`
- `approve`
- `forbidden`

### 7.2 Confidence and Review

- Field-level confidence thresholds.
- Escalation to human review for low-confidence or conflict cases.
- Explicit conflict representation instead of silent overwrite.

### 7.3 Provenance

Every extraction/recommendation should support:

- source quote
- page reference
- confidence score
- run/document linkage

---

## 8. Integration Strategy (US)

Keep and harden existing integration framework for:

- Email: Microsoft/Google
- Calendar: Microsoft/Google
- Accounting: QuickBooks (and optionally Xero where needed)
- Payments: Stripe and legal-payment rails
- E-signature: DocuSign/Adobe

Add US-priority connectors where justified by demand.

---

## 9. Data Governance and Compliance

### 9.1 Data Controls

- Encryption in transit and at rest.
- Access controls by tenant + role.
- Configurable retention and deletion policies.

### 9.2 Compliance Posture

Target controls include:

- SOC 2 aligned controls
- US privacy and client confidentiality obligations
- State-specific compliance overlays in workflow/rule packs

### 9.3 Incident Readiness

- Audit logs for investigation.
- Monitoring and alerting across API, queue, and integration failures.
- Runbooks for rollback and containment.

---

## 10. Migration Plan (High Level)

### Phase 0: Re-Baseline

- Freeze UK-only expansion.
- Inventory UK-coupled code/docs/tests.

### Phase 1: Foundation Localization

- Update schemas/validators/defaults.
- Replace UK docs/demo fixtures.

### Phase 2: Taxonomy + Pipeline

- Ship new data model and APIs.
- Ship pipeline orchestration and review UI.

### Phase 3: Practice Expansion

- Add additional US practice packs and analytics.

See `backlog/waiting/way-forward.md` for detailed execution and exit criteria.

---

## 11. Design Constraints

1. No destructive migration without explicit migration path.
2. Backward compatibility where feasible during transition.
3. Feature-flag major behavior changes.
4. Protect production stability over roadmap speed.
5. Prefer composable platform primitives over hard-coded jurisdiction logic.

---

## 12. Open Questions

1. Which US states are in first rollout cohort?
2. Which payment rails are required for launch (beyond Stripe)?
3. What approval policy defaults should ship for each action type?
4. Which practice area gets first benchmark-grade gold datasets?
5. What SLAs and latency SLOs are promised in pilot contracts?

---

## 13. Notes

This file intentionally avoids large static model/interface dumps.

For implementation details, read the live code in:

- `lib/db/schema/*.ts`
- `lib/api/schemas/*.ts`
- `app/api/**/route.ts`
