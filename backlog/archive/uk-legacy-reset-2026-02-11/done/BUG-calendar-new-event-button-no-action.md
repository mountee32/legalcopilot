# BUG: Calendar "New Event" Button Has No Functionality

## Summary

The "New Event" button on the calendar page (`/calendar`) does not perform any action when clicked. The button is visible and clickable but has no `onClick` handler or navigation configured.

## Severity

**Medium** - Core functionality missing for a primary user action

## Location

`/home/andy/dev/legalcopilot/app/(app)/calendar/page.tsx` (lines 198-204)

## Current Behavior

1. User navigates to `/calendar`
2. Calendar page loads successfully with proper UI
3. "New Event" button is visible in the top right (with Plus icon)
4. Clicking the button does nothing - no modal, no navigation, no action

## Expected Behavior

Clicking "New Event" should either:

1. Open a modal/dialog with an event creation form
2. Navigate to a dedicated event creation page (e.g., `/calendar/new`)
3. Open a dropdown/popover with event form fields

The form should include fields for:

- Event title
- Description
- Event type (hearing, deadline, meeting, etc.)
- Start date/time
- End date/time
- All-day toggle
- Location (optional)
- Matter association (optional)
- Priority level

## Steps to Reproduce

1. Login to the application (fast-login as Firm Admin works)
2. Navigate to `/calendar`
3. Locate the "New Event" button in the top right corner
4. Click the button
5. Observe: Nothing happens

## Screenshots

- `/home/andy/dev/legalcopilot/screenshots/calendar-03-calendar-page.png` - Initial calendar view
- `/home/andy/dev/legalcopilot/screenshots/calendar-05-add-event-clicked.png` - After clicking (no change)

## Code Analysis

The button implementation at line 198-204:

```tsx
<Button
  size="sm"
  className="ml-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
>
  <Plus className="h-4 w-4 mr-2" />
  New Event
</Button>
```

Missing: `onClick` handler or navigation action.

There's also a similar "Create Event" button in the Agenda view (line 309-312) that has the same issue.

## Related Code

- Calendar API exists at `/app/api/calendar/route.ts`
- Individual event API at `/app/api/calendar/[id]/route.ts`
- The API infrastructure is in place to support event creation

## Suggested Fix

Add one of the following:

**Option 1: Modal Dialog**

```tsx
const [showEventDialog, setShowEventDialog] = useState(false);

<Button onClick={() => setShowEventDialog(true)}>
  <Plus className="h-4 w-4 mr-2" />
  New Event
</Button>

<EventDialog open={showEventDialog} onOpenChange={setShowEventDialog} />
```

**Option 2: Navigation**

```tsx
<Button onClick={() => router.push("/calendar/new")}>
  <Plus className="h-4 w-4 mr-2" />
  New Event
</Button>
```

**Option 3: Sheet/Drawer Component**

```tsx
<Sheet open={showEventSheet} onOpenChange={setShowEventSheet}>
  <SheetTrigger asChild>
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      New Event
    </Button>
  </SheetTrigger>
  <SheetContent>
    <EventForm onSubmit={handleCreateEvent} />
  </SheetContent>
</Sheet>
```

## Additional Notes

- The calendar page otherwise works well - it loads, displays events, and allows navigation between months
- The UI design is polished and matches the application's aesthetic
- The agenda view also has a "Create Event" button with the same issue (line 309-312)
- Consider creating a reusable `EventDialog` or `EventForm` component that can be used from both locations

## Test Script

An automated test script was created at `/home/andy/dev/legalcopilot/test-calendar.mjs` that demonstrates this bug.

Run with: `node test-calendar.mjs`

## Dependencies

None - this is a standalone UI bug that doesn't depend on other features.

## Priority Justification

Medium priority because:

- The calendar page is functional for viewing events
- Users can still work around this by using other methods if they exist
- However, creating events is a core feature that users will expect to work
- The button is prominently displayed, so users will definitely try to click it

---

## Solution Design

### Approach: Modal Dialog for Event Creation

**Decision**: Implement a reusable `EventFormDialog` component that opens in a modal when either button is clicked. This provides:

- Consistent UX across calendar views (month + agenda)
- Non-disruptive event creation without page navigation
- Real-time form validation
- Easy integration with existing components

### Architecture

#### Component Structure

```
components/
├── calendar/
│   ├── EventFormDialog.tsx (new)
│   └── event-form-dialog.test.tsx (new)
└── ui/
    └── dialog.tsx (existing)
```

#### Form Fields & Validation

Use `CreateCalendarEventSchema` from `lib/api/schemas/calendar.ts`:

- **title** - Text input, required (min 1, max 200 chars)
- **eventType** - Select (hearing, deadline, meeting, reminder, limitation_date, filing_deadline, other)
- **startAt** - DateTime picker, required
- **endAt** - DateTime picker, optional (auto-calculated if allDay)
- **allDay** - Boolean toggle (shows/hides time pickers)
- **description** - Text area, optional
- **location** - Text input, optional
- **matterId** - Async select (fetch matters from `/api/matters`), optional
- **reminderMinutes** - Multi-select for reminder times, optional
- **priority** - Select (low, medium, high, critical), defaulted to "medium"

#### API Integration

- POST to `/api/calendar` with `CreateCalendarEventSchema`
- On success: close dialog, refetch calendar events, show success toast
- On error: display inline validation errors, show error toast
- Handle 400 (validation) and 401 (auth) responses gracefully

### Implementation Steps

1. Create `components/calendar/EventFormDialog.tsx` with form state & submission
2. Add `onClick` handlers to both "New Event" buttons
3. Style dialog to match calendar aesthetic (amber theme, serif typography)
4. Add useCallback hooks to optimize re-renders
5. Implement matter association with async select

### Files to Create

- `components/calendar/EventFormDialog.tsx` (main form component)

### Files to Modify

- `app/(app)/calendar/page.tsx` (add state, onClick handlers, dialog mount)

---

## Test Strategy

### Unit Tests

- Form field validation (required fields, min/max length)
- Date/time field constraints (endAt > startAt)
- Form submission with valid/invalid data
- Loading state during submission
- Error state rendering

### Integration Tests

- Create calendar event via form submission
- Verify event appears in calendar after creation
- Test matter association lookup
- Test form reset after successful submission

### E2E Tests

- User clicks "New Event" button → dialog opens
- User fills form → submits → event appears in calendar
- User clicks "New Event" in agenda view → same flow works
- User cancels dialog → no event created
- User enters invalid data → form shows errors → corrects → submits successfully

### Test Fixtures

- Mock matters data for select dropdown
- Pre-created test matter for association tests
- Sample form data for submission tests
