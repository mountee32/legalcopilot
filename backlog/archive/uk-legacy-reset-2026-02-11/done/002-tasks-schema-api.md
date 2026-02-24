# Tasks - Schema & API

## Priority: HIGH

## Summary

Implement task management for matters. Tasks can be manually created or AI-generated from emails/documents.

## Requirements

- Tasks linked to matters and optionally to users
- Support priorities, due dates, checklists
- AI can suggest tasks from context
- Tasks feed into approval workflow

## Scope

### Database Schema (`lib/db/schema/tasks.ts`)

- `tasks` table with:
  - id, firmId, matterId
  - title, description
  - assigneeId (user), createdById
  - priority (low/medium/high/urgent)
  - status (pending/in_progress/completed/cancelled)
  - dueDate, completedAt
  - aiGenerated (boolean), aiSource (email/document/matter)
  - sourceEntityType, sourceEntityId
  - checklistItems (JSONB array)
  - tags (JSONB array)

### API Routes

- `GET /api/tasks` - List tasks with filters (matterId, assigneeId, status, priority)
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `PATCH /api/tasks/[id]` - Update task
- `POST /api/tasks/[id]/complete` - Mark task complete
- `POST /api/matters/[id]/ai/generate-tasks` - AI generates tasks from matter context

### API Schemas (`lib/api/schemas/tasks.ts`)

- TaskSchema, CreateTaskSchema, UpdateTaskSchema
- TaskQuerySchema, TaskListSchema
- CompleteTaskSchema

## Out of Scope (Phase 2)

- Task dependencies
- Recurring tasks
- Time tracking on tasks

## Design

### Tenancy & Auth

- Derive `firmId` from the authenticated session (`getOrCreateFirmIdForUser`) and enforce via `withFirmDb` + explicit `firmId` filters (defence-in-depth).

### Data Model

- Create `lib/db/schema/tasks.ts` with `firmId`, `matterId`, `assigneeId`, `createdById`, status/priority enums, due dates, and JSONB for `checklistItems`/`tags`.
- Keep the MVP minimal: prefer JSONB for optional/experimental fields; add indexes only for common filters (firmId+status, firmId+assigneeId, firmId+matterId).

### Approval Enforcement (AI drafts, humans approve)

- Human-created tasks write directly to `tasks`.
- AI-generated tasks are proposed via `approval_requests` with `action: "task.create"` and payload containing the proposed task(s); tasks are only inserted on approval (bulk-friendly).

### API Shape

- Add `lib/api/schemas/tasks.ts` (create/update/query/list) and register in `scripts/generate-openapi.ts`.
- Implement `app/api/tasks/*` routes using the existing REST patterns (`withAuth`, `withErrorHandler`).

### Tests

- Add route tests under `__tests__/app/api/tasks/*` (validation errors, firm isolation, approval flow).

## References

- docs/backend-design.md Section 2.11 (Task entity)
- Existing patterns: lib/db/schema/matters.ts
