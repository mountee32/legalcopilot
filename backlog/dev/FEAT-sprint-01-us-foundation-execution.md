# FEAT-sprint-01-us-foundation-execution

## Objective

Execute Sprint 1 foundation work with vertical slices that include code, tests, and documentation in each slice.

## Workstreams

### Workstream A: Contract and Schema Baseline

Tasks:

- Update schema defaults/examples to US where safe
- Remove UK-only descriptions in API metadata sources
- Regenerate OpenAPI and verify diffs

Definition of done:

- Contract updates committed
- OpenAPI regenerated
- No regressions in contract generation script

### Workstream B: Runtime Language and UX Metadata

Tasks:

- Replace UK-facing runtime text in key user-visible system surfaces
- Ensure legal/marketing metadata reflects US scope

Definition of done:

- Runtime-facing text updated in scoped files
- No broken pages/routes from text/config edits

### Workstream C: Test and Fixture Stabilization

Tasks:

- Update tests that depend on UK defaults for touched flows
- Keep deterministic fixture behavior

Definition of done:

- Unit and integration suites pass for touched domains
- Added regression tests for changed defaults where needed

### Workstream D: Migration and Rollout Safety

Tasks:

- Add release notes and migration notes
- Define flags/guardrails for behavior changes

Definition of done:

- Clear rollout notes in sprint docs
- Any risky behavior guarded

## Execution Sequence

1. A -> regenerate OpenAPI
2. B -> smoke critical pages/endpoints
3. C -> run unit/integration tests
4. D -> finalize notes and demo script

## Demo Checklist

- Show updated API description and key schema examples
- Show one end-to-end flow with US-default behavior
- Show tests passing for touched scope
