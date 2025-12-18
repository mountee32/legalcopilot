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

---

## Solution Design

### Existing Code (Verified)

- ✅ `POST /api/clients` endpoint exists and works
- ✅ `CreateClientSchema` defines validation rules
- ✅ Clients list page already navigates to `/clients/new`

### Files to Create

1. **`app/(app)/clients/new/page.tsx`** - Client creation form page
   - Client type selector (individual, company, trust, estate, charity, government)
   - Conditional fields based on type (individual shows name, company shows company fields)
   - Required: email (always), firstName+lastName (individual), companyName (company)
   - Optional: phone, mobile, address fields, source
   - Submit → POST to `/api/clients`
   - Success → redirect to `/clients/[id]`
   - Error → show toast

### Form Fields (from CreateClientSchema)

| Field         | Type     | Required                 | Notes                   |
| ------------- | -------- | ------------------------ | ----------------------- |
| type          | select   | Yes (default individual) | Controls conditional UI |
| firstName     | text     | If type=individual       |                         |
| lastName      | text     | If type=individual       |                         |
| title         | text     | No                       | Mr/Mrs/Ms/etc           |
| companyName   | text     | If type=company          |                         |
| companyNumber | text     | No                       | UK company reg number   |
| email         | email    | Yes                      |                         |
| phone         | tel      | No                       |                         |
| mobile        | tel      | No                       |                         |
| addressLine1  | text     | No                       |                         |
| addressLine2  | text     | No                       |                         |
| city          | text     | No                       |                         |
| county        | text     | No                       |                         |
| postcode      | text     | No                       |                         |
| source        | select   | No                       | Marketing attribution   |
| notes         | textarea | No                       |                         |

### UI Components to Use

- `Card` - form container
- `Input` - text fields
- `Textarea` - notes field
- `Button` - submit
- Native `select` or custom dropdown for type/source
- `toast` - success/error feedback

---

## Test Strategy

### Unit Tests

- [ ] `tests/unit/app/(app)/clients/new/page.test.tsx` - Form rendering and submission

### Test Cases

1. **Form renders** - All expected fields are present for individual type
2. **Type switching** - Changing type shows/hides conditional fields
3. **Individual validation** - Submitting individual without firstName/lastName fails
4. **Company validation** - Submitting company without companyName fails
5. **Successful submission** - Valid data POSTs to API and redirects
6. **Error handling** - API error shows toast message

### Mock Pattern

```typescript
// Mock fetch for API calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ id: "new-client-id", ...data }),
});

// Mock router
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
```
