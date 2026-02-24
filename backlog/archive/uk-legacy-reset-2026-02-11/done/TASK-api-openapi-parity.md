# TASK: OpenAPI parity for implemented routes

## Goal

Ensure `docs/api/openapi.yaml` matches implemented API routes so frontend can be generated/typed reliably.

## Scope

- Add missing paths such as:
  - `/api/matters/{id}` (GET/PATCH/DELETE)
  - `/api/clients/{id}` (PATCH/DELETE)
  - `/api/storage/upload` (POST)
- Verify request/response schemas align with Zod + route implementations
- Document any intentionally undocumented/internal routes

## Acceptance Criteria

- Regenerated OpenAPI includes the missing endpoints and passes schema validation
- No breaking changes to existing documented endpoints without explicit note

## References

- `docs/api/openapi.yaml`
- `app/api/**/route.ts`

## Design

### Missing Endpoints to Add

1. `/api/matters/{id}` GET/PATCH/DELETE - core matter CRUD
2. `/api/clients/{id}` PATCH/DELETE - client update/archive
3. `/api/storage/upload` POST - file upload (multipart)
4. `/api/health` GET - system health check
5. `/api/ai/chat` POST - streaming AI chat
6. `/api/jobs/create` POST - background job creation
7. 5 webhook endpoints (email, calendar, payments, accounting, esignature)
8. 4 integration account detail routes (GET/DELETE)

### Path Fix

- OpenAPI: `/api/conflicts/{matterId}` → should be `/api/conflicts/by-matter/{matterId}`

### Intentionally Undocumented

- `/api/auth/[...all]` - Better-Auth internal
- `/api/bull-board/**` - Admin only
- `/api/demo/**` - Development/testing

### Implementation

- Update `scripts/generate-openapi.ts` to register missing paths
- Run `npm run docs:api` to regenerate

### Test Strategy

- Add schema validation tests using zod-to-openapi
- Validate API responses against spec
