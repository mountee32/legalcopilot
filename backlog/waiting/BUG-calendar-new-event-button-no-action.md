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
