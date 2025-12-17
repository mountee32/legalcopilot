# TASK: Integration tests for Notifications API

## Priority: 14 (Depends on various - notifications triggered by actions)

## Dependencies

- TASK-01: Matters API tests
- TASK-05: Tasks API tests
- TASK-10: Approvals API tests

## Endpoints to Test

| Method | Endpoint                         | Current Coverage |
| ------ | -------------------------------- | ---------------- |
| GET    | `/api/notifications`             | ❌ Unit only     |
| POST   | `/api/notifications/[id]/read`   | ❌ None          |
| POST   | `/api/notifications/read-all`    | ❌ None          |
| GET    | `/api/notifications/preferences` | ❌ Unit only     |
| PATCH  | `/api/notifications/preferences` | ❌ Unit only     |

## Test Scenarios Required

### List Notifications

- [ ] Get unread notifications
- [ ] Get all notifications with pagination
- [ ] Filter by type (task, approval, email)
- [ ] Notifications ordered by date

### Read Actions

- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Unread count updates

### Notification Types

- [ ] Task assigned notification
- [ ] Task due notification
- [ ] Approval required notification
- [ ] Email received notification
- [ ] Matter update notification

### Preferences

- [ ] Get notification preferences
- [ ] Update email notification settings
- [ ] Update in-app notification settings
- [ ] Preferences per notification type

### Multi-tenancy

- [ ] Notifications isolated by user/firm
- [ ] Cannot see other users' notifications

## Test File Location

`tests/integration/notifications/crud.test.ts`

## Acceptance Criteria

- [ ] All endpoints have integration tests
- [ ] Tests use real database (setupIntegrationSuite)
- [ ] Notification creation verified via triggers
- [ ] All tests pass with `npm run test:integration`
