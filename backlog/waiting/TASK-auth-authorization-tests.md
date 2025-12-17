# Authentication & Authorization Tests

## Priority: High

## Effort: Low

## Summary

Add tests that verify authentication and authorization are properly enforced. Current tests mock `withAuth` to always pass, leaving auth flows untested.

## Tests Needed

### Authentication (401 Unauthorized)

- [ ] API returns 401 when no session token provided
- [ ] API returns 401 when session token is expired
- [ ] API returns 401 when session token is invalid/malformed
- [ ] Magic link authentication flow works end-to-end
- [ ] Session invalidation on logout

### Authorization (403 Forbidden)

- [ ] User without `clients:read` permission cannot GET /api/clients
- [ ] User without `matters:write` permission cannot POST /api/matters
- [ ] User cannot access resources from another firm (even with valid token)
- [ ] Role-based access control enforced for each permission type
- [ ] Admin-only endpoints reject non-admin users

### RBAC Edge Cases

- [ ] User with multiple roles gets combined permissions
- [ ] Removing a role immediately revokes access
- [ ] System roles cannot be deleted or modified

## Files to Create

- `tests/unit/middleware/withAuth.test.ts`
- `tests/integration/auth/session.test.ts`
- `tests/integration/auth/rbac.test.ts`

## Acceptance Criteria

- All auth middleware paths have test coverage
- Tests run without requiring external auth providers
