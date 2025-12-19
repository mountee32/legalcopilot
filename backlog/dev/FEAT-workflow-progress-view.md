# FEAT: Workflow Progress Accordion View

## Status: Implementation Complete - Ready for Testing

---

## Summary

Add a workflow progress view to the matter detail page showing:

- **Overview tab**: Compact progress widget with current stage and blocked indicator
- **Workflow tab**: Full accordion view with stages, tasks, gates, and quick actions

---

## Current State

The enhanced task model (FEAT-enhanced-task-model) has been fully implemented with:

| Layer      | What Exists                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| **Schema** | 5 workflow tables (templates, stages, taskTemplates, matterWorkflows, matterStages)  |
| **APIs**   | `GET /api/matters/[id]/workflow` returns stages with task counts, progress %         |
| **Engine** | `lib/workflows/` with activation, completion, gating, stage-progression, due-dates   |
| **UI**     | Read-only workflow template viewer in `/settings/workflows` - NOT on matter page yet |

The matter detail page (`app/(app)/matters/[id]/page.tsx`) has 5 tabs but **no workflow progress view**.

---

## Decisions Made

| Decision             | Choice                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Blocked status**   | Derive visually from existing fields (requiresEvidence, requiresApproval, etc.) - no schema change |
| **View placement**   | Overview summary + dedicated Workflow tab with full accordion                                      |
| **Gate visibility**  | Yes - show Hard Gate / Soft Gate badges with blocked reasons                                       |
| **Quick actions**    | Full actions from accordion (complete, skip, N/A, add note, request approval)                      |
| **Blocking context** | Both: auto-computed from unmet requirements + manual taskNotes for context                         |
| **Progress bars**    | Show both: mandatory tasks (primary) + all tasks (secondary)                                       |
| **Overview summary** | Compact: progress bar + current stage name + blocked indicator (click to expand)                   |

---

## Visual Design

### Overview Tab - Workflow Summary Widget

```
+-------------------------------------------------------------------+
|  Workflow Progress                                            [->]  |
|  ############..............  48%   Current: Pre-Contract      !   |
|  4/8 mandatory - 6/12 total                                       |
+-------------------------------------------------------------------+
```

- Single compact card
- Progress bar with percentage
- Current stage name
- Warning icon if any stage is blocked
- Click anywhere to go to Workflow tab

### Workflow Tab - Full Accordion View

```
Stage: Pre-Contract -------------------------------- 75% ######..
  +- [check] Contract pack received                     5 Dec 2024
  +- [check] Title review completed                     8 Dec 2024
  +- [!] Enquiries resolved                            IN PROGRESS
  |      "Awaiting response on boundary query - chased 3x"
  +- [o] Report to client                              PENDING
  `- [x] Mortgage offer                                N/A

Stage: Exchange [HARD GATE] ------------------------- 0%  ........
  [lock] Blocked: Pre-Contract stage incomplete
```

### Task Status Visual Mapping

| DB Status          | Visual      | Icon          | Color                    |
| ------------------ | ----------- | ------------- | ------------------------ |
| `completed`        | Complete    | CheckCircle   | Green                    |
| `in_progress`      | In Progress | Clock         | Amber                    |
| `pending`          | Pending     | Circle        | Gray                     |
| `skipped`          | Skipped     | SkipForward   | Gray/strikethrough       |
| `not_applicable`   | N/A         | X             | Light gray/strikethrough |
| _derived_ blocking | Blocked     | AlertTriangle | Red                      |

**Derived "Blocked" conditions:**

- `requiresEvidence: true` + no evidence attached
- `requiresVerifiedEvidence: true` + evidence not verified
- `requiresApproval: true` + `approvalStatus: 'pending'`

### Stage Gate Badges

| Gate Type | Badge                    | Behavior                                     |
| --------- | ------------------------ | -------------------------------------------- |
| `hard`    | HARD GATE (lock icon)    | Cannot proceed until previous stage complete |
| `soft`    | SOFT GATE (warning icon) | Warning shown, can override with reason      |
| `none`    | (no badge)               | Informational only                           |

---

## Component Architecture

```
app/(app)/matters/[id]/
  page.tsx                          # Add Workflow tab trigger
  _components/
    workflow/
      workflow-summary-card.tsx     # Overview tab widget
      workflow-progress-panel.tsx   # Full Workflow tab content
      stage-accordion.tsx           # Expandable stage
      stage-progress-bar.tsx        # Dual progress (mandatory + all)
      workflow-task-row.tsx         # Task with status + actions
      task-quick-actions.tsx        # Complete, skip, N/A, note buttons
      gate-badge.tsx                # Hard/Soft gate indicator
      blocking-indicator.tsx        # Computed + manual blocking context
```

---

## Data Flow

1. **Fetch workflow**: `GET /api/matters/[id]/workflow` -> stages with task counts
2. **Fetch tasks by stage**: Include tasks in workflow response or separate fetch
3. **Compute blocking**: Client-side derive from `requiresEvidence`, `requiresApproval`, etc.
4. **Quick actions**:
   - Complete -> `POST /api/tasks/[id]/complete`
   - Skip -> `POST /api/tasks/[id]/skip`
   - N/A -> `POST /api/tasks/[id]/mark-not-applicable`
   - Note -> `POST /api/tasks/[id]/notes`
5. **Refresh**: Invalidate React Query cache on action success

---

## Implementation Steps

### Phase 1: API Enhancement (if needed)

1. **Review existing API**: Check if `GET /api/matters/[id]/workflow` returns tasks with blocking fields
2. **Extend response** (if needed): Include tasks per stage with:
   - `requiresEvidence`, `requiresVerifiedEvidence`, evidence count
   - `requiresApproval`, `approvalStatus`
   - `taskNotes` (first note or blocking-related)

### Phase 2: Workflow Summary Card (Overview Tab)

3. Create `workflow-summary-card.tsx`:
   - Fetch workflow progress with React Query
   - Display progress bar (mandatory tasks)
   - Show current stage name
   - Show blocked indicator if any stage blocked
   - Click handler to switch to Workflow tab

4. Add to Overview tab in `app/(app)/matters/[id]/page.tsx`

### Phase 3: Workflow Tab Components

5. **workflow-progress-panel.tsx**: Main container
6. **stage-accordion.tsx**: Collapsible stage with header + task list
7. **stage-progress-bar.tsx**: Dual progress display
8. **workflow-task-row.tsx**: Task item with status, date, blockers, actions
9. **task-quick-actions.tsx**: Action buttons with confirmation dialogs
10. **gate-badge.tsx**: Gate type indicator
11. **blocking-indicator.tsx**: Computed + manual blocking context

### Phase 4: Integration

12. Add "Workflow" tab to matter page tab list
13. Wire up tab switching from Overview summary card
14. Add React Query hooks for workflow data

### Phase 5: Testing

15. Unit tests for progress calculation utilities
16. Component tests for status icon rendering, blocking computation
17. Update demo data to showcase workflow progress states

---

## Files to Modify

| File                                     | Change                                         |
| ---------------------------------------- | ---------------------------------------------- |
| `app/(app)/matters/[id]/page.tsx`        | Add Workflow tab, add summary card to Overview |
| `app/api/matters/[id]/workflow/route.ts` | Potentially extend to include task details     |

## Files to Create

| File                                                                      | Purpose                |
| ------------------------------------------------------------------------- | ---------------------- |
| `app/(app)/matters/[id]/_components/workflow/workflow-summary-card.tsx`   | Overview widget        |
| `app/(app)/matters/[id]/_components/workflow/workflow-progress-panel.tsx` | Workflow tab container |
| `app/(app)/matters/[id]/_components/workflow/stage-accordion.tsx`         | Expandable stage       |
| `app/(app)/matters/[id]/_components/workflow/stage-progress-bar.tsx`      | Dual progress bar      |
| `app/(app)/matters/[id]/_components/workflow/workflow-task-row.tsx`       | Task item              |
| `app/(app)/matters/[id]/_components/workflow/task-quick-actions.tsx`      | Action buttons         |
| `app/(app)/matters/[id]/_components/workflow/gate-badge.tsx`              | Gate indicator         |
| `app/(app)/matters/[id]/_components/workflow/blocking-indicator.tsx`      | Blocking context       |

---

## Estimated Scope

- **New components**: 8 files
- **Modified files**: 2-3 files
- **API changes**: Minimal (may need to extend workflow response)
- **Schema changes**: None
