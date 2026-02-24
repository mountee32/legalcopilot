# PLAN-sprint-02-taxonomy-core

## Sprint Goal

Deliver the taxonomy-pack foundation (data model + read/fork APIs) needed for document pipeline rollout in Sprint 3.

## Duration

2 weeks

## In Scope

1. Taxonomy core data model

- Add taxonomy tables and enums for packs, categories, fields, document types, triggers, reconciliation rules, prompts.
- Add SQL migration for taxonomy schema rollout.

2. Taxonomy API baseline

- List packs endpoint with counts and tenant-safe visibility.
- Pack detail endpoint with nested categories/fields and related rule entities.
- Pack forking endpoint for cloning system packs to firm-owned packs.
- Field create/update endpoints for firm-owned pack customization.

3. Contract and docs

- Add taxonomy schemas to OpenAPI generation.
- Regenerate OpenAPI docs.

4. Validation

- Add route unit tests for happy path, validation errors, and unauthenticated behavior.

## Out of Scope

- Full taxonomy CRUD (create/update/delete for pack internals)
- Taxonomy editor UI
- Pipeline runtime integration

## Sprint Stories

1. FEAT-taxonomy-pack-core
2. TASK-openapi-taxonomy-contracts
3. TASK-taxonomy-route-test-coverage

## Acceptance Criteria

- [x] Taxonomy schema tables and migration added
- [x] List/detail/fork API endpoints implemented with tenant-safe access
- [x] Field create/update endpoints implemented with tenant-safe access
- [x] OpenAPI contract includes taxonomy routes/schemas
- [x] Unit tests pass for taxonomy route baseline
- [ ] CRUD mutators for categories/fields/triggers queued for next sprint

## Risks

- Schema drift between SQL migrations and Drizzle model.
- Key uniqueness collisions during repeated fork operations.

## Mitigations

- Keep migration aligned with schema constants and constraints.
- Generated fallback key suffix uses UUID fragment to reduce collisions.
