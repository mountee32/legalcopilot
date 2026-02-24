# Calendar Events - Schema & API

## Priority: HIGH

## Summary

Implement calendar/deadline management for matters. Track court dates, limitation periods, key deadlines, and appointments.

## Requirements

- Calendar events linked to matters
- Support different event types (hearing, deadline, meeting, reminder)
- Warning system for approaching deadlines
- Support all-day events and timed events

## Scope

### Database Schema (`lib/db/schema/calendar.ts`)

- `calendarEvents` table with:
  - id, firmId, matterId (nullable for firm-wide events)
  - title, description
  - eventType (hearing/deadline/meeting/reminder/limitation_date/filing_deadline/other)
  - startDate, endDate
  - allDay (boolean)
  - location
  - attendees (JSONB array of user IDs or external names)
  - reminderMinutes (array: [1440, 60] = 1 day and 1 hour before)
  - priority (low/medium/high/critical)
  - status (scheduled/completed/cancelled/rescheduled)
  - recurrence (JSONB: rrule-style or null for one-time)
  - createdById
  - externalId, externalSource (for future calendar sync)

### API Routes

- `GET /api/calendar` - List calendar events with date range and filters
- `POST /api/calendar` - Create calendar event
- `GET /api/calendar/[id]` - Get event details
- `PATCH /api/calendar/[id]` - Update event
- `DELETE /api/calendar/[id]` - Delete event
- `GET /api/calendar/upcoming` - Get upcoming deadlines/events

### API Schemas (`lib/api/schemas/calendar.ts`)

- CalendarEventSchema, CreateCalendarEventSchema, UpdateCalendarEventSchema
- CalendarQuerySchema, CalendarListSchema
- UpcomingEventsSchema

## Design

### Tenancy & Auth

- Derive `firmId` from session; enforce firm scoping in every query (`withFirmDb` + explicit `firmId` predicates).

### Data Model

- Create `lib/db/schema/calendar.ts` with a minimal set of fields required for deadlines/appointments; keep recurrence/reminders in JSONB until proven.
- Index for core queries: `firmId + startDate`, plus `firmId + matterId`.

### AI & Approvals

- AI-suggested deadlines/meetings should be created via `approval_requests` (`action: "calendar_event.create"`) and only persisted on approval.
- Human-created events write directly.

### API Shape

- `GET /api/calendar` supports date range filtering (required), plus `matterId`, `eventType`, `status`.
- `GET /api/calendar/upcoming` is a convenience wrapper for the next N days with server-side defaults.
- Add Zod request/response schemas and register in `scripts/generate-openapi.ts`.

### Tests

- Route tests should cover date-range validation, firm isolation, and approval-gated AI suggestions.

## Out of Scope (Phase 2)

- Google Calendar / Microsoft 365 sync
- Recurring event expansion
- Calendar invitations via email

## References

- docs/backend-design.md Section 2.12 (CalendarEvent entity)
