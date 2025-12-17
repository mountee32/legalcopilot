# BUG: Session cookie name mismatch in tests

## Problem

Integration tests use hardcoded cookie name `template.session_token` but Better Auth uses a different cookie name. This causes session validation tests to fail.

## Error

```
AssertionError: expected undefined to be '791b8820-927f-4f3d-baa5-45dfd3f08686'
```

The `auth.api.getSession()` returns `undefined` because it doesn't recognize the cookie.

## Impact

- 3 integration tests fail in `tests/integration/auth/session.test.ts`
- Session-based auth testing is unreliable

## Root Cause

The test helper function uses:

```typescript
function cookieHeader(sessionToken: string): Headers {
  return new Headers({ cookie: `template.session_token=${sessionToken}` });
}
```

But Better Auth likely uses a different cookie name (e.g., `better-auth.session_token` or configured name).

## Proposed Fix

1. Check Better Auth config for actual cookie name
2. Update test helper to use correct cookie name
3. Consider exporting cookie name from auth config for test use

## Files to Investigate

- `lib/auth/index.ts` - Better Auth configuration (cookie settings)
- `tests/integration/auth/session.test.ts` - Failing tests
- `tests/integration/clients/crud.test.ts` - Multi-tenancy test also affected

## Acceptance Criteria

- [ ] Session test uses correct cookie name from Better Auth config
- [ ] `tests/integration/auth/session.test.ts` passes (3 tests)
- [ ] Multi-tenancy test in clients CRUD passes
