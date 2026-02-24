# Legal Copilot - US Product Vision and Epics

## Purpose

This document is the active product vision for the US pivot.

- Supersedes UK-specific positioning and modules.
- Defines the US-first strategy, launch wedges, and product epics.
- Works with `backlog/waiting/way-forward.md` and `backlog/waiting/newbacklog.md`.

---

## Product Vision

Legal Copilot is an AI-first legal operations platform for US law firms. The system handles routine legal admin and first-pass analysis, while legal professionals retain decision authority through approval controls.

Core promise:

- AI does the first pass.
- Lawyers stay in control.
- Every AI action is auditable.

---

## AI-First Principles

1. Human-in-the-loop by default for high-risk actions.
2. Source-grounded outputs (citations, quotes, page references).
3. Reversible automation (approved actions can be tracked and undone where possible).
4. Explainable recommendations (confidence, reasoning summary, provenance).
5. Tenant-safe and role-safe behavior (strict firm isolation and RBAC).

---

## Target Market (US)

Primary:

- Plaintiff and defense firms in the 5-150 attorney range.
- Firms with high document volume and deadline sensitivity.

Launch wedge:

- Workers' Compensation
- Personal Injury

Next expansion:

- Immigration
- Insurance Defense

---

## Core Product Pillars

1. AI Case Operating System

- Matter-centric command center with risk, deadlines, and recommended next actions.

2. Document-to-Action Intelligence

- Ingest documents and emails, classify, extract structured findings, reconcile with case data, generate actions.

3. Revenue and Throughput Operations

- AI-suggested time entries, billing support, collections assist, and profitability visibility.

4. Trust and Governance

- Approval policies, full audit trails, policy-aware AI behavior, and jurisdiction-aware compliance overlays.

---

## US Jurisdiction Strategy

US legal operations vary by state and forum. The platform will support this through layered rules:

1. Federal baseline

- Common policies and default behaviors.

2. State overlays

- State-specific deadlines, filing rules, and compliance guidance.

3. Firm overlays

- Firm policy, playbooks, templates, and approval requirements.

All rule changes must be versioned, effective-dated, and auditable.

---

## Product Epics (US)

### Epic 0 - US Platform Localization (P0)

- Replace UK assumptions in language, validation, tax defaults, and demo content.
- Normalize address, phone, currency, and tax configuration for US usage.

### Epic 1 - Taxonomy Pack System (P0)

- Configurable extraction and action packs by practice area.
- Versioned categories, fields, document types, prompts, and reconciliation rules.

### Epic 2 - Intelligent Document Pipeline (P0)

- 6-stage pipeline: intake, OCR, classify, extract, reconcile, action generation.
- Track run status, findings, actions, confidence, and reviewer decisions.

### Epic 3 - Pipeline Workspace UI (P0)

- Real-time stage tracking, findings review, conflict resolution, and action acceptance.

### Epic 4 - Email Ingestion and Routing (P1)

- Monitor connected inboxes and auto-route attachments/emails into matter pipelines.

### Epic 5 - Taxonomy Editor (P1)

- Firm admins can fork system packs, tune fields/triggers, and test extraction behavior.

### Epic 6 - Matter Intelligence Enhancements (P1)

- Matter-level aggregated findings, dynamic risk scoring, and explainable factor breakdown.

### Epic 7 - AI Intake and Lead Qualification (P1)

- Public intake forms, lead scoring, and routing to teams.

### Epic 8 - AI-Assisted Drafting and Templates (P1)

- Generate draft documents from templates + case intelligence.

### Epic 9 - Time, Billing, and Payment Intelligence (P1)

- Activity-based time suggestions, compliance checks, and collections support.

### Epic 10 - Operational Analytics (P2)

- AI quality metrics, throughput analytics, and management dashboards.

### Epic 11 - Marketplace and Pack Distribution (P2)

- Optional ecosystem for curated taxonomy packs.

### Epic 12 - Client Experience Expansion (P2)

- Client portal enhancements, messaging, and self-service intake workflows.

---

## Out of Scope for US MVP

- UK conveyancing automations.
- UK tax and filing calculators (SDLT/IHT).
- UK regulator-specific workflow and compliance modules.
- UK-only integrations and terminology.

---

## Success Metrics

Product and AI quality:

- Classification accuracy by document type.
- Extraction precision/recall by field.
- Conflict detection precision.
- Action acceptance rate.
- Median document-to-action latency.

Operational outcomes:

- Weekly active legal users.
- AI-assisted actions per matter.
- Admin time reduction per matter.
- Billing capture uplift from AI suggestions.
- Pilot conversion and retention.

Trust and reliability:

- Pipeline success rate.
- P95 pipeline processing latency.
- Audit completeness across AI actions.
- Critical incidents related to compliance/deadlines.

---

## Delivery Phases

### Phase 0: Re-Baseline

- Finalize US MVP and migration plan.
- Freeze UK-only feature growth.

### Phase 1: US Foundation

- Localize platform defaults and update docs, tests, and fixtures.

### Phase 2: AI Differentiator

- Ship taxonomy packs + pipeline + review UI for first two practice areas.

### Phase 3: Expansion

- Add additional practice packs, integrations, and enterprise controls.

---

## Product Guardrails

- AI can propose; policy decides execution path.
- High-risk actions require approval by role/policy.
- Every AI decision includes traceability artifacts.
- No silent automation on irreversible legal actions.

---

## Canonical Inputs

When planning work, use:

- `backlog/waiting/way-forward.md`
- `backlog/waiting/newbacklog.md`
- `docs/backend-design.md`
- `lib/db/schema/*.ts` and `app/api/**/route.ts` as implementation source-of-truth.
