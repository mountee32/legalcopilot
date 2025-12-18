# BUG: Record Time Button Non-Functional

## Status

- **Priority**: High
- **Component**: Billing UI
- **Affected Page**: `/billing` (Time & Billing page)
- **Discovered**: 2025-12-18

## Summary

The "Record Time" button on the Time & Billing page is completely non-functional. Clicking it produces no action - no modal opens, no form appears, and no navigation occurs. Users cannot manually record time entries.

## Steps to Reproduce

1. Login as Firm Admin using fast-login
2. Navigate to Time & Billing page (via sidebar or `/billing`)
3. Click the "Record Time" button in the top right corner
4. **Expected**: A modal/dialog should open with a form to create a new time entry
5. **Actual**: Nothing happens - button click has no effect

## Root Cause

**File**: `/home/andy/dev/legalcopilot/app/(app)/billing/page.tsx`
**Lines**: 290-296

```tsx
<Button
  size="sm"
  className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
>
  <Clock className="h-4 w-4 mr-2" />
  Record Time
</Button>
```

The button has **no onClick handler**. There is no:

- Click event handler
- Navigation link
- Modal trigger
- Form component

The button is purely decorative.

## Impact

- **Severity**: Critical for time entry workflow
- Users cannot manually record time entries
- Only AI-suggested time entries can be approved (if any exist)
- Core billing functionality is blocked

## Expected Behavior

Clicking "Record Time" should:

1. Open a modal/dialog with a time entry form
2. Form should include fields for:
   - Matter selection (dropdown)
   - Date (date picker)
   - Duration/Hours (number input)
   - Description (textarea)
   - Hourly rate (number input, possibly pre-filled)
   - Billable toggle (checkbox)
3. Submit button should POST to `/api/time-entries`
4. On success, close modal and refresh time entries list
5. Show success toast notification

## Similar Issue

The "Generate Invoice" button (lines 405-411 and 427-429) has the same problem - no onClick handler.

## Test Evidence

- **Test Script**: `/home/andy/dev/legalcopilot/test-billing.mjs`
- **Screenshots**:
  - `screenshots/billing-03-billing-page.png` - Button visible
  - `screenshots/billing-04-after-record-time-click.png` - No change after click
  - `screenshots/billing-05-form-state.png` - No form fields found

## Console Output

```
Step 4: Looking for "Record Time" button...
Found "Record Time" button!
Step 5: Waiting for time entry form...
Looking for form fields...
Matter field: NOT FOUND
Description field: NOT FOUND
Hours field: NOT FOUND
Date field: NOT FOUND
Rate field: NOT FOUND

ERROR: No form fields found after clicking Record Time!
```

## Recommended Fix

1. Create a time entry form component (e.g., `TimeEntryDialog.tsx`)
2. Add state to manage modal open/close
3. Implement onClick handler to open modal
4. Implement form submission to POST `/api/time-entries`
5. Invalidate React Query cache on success
6. Apply same fix to "Generate Invoice" button

## Related Components

- Time entry API endpoint: Should exist at `/api/time-entries` (needs verification)
- Invoice generation API: Should exist at `/api/invoices` (needs verification)
- UI components needed: Dialog/Modal from shadcn/ui

## API Information

### Time Entry POST Endpoint

- **Endpoint**: `/api/time-entries` (POST) ✅ EXISTS
- **File**: `/home/andy/dev/legalcopilot/app/api/time-entries/route.ts`
- **Schema**: `CreateTimeEntrySchema` in `/home/andy/dev/legalcopilot/lib/api/schemas/time-entries.ts`

### Required Fields

```typescript
{
  matterId: string (UUID),          // REQUIRED
  workDate: string (ISO date),      // REQUIRED
  description: string (1-5000),     // REQUIRED
  durationMinutes: number,          // REQUIRED (min: 6, max: 1440, must be multiple of 6)
  hourlyRate: string (money),       // REQUIRED (e.g., "250.00")
  feeEarnerId: string (UUID),       // OPTIONAL (defaults to current user)
  source: enum,                     // OPTIONAL (defaults to "manual")
  isBillable: boolean,              // OPTIONAL (defaults to true)
  activityCode: string              // OPTIONAL
}
```

### Validation Rules

- Duration must be in 6-minute increments (0.1 hour units)
- Duration range: 6 minutes (0.1h) to 1440 minutes (24h)
- Description: 1-5000 characters
- Matter must exist and belong to the user's firm
- Fee earner (if specified) must exist in the user's firm

### Response

- **Success**: 201 Created with time entry object
- **Error**: Appropriate error response from error handler
