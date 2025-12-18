# TASK: Team & resource management APIs

## Goal

Support holidays/leave, capacity tracking, and workload rebalancing signals.

## Scope

- Leave request lifecycle (request/approve/reject)
- Team availability views
- Capacity/utilisation summaries (inputs for suggestions)

## Acceptance Criteria

- Admin can approve leave and see impact warnings
- Data is tenant-scoped and permissioned

## References

- `docs/ideas.md` (Epic 25)

## Design

### New Schema (`lib/db/schema/team.ts`)

- `leaveRequests`: userId, type, startDate, endDate, status, decidedBy
- `availabilityWindows`: userId, dayOfWeek, startTime, endTime

### Leave Types

`annual`, `sick`, `parental`, `unpaid`, `other`

### Endpoints

| Endpoint                            | Permission         | Purpose               |
| ----------------------------------- | ------------------ | --------------------- |
| `GET/POST /api/team/leave`          | leave:read/request | List/submit requests  |
| `POST /api/team/leave/[id]/approve` | leave:approve      | Approve request       |
| `POST /api/team/leave/[id]/reject`  | leave:approve      | Reject request        |
| `GET /api/team/availability`        | team:read          | Team calendar view    |
| `GET /api/team/capacity`            | team:read          | Utilisation summary   |
| `GET /api/team/workload`            | team:read          | Workload distribution |

### Impact Warnings

AI-generated warnings when approving:

- Uncovered matters
- Critical deadlines during absence
- Court dates
- Suggested reassignments

### Test Strategy

- Unit: leave request CRUD, permission checks
- Integration: approval workflow, capacity calculation
- E2E: full leave request lifecycle
