# Sprint 01 Release Notes (US Foundation)

## Date

2026-02-11

## Summary

Sprint 01 establishes the US localization foundation and removes UK-only calculator behavior from active runtime endpoints.

## Key Changes

- US defaults and terminology applied across client intake, metadata, and core runtime text.
- Client API now supports `postalCode` as the preferred field while keeping `postcode` for backward compatibility.
- UK-only tax calculator endpoints are retired:
  - `POST /api/conveyancing/sdlt/calculate` -> `410 ENDPOINT_RETIRED`
  - `POST /api/probate/iht/calculate` -> `410 ENDPOINT_RETIRED`
- US replacement estimator endpoints added:
  - `POST /api/real-estate/transfer-tax/calculate`
  - `POST /api/probate/estate-tax/calculate`
- US-first property-search endpoint alias added:
  - `POST /api/real-estate/searches/order` (delegates to legacy conveyancing implementation)
- Additional US-first practice-module aliases added:
  - `PATCH /api/matters/{id}/real-estate` (delegates to legacy conveyancing matter-data implementation)
  - `POST /api/estate/account` (delegates to legacy probate estate-account implementation)
- OpenAPI regenerated after schema and contract updates.

## Migration Impact

- Clients may submit `postalCode` instead of `postcode`.
- Existing clients using `postcode` remain compatible.
- UI now prefers `postalCode` in client detail rendering, with `postcode` fallback.
- Calls to retired UK calculator endpoints must be removed from downstream consumers.
- Tax estimation consumers should migrate to the new US estimator endpoints.
- New consumers should prefer `/api/real-estate/searches/order` over UK-named search routes.
- New consumers should prefer `/api/matters/{id}/real-estate` over `/api/matters/{id}/conveyancing`.
- New consumers should prefer `/api/estate/account` over `/api/probate/estate-account` where possible.

## Feature Flags

- No new runtime feature flags introduced in Sprint 01.

## Validation Evidence

- `npm run docs:api`
- `npx vitest run tests/unit/app/api/clients/route.test.ts tests/unit/app/api/clients/[id]/route.test.ts tests/unit/app/(app)/clients/new/page.test.tsx tests/unit/lib/documents/analyze.test.ts`
- `npx vitest run tests/integration/clients/crud.test.ts tests/integration/intake/conversion.test.ts tests/integration/intake/leads-quotes.test.ts`
- `npx vitest run tests/unit/app/api/conveyancing/sdlt/calculate/route.test.ts tests/unit/app/api/probate/iht/calculate/route.test.ts`
- `npx vitest run tests/unit/app/api/real-estate/searches/order/route.test.ts tests/unit/app/api/real-estate/transfer-tax/calculate/route.test.ts`
- `npx vitest run tests/unit/app/api/matters/[id]/real-estate/route.test.ts tests/unit/app/api/estate/account/route.test.ts`
