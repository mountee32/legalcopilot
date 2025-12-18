# FEAT: Frontend — Dashboard (Home)

## Goal

Provide an AI-first command centre showing what needs attention today.

## Scope

- Dashboard page + widgets (briefing, urgent items, approvals summary, tasks today, calendar today, firm snapshot)
- "Approve high confidence" bulk action entry point

## Dependencies

- API: `GET /api/approvals`, `GET /api/tasks`, `GET /api/notifications`, `GET /api/calendar/upcoming`, `GET /api/invoices`, `GET /api/matters`
- Optional API: dashboard aggregate endpoint (only if perf becomes an issue)

## Acceptance Criteria

- Dashboard loads via existing list endpoints and supports navigation to detail screens
- Bulk approvals route users into Approval Queue with filters pre-applied

## References

- `docs/frontend-design.md` (Dashboard)
- `docs/ideas.md` (Epics 1, 6)

---

## Solution Design

### Architecture Overview

Replace the current developer-focused dashboard with an AI-first command centre. The dashboard will fetch data from multiple existing API endpoints in parallel and display it in digestible widgets.

### Files to Create

```
app/(app)/dashboard/
├── page.tsx                      # Main dashboard page (replace existing)
├── loading.tsx                   # Streaming loading state

components/dashboard/
├── dashboard-greeting.tsx        # "Good morning, Jane" + date
├── ai-briefing-card.tsx         # AI-generated daily summary
├── urgent-items-card.tsx        # Limitation dates, alerts, overdue items
├── approval-queue-card.tsx      # Pending approvals with confidence scores
├── tasks-today-card.tsx         # Tasks due today
├── calendar-today-card.tsx      # Today's calendar events
├── firm-snapshot-card.tsx       # Key firm metrics
├── dashboard-skeleton.tsx       # Loading skeleton for dashboard

lib/hooks/
├── use-dashboard-data.ts        # Custom hook to fetch all dashboard data in parallel
```

### Files to Modify

- `app/(app)/dashboard/page.tsx` — Complete rewrite (currently shows dev test tools)

### Data Models

No new database tables required. Uses existing endpoints:

| Widget        | API Endpoint                 | Query Params              |
| ------------- | ---------------------------- | ------------------------- |
| Approvals     | `GET /api/approvals`         | `status=pending&limit=5`  |
| Tasks         | `GET /api/tasks`             | `status=pending&limit=10` |
| Calendar      | `GET /api/calendar/upcoming` | `days=1&limit=5`          |
| Matters       | `GET /api/matters`           | `status=active&limit=5`   |
| Invoices      | `GET /api/invoices`          | `status=overdue&limit=5`  |
| Notifications | `GET /api/notifications`     | `read=false&limit=5`      |

### API Response Shapes (from existing endpoints)

**Approvals** (`/api/approvals`):

```typescript
{
  approvals: Array<{
    id: string;
    action: string; // 'send_email' | 'stage_change' | 'time_entry' | etc.
    summary: string;
    status: string; // 'pending' | 'approved' | 'rejected'
    entityType?: string;
    entityId?: string;
    matterId?: string;
    aiMetadata?: { confidence?: number; model?: string };
    createdAt: string;
  }>;
  pagination: {
    total: number;
  }
}
```

**Tasks** (`/api/tasks`):

```typescript
{
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string; // 'pending' | 'in_progress' | 'completed'
    priority: string; // 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: string;
    matterId: string;
    assigneeId?: string;
  }>;
  pagination: {
    total: number;
  }
}
```

**Calendar** (`/api/calendar/upcoming`):

```typescript
{
  events: Array<{
    id: string;
    title: string;
    eventType: string; // 'meeting' | 'deadline' | 'court_hearing' | etc.
    startAt: string;
    endAt?: string;
    matterId?: string;
    location?: string;
  }>;
}
```

### UI Components Design

Based on `docs/frontend-design.md` Dashboard section:

**Layout (2-column on desktop, stacked on mobile)**:

```
+------------------------------------------------------------------+
|  Good morning, Jane                              Wed 18 Dec 2024  |
+------------------------------------------------------------------+
|  +-----------------------------+  +-----------------------------+ |
|  | AI BRIEFING                 |  | URGENT ITEMS                | |
|  +-----------------------------+  +-----------------------------+ |
|  +---------------------------------------------------------------+|
|  | APPROVAL QUEUE (7)                                            ||
|  +---------------------------------------------------------------+|
|  +---------------------------+  +-------------------------------+ |
|  | MY TASKS TODAY (8)        |  | CALENDAR TODAY                | |
|  +---------------------------+  +-------------------------------+ |
|  +---------------------------------------------------------------+|
|  | FIRM SNAPSHOT                                                 ||
|  +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### Component Specifications

**DashboardGreeting**

- Shows user's first name from auth context
- Shows current date in UK format (e.g., "Wed 18 Dec 2024")

**AIBriefingCard**

- Placeholder text for now (AI integration in future feature)
- Shows static briefing summary counting tasks, emails, meetings
- Refresh button (disabled for MVP)

**UrgentItemsCard**

- Filter notifications by `type` containing 'deadline', 'limitation', 'overdue'
- Show top 3-5 urgent items with icons
- Links to relevant case/email/invoice

**ApprovalQueueCard**

- Show top 5 pending approvals with confidence scores
- Color-coded confidence: >90% green, 70-89% yellow, <70% red
- Quick approve/reject buttons for high confidence
- "Approve All High Confidence (>90%)" bulk action button
- "View All" link to approval queue page

**TasksTodayCard**

- Show tasks with `dueDate` = today or overdue
- Checkbox to mark complete inline
- Priority badges (urgent=red, high=orange, medium=yellow, low=gray)
- "View All Tasks" link

**CalendarTodayCard**

- Show today's events sorted by time
- Event type icon (meeting, deadline, court hearing)
- Time in HH:MM format
- "Join" button if event has meeting link (future)
- "View Full Calendar" link

**FirmSnapshotCard**

- Static counters: Active cases, WIP value, MTD collections
- Overdue invoices count with warning if > 0

### State Management

- Use React Query (`@tanstack/react-query`) for data fetching with automatic caching
- Create `useDashboardData()` custom hook that fetches all endpoints in parallel
- Loading states: Skeleton for each card independently
- Error states: Show error boundary fallback per card (not whole page)

### Error Handling

- Each card handles its own loading/error state independently
- If one API fails, other cards still render
- Auth errors (401) redirect to login (handled by existing middleware)
- Network errors show retry button in card

### Accessibility

- Semantic HTML5 landmarks (main, section, article)
- ARIA labels on all interactive elements
- Focus management for approve/reject buttons
- Color contrast meets WCAG AA (4.5:1)

---

## Test Strategy

### Unit Tests

- [ ] `tests/unit/components/dashboard/dashboard-greeting.test.tsx`
  - Renders user's first name from auth context
  - Shows current date in correct format
  - Handles missing user name gracefully

- [ ] `tests/unit/components/dashboard/approval-queue-card.test.tsx`
  - Renders pending approvals list
  - Shows confidence badges with correct colors
  - Approve button triggers callback
  - Reject button triggers callback
  - "View All" link has correct href
  - Handles empty state

- [ ] `tests/unit/components/dashboard/tasks-today-card.test.tsx`
  - Renders tasks list
  - Shows priority badges
  - Checkbox triggers complete callback
  - Overdue tasks highlighted
  - Handles empty state

- [ ] `tests/unit/components/dashboard/calendar-today-card.test.tsx`
  - Renders events in time order
  - Shows event type icons
  - Handles empty state
  - "View Full Calendar" link works

- [ ] `tests/unit/components/dashboard/urgent-items-card.test.tsx`
  - Renders urgent items
  - Shows correct icons per item type
  - Links navigate correctly
  - Handles empty state

- [ ] `tests/unit/components/dashboard/firm-snapshot-card.test.tsx`
  - Renders metrics correctly
  - Shows warning for overdue invoices
  - Handles zero values

- [ ] `tests/unit/lib/hooks/use-dashboard-data.test.ts`
  - Fetches all endpoints in parallel
  - Returns combined data
  - Handles individual endpoint failures
  - Returns loading state

### E2E Tests

- [ ] `tests/e2e/browser/dashboard.spec.ts`
  - Dashboard loads and shows greeting with user name
  - All cards render (even if empty)
  - Navigation links work (View All Tasks, View Full Calendar, etc.)
  - Approve button sends request (mock or real)
  - Task checkbox marks task complete

### Test Cases Summary

| Component         | Happy Path        | Empty State                | Error State         | Edge Cases               |
| ----------------- | ----------------- | -------------------------- | ------------------- | ------------------------ |
| DashboardGreeting | Shows name + date | Shows "Welcome" if no name | N/A                 | Timezone handling        |
| ApprovalQueueCard | Shows approvals   | "No pending approvals"     | Shows error message | 0 confidence, >100 items |
| TasksTodayCard    | Shows tasks       | "All caught up!"           | Shows error message | Overdue highlighting     |
| CalendarTodayCard | Shows events      | "No events today"          | Shows error message | All-day events           |
| UrgentItemsCard   | Shows items       | "Nothing urgent"           | Shows error message | Multiple urgent types    |
| FirmSnapshotCard  | Shows metrics     | Shows zeros                | Shows error message | Large numbers formatting |

---

## Implementation Notes

1. **React Query Setup**: Install `@tanstack/react-query` if not present, add QueryClientProvider to app layout

2. **Parallel Fetching**: Use `Promise.all` or React Query's `useQueries` for concurrent API calls

3. **Confidence Colors**:
   - `>= 90%`: `bg-green-100 text-green-800`
   - `70-89%`: `bg-yellow-100 text-yellow-800`
   - `< 70%`: `bg-red-100 text-red-800`

4. **Date Handling**: Use `date-fns` for formatting (already in deps)

5. **Priority Colors**:
   - urgent: `destructive` variant
   - high: `warning` variant
   - medium: `secondary` variant
   - low: `outline` variant

6. **Responsive Breakpoints**:
   - Mobile (<768px): Single column stack
   - Desktop (>=768px): 2-column grid for pairs

---

## Assumptions

1. User has valid session (enforced by AuthGate in layout)
2. API endpoints return empty arrays if no data (not errors)
3. AI briefing is placeholder text for MVP (no actual AI generation)
4. Bulk approve navigates to approval queue with filter applied (doesn't approve inline)
5. "Join" button for calendar events is placeholder (no meeting integration yet)
