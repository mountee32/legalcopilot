# TASK: Integration tests for Calendar API

## Priority: 6 (Depends on Matters)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests

## Endpoints to Test

| Method | Endpoint                 | Current Coverage |
| ------ | ------------------------ | ---------------- |
| GET    | `/api/calendar`          | ❌ Unit only     |
| POST   | `/api/calendar`          | ❌ Unit only     |
| GET    | `/api/calendar/[id]`     | ❌ None          |
| PATCH  | `/api/calendar/[id]`     | ❌ None          |
| DELETE | `/api/calendar/[id]`     | ❌ None          |
| GET    | `/api/calendar/upcoming` | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- [x] Create calendar event
- [x] Create event linked to matter
- [x] Create event with attendees
- [x] Get event by ID
- [x] Update event (time, title, location)
- [x] Delete event
- [x] List events with date range filter

### Event Types

- [x] Court dates
- [x] Client meetings
- [x] Deadlines
- [x] Internal meetings

### Upcoming Events

- [x] Get upcoming events for user
- [x] Filter by date range
- [x] Include matter context

### Multi-tenancy

- [x] Events isolated by firm
- [x] Cannot access other firm's events

## Test File Location

`tests/integration/calendar/crud.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Event types handled correctly
- [x] All tests pass with `npm run test:integration`
