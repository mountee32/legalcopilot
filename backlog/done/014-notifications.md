# Notifications - Schema & API

## Priority: LOW (Phase 2)

## Summary

Implement notification system for in-app, email, and push notifications.

## Requirements

- In-app notifications (unread count, list, mark read)
- Email notifications (configurable per user)
- Push notifications (future)
- Notification preferences per user

## Scope

### Database Schema

- `notifications` table: userId, type, title, body, link, read, readAt, channel, sentAt
- `notificationPreferences` table: userId, type, channels (email, inApp, push)

### API Routes

- `GET /api/notifications` - List user's notifications
- `POST /api/notifications/[id]/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/preferences` - Get preferences
- `PATCH /api/notifications/preferences` - Update preferences

### Notification Types

- task_assigned, task_due, task_overdue
- approval_required, approval_decided
- deadline_approaching, deadline_passed
- email_received, document_uploaded
- invoice_paid, payment_received

## Design

### Tenancy & Auth

- Notifications are firm-scoped and user-targeted; derive firm from session and only return notifications for the authenticated user.

### Delivery Model

- Store in-app notifications in PostgreSQL as the system of record.
- Use background jobs for email/push delivery; record delivery attempts in metadata for auditability.

### API Shape

- List endpoint is always user-scoped; support pagination and optional filtering by `read` and `type`.
- “Mark read” endpoints are idempotent and update only rows belonging to the user.
- Preferences are a JSONB blob per user for MVP; migrate to normalized tables if/when needed.

### Tests

- User isolation (can’t read/mark other users’ notifications), pagination, and preference updates.

## References

- docs/backend-design.md Section 2.24 (Notification entity)
