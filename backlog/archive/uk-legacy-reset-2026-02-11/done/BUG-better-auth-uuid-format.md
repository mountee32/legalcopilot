# BUG: Better Auth generates non-UUID user IDs

## Problem

Better Auth generates user IDs in a custom format (e.g., `aXiJH7k7MTeXLIIjiIT4bKmb6vvSN0iu`) but the database schema expects UUID format. This causes E2E API tests to fail when signing up test users.

## Error

```
PostgresError: invalid input syntax for type uuid: "aXiJH7k7MTeXLIIjiIT4bKmb6vvSN0iu"
```

## Impact

- All E2E API tests fail (0/10 passing)
- Cannot create users via Better Auth signup flow
- Affects `tests/e2e/api/client-lifecycle.spec.ts` and any test requiring authentication

## Root Cause

The `users` table has `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` but Better Auth's default ID generation uses a non-UUID format.

---

## Solution Design

**Chosen approach**: Configure Better Auth to use UUID generation (Option A)

Better Auth supports `advanced.database.generateId = "uuid"` configuration which tells it to generate UUID format IDs instead of its default format.

### Changes Made

1. **`lib/auth/index.ts`** - Added `database.generateId: "uuid"` to advanced config

```typescript
advanced: {
  cookiePrefix: "template",
  database: {
    generateId: "uuid",
  },
},
```

2. **`lib/db/schema/users.ts`** - Updated accounts schema to match Better Auth expectations:
   - `provider` → `providerId`
   - `providerAccountId` → `accountId`
   - Added `password` field for credential auth
   - Added `accessTokenExpiresAt` and `refreshTokenExpiresAt`
   - Added `updatedAt` to sessions table

3. **Database migration** - Applied SQL to rename columns and add new fields

---

## Test Results

### E2E API Tests: ✅ 10/10 PASS

All E2E API tests now pass, confirming users can be created via Better Auth signup flow.

### Remaining Test Failures

3 integration test failures are related to a separate issue (session cookie name mismatch) tracked in `BUG-session-cookie-name-mismatch.md`.

---

## Acceptance Criteria

- [x] Solution designed
- [x] `lib/auth/index.ts` updated with `generateId: "uuid"`
- [x] Schema updated to match Better Auth expectations
- [x] E2E API tests can create users via Better Auth
- [x] User IDs are valid UUID format
- [x] All 10 E2E API tests pass
