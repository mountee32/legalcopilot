# Way Forward: UK to US Pivot

## Purpose

Define a clear, execution-ready path to pivot Legal Copilot from a UK-focused product into a state-of-the-art US AI-native legal SaaS case management platform.

---

## 1) Strategic Direction

### Pivot Thesis

Keep the platform core. Replace the legal domain layer.

- Keep: multi-tenant platform, auth/RBAC, workflows/tasks, document storage, AI orchestration, approvals, portal, integrations framework, reporting shell.
- Replace: UK regulatory assumptions, UK practice modules, UK data defaults, UK language/content, UK demo/test fixtures.
- Build next: US jurisdiction engine + taxonomy-pack AI pipeline + US-first practice packs.

### Product Positioning (US)

An AI Case Operating System for US firms where AI does first-pass legal ops and humans approve high-risk actions.

- AI-first administrative autonomy with human approval gates.
- State-aware workflows, deadlines, and compliance overlays.
- Deep document intelligence with citations, confidence, reconciliation, and action generation.
- Measurable ROI: faster intake-to-action, higher billable capture, lower missed-deadline risk.

---

## 2) Current Baseline (What Already Exists)

The product is not greenfield. It already has substantial assets:

- Broad API footprint (`app/api/*`) with ~180 route handlers across matters, clients, documents, billing, approvals, tasks, calendar, integrations, search, portal, and reporting.
- Mature schema coverage (`lib/db/schema/*`) for core legal operations.
- AI/document primitives already present (`documents/analyze`, `summarize`, `extract`, semantic search, AI matter endpoints).
- Frontend foundation for major app surfaces (`app/(app)/*` pages for dashboard, inbox, matters, clients, documents, tasks, compliance, billing, templates, settings).
- Large test infrastructure (`tests/*`) including unit, integration, e2e, fixtures, and seeded demo flows.
- Completed backlog indicates broad implementation across API, frontend, integrations, and test suites (`backlog/done/*`).

Implication: the pivot should be a domain migration and product sharpening program, not a platform rewrite.

---

## 3) Non-Negotiable US Migration Work

### A) Regulatory and Workflow Model

- Replace SRA-centric language/rules with a US compliance model:
- ABA Model Rules baseline.
- State bar overlays.
- Trust accounting requirements (IOLTA handling).
- Privacy/security obligations by state and client segment.
- Refactor workflow authoring from UK-specific references in:
- `docs/workflow-rules.md`
- `docs/workflows/residential-purchase.yaml`
- related compliance/task template content.

### B) Practice Area Reset

- Deprioritize UK conveyancing-centric flows.
- Launch with US high-volume AI-friendly packs:
- Workers' Compensation
- Personal Injury
- Immigration
- Insurance Defense

### C) Data Model and Validation Localization

- Replace UK defaults and validators in schemas/UI/APIs:
- UK postcode/phone validation.
- UK address conventions.
- UK company/SRA/VAT assumptions.
- Country defaults and locale formatting.

### D) Billing and Payments

- Shift from VAT-centric billing assumptions to US sales-tax optional model.
- Keep multi-currency capability, default USD.
- Prioritize US payment rails and legal billing expectations.

### E) Demo, Tests, and Prompt Layer

- Replace UK-centric demo data, generated PDFs, seeded matters, and AI prompt instructions.
- Retune prompts for US legal terminology and procedural expectations.

---

## 4) North-Star US Product Vision

### Product Outcome

By default, every inbound document/email becomes structured case intelligence and recommended next actions within minutes.

### State-of-the-Art AI Capabilities

- Six-stage document pipeline (intake, OCR, classify, extract, reconcile, act).
- Taxonomy packs per practice area and jurisdiction.
- Confidence-gated automation with explicit human review thresholds.
- Full provenance: source quotes, page references, audit log of all AI proposals and decisions.
- Continuous learning loop from accept/reject edits to improve extraction/action quality.
- AI operations telemetry: quality, latency, cost per completed case action.

### Human Control Model

- AI can draft and propose autonomously.
- Execution of sensitive actions requires approval policies (by role, confidence, action type, matter risk).
- Every AI action must be explainable, reversible, and traceable.

---

## 5) Architecture Plan for the Pivot

### Keep and Extend Core Platform

- Keep existing core domains: matters, clients, documents, tasks, billing, approvals, timeline, notifications, portal, integrations.
- Add taxonomy/pipeline domain from `newbacklog.md` as first-class architecture.

### New Domain Layer (P0)

- `taxonomy_packs`
- `taxonomy_categories`
- `taxonomy_fields`
- `taxonomy_document_types`
- `taxonomy_action_triggers`
- `taxonomy_reconciliation_rules`
- `taxonomy_prompt_templates`
- `pipeline_runs`
- `pipeline_findings`
- `pipeline_actions`

### US Jurisdiction Engine (P0/P1)

- Federal baseline rules.
- State overlays for deadlines, filing constraints, and compliance prompts.
- Versioned rule packs with effective dates and audit history.

### Integration Priorities (US)

- Keep: Microsoft/Google mail + calendar, Stripe, QuickBooks, DocuSign/Adobe.
- Add/adjust: LawPay, US e-filing connectors (where practical), optional SMS (Twilio) for client comms/reminders.

---

## 6) Delivery Roadmap

### Phase 0: Re-Baseline (2-3 weeks)

Goal: make the product pivot-safe without breaking core operations.

- Finalize US product scope and launch wedges.
- Freeze UK-only feature expansion.
- Create code/documentation migration checklist by domain.
- Establish product language standards (US terminology, labels, defaults).
- Define US compliance advisory panel process (internal + outside counsel review loop).

Exit criteria:

- Approved US MVP definition.
- Signed domain migration checklist.
- UK-specific artifacts inventoried and tagged.

### Phase 1: US Foundation (6-8 weeks)

Goal: convert the base app from UK assumptions to US-safe defaults.

- Update schemas/validators for address/phone/currency/tax defaults.
- Replace UK-facing copy, metadata, and public messaging.
- Rework compliance engine foundations to US model (federal baseline + state overlays).
- Replace UK demo fixtures with US firms, matters, documents, tasks, and timelines.
- Ensure test suites pass with US fixtures and assumptions.

Exit criteria:

- US-localized core workflows operational end-to-end.
- CI green on updated unit/integration/e2e suites.
- No UK regulatory dependencies in runtime-critical paths.

### Phase 2: AI Differentiator Build (8-10 weeks)

Goal: ship the intelligence layer that creates market separation.

- Implement Taxonomy Pack system and management APIs.
- Implement 6-stage intelligent document pipeline with reconciliation and action generation.
- Build pipeline UI, findings review, conflict resolution, and action acceptance.
- Ship first US packs: Workers' Comp and Personal Injury.
- Introduce AI quality dashboards (acceptance rate, precision by field, conflict rate, processing latency).

Exit criteria:

- Pipeline live for pilot firms.
- Median document-to-action time and quality targets met.
- Human-review UX stable for legal users.

### Phase 3: Vertical Expansion and Market Readiness (8+ weeks)

Goal: convert platform capability into a scalable US product.

- Add Immigration and Insurance Defense packs.
- Expand intake scoring, document generation, and billing automation tuned to US matters.
- Harden integrations and onboarding flows.
- Add admin tooling for taxonomy customization and pack governance.

Exit criteria:

- 2-4 production-ready US practice packs.
- Repeatable onboarding playbook for new firms.
- Measurable ROI from pilot cohort.

---

## 7) Backlog Conversion Strategy

Use `backlog/waiting/newbacklog.md` as the primary build track with these adjustments:

### Keep as P0 (Core to vision)

- Epic 1: Taxonomy Pack System
- Epic 2: Intelligent Document Pipeline
- Epic 3: Pipeline User Interface

### Keep as P1 (Needed for competitive parity)

- Epic 4: Email Ingestion
- Epic 5: Taxonomy Editor
- Epic 6: Matter Enhancements (risk scoring/findings dashboard)
- Epic 7: AI Intake
- Epic 8: AI-Assisted Document Drafting
- Epic 9: Time/Billing suggestions

### Sequence as P2+ (After PMF signals)

- Epic 10: Analytics depth
- Epic 11: Taxonomy marketplace
- Epic 12: Client portal expansion
- Epic 13: Additional integrations
- Epic 14: Mobile push and advanced mobile UX

### Explicitly De-Scope for US MVP

- UK conveyancing-specific automations.
- UK tax and filing calculators (SDLT/IHT).
- UK regulator-specific templates and reporting logic.

---

## 8) Operating Model and Governance

### Product Governance

- Every AI action type gets a policy: `auto`, `approve`, or `forbidden`.
- Confidence thresholds are configurable by firm and by taxonomy field.
- All model/prompt/rule changes are versioned and auditable.

### Legal Governance

- Establish jurisdiction content review workflow before enabling state packs.
- Maintain clear legal-content ownership (product legal ops + external counsel review).

### Engineering Governance

- Backward-compatible migrations by default.
- Feature flags for rollout per practice area and firm cohort.
- Contract tests for integrations and taxonomy APIs.
- Gold-set evaluation harness for extraction/classification/action quality.

---

## 9) Success Metrics

### Product and AI Quality

- Document classification accuracy.
- Field extraction precision/recall by taxonomy field.
- Conflict detection precision.
- Action acceptance rate by action type.
- Median document-to-recommended-action time.

### User and Business Outcomes

- Weekly active fee earners.
- AI-approved action volume per matter.
- Reduction in manual admin time per file.
- Billing capture uplift from AI-suggested time entries.
- Pilot-to-paid conversion rate.

### Reliability and Trust

- Pipeline success rate.
- P95 pipeline processing latency.
- Audit completeness (all AI actions attributable).
- Critical incident count related to compliance or deadline misses.

---

## 10) Key Risks and Mitigations

- Risk: Overbuilding before product-market fit.
- Mitigation: wedge-first launch with 2 practice packs and strict phase gates.

- Risk: Jurisdictional complexity across states.
- Mitigation: federal core + state overlay architecture and staged state rollout.

- Risk: AI hallucinations in legal workflows.
- Mitigation: citation-required outputs, confidence gating, mandatory approval policies for high-risk actions.

- Risk: Data/compliance exposure.
- Mitigation: auditable action trail, least-privilege RBAC, encryption, retention controls, incident response readiness.

---

## 11) First 30-Day Action Plan

1. Create and approve US MVP charter (practice areas, personas, success metrics).
2. Build a file-by-file migration board for UK to US artifacts in docs, code, tests, and fixtures.
3. Implement localization baseline for schemas, validation, and defaults.
4. Implement US locale, currency, and tax defaults across APIs and UI.
5. Complete US terminology pass in product UI, prompts, and API docs.
6. Draft and approve US compliance model v1 (federal baseline + first state overlays).
7. Start Taxonomy Pack schema + API implementation from Epic 1.
8. Replace demo fixture set with US data and documents.
9. Stand up AI quality benchmark suite for extraction/classification/action acceptance.

---

## 12) Final Direction

The winning strategy is not to rebuild Legal Copilot. It is to repurpose its strong platform core into a US-first AI legal operations engine with:

- jurisdiction-aware intelligence,
- document-to-action automation,
- and strict human-in-the-loop control.

If executed in the phases above, the product can move from unfinished UK-centric build to a differentiated US AI case management SaaS with defendable technical advantage.
