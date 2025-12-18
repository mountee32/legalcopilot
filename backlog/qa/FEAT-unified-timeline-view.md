# FEAT: Unified Timeline View

## Summary

Replace the separate Timeline and Calendar tabs on the matter detail page with a single, unified timeline view. Uses a centered vertical layout with events alternating left/right, time-proportional spacing, and a prominent TODAY marker.

## Business Value

- **"Where are we now?"** answered at a glance
- Solicitors see the rhythm of a case - periods of activity vs inactivity
- Past events and upcoming deadlines in one chronological view
- Clear visual distinction between what's done and what's coming

## Current State

- `app/(app)/matters/[id]/page.tsx` has separate Timeline and Calendar tabs
- Timeline tab: Simple vertical card list from `timeline_events`
- Calendar tab: Monthly calendar + event lists from `calendar_events`
- Two tabs, two mental models, context switching required

## Proposed State

Single "Timeline" tab showing:

- Events from `timeline_events` (what happened)
- Events from `calendar_events` (what's scheduled)
- Merged into one chronological stream
- Centered vertical timeline with alternating left/right cards
- TODAY marker dividing past from future

---

## User Stories

| ID    | As a...      | I want to...                                    | So that...                                            |
| ----- | ------------ | ----------------------------------------------- | ----------------------------------------------------- |
| US-01 | Solicitor    | See all case activity in one chronological view | I don't switch between tabs to understand case status |
| US-02 | Solicitor    | See a clear TODAY marker                        | I know exactly where we are in the matter lifecycle   |
| US-03 | Solicitor    | Distinguish past events from future events      | I can focus on what's coming without losing context   |
| US-04 | Solicitor    | See time gaps between events                    | I understand the pace and rhythm of the matter        |
| US-05 | Solicitor    | View event details on hover/click               | I get full context without navigation                 |
| US-06 | Case Manager | See events grouped by month                     | I can navigate longer matters easily                  |
| US-07 | Solicitor    | Switch between proportional and compact views   | I use whichever suits my current task                 |

---

## Functional Requirements

### FR-1: Data Sources

**FR-1.1**: Fetch events from both tables:

- `timeline_events` - past activity (documents, emails, tasks, AI actions)
- `calendar_events` - scheduled items (hearings, deadlines, meetings)

**FR-1.2**: Merge and sort by date ascending (oldest first, newest last).

**FR-1.3**: Distinguish visually:

- Timeline events: filled dots (●)
- Calendar events: diamond markers (◆)

### FR-2: View Modes

**FR-2.1**: Two view modes available:

- **Proportional** (default) - vertical spacing reflects actual time gaps
- **Compact** - uniform spacing, denser view

**FR-2.2**: View mode persists in session storage.

**FR-2.3**: Toggle clearly accessible above timeline.

### FR-3: Centered Timeline Layout

**FR-3.1**: Vertical timeline axis runs down the center of the viewport.

**FR-3.2**: Events alternate left and right (zigzag pattern by index):

- Even index (0, 2, 4...) → left side
- Odd index (1, 3, 5...) → right side

**FR-3.3**: Each event card connects to the center axis via a horizontal connector line.

**FR-3.4**: Dot/marker on the axis at each event's position.

**FR-3.5**: On mobile (<768px), collapse to single column (all cards on right of axis).

### FR-4: TODAY Marker

**FR-4.1**: Horizontal divider spanning full width at current date position.

**FR-4.2**: TODAY marker includes:

- Bold horizontal line
- Label: "TODAY" with pin icon
- Current date (e.g., "18 December 2025")

**FR-4.3**: Highest z-index - never obscured by cards.

**FR-4.4**: On page load, scroll position centers TODAY marker in viewport.

**FR-4.5**: Events on today's date get additional emphasis (ring highlight).

### FR-5: Time-Proportional Spacing

**FR-5.1**: In proportional mode, vertical gap between events reflects actual calendar time.

**FR-5.2**: Gap calculation:

```
gap_pixels = days_between_events * BASE_PIXELS_PER_DAY
```

Where `BASE_PIXELS_PER_DAY` = configurable (suggest 8-12px).

**FR-5.3**: Minimum gap: 16px (events on same day still visually separate).

**FR-5.4**: Maximum gap: 120px (cap very long gaps, show indicator instead).

**FR-5.5**: For gaps > 7 days, show subtle indicator: "← 14 days →"

### FR-6: Month Headers

**FR-6.1**: Month headers appear inline when events span multiple months.

**FR-6.2**: Format: "November 2025", "December 2025"

**FR-6.3**: Headers span full width, centered on timeline axis.

**FR-6.4**: Sticky positioning optional (consider for long timelines).

### FR-7: Event Cards

**FR-7.1**: Each card displays:

- Event type icon (from type mapping below)
- Event title (truncate at ~50 chars with ellipsis)
- Brief description (2 lines max, truncate)
- Relative time ("3 days ago", "In 5 days", "Today")
- Source badge: `[Timeline]` or `[Calendar]`

**FR-7.2**: Additional fields for calendar events:

- Time (if not all-day): "10:00 - 11:30"
- Location (if present): "County Court, Room 3"

**FR-7.3**: Past events have reduced opacity (75%).

**FR-7.4**: Today's events have ring highlight.

**FR-7.5**: Future events full opacity with subtle blue tint.

### FR-8: Event Type Mapping

Map database event types to display categories:

| Display Category | Icon        | Color  | Timeline Event Types                                                                                                                        |
| ---------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Document         | FileText    | Blue   | `document_uploaded`, `document_extracted`, `document_chunked`, `document_summarized`, `document_entities_extracted`                         |
| Email            | Mail        | Green  | `email_received`, `email_sent`                                                                                                              |
| Task             | CheckSquare | Purple | `task_created`, `task_completed`                                                                                                            |
| Billing          | Receipt     | Amber  | `time_entry_submitted`, `time_entry_approved`, `invoice_generated`, `invoice_sent`, `invoice_voided`, `payment_recorded`, `payment_deleted` |
| Calendar         | Calendar    | Orange | `calendar_event_created`, `calendar_event_updated`, `calendar_event_deleted`                                                                |
| AI               | Sparkles    | Violet | `conflict_check_run`, `conflict_check_cleared`, `conflict_check_waived`                                                                     |
| Matter           | Folder      | Slate  | `matter_created`, `matter_updated`, `matter_archived`                                                                                       |
| Other            | Clock       | Slate  | `lead_converted`, `quote_converted`, `approval_decided`, `note_added`                                                                       |

For `calendar_events`, map by `eventType` field:
| Calendar Event Type | Icon | Color |
|---------------------|------|-------|
| `hearing` | Scale | Blue |
| `deadline`, `filing_deadline` | AlertCircle | Orange |
| `limitation_date` | AlertTriangle | Red |
| `meeting` | Users | Green |
| `consultation` | MessageSquare | Teal |
| Other | Calendar | Slate |

### FR-9: Hover/Click Interaction

**FR-9.1**: On hover, card elevates (shadow increase, slight scale).

**FR-9.2**: On hover, show expanded tooltip/popover with:

- Full title (not truncated)
- Full description
- Absolute date and time
- Actor (who/what created it)
- Link to related entity (document, task, etc.)

**FR-9.3**: On click, navigate to related entity detail page if applicable.

**FR-9.4**: Keyboard accessible: Tab to focus, Enter to activate.

### FR-10: Summary Statistics

**FR-10.1**: Display stats bar below timeline:

| Stat                  | Calculation                      |
| --------------------- | -------------------------------- |
| Events completed      | Count where date < today         |
| Upcoming              | Count where date >= today        |
| Days active           | today - earliest event date      |
| Days to next deadline | Next calendar event date - today |

**FR-10.2**: Stats update reactively as data changes.

### FR-11: Empty States

**FR-11.1**: No events at all: "No activity yet. Events will appear as work progresses on this matter."

**FR-11.2**: No past events: TODAY marker at top, all events below.

**FR-11.3**: No future events: TODAY marker at bottom, show "No upcoming events scheduled."

---

## UI Specifications

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Timeline ▼]              [Proportional] [Compact]             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ── November 2025 ──                          │
│                                                                 │
│   ┌──────────────────────┐    │                                 │
│   │ 🤖 AI: Title analysis│────●                                 │
│   │ AI reviewed deeds... │    │                                 │
│   │ 10 Nov · 38 days ago │    │                                 │
│   └──────────────────────┘    │                                 │
│                               │                                 │
│                               │   ┌──────────────────────┐      │
│                               ●───│ 📋 Enquiries raised  │      │
│                               │   │ 15 enquiries sent... │      │
│                               │   │ 13 Nov · 35 days ago │      │
│                               │   └──────────────────────┘      │
│                               │                                 │
│                    ── December 2025 ──                          │
│                               │                                 │
│   ┌──────────────────────┐    │                                 │
│   │ 📧 Report sent       │────●                                 │
│   │ Sent to Mrs Thompson │    │                                 │
│   │ 8 Dec · 10 days ago  │    │                                 │
│   └──────────────────────┘    │                                 │
│                               │                                 │
│ ═══════════════════ 📍 TODAY · 18 Dec 2025 ═══════════════════ │
│                               │                                 │
│                               │   ┌──────────────────────┐      │
│                               ○───│ ✍️ Contract deadline │      │
│                               │   │ Return signed docs   │      │
│                               │   │ 20 Dec · In 2 days   │      │
│                               │   └──────────────────────┘      │
│                               │                                 │
│   ┌──────────────────────┐    │                                 │
│   │ ⚖️ Exchange          │────◆                                 │
│   │ Exchange of contracts│    │                                 │
│   │ 23 Dec · In 5 days   │    │                                 │
│   │ 📍 Harrison & Clarke │    │                                 │
│   └──────────────────────┘    │                                 │
│                               │                                 │
├─────────────────────────────────────────────────────────────────┤
│  Completed: 12    Upcoming: 4    Active: 38 days    Next: 2d   │
└─────────────────────────────────────────────────────────────────┘
```

### Colors (Tailwind)

| Element               | Class                         |
| --------------------- | ----------------------------- |
| Background            | `bg-slate-50`                 |
| Card background       | `bg-white`                    |
| Card border           | `border-slate-200`            |
| Timeline axis         | `bg-slate-300`                |
| Past event dot        | `bg-slate-400`                |
| Future event dot      | `bg-blue-500`                 |
| Calendar event marker | `bg-orange-500` (diamond)     |
| TODAY line            | `bg-red-500`                  |
| TODAY label           | `bg-red-500 text-white`       |
| Month header          | `text-slate-500 bg-slate-100` |

### Card Colors by Category

| Category | Background     | Border              | Icon Color        |
| -------- | -------------- | ------------------- | ----------------- |
| Document | `bg-blue-50`   | `border-blue-200`   | `text-blue-600`   |
| Email    | `bg-green-50`  | `border-green-200`  | `text-green-600`  |
| Task     | `bg-purple-50` | `border-purple-200` | `text-purple-600` |
| Billing  | `bg-amber-50`  | `border-amber-200`  | `text-amber-600`  |
| Calendar | `bg-orange-50` | `border-orange-200` | `text-orange-600` |
| AI       | `bg-violet-50` | `border-violet-200` | `text-violet-600` |
| Matter   | `bg-slate-50`  | `border-slate-300`  | `text-slate-600`  |

### Typography

| Element          | Size       | Weight          |
| ---------------- | ---------- | --------------- |
| Month header     | `text-sm`  | `font-semibold` |
| Card title       | `text-sm`  | `font-medium`   |
| Card description | `text-sm`  | `font-normal`   |
| Card timestamp   | `text-xs`  | `font-normal`   |
| TODAY label      | `text-sm`  | `font-bold`     |
| Stats numbers    | `text-2xl` | `font-bold`     |
| Stats labels     | `text-sm`  | `font-normal`   |

### Spacing

| Element               | Value               |
| --------------------- | ------------------- |
| Container padding     | `p-6`               |
| Card padding          | `p-4`               |
| Card border radius    | `rounded-xl`        |
| Timeline axis width   | `w-0.5` (2px)       |
| Event dot size        | `w-3 h-3` (12px)    |
| Connector line length | `w-8` (32px)        |
| Card max width        | `max-w-sm` (~384px) |

### Transitions

| Interaction      | Duration | Easing        |
| ---------------- | -------- | ------------- |
| Card hover       | `200ms`  | `ease-out`    |
| View mode toggle | `300ms`  | `ease-in-out` |
| Tooltip appear   | `150ms`  | `ease-out`    |

---

## Component Structure

```
app/(app)/matters/[id]/
├── page.tsx                      # Remove Calendar tab, update Timeline tab
└── _components/
    └── timeline/
        ├── unified-timeline.tsx      # Main container, data fetching
        ├── timeline-event-card.tsx   # Individual event card
        ├── timeline-axis.tsx         # Center line + dots
        ├── timeline-today-marker.tsx # TODAY divider
        ├── timeline-month-header.tsx # Month separators
        ├── timeline-stats.tsx        # Summary statistics bar
        ├── timeline-empty.tsx        # Empty state
        └── types.ts                  # UnifiedEvent, display mappings
```

---

## API Requirements

### Existing Endpoints (no changes needed)

- `GET /api/matters/:id/timeline` - returns `timeline_events`
- `GET /api/calendar?matterId=:id&from=:from&to=:to` - returns `calendar_events`

### Client-Side Merge

```typescript
interface UnifiedEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  source: "timeline" | "calendar";
  eventType: string; // Original type from DB
  displayCategory: DisplayCategory;
  actorType?: "user" | "system" | "ai";
  metadata?: Record<string, unknown>;
  // Calendar-specific
  startTime?: string;
  endTime?: string;
  location?: string;
  allDay?: boolean;
}

type DisplayCategory =
  | "document"
  | "email"
  | "task"
  | "billing"
  | "calendar"
  | "ai"
  | "matter"
  | "other";
```

---

## Accessibility Requirements

- **ACC-01**: All interactive elements keyboard accessible (Tab navigation)
- **ACC-02**: Event cards have `aria-label`: "[Title], [Category], [Relative date]"
- **ACC-03**: TODAY marker has `role="status"` and `aria-live="polite"`
- **ACC-04**: Color is not the only indicator - icons required for each category
- **ACC-05**: Contrast ratio meets WCAG AA (4.5:1 for text)
- **ACC-06**: Focus indicators visible on all interactive elements
- **ACC-07**: Screen reader users can navigate chronologically

---

## Performance Requirements

- **PERF-01**: Render within 500ms for ≤100 events
- **PERF-02**: Smooth scroll at 60fps
- **PERF-03**: Hover interactions <50ms response
- **PERF-04**: View mode toggle instant (no refetch)
- **PERF-05**: Consider virtualization if >200 events

---

## Test Plan

### Unit Tests

- [ ] Event type mapping returns correct display category
- [ ] Time gap calculation correct
- [ ] Relative time formatting ("3 days ago", "In 5 days")
- [ ] Zigzag side assignment (even=left, odd=right)

### Integration Tests

- [ ] Fetches and merges both data sources
- [ ] Sorts events chronologically
- [ ] TODAY position calculated correctly

### E2E Tests

- [ ] Timeline renders with demo data (MAT-DEMO-001 has 66 events)
- [ ] View mode toggle persists
- [ ] Scroll to TODAY on load
- [ ] Mobile responsive (single column)
- [ ] Card hover shows expanded details
- [ ] Click navigates to entity detail

---

## Acceptance Checklist

### Layout

- [ ] Centered vertical timeline axis
- [ ] Events alternate left/right (zigzag)
- [ ] Connector lines link cards to axis
- [ ] Mobile collapses to single column

### TODAY Marker

- [ ] Visible with date label
- [ ] Spans full width
- [ ] Page scrolls to center TODAY on load
- [ ] Today's events highlighted

### Events

- [ ] Timeline events shown (filled dots)
- [ ] Calendar events shown (diamond markers)
- [ ] Correct icons per category
- [ ] Correct colors per category
- [ ] Past events reduced opacity
- [ ] Hover shows expanded details

### Time Display

- [ ] Proportional mode: gaps reflect real time
- [ ] Compact mode: uniform spacing
- [ ] Gap indicators for >7 day gaps
- [ ] Month headers displayed

### Statistics

- [ ] Completed count accurate
- [ ] Upcoming count accurate
- [ ] Days active calculated
- [ ] Days to next deadline shown

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces events
- [ ] Color not sole indicator

---

## Out of Scope (Future)

- Filter by event type/category
- Search within timeline
- Drag to reschedule calendar events
- Print-optimized view
- Export timeline as PDF
- Swimlanes by actor/party
- Zoom levels (week/month/quarter)

---

## Solution Design

### Existing Code to Reuse

| File                                     | What it provides                                            |
| ---------------------------------------- | ----------------------------------------------------------- |
| `app/api/matters/[id]/timeline/route.ts` | Timeline API - paginated, filterable by type, date range    |
| `app/api/calendar/route.ts`              | Calendar API - filterable by matterId, date range           |
| `lib/db/schema/timeline.ts`              | `timelineEventTypeEnum` with 25 event types                 |
| `lib/db/schema/calendar.ts`              | `calendarEventTypeEnum` with 7 event types                  |
| `app/(app)/matters/[id]/page.tsx`        | Existing `TimelineTab` component to replace (lines 217-315) |
| `components/ui/card.tsx`                 | Card component for event cards                              |
| `components/ui/badge.tsx`                | Badge for category/source indicators                        |
| `components/ui/button.tsx`               | Toggle buttons for view mode                                |
| `components/ui/skeleton.tsx`             | Loading states                                              |
| `components/ui/empty-state.tsx`          | Empty state component                                       |

### Dependencies to Add

```bash
# Add HoverCard for event detail popovers
npx shadcn@latest add hover-card
```

### Files to Create

| File                                                                    | Purpose                                      |
| ----------------------------------------------------------------------- | -------------------------------------------- |
| `app/(app)/matters/[id]/_components/timeline/unified-timeline.tsx`      | Main container with data fetching and layout |
| `app/(app)/matters/[id]/_components/timeline/timeline-event-card.tsx`   | Individual event card with hover state       |
| `app/(app)/matters/[id]/_components/timeline/timeline-axis.tsx`         | Central vertical line with dots/diamonds     |
| `app/(app)/matters/[id]/_components/timeline/timeline-today-marker.tsx` | TODAY horizontal divider                     |
| `app/(app)/matters/[id]/_components/timeline/timeline-month-header.tsx` | Month separator headers                      |
| `app/(app)/matters/[id]/_components/timeline/timeline-stats.tsx`        | Bottom statistics bar                        |
| `app/(app)/matters/[id]/_components/timeline/timeline-empty.tsx`        | Empty state wrapper                          |
| `app/(app)/matters/[id]/_components/timeline/types.ts`                  | TypeScript types and mapping functions       |
| `app/(app)/matters/[id]/_components/timeline/index.ts`                  | Barrel export                                |

### Files to Modify

| File                              | Change                                                        |
| --------------------------------- | ------------------------------------------------------------- |
| `app/(app)/matters/[id]/page.tsx` | Remove Calendar tab, replace TimelineTab with UnifiedTimeline |

### Demo Data Analysis (MAT-DEMO-001)

Analyzed actual demo data distribution for conveyancing matter:

```
Timeline Events (12 total):
- Days 45-38: 8 events in 7 days (DENSE - matter opening)
- Days 38-35: 1 event (3 day gap)
- Days 35-28: 1 event (7 day gap - waiting for searches)
- Days 28-21: 1 event (7 day gap - waiting for replies)
- Days 21-14: 1 event (7 day gap - waiting for mortgage)
- Days 14-10: 1 event (4 day gap)

Calendar Events (for this matter):
- "Client Meeting - Property Purchase Update" in 3 days
```

This confirms time-proportional spacing will reveal the real workflow pattern: initial burst of activity, then waiting periods.

### Time-Proportional Spacing Algorithm

```typescript
const BASE_PIXELS_PER_DAY = 12;
const MIN_GAP = 24; // px - same day events still separate
const MAX_GAP = 120; // px - cap long waits, show indicator
const GAP_INDICATOR_THRESHOLD = 7; // days

function calculateGap(daysBetween: number): { gap: number; showIndicator: boolean } {
  const rawGap = daysBetween * BASE_PIXELS_PER_DAY;
  const gap = Math.max(MIN_GAP, Math.min(rawGap, MAX_GAP));
  const showIndicator = daysBetween > GAP_INDICATOR_THRESHOLD && rawGap > MAX_GAP;
  return { gap, showIndicator };
}

// Examples with 12px/day:
// 0 days (same day): 24px (MIN)
// 1 day: 24px (MIN)
// 3 days: 36px
// 7 days: 84px
// 10+ days: 120px (MAX) + indicator
```

### Scroll-to-TODAY Implementation

```typescript
// In unified-timeline.tsx
const todayRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (todayRef.current) {
    todayRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [events]); // Scroll when events load
```

### Event Type Display Mapping

```typescript
// In types.ts
import {
  FileText,
  Mail,
  CheckSquare,
  Receipt,
  Calendar,
  Sparkles,
  Folder,
  Clock,
  Scale,
  AlertCircle,
  AlertTriangle,
  Users,
  MessageSquare,
} from "lucide-react";

type DisplayCategory =
  | "document"
  | "email"
  | "task"
  | "billing"
  | "calendar"
  | "ai"
  | "matter"
  | "other";

const TIMELINE_TYPE_MAP: Record<string, DisplayCategory> = {
  document_uploaded: "document",
  document_extracted: "document",
  document_chunked: "document",
  document_summarized: "document",
  document_entities_extracted: "document",
  email_received: "email",
  email_sent: "email",
  task_created: "task",
  task_completed: "task",
  time_entry_submitted: "billing",
  time_entry_approved: "billing",
  invoice_generated: "billing",
  invoice_sent: "billing",
  invoice_voided: "billing",
  payment_recorded: "billing",
  payment_deleted: "billing",
  calendar_event_created: "calendar",
  calendar_event_updated: "calendar",
  calendar_event_deleted: "calendar",
  conflict_check_run: "ai",
  conflict_check_cleared: "ai",
  conflict_check_waived: "ai",
  matter_created: "matter",
  matter_updated: "matter",
  matter_archived: "matter",
  lead_converted: "other",
  quote_converted: "other",
  approval_decided: "other",
  note_added: "other",
};

const CATEGORY_CONFIG: Record<
  DisplayCategory,
  { icon: LucideIcon; bg: string; border: string; iconColor: string }
> = {
  document: {
    icon: FileText,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
  },
  email: { icon: Mail, bg: "bg-green-50", border: "border-green-200", iconColor: "text-green-600" },
  task: {
    icon: CheckSquare,
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconColor: "text-purple-600",
  },
  billing: {
    icon: Receipt,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
  },
  calendar: {
    icon: Calendar,
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconColor: "text-orange-600",
  },
  ai: {
    icon: Sparkles,
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconColor: "text-violet-600",
  },
  matter: {
    icon: Folder,
    bg: "bg-slate-50",
    border: "border-slate-300",
    iconColor: "text-slate-600",
  },
  other: {
    icon: Clock,
    bg: "bg-slate-50",
    border: "border-slate-300",
    iconColor: "text-slate-600",
  },
};
```

### Data Fetching Strategy

```typescript
// In unified-timeline.tsx
const { data: timelineData } = useQuery({
  queryKey: ["matter-timeline", matterId],
  queryFn: () => fetch(`/api/matters/${matterId}/timeline?limit=200`).then((r) => r.json()),
});

const { data: calendarData } = useQuery({
  queryKey: ["matter-calendar", matterId],
  queryFn: () =>
    fetch(`/api/calendar?matterId=${matterId}&from=${sixMonthsAgo}&to=${sixMonthsAhead}`).then(
      (r) => r.json()
    ),
});

// Merge and sort
const unifiedEvents = useMemo(() => {
  const timeline = (timelineData?.events || []).map((e) => ({
    ...e,
    date: new Date(e.occurredAt),
    source: "timeline" as const,
    displayCategory: TIMELINE_TYPE_MAP[e.type] || "other",
  }));

  const calendar = (calendarData?.events || []).map((e) => ({
    ...e,
    date: new Date(e.startAt),
    source: "calendar" as const,
    displayCategory: "calendar" as const,
    startTime: e.allDay ? null : format(new Date(e.startAt), "HH:mm"),
    endTime: e.endAt && !e.allDay ? format(new Date(e.endAt), "HH:mm") : null,
  }));

  return [...timeline, ...calendar].sort((a, b) => a.date.getTime() - b.date.getTime());
}, [timelineData, calendarData]);
```

---

## Test Strategy

### Unit Tests

| Test File                                                                | Test Cases                                 |
| ------------------------------------------------------------------------ | ------------------------------------------ |
| `tests/unit/app/(app)/matters/[id]/_components/timeline/types.test.ts`   | Event type mapping, category config lookup |
| `tests/unit/app/(app)/matters/[id]/_components/timeline/spacing.test.ts` | Gap calculation, indicator threshold       |
| `tests/unit/app/(app)/matters/[id]/_components/timeline/utils.test.ts`   | Relative time formatting, date helpers     |

### Unit Test Cases

```typescript
// types.test.ts
describe("TIMELINE_TYPE_MAP", () => {
  it("maps document_uploaded to document category", () => {
    expect(TIMELINE_TYPE_MAP["document_uploaded"]).toBe("document");
  });

  it("maps all 25 timeline event types", () => {
    const allTypes = ["matter_created", "document_uploaded" /* ... */];
    allTypes.forEach((type) => {
      expect(TIMELINE_TYPE_MAP[type]).toBeDefined();
    });
  });
});

// spacing.test.ts
describe("calculateGap", () => {
  it("returns MIN_GAP for same day events", () => {
    expect(calculateGap(0).gap).toBe(24);
  });

  it("returns calculated gap for 3 days", () => {
    expect(calculateGap(3).gap).toBe(36);
  });

  it("caps at MAX_GAP for 10+ days", () => {
    expect(calculateGap(10).gap).toBe(120);
    expect(calculateGap(30).gap).toBe(120);
  });

  it("shows indicator for gaps > 7 days exceeding MAX_GAP", () => {
    expect(calculateGap(7).showIndicator).toBe(false);
    expect(calculateGap(14).showIndicator).toBe(true);
  });
});

// utils.test.ts
describe("formatRelativeTime", () => {
  it('formats "Today" for same day', () => {
    expect(formatRelativeTime(new Date())).toBe("Today");
  });

  it('formats "Yesterday" for 1 day ago', () => {
    const yesterday = subDays(new Date(), 1);
    expect(formatRelativeTime(yesterday)).toBe("Yesterday");
  });

  it('formats "3 days ago" for past dates', () => {
    const threeDaysAgo = subDays(new Date(), 3);
    expect(formatRelativeTime(threeDaysAgo)).toBe("3 days ago");
  });

  it('formats "In 5 days" for future dates', () => {
    const fiveDaysAhead = addDays(new Date(), 5);
    expect(formatRelativeTime(fiveDaysAhead)).toBe("In 5 days");
  });
});
```

### Integration Tests

| Test File                                          | Test Cases                        |
| -------------------------------------------------- | --------------------------------- |
| `tests/integration/timeline/unified-fetch.test.ts` | Fetch and merge both data sources |

### E2E Tests

| Test File                                   | Test Cases                       |
| ------------------------------------------- | -------------------------------- |
| `tests/e2e/browser/matter-timeline.spec.ts` | Full user journey with demo data |

### E2E Test Cases

```typescript
// matter-timeline.spec.ts
test.describe("Unified Timeline", () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo user, navigate to MAT-DEMO-001
    await page.goto("/matters/de000000-0000-4000-a002-000000000001");
    await page.getByRole("tab", { name: "Timeline" }).click();
  });

  test("renders timeline with demo events", async ({ page }) => {
    // MAT-DEMO-001 has 12 timeline events + 1 calendar event
    await expect(page.getByTestId("timeline-event-card")).toHaveCount(13);
  });

  test("shows TODAY marker", async ({ page }) => {
    await expect(page.getByText("TODAY")).toBeVisible();
  });

  test("scrolls to TODAY on load", async ({ page }) => {
    const todayMarker = page.getByTestId("today-marker");
    await expect(todayMarker).toBeInViewport();
  });

  test("toggles between proportional and compact views", async ({ page }) => {
    await page.getByRole("button", { name: "Compact" }).click();
    // Verify uniform spacing
    await page.getByRole("button", { name: "Proportional" }).click();
    // Verify time-proportional spacing
  });

  test("shows event details on hover", async ({ page }) => {
    const firstCard = page.getByTestId("timeline-event-card").first();
    await firstCard.hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
  });

  test("collapses to single column on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Verify all cards on right side of axis
  });
});
```

---

## References

- Original mockup: `backlog/waiting/timeline-view.md`
- Current implementation: `app/(app)/matters/[id]/page.tsx`
- Timeline schema: `lib/db/schema/timeline.ts`
- Calendar schema: `lib/db/schema/calendar.ts`
- Timeline API: `app/api/matters/[id]/timeline/route.ts`
- Calendar API: `app/api/calendar/route.ts`
- Demo data seeder: `tests/fixtures/demo-data/seeders/timeline-events.ts`
- Demo calendar seeder: `tests/fixtures/demo-data/seeders/calendar-events.ts`
