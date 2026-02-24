# Product Charter (US)

## Mission

Build an AI-native legal case management SaaS for US law firms where AI performs first-pass administrative and analytical work while attorneys retain control through approval policies.

## Launch Wedge

- Practice areas: Workers' Compensation and Personal Injury
- Firm segment: 5-150 attorney firms
- User roles: partner, attorney, paralegal, legal assistant, ops/admin

## Problems We Must Solve

- High document/email volume with low signal visibility
- Deadline and workflow risk across jurisdiction-specific rules
- Administrative overhead reducing billable throughput
- Weak auditability of AI-assisted operations in existing tools

## Product Pillars

1. Document-to-Action Intelligence
2. Human-in-the-Loop AI Operations
3. Jurisdiction-Aware Workflow and Compliance
4. Throughput + Revenue Optimization

## MVP Scope

In scope:

- US-localized data defaults, validation, language, and fixtures
- Taxonomy pack system
- 6-stage AI document pipeline
- Pipeline review workspace (findings/conflicts/actions)
- Foundational eval harness and quality metrics

Out of scope:

- UK-specific modules and calculators
- Broad marketplace/ecosystem features
- Deep multi-state coverage beyond launch set

## KPIs

Product quality:

- Classification accuracy >= 90% on gold-set doc types
- Extraction precision >= 92% for critical fields
- Conflict detection precision >= 90%

Operational quality:

- Median doc-to-action time <= 5 minutes
- Pipeline success rate >= 99%
- P95 pipeline latency <= 10 minutes

Business outcomes:

- > = 30% reduction in admin time per matter (pilot baseline-adjusted)
- > = 10% uplift in captured billable activity in pilot cohort

## Release Gates

Gate 1 (Foundation): no UK-dependent runtime-critical behavior in US flow
Gate 2 (AI quality): eval thresholds met for launch practice areas
Gate 3 (Trust): approval policy and audit logging validated end-to-end
