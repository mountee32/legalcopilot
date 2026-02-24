# ADR-0002: AI Action Approval Policy

## Status

Accepted

## Decision

All AI-generated actions must be governed by explicit policy mode:

- auto
- approve
- forbidden

Default for legal-impacting actions is `approve`.

## Rationale

- Preserves human legal control
- Reduces risk of unsafe or irreversible autonomous actions
- Improves trust and audit readiness

## Consequences

- Action execution requires policy checks at runtime
- UI must support rapid approve/reject with provenance visibility
- QA must include policy-path coverage tests
