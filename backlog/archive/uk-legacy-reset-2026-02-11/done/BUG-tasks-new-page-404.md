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

---

## Solution Design

### Approach

Implement **Option 1: Create dedicated page** for consistency with Next.js patterns and to follow the navigation already coded in the button click handler.

### Files to Create

**1. `/app/(app)/tasks/new/page.tsx`** (new task creation page)

- Client component using React hooks for form state
- Form fields: title, description, priority, due date, assignee, matter (required dropdown)
- Real-time form validation using schema
- POST to `/api/tasks` on submit
- Redirect to `/tasks` with success toast
- Handle errors with error toast

### Form Fields & Validation

Based on `CreateTaskSchema` from `/lib/api/schemas/tasks.ts`:

| Field              | Type     | Validation                     | UI Component                                      |
| ------------------ | -------- | ------------------------------ | ------------------------------------------------- |
| **matterId**       | UUID     | Required                       | Dropdown (fetch from `/api/matters`)              |
| **title**          | String   | Required, 1-200 chars          | Text input                                        |
| **description**    | String   | Optional, max 10k chars        | Textarea                                          |
| **priority**       | Enum     | Optional, defaults to "medium" | Select (low/medium/high/urgent)                   |
| **dueDate**        | DateTime | Optional                       | Date+time picker                                  |
| **assigneeId**     | UUID     | Optional, nullable             | Dropdown (fetch from `/api/users` or matter team) |
| **checklistItems** | Array    | Optional                       | Skip for MVP (future enhancement)                 |
| **tags**           | Array    | Optional                       | Skip for MVP (future enhancement)                 |

### API Integration

**Matters Dropdown:**

- Call `GET /api/matters` with pagination to populate dropdown
- Cache with React Query
- Default selection required (validation fails if empty)

**Assignees Dropdown:**

- Call `GET /api/users` or fetch matter team members
- Optional field (can be null)

**Task Creation:**

- POST `/api/tasks` with validated form data
- API already handles: firmId, createdById (from auth), status (defaults to pending), aiGenerated (false)
- Success: redirect to `/tasks` page
- Error: display toast with error message

### Layout & Components

- Use shadcn/ui components: Button, Input, Textarea, Select, Label, Card
- Follow existing Tailwind styling pattern from tasks list page
- Header section: "Create New Task" title + back link
- Form section: centered card layout (similar to auth pages)
- Action buttons: Cancel (back), Submit (create task)

### Test Strategy

**Unit Tests** (`tests/unit/app/tasks/new/page.test.ts`):

- Form field rendering
- Validation state changes
- Disable/enable of submit button based on validation

**Integration Tests** (`tests/integration/tasks/create.test.ts`):

- Fetch matters dropdown data
- POST to `/api/tasks` with valid data
- Verify task created in database
- Check redirect URL

**E2E Tests** (`tests/e2e/browser/tasks-create-flow.spec.ts`):

- Full user journey: navigate to /tasks → click New Task → fill form → submit → verify task in list
- Test with multiple matter/assignee combinations
- Error handling: submit with empty required fields
- Back button navigation

---

## Implementation Status

- [ ] Create `/app/(app)/tasks/new/page.tsx` with form
- [ ] Implement matter & assignee dropdowns
- [ ] API integration & submission logic
- [ ] Error handling & toast messages
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Move to backlog/qa/
