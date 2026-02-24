# BUG: Session cookie name mismatch in tests

## Problem

Integration tests use hardcoded cookie name `template.session_token` but Better Auth uses **signed cookies**. This causes session validation tests to fail because `auth.api.getSession()` cannot verify unsigned cookies.

## Error

```
AssertionError: expected undefined to be '791b8820-927f-4f3d-baa5-45dfd3f08686'
```

The `auth.api.getSession()` returns `undefined` because it can't verify the unsigned cookie.

## Impact

- 3 integration tests fail in `tests/integration/auth/session.test.ts`
- 1 RBAC test fails due to same issue
- Session-based auth testing is unreliable

## Root Cause

The test manually inserts sessions into the database and creates plain cookies:

```typescript
await db.insert(sessions).values({ userId, token, ... });
const session = await auth.api.getSession({ headers: cookieHeader(token) });
```

But Better Auth:

1. Uses **signed cookies** (HMAC-verified)
2. Expects cookies signed with the app secret
3. Won't accept raw token values

---

## Solution Design

**Chosen approach**: Refactor tests to use Better Auth's actual API

Instead of manually inserting sessions and creating plain cookies, use Better Auth's signup/signin APIs to create proper sessions with signed cookies.

---

## Changes Made

### 1. `tests/integration/auth/session.test.ts`

Rewrote tests to use Better Auth's `signUpEmail` API:

- Creates users and sessions through the proper auth flow
- Extracts signed cookies from Set-Cookie headers
- Tests actual session lookup with signed cookies

### 2. `tests/integration/auth/rbac.test.ts`

Added `createAuthenticatedUser` helper that:

- Signs up via Better Auth API
- Extracts signed session cookie
- Links user to firm and role
- Returns signed cookie for API requests

### Key Implementation

```typescript
function extractSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const cookies = setCookieHeader.split(/[,\n]/).map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.includes("session_token"));
  if (!sessionCookie) return null;
  return sessionCookie.split(";")[0] || null;
}
```

---

## Test Results

### All Tests Pass: ✅ 406/406

- `tests/integration/auth/session.test.ts` - 3/3 pass
- `tests/integration/auth/rbac.test.ts` - 4/4 pass
- Full regression - 406/406 pass

---

## Acceptance Criteria

- [x] Session tests use Better Auth API to create sessions
- [x] Tests use signed cookies from Better Auth responses
- [x] `tests/integration/auth/session.test.ts` passes (3 tests)
- [x] RBAC tests pass (4 tests)
- [x] Full regression passes (406 tests)
