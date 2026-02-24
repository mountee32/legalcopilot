# TASK-sprint-01-us-foundation-qa

## QA Goal

Validate that Sprint 1 delivers a safe US-localized baseline without introducing regressions.

## Test Matrix

### Contract/Docs Validation

- [x] `npm run docs:api` succeeds
- [x] OpenAPI top-level description is US-oriented
- [ ] No UK-only terminology in non-archived active docs for touched scope

### API and Schema Validation

- [x] Client create/update defaults behave as expected
- [x] Postal code and phone inputs accept documented formats
- [x] No regression in existing client/matter workflows
- [x] Retired UK-only calculator endpoints return `410 ENDPOINT_RETIRED`
- [x] US replacement estimator endpoints return expected calculations and validation errors

### Regression Suites

- [x] `npm run test:unit` for touched domains
- [x] `npm run test:integration` for touched domains
- [ ] Targeted e2e smoke for core pages if impacted

### Negative Testing

- [ ] Invalid payloads still return expected validation errors
- [ ] Auth/RBAC behavior unchanged for modified endpoints

## Defect Severity Guidelines

- P0: Data corruption, auth bypass, major workflow break
- P1: Incorrect defaults/contract mismatch in core flows
- P2: Documentation drift or non-critical UX text issues

## Exit Criteria

- [x] No open P0/P1 defects
- [x] Regression evidence captured
- [ ] Go/No-go recommendation documented

## Evidence

- Unit: `npx vitest run tests/unit/app/api/clients/route.test.ts tests/unit/app/api/clients/[id]/route.test.ts tests/unit/app/(app)/clients/new/page.test.tsx tests/unit/lib/documents/analyze.test.ts`
- Integration: `npx vitest run tests/integration/clients/crud.test.ts tests/integration/intake/conversion.test.ts tests/integration/intake/leads-quotes.test.ts`
- Unit (retired endpoints): `npx vitest run tests/unit/app/api/conveyancing/sdlt/calculate/route.test.ts tests/unit/app/api/probate/iht/calculate/route.test.ts`
- Unit (US estimator endpoints): `npx vitest run tests/unit/app/api/real-estate/transfer-tax/calculate/route.test.ts tests/unit/app/api/probate/estate-tax/calculate/route.test.ts`
- Contract: `npm run docs:api`
