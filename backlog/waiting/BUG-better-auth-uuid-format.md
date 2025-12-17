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

The `users` table has `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` but Better Auth's default ID generation uses a different format.

## Proposed Fix

Option A: Configure Better Auth to use UUID generation
Option B: Change schema to use `text` type for user IDs
Option C: Add custom ID generator hook in Better Auth config

## Files to Investigate

- `lib/auth/index.ts` - Better Auth configuration
- `lib/db/schema/users.ts` - User schema definition
- `tests/e2e/api/helpers/auth.ts` - E2E auth helper

## Acceptance Criteria

- [ ] E2E API tests can create users via Better Auth
- [ ] User IDs are consistent format across the system
- [ ] Existing user data (if any) is migrated
