# Authentication & Authorization Tests

## Priority: High

## Effort: Low

## Summary

Add tests that verify authentication and authorization are properly enforced. Current tests mock `withAuth` to always pass, leaving auth flows untested.

## Design

- Unit-test `middleware/withAuth.ts` by mocking `auth.api.getSession` (missing/invalid/expired session + error path).
- Integration-test session validation by inserting `users` + `sessions` rows directly and passing the `template.session_token` cookie header into `auth.api.getSession` and `withAuth`.
- Authorization coverage:
  - unit tests for `middleware/withPermission.ts` plus
  - integration tests for `lib/auth/rbac.ts` against real DB (role assignment, permission checks, revocation).
- If any public API routes lack RBAC guards, add `withPermission(...)` at the route boundary and lock it in with tests.

## Tests Needed

### Authentication (401 Unauthorized)

- [x] API returns 401 when no session token provided
- [x] API returns 401 when session token is expired
- [x] API returns 401 when session token is invalid/malformed
- [ ] Magic link authentication flow works end-to-end
- [ ] Session invalidation on logout

### Authorization (403 Forbidden)

- [x] User without `clients:read` permission cannot GET /api/clients
- [x] User without `cases:write` permission cannot POST /api/matters
- [x] User cannot access resources from another firm (even with valid token)
- [ ] Role-based access control enforced for each permission type
- [ ] Admin-only endpoints reject non-admin users

### RBAC Edge Cases

- [ ] User with multiple roles gets combined permissions
- [x] Removing a role immediately revokes access
- [ ] System roles cannot be deleted or modified

## Files Created

- `tests/unit/middleware/withAuth.test.ts`
- `tests/integration/auth/session.test.ts`
- `tests/integration/auth/rbac.test.ts`

## Code Updated

- `app/api/clients/route.ts` (adds `withPermission("clients:read"|"clients:write")`)
- `app/api/clients/[id]/route.ts` (adds `withPermission("clients:read"|"clients:write")`)
- `app/api/matters/route.ts` (adds `withPermission("cases:read"|"cases:write")`)
- `app/api/matters/[id]/route.ts` (adds `withPermission("cases:read"|"cases:write")`)

## Acceptance Criteria

- [x] All auth middleware paths have test coverage
- [x] Tests run without requiring external auth providers
