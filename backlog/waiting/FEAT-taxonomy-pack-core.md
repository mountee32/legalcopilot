# FEAT-taxonomy-pack-core

## Goal

Implement the core taxonomy pack domain model and APIs to support configurable extraction/classification/action behavior.

## Acceptance Criteria

- [x] Taxonomy pack schema tables created with migrations
- [x] CRUD/list/fork APIs functional and tenant-safe
- [x] OpenAPI updated and tests added

## Progress Notes

- Completed: taxonomy domain schema added in `lib/db/schema/taxonomy.ts`.
- Completed: migration SQL added in `drizzle/0015_taxonomy_pack_core.sql`.
- Completed: API routes for list/detail/fork:
  - `GET /api/taxonomy/packs`
  - `GET /api/taxonomy/packs/{packId}`
  - `POST /api/taxonomy/packs/{packId}/fork`
- Completed: field customization endpoints for firm-owned packs:
  - `POST /api/taxonomy/packs/{packId}/fields`
  - `PUT /api/taxonomy/packs/{packId}/fields/{fieldId}`
- Completed: OpenAPI registration for the taxonomy pack routes.
- Completed: unit tests for list/detail/fork plus unauthenticated checks.
- Remaining: pack/category lifecycle mutators (full create/update/delete breadth) and editor UI workflows.
