# BUG: Client creation page (/clients/new) is missing

## Summary

The Clients page has "New Client" and "Add Client" buttons that navigate to `/clients/new`, but this page does not exist, resulting in a blank page with only the sidebar visible.

## Steps to Reproduce

1. Login as Firm Admin via fast-login
2. Navigate to `/clients`
3. Click the "New Client" button (top right) or "Add Client" button (in empty state)
4. Observer that the page navigates to `/clients/new` but shows a blank content area

## Expected Behavior

- Clicking "New Client" should either:
  - Open a modal dialog with a client creation form, OR
  - Navigate to `/clients/new` page with a client creation form

## Actual Behavior

- Navigation goes to `/clients/new` but the page is blank (only sidebar shows)
- No form is rendered
- User cannot create a client

## Technical Details

### Current Implementation

- File: `/home/andy/dev/legalcopilot/app/(app)/clients/page.tsx`
- Lines 133-136: "New Client" button uses `router.push("/clients/new")`
- Lines 208-211: "Add Client" button in empty state also navigates to `/clients/new`

### Missing Component

- The route `/clients/new` requires creating:
  - `/home/andy/dev/legalcopilot/app/(app)/clients/new/page.tsx`

### Required Form Fields

Based on the Client schema, the form should include:

- Client type (individual, company, trust, estate)
- For individuals: firstName, lastName, dateOfBirth
- For companies: companyName, companyNumber
- Common fields: email, phone, address, postcode
- Optional: idVerified, conflictCheckStatus, referenceNumber

## Screenshots

- `/tmp/test-clients-1-list.png` - Clients page with "New Client" button
- `/tmp/test-clients-3-after-click.png` - Blank page after clicking button

## Impact

- HIGH: Core functionality broken - users cannot create clients from the UI
- Blocks client management workflows
- New users cannot add their first client

## Suggested Fix

Create `/home/andy/dev/legalcopilot/app/(app)/clients/new/page.tsx` with:

1. Form component with proper validation
2. Integration with POST `/api/clients` endpoint
3. Success/error handling
4. Redirect to client detail page or back to list on success

## Related Files

- `/home/andy/dev/legalcopilot/app/(app)/clients/page.tsx` (buttons)
- `/home/andy/dev/legalcopilot/app/api/clients/route.ts` (API endpoint)
- `/home/andy/dev/legalcopilot/lib/api/schemas/clients.ts` (validation schema)
