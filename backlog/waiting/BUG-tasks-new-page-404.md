# BUG: Tasks New Page Returns 404

## Summary

Clicking the "New Task" button on the `/tasks` page navigates to `/tasks/new`, which returns a 404 error. The task creation functionality is completely broken because the destination page does not exist.

## Steps to Reproduce

1. Log in to the application (using fast-login or credentials)
2. Navigate to `/tasks` page
3. Click the "New Task" button in the top right corner
4. Observe 404 error page

## Expected Behavior

- The "New Task" button should either:
  1. Navigate to a working `/tasks/new` page with a task creation form, OR
  2. Open a modal/dialog on the current page for creating a new task

## Actual Behavior

- Clicking "New Task" navigates to `/tasks/new`
- The page returns a 404 error: "This page could not be found."
- No task creation form or interface is available

## Root Cause

- File: `/home/andy/dev/legalcopilot/app/(app)/tasks/page.tsx` (line 209)
- The button has an onClick handler: `onClick={() => router.push("/tasks/new")}`
- However, the route `/tasks/new` does not exist
- Directory structure shows only `/app/(app)/tasks/page.tsx` exists
- No `/app/(app)/tasks/new/page.tsx` file exists

## Technical Details

### Current Implementation

```tsx
<Button onClick={() => router.push("/tasks/new")}>
  <Plus className="h-4 w-4 mr-2" />
  New Task
</Button>
```

### Missing File

- Expected location: `/home/andy/dev/legalcopilot/app/(app)/tasks/new/page.tsx`
- Status: Does not exist

## Screenshots

- Tasks list page: `/home/andy/dev/legalcopilot/screenshots/tasks-test/03-tasks-page.png`
- 404 error page: `/home/andy/dev/legalcopilot/screenshots/tasks-test/05-after-create-click.png`

## Impact

- **Severity**: High
- **Impact**: Users cannot create tasks manually
- **Workaround**: None available (feature is completely broken)

## Suggested Fix

Create one of the following:

### Option 1: Create the missing page (recommended for tasks)

1. Create `/app/(app)/tasks/new/page.tsx` with a task creation form
2. Implement form with fields: title, description, priority, due date, assignee, matter
3. POST to `/api/tasks` endpoint on submit
4. Redirect to `/tasks` on success

### Option 2: Use a modal/dialog

1. Add task creation dialog component to the tasks page
2. Change button to open dialog instead of navigating
3. Submit form via API and refresh the task list on success

## Related Files

- `/home/andy/dev/legalcopilot/app/(app)/tasks/page.tsx` - Tasks list page with broken button
- `/home/andy/dev/legalcopilot/app/api/tasks/route.ts` - API endpoint (may need GET handler for task creation)

## API Requirements

The task creation page will need to:

- Fetch available matters for selection (dropdown)
- Fetch available users for assignment (dropdown)
- Submit to POST `/api/tasks` endpoint

## Test Script

Automated test script available at: `/home/andy/dev/legalcopilot/test-tasks.mjs`

Run with: `node test-tasks.mjs`
