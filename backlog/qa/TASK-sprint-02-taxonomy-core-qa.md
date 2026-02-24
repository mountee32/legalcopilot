# TASK-sprint-02-taxonomy-core-qa

## QA Goal

Validate taxonomy core endpoints and contracts for correctness, tenant safety, and migration readiness.

## Test Matrix

### Contract/Docs Validation

- [x] `npm run docs:api` succeeds
- [x] OpenAPI includes taxonomy schemas and endpoints

### API Runtime Validation

- [x] List endpoint returns pack counts/pagination shape
- [x] Detail endpoint returns nested categories + fields
- [x] Fork endpoint returns copied counts and created pack metadata
- [x] Field create endpoint enforces validation and returns created field
- [x] Field update endpoint updates editable attributes and handles not-found
- [x] Unauthenticated requests return 401 on protected endpoints

### Regression Suites

- [x] `npx vitest run tests/unit/app/api/taxonomy/packs`

### Negative Testing

- [x] Invalid query/payload inputs return validation errors
- [x] Missing pack path returns not-found response path

## Exit Criteria

- [x] No open P0/P1 defects in taxonomy list/detail/fork
- [x] No open P0/P1 defects in taxonomy field create/update
- [x] Contract and unit evidence captured
- [ ] CRUD mutator QA deferred to next sprint

## Evidence

- `npx vitest run tests/unit/app/api/taxonomy/packs`
- `npm run docs:api`
