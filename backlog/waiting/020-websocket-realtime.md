# WebSocket Real-time Updates

## Priority: LOW (Phase 2)

## Summary

Implement WebSocket server for real-time UI updates.

## Requirements

- Real-time notifications
- Live updates to case data
- Presence indicators (who's viewing)
- Typing indicators for collaborative features

## Scope

### WebSocket Server

- Socket.io or native WebSocket
- Authentication via session token
- Room-based subscriptions (per matter, per firm)

### Event Types

- `notification:new` - New notification
- `matter:updated` - Matter data changed
- `document:uploaded` - New document
- `task:assigned` - Task assigned to user
- `approval:required` - New approval needed
- `email:received` - New email

### Client Integration

- React hook for WebSocket connection
- Automatic reconnection
- Optimistic UI updates

## Design

### Deployment Shape

- Prefer a dedicated WebSocket server/process (Socket.io or `ws`) alongside Next.js; Next.js API routes are not a reliable long-lived WS host across all deploy targets.

### Auth & Tenancy

- Authenticate the socket using the same session token as the REST API; derive `firmId` server-side and never accept tenant identifiers from client messages.
- Use room naming conventions that include firm scoping (e.g. `firm:{firmId}`, `matter:{matterId}`) and enforce membership checks on join.

### Event Model

- Events are emitted from backend mutations (after DB commit) and should be designed to be idempotent on the client (include entity ids + updatedAt/version).
- Start minimal: notifications + approvals + matter/document/task updates; add presence/typing later.

### Backpressure & Reliability

- Treat WS as a best-effort UI accelerator; the REST API remains the source of truth.
- Consider integrating BullMQ events for job completion notifications rather than polling.

## References

- docs/backend-design.md WebSocket section
