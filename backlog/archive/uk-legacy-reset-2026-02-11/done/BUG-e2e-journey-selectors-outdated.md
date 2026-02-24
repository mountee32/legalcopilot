# BUG: E2E journey test selectors don't match demo page UI

## Problem

The 3 demo page journey tests fail because the Playwright selectors don't match the current demo page UI elements.

## Failing Tests

1. `tests/e2e/browser/journey-demo-database.spec.ts` - "Test User" text not found
2. `tests/e2e/browser/journey-demo-cache.spec.ts` - "Clear" button not found
3. `tests/e2e/browser/journey-demo-storage.spec.ts` - Uploaded file not visible

## Error Examples

```
Locator: getByText('Test User', { exact: true })
Expected: visible
Error: element(s) not found
```

```
Locator: getByRole('button', { name: 'Clear' })
Expected: visible
Error: element(s) not found
```

## Impact

- 3/20 E2E browser tests fail
- Demo page functionality works but tests are broken

## Root Cause

The demo page UI was updated but the journey test selectors weren't updated to match.

## Proposed Fix

1. Review current demo page UI (`app/demo/page.tsx`)
2. Update selectors in journey tests to match actual elements
3. Add data-testid attributes to demo page for stable selectors

## Files to Fix

- `tests/e2e/browser/journey-demo-database.spec.ts`
- `tests/e2e/browser/journey-demo-cache.spec.ts`
- `tests/e2e/browser/journey-demo-storage.spec.ts`
- `app/demo/page.tsx` (add data-testid attributes)

## Acceptance Criteria

- [x] All 3 journey tests pass
- [x] Demo page has stable test selectors (data-testid)
- [x] `npm run test:e2e:browser` shows 20/20 passing

## Implementation Summary

Added `data-testid` attributes to the demo page for stable E2E selectors:

**Database tab:**

- `data-testid="users-panel"` - Users list container
- `data-testid="user-row-{email}"` - Individual user rows

**Redis tab:**

- `data-testid="cache-result-panel"` - Cache result container
- `data-testid="cache-hit"` / `data-testid="cache-miss"` - Cache status badges
- `data-testid="cache-key"` / `data-testid="cache-value"` - Cache data display

**MinIO tab:**

- `data-testid="files-panel"` - Files list container
- `data-testid="file-row-{filename}"` - Individual file rows

Updated all 3 journey tests to use `getByTestId()` selectors instead of fragile role/text selectors.

## QA Results

- **Vitest**: 406/406 tests pass
- **E2E API**: 10/10 tests pass
- **E2E Browser**: 20/20 tests pass ✓

All acceptance criteria met.
