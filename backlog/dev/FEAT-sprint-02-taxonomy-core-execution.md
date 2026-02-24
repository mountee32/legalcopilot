# FEAT-sprint-02-taxonomy-core-execution

## Objective

Execute a production-safe taxonomy core slice that unlocks pipeline orchestration work.

## Workstreams

### Workstream A: Schema + Migration

Tasks:

- Add taxonomy domain schema under `lib/db/schema/taxonomy.ts`
- Add SQL migration `drizzle/0015_taxonomy_pack_core.sql`
- Export taxonomy schema via `lib/db/schema/index.ts`

Definition of done:

- Drizzle schema compiles in route/test usage
- Migration SQL checked in and reviewable

### Workstream B: API Runtime

Tasks:

- Implement `GET /api/taxonomy/packs`
- Implement `GET /api/taxonomy/packs/{packId}`
- Implement `POST /api/taxonomy/packs/{packId}/fork`
- Implement `POST /api/taxonomy/packs/{packId}/fields`
- Implement `PUT /api/taxonomy/packs/{packId}/fields/{fieldId}`

Definition of done:

- Tenant isolation enforced (firm + system visibility only)
- Not-found and validation paths covered

### Workstream C: Contracts + Tests

Tasks:

- Add taxonomy schemas in `lib/api/schemas/taxonomy.ts`
- Export schemas in `lib/api/schemas/index.ts`
- Register paths/schemas in `scripts/generate-openapi.ts`
- Add unit tests for list/detail/fork and auth checks

Definition of done:

- `npm run docs:api` succeeds
- New taxonomy unit suites pass

## Status

- [x] Workstream A complete
- [x] Workstream B complete for list/detail/fork and field mutators
- [x] Workstream C complete
- [ ] Full taxonomy lifecycle CRUD breadth deferred

## Deferred Follow-ups

1. `POST /api/taxonomy/packs` (firm-created pack)
2. `PATCH /api/taxonomy/packs/{packId}` and deactivate/archive semantics
3. Category CRUD endpoints and sort-order bulk update
4. Field delete endpoint and dependency safeguards
