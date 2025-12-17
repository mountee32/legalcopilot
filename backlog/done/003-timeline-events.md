# Timeline Events - Schema & Auto-Creation

## Priority: HIGH

## Summary

Implement case timeline to automatically track all significant events on a matter. This provides a chronological activity log for compliance and case review.

## Requirements

- Auto-log events when entities are created/updated
- Support manual event creation (e.g., phone calls, meetings)
- AI can flag important events
- Searchable and filterable timeline

## Scope

### Database Schema (`lib/db/schema/timeline.ts`)

- `timelineEvents` table with:
  - id, firmId, matterId
  - eventType (case_created, email_received, email_sent, document_uploaded, document_viewed, task_created, task_completed, time_recorded, invoice_sent, payment_received, note_added, status_changed, deadline_set, deadline_passed, hearing_scheduled, client_communication, ai_action)
  - title, description
  - actorId (user who performed), actorType (user/system/ai)
  - entityType, entityId (the related entity)
  - metadata (JSONB for extra context)
  - aiImportance (low/medium/high)
  - occurredAt, createdAt

### API Routes

- `GET /api/matters/[id]/timeline` - Get matter timeline with filters
- `POST /api/matters/[id]/timeline` - Add manual timeline event (e.g., phone note)

### Auto-Creation Hooks

- Create utility `lib/timeline/createEvent.ts` that can be called from other routes
- Add timeline events when:
  - Matter created/updated
  - Document uploaded
  - Email received/sent
  - Task created/completed
  - Time entry recorded
  - Approval decision made

### API Schemas (`lib/api/schemas/timeline.ts`)

- TimelineEventSchema, CreateTimelineEventSchema
- TimelineQuerySchema, TimelineListSchema

## Design

### Purpose

- Timeline is the immutable, chronological “case audit trail” for humans and AI; it should be append-only in MVP (no edits/deletes via API).

### Tenancy & Auth

- All reads/writes scoped by firm derived from session (`withAuth` → `getOrCreateFirmIdForUser` → `withFirmDb`).

### Data Model

- Create `lib/db/schema/timeline.ts` with `firmId`, `matterId`, `eventType`, `actorType`/`actorId`, `entityType`/`entityId`, `metadata` JSONB, and `occurredAt`.
- Keep enums small and evolvable; store event-specific extras in `metadata` to avoid schema churn.

### Event Creation

- Implement `lib/timeline/createEvent.ts` and call it from API routes after successful mutations (within the same `withFirmDb` transaction where possible).
- AI may create timeline entries for “ai_insight/ai_action” events, but must not mutate core entities without an `approval_requests` decision.

### API Shape

- `GET /api/matters/[id]/timeline` supports filtering by `eventType`, date range, and related `entityType/entityId`; default sort by `occurredAt DESC`.
- `POST /api/matters/[id]/timeline` is for manual notes only (actorType=user); validation via Zod + OpenAPI registration.

## Out of Scope (Phase 2)

- Timeline event aggregation/summaries
- AI-generated timeline summaries

## References

- docs/backend-design.md Section 2.9 (TimelineEvent entity)
