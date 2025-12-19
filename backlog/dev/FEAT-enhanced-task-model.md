# FEAT: Enhanced Task Model - Phase 1 MVP

## Status: Design Complete (Review Incorporated)

## Review Refinements (Critical)

The following refinements were identified during business review and **must be implemented**:

### A. Provenance Fields (source tracking)

Add source/provenance fields everywhere decisions are made:

| Entity           | Field                | Values                                                      |
| ---------------- | -------------------- | ----------------------------------------------------------- |
| `tasks`          | `source`             | `"workflow"` \| `"workflow_change"` \| `"manual"` \| `"ai"` |
| `taskExceptions` | `decisionSource`     | `"user"` \| `"system"`                                      |
| `evidenceItems`  | `verificationMethod` | `"manual"` \| `"integration"` \| `"ai"`                     |

**Why**: AI/automation later, regulator questions ("Was this verified by a solicitor?"), negligence defensibility.

### B. Approval Authority

Add explicit approval policy to workflow task templates:

```typescript
requiredApproverRole: assigneeRoleEnum; // "supervisor" | "partner" | null
```

**Why**: Firms will immediately ask "who can approve this?" — don't leave implicit.

### C. Mandatory Immutability

`isMandatory` on task instances **cannot be changed** once created.

**Implementation**: Enforce at service layer — reject any update that attempts to change `isMandatory`.

**Why**: Firms will accidentally toggle and undermine compliance.

### D. Require Verified Evidence

Completion predicate must require **verified** evidence, not just attached:

```typescript
// CORRECT predicate
task.isComplete =
  status == 'completed'
  AND (if requiresEvidence → evidenceItems.count(WHERE verifiedAt IS NOT NULL) >= 1)
  AND (if requiresApproval → approvalStatus == 'approved')
  AND completedAt IS NOT NULL
```

Add `requiresVerifiedEvidence: boolean` to templates (default: `true`).

**Why**: Otherwise evidence is uploaded but never checked — audit weakness.

### E. Automatic Stage Start

Stage `startedAt` should be set automatically when:

- First task in stage moves to `in_progress`, OR
- Previous stage completes

**Why**: Keeps due date logic correct, SLA metrics meaningful, timeline clean.

### F. Phase 1 Simplifications

| Item                           | Approach                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `completionCriteria: "custom"` | Accept value, treat same as `"all_mandatory_tasks"`. Log TODO for Phase 2.             |
| Bulk operations dry-run        | Optional enhancement: `?dryRun=true` returns eligible/blocked tasks without executing. |

---

## Overview

Transform the task system from a simple todo list into an **evidence-backed compliance engine with discretionary override**. This is not about tasks in stages — it's about tracking what's required, what's done, what proof exists, and logging human judgment.

---

## Core Mental Model

> "Conveyancing is not tasks in stages — it is an evidence-backed compliance process with discretionary override."

Key principles:

1. **Evidence-first**: Tasks can require evidence for completion
2. **Stage-gated**: Stages own gates, not individual tasks
3. **Override-logged**: Human judgment is allowed but always recorded
4. **Version-pinned**: Matters pin to workflow version at creation
5. **Audit-ready**: Everything produces an audit trail

---

## Existing Code Analysis

### Already Exists (reuse these):

- `lib/db/schema/tasks.ts` — Basic task model (extend with new fields)
- `lib/db/schema/task-templates.ts` — Template system (extend for stages)
- `lib/db/schema/timeline.ts` — Append-only timeline (add new event types)
- `lib/db/schema/approvals.ts` — Approval workflow (extend for task approvals)
- `lib/db/schema/documents.ts` — Document storage (link for evidence)
- `lib/db/schema/notifications.ts` — Notification system (add new types)
- `app/api/tasks/` — Task CRUD API (extend endpoints)
- `lib/api/schemas/tasks.ts` — Task validation schemas (extend)

### Gaps to Fill:

- Task notes system
- Evidence items (first-class entity)
- Workflow templates with stages
- Stage gating logic
- Exception/override logging
- Matter workflow instances
- Due date relative calculation

---

## Solution Design

### 1. Database Schema Changes

#### 1.1 New File: `lib/db/schema/workflows.ts`

```typescript
/**
 * Workflow Templates & Stages Schema
 *
 * System-defined workflow templates with stages for compliance workflows.
 * Matters pin to a specific workflow version at creation.
 */

// Enums
export const workflowGateTypeEnum = pgEnum("workflow_gate_type", [
  "hard", // Cannot proceed - blocks progression
  "soft", // Warning with override allowed
  "none", // No gating
]);

export const dueDateRelativeToEnum = pgEnum("due_date_relative_to", [
  "stage_started",
  "task_created",
  "matter_created",
  "matter_opened",
]);

// Tables

/** System-defined workflow templates (versioned, immutable once released) */
export const workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Human-readable key for lookup */
  key: text("key").notNull(), // e.g. "residential-purchase-mortgage"

  /** Semantic version */
  version: text("version").notNull(), // e.g. "2.3.0"

  /** Display name */
  name: text("name").notNull(),

  /** Description */
  description: text("description"),

  /** Practice area this applies to */
  practiceArea: practiceAreaEnum("practice_area").notNull(),

  /** Sub-type within practice area */
  subType: text("sub_type").notNull(),

  /** Conditions for auto-selection (JSON) */
  selectionConditions: jsonb("selection_conditions"),

  /** Whether this is the default for the practice area + sub-type */
  isDefault: boolean("is_default").notNull().default(false),

  /** When this version was released (immutable after this) */
  releasedAt: timestamp("released_at"),

  /** Is this version currently active for new matters? */
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Stages within a workflow template */
export const workflowStages = pgTable("workflow_stages", {
  id: uuid("id").primaryKey().defaultRandom(),

  workflowTemplateId: uuid("workflow_template_id")
    .notNull()
    .references(() => workflowTemplates.id, { onDelete: "cascade" }),

  /** Stage name */
  name: text("name").notNull(),

  /** Description */
  description: text("description"),

  /** Order within workflow */
  sortOrder: integer("sort_order").notNull(),

  /** Gate type for this stage */
  gateType: workflowGateTypeEnum("gate_type").notNull().default("none"),

  /** Completion criteria: "all_mandatory_tasks" | "all_tasks" | "custom" */
  completionCriteria: text("completion_criteria").notNull().default("all_mandatory_tasks"),

  /** Is this stage visible to clients in portal? */
  clientVisible: boolean("client_visible").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Task templates within a stage */
export const workflowTaskTemplates = pgTable("workflow_task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  stageId: uuid("stage_id")
    .notNull()
    .references(() => workflowStages.id, { onDelete: "cascade" }),

  /** Task title */
  title: text("title").notNull(),

  /** Description */
  description: text("description"),

  /** Is this task mandatory for stage completion? */
  isMandatory: boolean("is_mandatory").notNull().default(false),

  /** Does this task require evidence to complete? */
  requiresEvidence: boolean("requires_evidence").notNull().default(false),

  /** Required evidence types (array of evidence type codes) */
  requiredEvidenceTypes: jsonb("required_evidence_types"),

  /** Does this task require approval to complete? */
  requiresApproval: boolean("requires_approval").notNull().default(false),

  /** Must evidence be verified (not just attached) for completion? (REVIEW REFINEMENT D) */
  requiresVerifiedEvidence: boolean("requires_verified_evidence").notNull().default(true),

  /** Who can approve this task? (REVIEW REFINEMENT B) */
  requiredApproverRole: assigneeRoleEnum("required_approver_role"),

  /** Default assignee role */
  defaultAssigneeRole: assigneeRoleEnum("default_assignee_role"),

  /** Default priority */
  defaultPriority: taskPriorityEnum("default_priority").notNull().default("medium"),

  /** Relative due date (days) */
  relativeDueDays: integer("relative_due_days"),

  /** What the due date is relative to */
  dueDateRelativeTo: dueDateRelativeToEnum("due_date_relative_to"),

  /** Is this task visible to clients in portal? */
  clientVisible: boolean("client_visible").notNull().default(false),

  /** Regulatory/legal basis for this task */
  regulatoryBasis: text("regulatory_basis"),

  /** Order within stage */
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Instance of a workflow attached to a matter (pinned to version) */
export const matterWorkflows = pgTable("matter_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),

  matterId: uuid("matter_id")
    .notNull()
    .references(() => matters.id, { onDelete: "cascade" }),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Pinned workflow template */
  workflowTemplateId: uuid("workflow_template_id")
    .notNull()
    .references(() => workflowTemplates.id, { onDelete: "restrict" }),

  /** Pinned version (denormalized for audit) */
  workflowVersion: text("workflow_version").notNull(),

  /** When this workflow was activated on the matter */
  activatedAt: timestamp("activated_at").defaultNow().notNull(),

  /** User who activated it */
  activatedById: uuid("activated_by_id").references(() => users.id, { onDelete: "set null" }),

  /** Current stage ID */
  currentStageId: uuid("current_stage_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Stage instances on a matter (tracks completion).
 * NOTE (REVIEW REFINEMENT E): startedAt is set AUTOMATICALLY when:
 *   - First task in stage moves to in_progress, OR
 *   - Previous stage completes
 */
export const matterStages = pgTable("matter_stages", {
  id: uuid("id").primaryKey().defaultRandom(),

  matterWorkflowId: uuid("matter_workflow_id")
    .notNull()
    .references(() => matterWorkflows.id, { onDelete: "cascade" }),

  /** Source stage template */
  workflowStageId: uuid("workflow_stage_id")
    .notNull()
    .references(() => workflowStages.id, { onDelete: "restrict" }),

  /** Stage name (denormalized) */
  name: text("name").notNull(),

  /** Status */
  status: text("status").notNull().default("pending"), // pending | in_progress | completed

  /** When stage was started (SET AUTOMATICALLY - see note above) */
  startedAt: timestamp("started_at"),

  /** When stage was completed */
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 1.2 New File: `lib/db/schema/evidence.ts`

```typescript
/**
 * Evidence Items Schema
 *
 * First-class evidence entities linked to tasks.
 * Evidence is proof of compliance, separate from notes (commentary).
 */

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "id_document",
  "proof_of_address",
  "proof_of_funds",
  "source_of_wealth",
  "search_result",
  "signed_authority",
  "client_instruction",
  "title_document",
  "contract",
  "completion_statement",
  "land_registry",
  "other",
]);

export const verificationMethodEnum = pgEnum("verification_method", [
  "manual", // Verified by human review
  "integration", // Verified by external system (e.g., ID check API)
  "ai", // Verified by AI analysis
]);

export const evidenceItems = pgTable(
  "evidence_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Task this evidence is linked to */
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    /** Evidence type */
    type: evidenceTypeEnum("type").notNull(),

    /** Description */
    description: text("description"),

    /** Linked document (if applicable) */
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),

    /** User who added this evidence */
    addedById: uuid("added_by_id").references(() => users.id, { onDelete: "set null" }),

    /** When evidence was added */
    addedAt: timestamp("added_at").defaultNow().notNull(),

    /** User who verified this evidence */
    verifiedById: uuid("verified_by_id").references(() => users.id, { onDelete: "set null" }),

    /** When evidence was verified */
    verifiedAt: timestamp("verified_at"),

    /** How was verification performed? (REVIEW REFINEMENT A) */
    verificationMethod: verificationMethodEnum("verification_method"),

    /** Additional metadata */
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    taskIdx: index("evidence_items_task_idx").on(t.taskId),
    firmIdx: index("evidence_items_firm_idx").on(t.firmId),
  })
);
```

#### 1.3 New File: `lib/db/schema/task-notes.ts`

```typescript
/**
 * Task Notes Schema
 *
 * Notes are commentary attached to tasks.
 * Immutable with edit history preserved. Visibility controlled.
 */

export const noteVisibilityEnum = pgEnum("note_visibility", [
  "internal", // Staff only
  "client_visible", // Visible in client portal
]);

export const taskNotes = pgTable(
  "task_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Task this note belongs to */
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    /** Rich text content (HTML from limited editor) */
    content: text("content").notNull(),

    /** Visibility level */
    visibility: noteVisibilityEnum("visibility").notNull().default("internal"),

    /** User who created the note */
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    /** If this is an edit, reference to original note */
    originalNoteId: uuid("original_note_id"),

    /** Edit version number (1 = original) */
    version: integer("version").notNull().default(1),

    /** Is this the current version? */
    isCurrent: boolean("is_current").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    taskIdx: index("task_notes_task_idx").on(t.taskId),
    originalIdx: index("task_notes_original_idx").on(t.originalNoteId),
  })
);

/** Attachments on notes (separate from evidence) */
export const taskNoteAttachments = pgTable("task_note_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),

  noteId: uuid("note_id")
    .notNull()
    .references(() => taskNotes.id, { onDelete: "cascade" }),

  /** Linked document */
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 1.4 New File: `lib/db/schema/exceptions.ts`

```typescript
/**
 * Exception/Override Log Schema
 *
 * Records when tasks are skipped or gates are overridden.
 * Critical for audit trail and regulatory compliance.
 */

export const exceptionTypeEnum = pgEnum("exception_type", [
  "skipped", // Task was applicable but deliberately not done
  "not_applicable", // Task should not exist for this matter
  "gate_override", // Stage gate was overridden
]);

export const decisionSourceEnum = pgEnum("decision_source", [
  "user", // Human decision
  "system", // System/automation decision
]);

export const taskExceptions = pgTable(
  "task_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Type of object being excepted */
    objectType: text("object_type").notNull(), // "task" | "stage"

    /** ID of the object */
    objectId: uuid("object_id").notNull(),

    /** Type of exception */
    exceptionType: exceptionTypeEnum("exception_type").notNull(),

    /** Reason for exception (required) */
    reason: text("reason").notNull(),

    /** Was this a human or system decision? (REVIEW REFINEMENT A) */
    decisionSource: decisionSourceEnum("decision_source").notNull().default("user"),

    /** User who approved the exception */
    approvedById: uuid("approved_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    /** When exception was approved */
    approvedAt: timestamp("approved_at").defaultNow().notNull(),

    /** Additional context */
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    objectIdx: index("task_exceptions_object_idx").on(t.objectType, t.objectId),
    firmIdx: index("task_exceptions_firm_idx").on(t.firmId),
  })
);
```

#### 1.5 Modify: `lib/db/schema/tasks.ts`

Add new fields to existing tasks table:

```typescript
// Add to taskStatusEnum values:
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "skipped",          // NEW: Deliberately skipped with justification
  "not_applicable",   // NEW: Should not exist for this matter
]);

// Add new enum for task source
export const taskSourceEnum = pgEnum("task_source", [
  "workflow",         // Created from workflow template
  "workflow_change",  // Injected due to workflow change mid-matter
  "manual",           // Manually created by user
  "ai",               // Created by AI
]);

// Add new fields to tasks table:
{
  // ... existing fields ...

  /** Stage this task belongs to (if from workflow) */
  matterStageId: uuid("matter_stage_id")
    .references(() => matterStages.id, { onDelete: "set null" }),

  /** Source workflow task template (if from workflow) */
  workflowTaskTemplateId: uuid("workflow_task_template_id"),

  /** How was this task created? (REVIEW REFINEMENT A) */
  source: taskSourceEnum("source").notNull().default("manual"),

  /**
   * Is this task mandatory for stage completion?
   * WARNING (REVIEW REFINEMENT C): This field is IMMUTABLE after creation.
   * Service layer MUST reject any update that attempts to change this value.
   */
  isMandatory: boolean("is_mandatory").notNull().default(false),

  /** Does this task require evidence? */
  requiresEvidence: boolean("requires_evidence").notNull().default(false),

  /** Must evidence be verified (not just attached)? */
  requiresVerifiedEvidence: boolean("requires_verified_evidence").notNull().default(true),

  /** Does this task require approval? */
  requiresApproval: boolean("requires_approval").notNull().default(false),

  /** Who can approve this task? */
  requiredApproverRole: assigneeRoleEnum("required_approver_role"),

  /** Approval status (if requiresApproval) */
  approvalStatus: text("approval_status"),  // "pending" | "approved" | "rejected"

  /** Who approved (if approved) */
  approvedById: uuid("approved_by_id")
    .references(() => users.id, { onDelete: "set null" }),

  /** When approved */
  approvedAt: timestamp("approved_at"),

  /** Is this task visible to clients? */
  clientVisible: boolean("client_visible").notNull().default(false),

  /** Regulatory basis for this task */
  regulatoryBasis: text("regulatory_basis"),
}
```

#### 1.6 Modify: `lib/db/schema/timeline.ts`

Add new event types:

```typescript
export const timelineEventTypeEnum = pgEnum("timeline_event_type", [
  // ... existing types ...

  // NEW task events
  "task_skipped",
  "task_not_applicable",
  "task_evidence_added",
  "task_evidence_verified",
  "task_approval_requested",
  "task_approved",
  "task_rejected",

  // NEW stage events
  "stage_started",
  "stage_completed",
  "stage_gate_blocked",
  "stage_gate_overridden",

  // NEW workflow events
  "workflow_activated",
  "workflow_changed",
]);

// Add visibility field
{
  // ... existing fields ...

  /** Visibility of this event */
  visibility: text("visibility").default("internal"),  // "internal" | "client_visible"
}
```

#### 1.7 Modify: `lib/db/schema/notifications.ts`

Add new notification types:

```typescript
export const notificationTypeEnum = pgEnum("notification_type", [
  // ... existing types ...

  // NEW
  "stage_gate_blocked",
  "evidence_required",
  "task_approval_needed",
]);
```

---

### 2. API Endpoints

#### 2.1 Task Notes API

**`POST /api/tasks/[id]/notes`** — Create note

```typescript
{
  content: string,       // Rich text HTML
  visibility: "internal" | "client_visible",
  attachmentIds?: string[]  // Optional document IDs
}
```

**`GET /api/tasks/[id]/notes`** — List notes (with history)

```typescript
{
  notes: Note[],
  total: number
}
```

**`PUT /api/tasks/[id]/notes/[noteId]`** — Edit note (creates new version)

```typescript
{
  content: string,
  visibility?: "internal" | "client_visible"
}
```

#### 2.2 Evidence API

**`POST /api/tasks/[id]/evidence`** — Add evidence

```typescript
{
  type: EvidenceType,
  description?: string,
  documentId?: string,
  metadata?: object
}
```

**`GET /api/tasks/[id]/evidence`** — List evidence

```typescript
{
  evidence: EvidenceItem[]
}
```

**`POST /api/tasks/[id]/evidence/[evidenceId]/verify`** — Verify evidence

```typescript
{
  notes?: string
}
```

#### 2.3 Task Status Extensions

**`POST /api/tasks/[id]/skip`** — Skip task (with justification)

```typescript
{
  reason: string;
}
```

**`POST /api/tasks/[id]/mark-not-applicable`** — Mark not applicable

```typescript
{
  reason: string;
}
```

**`POST /api/tasks/[id]/complete`** — Complete task (validate predicates)
Returns error if:

- requiresEvidence but no evidence attached
- requiresApproval but not approved

**`POST /api/tasks/[id]/request-approval`** — Request task approval

```typescript
{
  notes?: string
}
```

**`POST /api/tasks/[id]/approve`** — Approve task (supervisor)
**`POST /api/tasks/[id]/reject`** — Reject task (supervisor)

#### 2.4 Workflow API

**`GET /api/workflows`** — List available workflow templates
**`GET /api/workflows/[id]`** — Get workflow with stages and task templates

**`POST /api/matters/[id]/workflow`** — Activate workflow on matter

```typescript
{
  workflowTemplateId: string;
}
```

**`GET /api/matters/[id]/workflow`** — Get matter's workflow with stages
**`GET /api/matters/[id]/stages`** — Get stages with completion status

**`POST /api/matters/[id]/stages/[stageId]/override`** — Override stage gate

```typescript
{
  reason: string;
}
```

#### 2.5 Bulk Operations

**`POST /api/tasks/bulk/complete`** — Bulk complete (non-mandatory only)

```typescript
{
  taskIds: string[]
}
```

**`POST /api/tasks/bulk/assign`** — Bulk assign

```typescript
{
  taskIds: string[],
  assigneeId: string
}
```

**`POST /api/tasks/bulk/due-date`** — Bulk set due date

```typescript
{
  taskIds: string[],
  dueDate: string
}
```

---

### 3. Files to Create

| File                                     | Purpose                                 |
| ---------------------------------------- | --------------------------------------- |
| `lib/db/schema/workflows.ts`             | Workflow, stage, matter workflow tables |
| `lib/db/schema/evidence.ts`              | Evidence items table                    |
| `lib/db/schema/task-notes.ts`            | Task notes with versioning              |
| `lib/db/schema/exceptions.ts`            | Exception/override log                  |
| `lib/api/schemas/workflows.ts`           | Workflow API validation                 |
| `lib/api/schemas/evidence.ts`            | Evidence API validation                 |
| `lib/api/schemas/task-notes.ts`          | Notes API validation                    |
| `lib/workflows/`                         | Workflow engine logic                   |
| `lib/workflows/activate.ts`              | Activate workflow on matter             |
| `lib/workflows/completion.ts`            | Task/stage completion predicates        |
| `lib/workflows/gating.ts`                | Stage gate checking                     |
| `app/api/tasks/[id]/notes/route.ts`      | Notes CRUD                              |
| `app/api/tasks/[id]/evidence/route.ts`   | Evidence CRUD                           |
| `app/api/tasks/[id]/skip/route.ts`       | Skip task                               |
| `app/api/tasks/[id]/approve/route.ts`    | Approve task                            |
| `app/api/workflows/route.ts`             | List workflows                          |
| `app/api/workflows/[id]/route.ts`        | Get workflow                            |
| `app/api/matters/[id]/workflow/route.ts` | Matter workflow                         |
| `app/api/matters/[id]/stages/route.ts`   | Matter stages                           |
| `app/api/tasks/bulk/route.ts`            | Bulk operations                         |

### 4. Files to Modify

| File                                   | Changes                                            |
| -------------------------------------- | -------------------------------------------------- |
| `lib/db/schema/tasks.ts`               | Add new status values, stage link, evidence fields |
| `lib/db/schema/timeline.ts`            | Add new event types, visibility field              |
| `lib/db/schema/notifications.ts`       | Add new notification types                         |
| `lib/db/schema/index.ts`               | Export new schemas                                 |
| `lib/api/schemas/tasks.ts`             | Add new fields to schemas                          |
| `lib/api/schemas/index.ts`             | Export new schemas                                 |
| `app/api/tasks/[id]/route.ts`          | Return notes count, evidence count                 |
| `app/api/tasks/[id]/complete/route.ts` | Validate completion predicates                     |

---

## Test Strategy

### Unit Tests

| Test File                                                | Purpose               |
| -------------------------------------------------------- | --------------------- |
| `tests/unit/app/api/tasks/[id]/notes/route.test.ts`      | Notes CRUD            |
| `tests/unit/app/api/tasks/[id]/evidence/route.test.ts`   | Evidence CRUD         |
| `tests/unit/app/api/tasks/[id]/skip/route.test.ts`       | Skip task             |
| `tests/unit/app/api/tasks/[id]/approve/route.test.ts`    | Approve task          |
| `tests/unit/app/api/workflows/route.test.ts`             | Workflow list         |
| `tests/unit/app/api/matters/[id]/workflow/route.test.ts` | Activate workflow     |
| `tests/unit/lib/workflows/completion.test.ts`            | Completion predicates |
| `tests/unit/lib/workflows/gating.test.ts`                | Stage gate logic      |

### API Test Cases (per endpoint)

**Notes API:**

- [ ] POST - creates note with valid data
- [ ] POST - rejects empty content (400)
- [ ] GET - returns notes for task
- [ ] PUT - creates new version, preserves history
- [ ] Auth - rejects unauthenticated (401)
- [ ] Permission - rejects without cases:write (403)

**Evidence API:**

- [ ] POST - adds evidence to task
- [ ] POST - rejects invalid type (400)
- [ ] POST - links document correctly
- [ ] POST /verify - marks evidence as verified
- [ ] GET - returns evidence for task

**Task Completion:**

- [ ] POST /complete - succeeds when predicates met
- [ ] POST /complete - fails if evidence required but missing
- [ ] POST /complete - fails if evidence required but not VERIFIED (Review Refinement D)
- [ ] POST /complete - fails if approval required but not approved
- [ ] POST /complete - fails if approver does not have requiredApproverRole (Review Refinement B)
- [ ] POST /skip - requires reason
- [ ] POST /skip - creates exception log entry with decisionSource
- [ ] POST /skip - fails on mandatory task without supervisor
- [ ] PATCH - rejects attempt to change isMandatory (Review Refinement C)

**Workflow API:**

- [ ] GET /workflows - lists active templates
- [ ] POST /matters/[id]/workflow - activates workflow
- [ ] POST - creates stages and tasks from template
- [ ] POST - pins to workflow version
- [ ] GET /matters/[id]/stages - returns stage completion status

**Bulk Operations:**

- [ ] POST /bulk/complete - completes eligible tasks
- [ ] POST /bulk/complete - rejects tasks requiring evidence
- [ ] POST /bulk/assign - assigns multiple tasks
- [ ] POST /bulk/due-date - sets due dates

### Integration Tests

| Test File                                         | Purpose                         |
| ------------------------------------------------- | ------------------------------- |
| `tests/integration/workflows/activation.test.ts`  | Workflow activation flow        |
| `tests/integration/workflows/completion.test.ts`  | Task completion with predicates |
| `tests/integration/workflows/gating.test.ts`      | Stage gate blocking & override  |
| `tests/integration/evidence/verification.test.ts` | Evidence add & verify flow      |

### Mock Pattern Reminder

```typescript
// Use mockImplementation for withFirmDb (see tests/helpers/mocks.ts)
vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
  return { id: "task-1", status: "completed" };
});

// For errors
vi.mocked(withFirmDb).mockImplementation(async () => {
  throw new ValidationError("Evidence required for completion");
});
```

---

## Implementation Order

1. **Schema changes** — All new tables and field additions
2. **Task notes** — Notes CRUD, versioning, attachments
3. **Evidence items** — Evidence CRUD, verification
4. **Task status extensions** — Skip, not_applicable, completion predicates
5. **Exception logging** — Override/skip logging
6. **Workflow templates** — Template + stage tables
7. **Matter workflow activation** — Activate workflow, create tasks
8. **Stage gating** — Gate checking, override endpoint
9. **Timeline events** — New event types
10. **Notifications** — Gate blocked, evidence required
11. **Bulk operations** — Bulk complete, assign, due-date

---

## Dependencies

- None (self-contained feature)

---

## Out of Scope (Phase 2+)

- Firm overlays (database customisation)
- Lender task packs
- Compliance reconciliation tool
- Audit pack export
- Client portal visibility configuration

---

## Phase 1 UI: Workflow Viewer (Settings)

A read-only workflow browser under Settings so business users can see what workflows exist.

### New Pages

| Route                      | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `/settings/workflows`      | List all workflow templates with practice area filter        |
| `/settings/workflows/[id]` | View workflow detail: stages, tasks, gates, regulatory basis |

### UI Components

**`/settings/workflows` — Workflow List**

```
┌─────────────────────────────────────────────────────────────┐
│ Settings > Workflows                                        │
├─────────────────────────────────────────────────────────────┤
│ [Filter by Practice Area ▼]  [Search...]                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏠 Residential Purchase                          v1.0.0 │ │
│ │ conveyancing · freehold_purchase, leasehold_purchase    │ │
│ │ 7 stages · 42 tasks · Hard gates: 4                     │ │
│ │ [View →]                                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚖️ Litigation General                            v1.0.0 │ │
│ │ litigation · all sub-types                              │ │
│ │ 7 stages · 28 tasks · Hard gates: 3                     │ │
│ │ [View →]                                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**`/settings/workflows/[id]` — Workflow Detail**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Workflows                                         │
│                                                             │
│ Residential Purchase                               v1.0.0   │
│ conveyancing · freehold_purchase, leasehold_purchase        │
│ Regulatory: SRA Code, MLR 2017, Land Registry Rules         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Stage 1: Client Onboarding ──────────────── HARD GATE ─┐ │
│ │                                                          │ │
│ │  ☑ Record client instruction          [mandatory]        │ │
│ │    Evidence: client_instruction                          │ │
│ │    Assignee: paralegal · Due: +1 day                     │ │
│ │    Basis: SRA Code of Conduct                            │ │
│ │                                                          │ │
│ │  ☑ Issue client care letter           [mandatory]        │ │
│ │    Evidence: signed_authority                            │ │
│ │    Assignee: paralegal · Due: +3 days                    │ │
│ │    Basis: SRA Code of Conduct                            │ │
│ │                                                          │ │
│ │  ☑ Conflict check completed           [mandatory]        │ │
│ │    Evidence: other · Requires approval                   │ │
│ │    Assignee: fee_earner · Due: +1 day                    │ │
│ │    Basis: SRA Code of Conduct                            │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Stage 2: AML / Compliance ──────────────── HARD GATE ──┐ │
│ │  ...                                                     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Files to Create

| File                                           | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `app/(app)/settings/workflows/page.tsx`        | Workflow list page         |
| `app/(app)/settings/workflows/[id]/page.tsx`   | Workflow detail page       |
| `components/workflows/workflow-card.tsx`       | Card for workflow list     |
| `components/workflows/workflow-stage-view.tsx` | Stage accordion with tasks |
| `components/workflows/workflow-task-row.tsx`   | Task row with badges       |

### API Endpoints (already in design)

- `GET /api/workflows` — List workflows (add pagination, practice area filter)
- `GET /api/workflows/[id]` — Get workflow with stages and tasks

### Notes

- **Read-only in Phase 1** — No editing, just viewing
- **System templates only** — Firm overlays are Phase 2
- **Accessible to**: Partners, supervisors (permission: `settings:read`)

---

## Risks & Mitigations

| Risk                                             | Mitigation                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Firms think they can "configure away" compliance | System templates visibly "locked". UI labels mandatory tasks as "Required by regulation/lender". Show `regulatoryBasis` prominently.       |
| Evidence becomes a dumping ground                | Verification step is mandatory (`requiresVerifiedEvidence` default true). Evidence must be linked to a task. No "unlinked evidence" in v1. |
| Timeline becomes noisy and unusable              | Default timeline view is filtered. Advanced/audit view shows everything. Client portal sees only `client_visible` events.                  |
| Over-engineering slows shipping                  | Phase 2 items explicitly marked. Rule: If it's not needed to pass an SRA audit on one matter, it's Phase 2.                                |

---

## Questions Resolved in Brainstorm

| Question                   | Decision                                    |
| -------------------------- | ------------------------------------------- |
| Stage vs task gating?      | Stage-level only                            |
| Workflow versioning?       | Semantic version + immutable UUID           |
| Evidence types?            | System-defined, extensible later            |
| Not applicable vs skipped? | Distinct statuses                           |
| Notes vs timeline?         | Notes feed timeline, timeline is read model |
| Task dependencies?         | No task-to-task deps, stage-level only      |

---

## Ship/No-Ship Verdict (from Review)

**SHIP** — This design is above MVP quality. It specifies a compliance substrate that other features will sit on top of. The refinements incorporated above address all critical gaps identified in review.

---

## Workflow Data Files

Reference workflow definitions for seeding:

| File                                       | Description                                                      |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `docs/workflows/residential-purchase.yaml` | Canonical conveyancing workflow (8 stages, 47 tasks)             |
| `docs/workflow-rules.md`                   | Authoring playbook + starter workflows for all 12 practice areas |

The residential-purchase workflow serves as the reference template. Other practice area workflows will follow the same YAML structure.

---

## Design Completeness Checklist

| Category               | Item                                                           | Status |
| ---------------------- | -------------------------------------------------------------- | ------ |
| **Core Model**         | Task notes (rich text, visibility, versioning)                 | ✅     |
|                        | Evidence items (first-class, verification)                     | ✅     |
|                        | Workflow templates with stages                                 | ✅     |
|                        | Stage gating (hard/soft/none)                                  | ✅     |
|                        | Task completion predicates                                     | ✅     |
|                        | Exception/override logging                                     | ✅     |
|                        | Matter workflow versioning                                     | ✅     |
| **Review Refinements** | Provenance fields (source, decisionSource, verificationMethod) | ✅     |
|                        | Approval authority (requiredApproverRole)                      | ✅     |
|                        | Mandatory immutability                                         | ✅     |
|                        | Require verified evidence                                      | ✅     |
|                        | Automatic stage start                                          | ✅     |
| **Schema**             | New tables (4): workflows, evidence, task-notes, exceptions    | ✅     |
|                        | Modified tables (3): tasks, timeline, notifications            | ✅     |
| **API**                | Task notes endpoints                                           | ✅     |
|                        | Evidence endpoints                                             | ✅     |
|                        | Task status endpoints (skip, complete, approve)                | ✅     |
|                        | Workflow endpoints                                             | ✅     |
|                        | Bulk operations                                                | ✅     |
| **UI**                 | Workflow viewer in settings                                    | ✅     |
| **Testing**            | Unit test strategy                                             | ✅     |
|                        | Integration test strategy                                      | ✅     |
|                        | Mock patterns documented                                       | ✅     |
| **Documentation**      | Workflow authoring playbook                                    | ✅     |
|                        | Reference workflow (residential-purchase)                      | ✅     |
|                        | Risks & mitigations                                            | ✅     |

**Design Status: COMPLETE** — Ready for implementation.
