# FEAT: Workflow Task Detail Expansion

## Status: Ready for Development

---

## Summary

Add inline expansion to workflow task rows to show notes, evidence, and documents without leaving the accordion view.

---

## User Requirements

1. **Inline Expansion**: Click task row → expands inline panel showing details
2. **Counts + Icons**: At-a-glance badges `[📝 2] [📎 3]`, click reveals full list
3. **Unified Attachments**: Evidence items (with verification badges) and documents in one list

---

## Design Decisions

All open questions have been resolved:

| Question              | Decision                                                      | Rationale                                         |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Notes count in API?   | **Add `notesCount`** to workflow API response                 | Already have `evidenceCount`, consistency matters |
| Empty states          | **Show "No notes yet" / "No attachments"** with subtle prompt | Guides users, better than blank space             |
| Note editing          | **View-only + Add** (no edit/delete from inline)              | Edit opens separate view, keeps inline simple     |
| Evidence verification | **View-only** status display                                  | Verification requires document review, not inline |
| Document preview      | **Download only** (click downloads)                           | Preview modal is future enhancement               |
| Mobile behavior       | **Stack vertically**, full-width sections                     | Natural responsive behavior                       |
| Animation             | **Height transition** (150ms ease) + **fade-in** for content  | Smooth but not distracting                        |
| Loading state         | **Skeleton UI** (3 skeleton lines)                            | Better than spinner, shows structure              |

---

## Existing Code Reference

### Component to Modify

- `app/(app)/matters/[id]/_components/workflow/workflow-task-row.tsx`
  - Already has: `evidenceCount`, `verifiedEvidenceCount`, `latestNote`
  - Already has: Add Note dialog (can reuse pattern)
  - Line 41-61: `WorkflowTask` interface - add `notesCount`

### Existing APIs (no changes needed)

| Endpoint                       | Response                   | Notes                                 |
| ------------------------------ | -------------------------- | ------------------------------------- |
| `GET /api/tasks/[id]/notes`    | `{ notes, pagination }`    | Has author, visibility, version       |
| `GET /api/tasks/[id]/evidence` | `{ evidence, pagination }` | Has documentName, verification status |

### Minor API Enhancement

- `app/api/matters/[id]/workflow/route.ts` - Add `notesCount` to task query

---

## Visual Design

### Collapsed Row (Current + Count Badges)

```
+---------------------------------------------------------------------------------+
| [●] Task Title *                    [📝 2] [📎 3]    Due 15 Dec  [Pending] [...] |
|     📄 Last note preview snippet...                                              |
+---------------------------------------------------------------------------------+
```

### Expanded Row (New)

```
+---------------------------------------------------------------------------------+
| [●] Task Title *                    [📝 2] [📎 3]    Due 15 Dec  [Pending] [...] |
+----------------------------------------------------------------------------------+
|                                                                                  |
| NOTES                                                           [+ Add Note]    |
| +------------------------------------------------------------------------------+ |
| | "Client confirmed funds in place"                                            | |
| | Sarah Harrison · 15 Dec 2024 · 🔒 Internal                                   | |
| +------------------------------------------------------------------------------+ |
| | "Waiting for mortgage offer letter"                                          | |
| | James Clarke · 12 Dec 2024 · 👁 Client Visible                               | |
| +------------------------------------------------------------------------------+ |
|                                                                                  |
| ATTACHMENTS                                                  [+ Add Evidence]   |
| +------------------------------------------------------------------------------+ |
| | 📄 Mortgage_Offer_2024.pdf          proof_of_funds    ✓ Verified            | |
| |    Added by Sarah Harrison · 14 Dec                           [Download]     | |
| +------------------------------------------------------------------------------+ |
| | 📄 Bank_Statement.pdf               source_of_wealth  ⏳ Pending             | |
| |    Added by Tom Richards · 10 Dec                             [Download]     | |
| +------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------+
```

### Empty State

```
| NOTES                                                           [+ Add Note]    |
| +------------------------------------------------------------------------------+ |
| |  No notes yet. Add a note to track progress or share updates.               | |
| +------------------------------------------------------------------------------+ |
```

---

## Component Architecture

### New/Modified Files

```
app/(app)/matters/[id]/_components/workflow/
├── workflow-task-row.tsx          # MODIFY: Add expansion + count badges
├── task-detail-panel.tsx          # NEW: Inline expansion panel
├── task-notes-list.tsx            # NEW: Notes section
└── task-attachments-list.tsx      # NEW: Unified attachments
```

### Component Hierarchy

```
WorkflowTaskRow (enhanced)
├── CompactRow (existing content)
│   ├── StatusIcon, Title, Indicators
│   ├── CountBadges [📝 N] [📎 N]    ← NEW
│   ├── DueDate, StatusBadge
│   └── ActionsMenu
│
└── TaskDetailPanel (collapsible)   ← NEW
    ├── TaskNotesList
    │   ├── NoteItem × N
    │   └── AddNoteButton
    │
    └── TaskAttachmentsList
        ├── AttachmentItem × N (evidence only, unified later)
        └── AddEvidenceButton
```

---

## Data Fetching Strategy

**Lazy Loading on Expand**:

- Workflow API returns counts for badges (add `notesCount`)
- Fetch full notes/evidence only when user expands a task
- Use React Query with `enabled: isExpanded`

```typescript
// In TaskDetailPanel
const { data: notes, isLoading: notesLoading } = useQuery({
  queryKey: ["tasks", taskId, "notes"],
  queryFn: () => fetchTaskNotes(taskId),
  enabled: isExpanded,
});

const { data: evidence, isLoading: evidenceLoading } = useQuery({
  queryKey: ["tasks", taskId, "evidence"],
  queryFn: () => fetchTaskEvidence(taskId),
  enabled: isExpanded,
});
```

---

## Implementation Plan

### Phase 1: Count Badges

- Add `notesCount` to workflow API task query
- Add count badges `[📝 N] [📎 N]` to task row UI
- Hide badges when count is 0

### Phase 2: Expansion State

- Add `isExpanded` state to `WorkflowTaskRow`
- Click on row body (not action button) toggles expansion
- Add `aria-expanded` for accessibility
- Animate height transition

### Phase 3: TaskDetailPanel

- Container component with loading/error states
- Lazy fetch notes and evidence on expand
- Skeleton UI while loading

### Phase 4: TaskNotesList

- Display notes with author name, date, visibility icon
- Integrate existing Add Note dialog
- Empty state message

### Phase 5: TaskAttachmentsList

- Display evidence items with:
  - Document name (linked to download)
  - Evidence type badge
  - Verification status (✓ Verified / ⏳ Pending)
  - Added by / date
- Integrate Add Evidence action
- Empty state message

---

## Test Strategy

### Unit Tests Required

| File                                                            | Test Cases                                      |
| --------------------------------------------------------------- | ----------------------------------------------- |
| `tests/unit/components/workflow/task-detail-panel.test.tsx`     | Loading states, error states, empty states      |
| `tests/unit/components/workflow/task-notes-list.test.tsx`       | Renders notes, visibility badges, add button    |
| `tests/unit/components/workflow/task-attachments-list.test.tsx` | Renders evidence, verification badges, download |
| `tests/unit/components/workflow/workflow-task-row.test.tsx`     | Count badges, expand/collapse, accessibility    |

### Test Cases Detail

**TaskDetailPanel**

- [ ] Shows skeleton when loading
- [ ] Renders notes section when loaded
- [ ] Renders attachments section when loaded
- [ ] Shows error state on fetch failure

**TaskNotesList**

- [ ] Renders list of notes
- [ ] Shows author name and date
- [ ] Shows visibility icon (internal vs client)
- [ ] Shows empty state when no notes
- [ ] Add Note button triggers callback

**TaskAttachmentsList**

- [ ] Renders evidence items
- [ ] Shows document name with download link
- [ ] Shows evidence type
- [ ] Shows verification badge (verified/pending)
- [ ] Shows empty state when no attachments

**WorkflowTaskRow (enhanced)**

- [ ] Shows count badges when counts > 0
- [ ] Hides count badges when counts = 0
- [ ] Expands on row click
- [ ] Collapses on second click
- [ ] Has aria-expanded attribute
- [ ] Action menu click doesn't trigger expand

### Mock Pattern Reminder

```typescript
// Use mockImplementation for withFirmDb
vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
  return { notes: mockNotes, pagination: mockPagination };
});
```

---

## Acceptance Criteria

- [ ] Count badges visible on task rows (📝 for notes, 📎 for attachments)
- [ ] Clicking task row expands inline panel
- [ ] Notes displayed with author, date, visibility
- [ ] Attachments displayed with type, verification status
- [ ] Add Note button works from expanded view
- [ ] Add Evidence button works from expanded view
- [ ] Smooth expand/collapse animation (150ms)
- [ ] Skeleton loading states while fetching
- [ ] Accessible (keyboard, aria-expanded)
- [ ] Empty states shown when no notes/attachments

---

## Estimated Scope

- **New components**: 3 files
- **Modified files**: 2 files (workflow-task-row + workflow API)
- **API changes**: Add `notesCount` to workflow task response
- **Schema changes**: None
- **Unit tests**: 4 test files

---

## Dependencies

- ✅ Existing workflow accordion (complete)
- ✅ `/api/tasks/[id]/notes` endpoint (complete)
- ✅ `/api/tasks/[id]/evidence` endpoint (complete)
