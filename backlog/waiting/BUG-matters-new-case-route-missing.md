# BUG: New Case Button Leads to Non-Existent Route

## Priority

High

## Summary

The "New Case" button on the `/matters` page attempts to navigate to `/matters/new`, but this route does not exist. Users clicking this button will see a 404 error instead of a case creation form.

## Steps to Reproduce

1. Login to the application (use fast-login with "Firm Admin" button)
2. Navigate to `/matters` (Cases page)
3. Click the "New Case" button in the top right corner
4. Observe that the route `/matters/new` does not exist

## Expected Behavior

Clicking "New Case" should navigate to a form page where users can create a new case/matter with fields like:

- Title/Name (required)
- Client selection (required)
- Practice area (required)
- Description (optional)
- Status (optional, default: active)
- Key deadline (optional)
- Other matter-specific fields

## Actual Behavior

The button tries to navigate to `/matters/new` which results in a 404 error because the route is not implemented.

## Technical Details

### Current Code Location

- **File**: `/home/andy/dev/legalcopilot/app/(app)/matters/page.tsx`
- **Line**: 152-155

```tsx
<Button onClick={() => router.push("/matters/new")}>
  <Plus className="h-4 w-4 mr-2" />
  New Case
</Button>
```

### Missing File

- **Expected Location**: `/home/andy/dev/legalcopilot/app/(app)/matters/new/page.tsx`
- **Status**: Does not exist

### Current Directory Structure

```
app/(app)/matters/
├── [id]/
│   └── page.tsx (matter detail page exists)
└── page.tsx (matter list page exists)
```

## Impact

- **Severity**: High - Core functionality completely broken
- **User Impact**: Users cannot create new cases/matters through the UI
- **Workaround**: None available through the UI (would need to use API directly)

## Testing Evidence

Automated test script (`test-matters.mjs`) confirmed:

1. Login works correctly
2. Navigation to `/matters` works correctly
3. "New Case" button is visible and clickable
4. Button click attempts to navigate to `/matters/new`
5. No form page loads (route missing)

## Screenshots

- `/home/andy/dev/legalcopilot/screenshot-3-matters-page.png` - Shows "New Case" button on matters list page
- `/home/andy/dev/legalcopilot/screenshot-4-create-form.png` - Shows page after clicking (still on /matters, no form)
- `/home/andy/dev/legalcopilot/screenshot-5-form-filled.png` - Confirms no navigation occurred

## Recommended Solution

Create `/home/andy/dev/legalcopilot/app/(app)/matters/new/page.tsx` with:

1. Form fields for all required matter properties (see `lib/api/schemas/matters.ts`)
2. Client selection dropdown (fetch from `/api/clients`)
3. Practice area selection (conveyancing, litigation, family, probate, etc.)
4. Form validation using Zod schema
5. POST to `/api/matters` endpoint (which already exists)
6. Success: redirect to `/matters/[id]` for the newly created matter
7. Error handling with user-friendly messages

## Related Code

- API endpoint: `/home/andy/dev/legalcopilot/app/api/matters/route.ts` (POST handler exists)
- Matter schema: `/home/andy/dev/legalcopilot/lib/api/schemas/matters.ts`
- Matter detail page: `/home/andy/dev/legalcopilot/app/(app)/matters/[id]/page.tsx` (for reference)

## Notes

- The API endpoint for creating matters already exists and works
- The matter list page expects this functionality to work
- The empty state on the matters page also has a "Create Case" button that likely has the same issue
