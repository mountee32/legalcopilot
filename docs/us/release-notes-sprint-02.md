# Sprint 02 Release Notes (Taxonomy Core)

## Date

2026-02-11

## Summary

Sprint 02 delivers the first production taxonomy foundation for the US pivot: schema, migration, API contracts, and list/detail/fork runtime endpoints.

## Key Changes

- Added taxonomy domain schema in `lib/db/schema/taxonomy.ts`:
  - packs, categories, fields, document types
  - action triggers, reconciliation rules, prompt templates
- Added SQL migration:
  - `drizzle/0015_taxonomy_pack_core.sql`
- Added taxonomy API schemas:
  - `lib/api/schemas/taxonomy.ts`
- Added taxonomy runtime endpoints:
  - `GET /api/taxonomy/packs`
  - `GET /api/taxonomy/packs/{packId}`
  - `POST /api/taxonomy/packs/{packId}/fork`
  - `POST /api/taxonomy/packs/{packId}/fields`
  - `PUT /api/taxonomy/packs/{packId}/fields/{fieldId}`
- OpenAPI generation updated for new taxonomy contracts and endpoints.

## Migration Impact

- No breaking changes to existing endpoint contracts.
- New taxonomy tables are additive.
- New endpoints are protected by auth and permission middleware.

## Validation Evidence

- `npx vitest run tests/unit/app/api/taxonomy/packs`
- `npm run docs:api`

## Deferred to Next Sprint

- Full taxonomy CRUD endpoints (create/update/delete for pack internals)
- Taxonomy editor UI
- Pipeline integration with active taxonomy pack resolution
