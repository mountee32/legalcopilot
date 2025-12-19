# FEAT: Task CRUD on Matter Detail Page

## Summary

Add full task management (Create, Read, Update, Delete) to the Tasks tab on the matter detail page (`/matters/[id]`). Currently users can only view tasks and mark them complete - they cannot create, edit, or delete tasks directly from the case screen.

## User Story

As a fee earner viewing a case, I want to manage tasks directly from the Tasks tab so that I can quickly add, edit, and remove tasks without navigating away from the case.

## Requirements

### Functional

1. **Create Task** - "Add Task" button opens dialog with form fields:
   - Title (required)
   - Description (optional)
   - Priority (low/medium/high/urgent)
   - Due date (optional)
   - Assignee (dropdown of firm members)

2. **Create from Template** - "Add from Template" button opens dialog to:
   - Select from available templates for the case's practice area/sub-type
   - Preview template tasks (mandatory/optional)
   - Apply selected tasks to the case

3. **Edit Task** - Click task card opens edit dialog with pre-populated fields

4. **Delete Task** - Soft delete via "Cancel" action (sets status to 'cancelled')

### Non-Functional

- Use existing API endpoints (POST/PATCH /api/tasks)
- Reuse existing template components (TemplateSelector, TemplatePreview)
- Follow existing dialog patterns (shadcn/ui Dialog)
- Optimistic updates for better UX

## Acceptance Criteria

- [ ] User can create a task with title, description, priority, due date, assignee
- [ ] User can create tasks from available templates
- [ ] User can edit any task field by clicking the task card
- [ ] User can cancel/soft-delete a task
- [ ] Cancelled tasks are hidden from the default view
- [ ] All changes reflect immediately in the task list
- [ ] Unit tests cover all new components

---

## Solution Design

### Existing Code to Reuse

| Component          | Location                                          | Status   |
| ------------------ | ------------------------------------------------- | -------- |
| Task API GET/POST  | `app/api/tasks/route.ts`                          | Complete |
| Task API GET/PATCH | `app/api/tasks/[id]/route.ts`                     | Complete |
| Task Schemas       | `lib/api/schemas/tasks.ts`                        | Complete |
| TemplateSelector   | `components/task-templates/template-selector.tsx` | Reuse    |
| TemplatePreview    | `components/task-templates/template-preview.tsx`  | Reuse    |
| Apply Template API | `app/api/matters/[id]/apply-template/route.ts`    | Complete |

### New Files to Create

**Components:**

- `components/tasks/task-form-dialog.tsx` - Create/edit task dialog
- `components/tasks/add-from-template-dialog.tsx` - Template selection dialog
- `components/tasks/task-card.tsx` - Extracted task card with actions
- `components/tasks/index.ts` - Exports

**API:**

- `app/api/firm/members/route.ts` - GET firm members for assignee dropdown

**Hooks:**

- `lib/hooks/use-firm-members.ts` - React Query hook for firm members

### Files to Modify

- `app/(app)/matters/[id]/page.tsx` - TasksTab component (lines 262-413)

### Implementation Order

1. **Phase 1: Foundation** - API endpoint, hook, TaskCard extraction
2. **Phase 2: TaskFormDialog** - Create/edit functionality
3. **Phase 3: AddFromTemplateDialog** - Template integration
4. **Phase 4: TasksTab Integration** - Wire everything together
5. **Phase 5: Tests** - Unit tests for all new components

---

## Test Strategy

### Unit Tests - Components

**`tests/unit/components/tasks/task-form-dialog.test.tsx`**

- [ ] Renders create form with empty fields
- [ ] Renders edit form with pre-populated fields
- [ ] Submits POST request for new task
- [ ] Submits PATCH request for existing task
- [ ] Shows validation error for empty title
- [ ] Loads firm members in assignee dropdown
- [ ] Calls onSuccess after successful submission

**`tests/unit/components/tasks/add-from-template-dialog.test.tsx`**

- [ ] Renders TemplateSelector for practice area
- [ ] Shows "no templates" when none available
- [ ] Calls apply-template API with selected items
- [ ] Calls onTasksAdded after successful application

**`tests/unit/components/tasks/task-card.test.tsx`**

- [ ] Renders task title and description
- [ ] Shows correct priority badge color
- [ ] Calls onEdit when card clicked
- [ ] Calls onComplete when Complete selected
- [ ] Calls onCancel when Cancel selected
- [ ] Shows strikethrough for completed tasks

**`tests/unit/app/api/firm/members/route.test.ts`**

- [ ] Returns firm members list
- [ ] Returns 401 for unauthenticated request
- [ ] Filters to correct firm (multi-tenancy)

---

## Detailed Design

See `/home/andy/.claude/plans/rustling-gathering-waterfall.md` for:

- Component interfaces
- API endpoint design
- TasksTab modification details
- Implementation phases
