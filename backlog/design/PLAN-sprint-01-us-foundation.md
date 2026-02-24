# PLAN-sprint-01-us-foundation

## Sprint Goal

Deliver a US-localized platform baseline with stable contracts, updated defaults, and migration-safe behavior so Sprint 2 can build taxonomy and pipeline features without UK coupling.

## Duration

2 weeks

## In Scope

1. API/schema localization baseline

- Country defaults and examples aligned to US
- Postal code/phone description and validation updates where needed
- Currency/tax defaults reviewed and made US-safe

2. Product language and metadata cleanup

- Remove UK-specific runtime-facing language
- Ensure docs and generated API contract reflect US positioning

3. Test and fixture baseline

- Identify and update UK-assumption tests for Sprint 1 scope
- Keep deterministic fixtures and pass unit/integration baseline suites

4. Migration controls

- Add feature-flag/migration notes for any breaking-adjacent behavior

## Out of Scope

- Full taxonomy pack implementation
- Full 6-stage pipeline implementation
- State-specific legal overlays beyond architecture placeholders

## Sprint Stories

1. FEAT-us-schema-and-validation-localization
2. FEAT-us-language-and-contract-refresh
3. TASK-test-fixture-us-baseline
4. TASK-migration-safety-and-rollout-controls

## Acceptance Criteria

- [ ] No runtime-critical flow depends on UK-only assumptions
- [x] `npm run docs:api` produces US-oriented top-level API description
- [x] Unit + integration suites pass for touched areas
- [x] Release notes capture migration impacts and feature flags

## Current Sprint Status

- Completed: US metadata/copy defaults, locale/currency updates, US country defaults, prompt localization.
- Completed: backward-compatible `postalCode` alias support across client API and UI.
- Completed: targeted unit/integration regression runs for touched client/intake/document flows.
- Completed: retired legacy UK calculator modules (`sdlt`, `iht`) with explicit `410 ENDPOINT_RETIRED` behavior.
- Completed: introduced US-native estimator endpoints for transfer tax and estate tax workflows.

## Release Notes

- `docs/us/release-notes-sprint-01.md`

## Dependencies

- `docs/us/product-charter.md`
- `docs/us/architecture.md`
- `docs/us/evals.md`
- `backlog/waiting/way-forward.md`

## Risks

- Hidden UK assumptions in downstream fixtures and tests
- Over-scoping into full domain rewrite

## Mitigations

- Restrict scope to baseline localization and stability
- Log deferred items explicitly into Sprint 2 backlog
