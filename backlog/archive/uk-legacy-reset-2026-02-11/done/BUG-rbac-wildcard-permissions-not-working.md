# BUG: RBAC Wildcard Permissions Not Working

## Summary

The `hasPermission()` function in `lib/auth/rbac.ts` doesn't handle wildcard permissions (`*`, `approvals:*`, etc.), causing all API requests to return 403 Forbidden even for users with full permissions.

## Symptoms

- All API endpoints return 403 Forbidden
- Dashboard shows skeleton loading states (no data loads)
- Console shows multiple "Failed to load resource: 403" errors
- Affects: `/api/approvals`, `/api/tasks`, `/api/matters`, `/api/calendar/upcoming`, `/api/invoices`, etc.

## Root Cause

```typescript
// lib/auth/rbac.ts line 154-156
export function hasPermission(userPermissions: readonly string[], required: Permission): boolean {
  return userPermissions.includes(required);
}
```

This function does a simple `includes()` check which fails for wildcards:

- User has permissions: `["*"]`
- Required permission: `"approvals:view"`
- `["*"].includes("approvals:view")` returns `false`

## Expected Behavior

The function should handle:

1. `*` - matches ALL permissions
2. `resource:*` - matches all actions on a resource (e.g., `approvals:*` matches `approvals:view`, `approvals:create`, etc.)
3. Exact match - `approvals:view` matches `approvals:view`

## Fix Required

Update `hasPermission()` to check for wildcard patterns:

```typescript
export function hasPermission(userPermissions: readonly string[], required: Permission): boolean {
  // Check for global wildcard
  if (userPermissions.includes("*")) return true;

  // Check for exact match
  if (userPermissions.includes(required)) return true;

  // Check for resource wildcard (e.g., "approvals:*" matches "approvals:view")
  const [resource] = required.split(":");
  if (resource && userPermissions.includes(`${resource}:*`)) return true;

  return false;
}
```

## Files to Modify

- `lib/auth/rbac.ts` - Fix `hasPermission()` function

## Testing

1. Run: `npm run test:unit -- lib/auth/rbac`
2. Verify test users with `["*"]` can access all endpoints
3. Run Playwright tests: `npx playwright test tests/e2e/browser/fast-login.spec.ts`

## Priority

**Critical** - All authenticated API requests fail, app is unusable after login.

## Discovered

- Date: 2025-12-18
- Via: Playwright exploration of logged-in app state
