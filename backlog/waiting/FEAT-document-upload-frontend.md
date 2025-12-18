# FEAT: Document Upload Frontend

## Overview

Build the frontend for AI-powered document upload. Users upload PDFs, see AI analysis in real-time, review/edit extracted metadata, then assign to a matter.

**Depends on:** `backlog/done/FEAT-document-upload.md` (Phase 1 - Backend API complete)

## Backend API Available

```
POST /api/documents/[id]/analyze
POST /api/documents/[id]/analyze?async=true  (returns jobId)
GET  /api/jobs/[id]                          (poll for status)
```

**Response shape:**

```json
{
  "success": true,
  "analysis": {
    "suggestedTitle": "Contract for Sale - 15 Willow Lane",
    "documentType": "contract",
    "documentDate": "2024-11-15",
    "parties": [{ "name": "Margaret Thompson", "role": "Buyer" }],
    "keyDates": [{ "label": "Completion Date", "date": "2024-12-20" }],
    "summary": "Standard contract for sale...",
    "confidence": 92,
    "confidenceLevel": "green"
  },
  "usage": { "tokensUsed": 1847, "model": "google/gemini-3-flash-preview" }
}
```

---

## Phase 1: Upload Flow Integration

Wire analysis into the existing upload flow - analyze runs automatically after upload completes.

### Changes

- After file upload completes, automatically trigger `/api/documents/[id]/analyze`
- Use async mode for larger files (returns job ID, poll for completion)
- Show processing state while AI analyzes
- Document starts with `type: null`, AI sets it

### Acceptance Criteria

- [ ] Upload triggers analyze automatically
- [ ] Processing spinner shown during analysis
- [ ] Results displayed when complete
- [ ] Error handling for failed analysis
- [ ] Timeline event visible after analysis

---

## Phase 2: Upload Wizard Modal

New multi-step upload modal with AI-assisted metadata entry.

### User Flow

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Upload        Step 2: Processing               │
│  ┌─────────────┐       ┌─────────────────────┐          │
│  │             │       │   Analyzing...      │          │
│  │  Drop file  │  ──►  │   ████████░░ 80%    │          │
│  │    here     │       │                     │          │
│  └─────────────┘       └─────────────────────┘          │
│                                                         │
│  Step 3: Review         Step 4: Assign                  │
│  ┌─────────────────┐   ┌─────────────────────┐          │
│  │ Title: [____]   │   │ Matter: [Search...] │          │
│  │ Type:  [____]   │   │                     │          │
│  │ Date:  [____]   │   │ ○ Thompson v Smith  │          │
│  │ 🟢 92% conf     │   │ ○ 15 Willow Lane    │          │
│  │ [Edit] [Accept] │   │ ○ Create new...     │          │
│  └─────────────────┘   └─────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Step Details

**Step 1: Upload File**

- Drag-and-drop zone with click fallback
- Accept PDF files only (for now)
- Show file name and size after selection
- "Continue" button to start upload

**Step 2: AI Processing**

- Upload file to MinIO via existing upload endpoint
- Trigger analyze endpoint (async mode)
- Poll job status every 2 seconds
- Show progress indicator (indeterminate or estimated)
- Handle errors gracefully (retry option)

**Step 3: Review & Edit**

- Display AI-extracted fields in editable form:
  - Title (text input, pre-filled with `suggestedTitle`)
  - Type (dropdown, pre-selected with `documentType`)
  - Date (date picker, pre-filled with `documentDate`)
  - Summary (textarea, pre-filled, collapsible)
- Show confidence as RAG indicator:
  - 🟢 Green (80-100): "High confidence"
  - 🟡 Amber (50-79): "Review recommended"
  - 🔴 Red (0-49): "Manual review required"
- Show extracted parties (read-only list)
- Show key dates (read-only list)
- "Back" to re-upload, "Continue" to assign

**Step 4: Assign to Matter**

- Search input with instant results (debounced)
- Show recent matters as quick options
- Option to skip (leave unassigned)
- Option to create new matter (future)
- "Save" button to complete

### Components to Create

| Component              | Location                                     | Purpose                |
| ---------------------- | -------------------------------------------- | ---------------------- |
| `DocumentUploadWizard` | `components/documents/upload-wizard.tsx`     | Main wizard container  |
| `UploadDropzone`       | `components/documents/upload-dropzone.tsx`   | Drag-drop file input   |
| `AnalysisProgress`     | `components/documents/analysis-progress.tsx` | Processing state UI    |
| `AnalysisReview`       | `components/documents/analysis-review.tsx`   | Review/edit form       |
| `MatterAssign`         | `components/documents/matter-assign.tsx`     | Matter search & select |
| `ConfidenceBadge`      | `components/documents/confidence-badge.tsx`  | RAG indicator          |

### Acceptance Criteria

- [ ] 4-step wizard modal with navigation
- [ ] Drag-drop file upload working
- [ ] Processing state with visual feedback
- [ ] Confidence shown as RAG colours
- [ ] Editable form with AI suggestions pre-filled
- [ ] Extracted parties and dates displayed
- [ ] Matter search with instant results
- [ ] Save creates document with all metadata
- [ ] Modal closes and refreshes document list
- [ ] Keyboard navigation (Escape to close)
- [ ] Mobile responsive

---

## Phase 3: Document List Improvements

Enhanced filtering and document detail view.

### Features

**Filtering**

- Matter filter (instant search, not dropdown)
- Type dropdown filter (letter_in, contract, etc.)
- Status dropdown filter (if applicable)
- Active filter chips with clear button
- URL-persisted filters (shareable links)

**Document Detail**

- Slide-in panel from right (or modal)
- Show all document metadata
- Show AI analysis results
- Show extracted parties and dates
- Download button
- Re-analyze button
- Edit metadata button

### Acceptance Criteria

- [ ] Matter search filter working
- [ ] Type dropdown filter working
- [ ] Filter chips with clear buttons
- [ ] Filters persisted in URL
- [ ] Document detail panel/modal
- [ ] All metadata displayed
- [ ] Download and re-analyze actions

---

## Technical Notes

### Existing Components to Reuse

| Component    | Location                     | Reuse                |
| ------------ | ---------------------------- | -------------------- |
| Dialog/Modal | `components/ui/dialog.tsx`   | Wizard container     |
| Button       | `components/ui/button.tsx`   | All buttons          |
| Input        | `components/ui/input.tsx`    | Form fields          |
| Select       | `components/ui/select.tsx`   | Type dropdown        |
| Badge        | `components/ui/badge.tsx`    | Confidence indicator |
| Skeleton     | `components/ui/skeleton.tsx` | Loading states       |
| Command      | `components/ui/command.tsx`  | Matter search        |

### API Endpoints Needed

| Endpoint                           | Purpose                | Status |
| ---------------------------------- | ---------------------- | ------ |
| `POST /api/uploads`                | Upload file to MinIO   | Exists |
| `POST /api/documents`              | Create document record | Exists |
| `POST /api/documents/[id]/analyze` | AI analysis            | Exists |
| `GET /api/jobs/[id]`               | Poll job status        | Exists |
| `GET /api/matters?search=`         | Search matters         | Exists |
| `PATCH /api/documents/[id]`        | Update document        | Exists |

### State Management

Use React state for wizard steps. Consider:

- `useState` for simple step tracking
- `useReducer` if logic gets complex
- Form state with `react-hook-form` for Step 3

### File Upload Pattern

```typescript
// 1. Upload file to MinIO
const uploadRes = await fetch("/api/uploads", {
  method: "POST",
  body: formData,
});
const { uploadId } = await uploadRes.json();

// 2. Create document record
const docRes = await fetch("/api/documents", {
  method: "POST",
  body: JSON.stringify({ uploadId, title: file.name }),
});
const { id: documentId } = await docRes.json();

// 3. Trigger async analysis
const analyzeRes = await fetch(`/api/documents/${documentId}/analyze?async=true`, {
  method: "POST",
});
const { jobId } = await analyzeRes.json();

// 4. Poll for completion
const pollJob = async () => {
  const jobRes = await fetch(`/api/jobs/${jobId}`);
  const job = await jobRes.json();
  if (job.status === "completed") {
    return job.result;
  } else if (job.status === "failed") {
    throw new Error(job.error);
  }
  // Still processing, poll again
  await new Promise((r) => setTimeout(r, 2000));
  return pollJob();
};
```

---

## Out of Scope

- Image file support (JPG, PNG) - future phase
- Batch upload (multiple files at once)
- Document versioning
- Related document matching
- Re-analysis scheduling
