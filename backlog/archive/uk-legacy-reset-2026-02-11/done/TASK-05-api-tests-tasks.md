# TASK: Integration tests for Tasks API

## Priority: 5 (Depends on Matters)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests

## Endpoints to Test

| Method | Endpoint                   | Current Coverage |
| ------ | -------------------------- | ---------------- |
| GET    | `/api/tasks`               | ❌ Unit only     |
| POST   | `/api/tasks`               | ❌ Unit only     |
| GET    | `/api/tasks/[id]`          | ❌ None          |
| PATCH  | `/api/tasks/[id]`          | ❌ None          |
| DELETE | `/api/tasks/[id]`          | ❌ None          |
| POST   | `/api/tasks/[id]/complete` | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- [x] Create task for matter
- [x] Create task with due date and assignee
- [x] Get task by ID
- [x] Update task (title, description, due date)
- [x] Delete task
- [x] List tasks with filtering
- [x] Filter by matter, assignee, status, due date

### Task Workflow

- [x] Mark task as complete
- [x] Reopen completed task
- [x] Task completion updates matter timeline

### Assignment

- [x] Assign task to user
- [x] Reassign task
- [x] List tasks assigned to user

### Multi-tenancy

- [x] Tasks isolated by firm
- [x] Cannot access other firm's tasks

## Test File Location

`tests/integration/tasks/crud.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Task workflow verified
- [x] All tests pass with `npm run test:integration`
