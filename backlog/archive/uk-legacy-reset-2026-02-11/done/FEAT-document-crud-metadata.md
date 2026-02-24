# FEAT: Document CRUD with AI Metadata Display

## Summary

Add comprehensive document management features including display of AI-extracted metadata, re-analyze capability, and full CRUD operations for documents and their metadata.

## User Stories

### US1: View AI Analysis Results

**As a** fee earner
**I want to** see all AI-extracted metadata on the document detail page
**So that** I can review what the AI found without re-analyzing

**Acceptance Criteria:**

- Display confidence score with visual indicator (green/amber/red)
- Show extracted parties (name + role)
- Show key dates (label + date)
- Display AI model used and analysis timestamp
- Show token usage for cost tracking

### US2: Re-analyze Document

**As a** fee earner
**I want to** trigger a fresh AI analysis from the document detail page
**So that** I can update metadata if the document was updated or initial analysis was poor

**Acceptance Criteria:**

- "Re-analyze" button on document detail page
- Shows loading state during analysis
- Refreshes displayed data after completion
- Preserves manual edits option (confirm before overwriting)

### US3: Edit Document Metadata

**As a** fee earner
**I want to** manually edit document metadata
**So that** I can correct AI mistakes or add missing information

**Acceptance Criteria:**

- Edit title, type, document date
- Edit/add extracted parties
- Edit/add key dates
- Edit summary
- Save changes to database

### US4: Delete Document

**As a** fee earner
**I want to** delete a document
**So that** I can remove incorrectly uploaded or duplicate documents

**Acceptance Criteria:**

- Delete button with confirmation dialog
- Removes document record and associated file from storage
- Creates audit trail entry
- Redirects to documents list after deletion

### US5: Document CRUD on Matter Page

**As a** fee earner
**I want to** manage documents directly from a matter/case page
**So that** I can work with case documents in context

**Acceptance Criteria:**

- List documents linked to matter
- Upload new document to matter (uses existing wizard)
- Link/unlink existing documents to matter
- View document details inline or via modal
- Quick actions: view, download, edit, delete

## Technical Notes

### Existing Infrastructure

- Database fields exist: `extractedParties`, `extractedDates`, `aiConfidence`, `aiModel`, `aiTokensUsed`, `analyzedAt`
- API endpoints exist: GET/POST/PATCH `/api/documents/[id]`, POST `/api/documents/[id]/analyze`
- UI components exist: `ConfidenceBadge`, `AnalysisReview` (can be adapted)

### Files to Modify/Create

- `app/(app)/documents/[id]/page.tsx` - Add AI metadata display + re-analyze + edit/delete
- `app/api/documents/[id]/route.ts` - Add DELETE handler, ensure PATCH handles all fields
- `app/(app)/matters/[id]/page.tsx` - Add documents section with CRUD
- `components/documents/document-edit-form.tsx` - New component for editing metadata

### API Changes Needed

- DELETE `/api/documents/[id]` - Delete document and storage file
- Ensure PATCH supports: `extractedParties`, `extractedDates`, `aiSummary`

## Priority

Medium

## Estimate

Medium (2-3 days)

---

## Solution Design

### Existing Code Analysis

**Already Implemented:**

- `app/api/documents/[id]/route.ts` - GET, PATCH exist (no DELETE)
- `app/api/documents/[id]/analyze/route.ts` - Full analyze endpoint exists
- `app/(app)/documents/[id]/page.tsx` - Basic detail page (missing AI metadata display)
- `components/documents/confidence-badge.tsx` - RAG confidence indicator
- `components/documents/analysis-review.tsx` - Editable metadata form (used in upload wizard)
- `lib/db/schema/documents.ts` - All AI fields exist (extractedParties, extractedDates, aiConfidence, aiModel, aiTokensUsed, analyzedAt)
- `lib/storage/minio.ts` - `deleteFile()` function exists
- `app/(app)/matters/[id]/page.tsx` - Has DocumentsTab but lacks upload/edit/delete actions

**Gaps to Fill:**

1. DELETE handler in API route
2. PATCH to support extractedParties, extractedDates
3. UI to display AI metadata on document detail page
4. Re-analyze button with confirmation
5. Edit mode for document metadata
6. Delete with confirmation dialog
7. Enhanced DocumentsTab with upload/actions

### Files to Modify

#### 1. `app/api/documents/[id]/route.ts`

- Add DELETE handler:
  - Verify document exists and belongs to firm
  - Delete from MinIO via `deleteFile(bucket, path)`
  - Delete document record from DB
  - Create audit timeline event
  - Return 204 No Content
- Extend PATCH to support `extractedParties`, `extractedDates` fields

#### 2. `app/(app)/documents/[id]/page.tsx`

- Add interface fields for AI metadata: `aiConfidence`, `extractedParties`, `extractedDates`, `analyzedAt`, `aiModel`, `aiTokensUsed`
- Add AI Analysis card displaying:
  - ConfidenceBadge component
  - Extracted parties list
  - Key dates list
  - Analysis timestamp + model + token count
- Add Re-analyze button with useMutation
- Add Edit button opening edit dialog/mode
- Add Delete button with confirmation AlertDialog
- Use existing ConfidenceBadge component

#### 3. `components/documents/document-metadata-editor.tsx` (NEW)

- Adapt AnalysisReview for standalone use
- Editable: title, type, documentDate, aiSummary
- Editable: extractedParties (add/remove/edit)
- Editable: extractedDates (add/remove/edit)
- Save button triggers PATCH

#### 4. `app/(app)/matters/[id]/page.tsx` - DocumentsTab

- Add "Upload Document" button opening UploadDocumentDialog
- Add dropdown actions per document: View, Download, Edit, Delete
- Delete action with confirmation
- Wire upload to matter assignment

### API Schema Updates

Update `lib/api/schemas/documents.ts`:

```typescript
// Add UpdateDocumentMetadataSchema for extended PATCH
export const UpdateDocumentMetadataSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    type: DocumentTypeSchema.optional(),
    matterId: UuidSchema.nullable().optional(),
    documentDate: z.union([DateSchema, DateTimeSchema]).nullable().optional(),
    recipient: z.string().nullable().optional(),
    sender: z.string().nullable().optional(),
    aiSummary: z.string().nullable().optional(),
    extractedParties: z.array(ExtractedPartySchema).nullable().optional(),
    extractedDates: z.array(ExtractedDateSchema).nullable().optional(),
  })
  .openapi("UpdateDocumentMetadata");
```

### Timeline Events

- Document deletion: `document_deleted` event type
- Already have: `document_analyzed`, `document_uploaded`

### Test Strategy

#### Unit Tests

**API Tests (`tests/unit/app/api/documents/[id]/route.test.ts`):**

- [ ] GET - returns document with AI metadata fields
- [ ] PATCH - updates extractedParties successfully
- [ ] PATCH - updates extractedDates successfully
- [ ] PATCH - rejects invalid party/date formats (400)
- [ ] DELETE - deletes document and storage file
- [ ] DELETE - returns 404 for non-existent document
- [ ] DELETE - creates timeline event (audit)
- [ ] Auth - rejects unauthenticated (401)
- [ ] Tenant - rejects document from different firm (404)

**Component Tests:**

- [ ] `tests/unit/components/documents/document-metadata-editor.test.tsx`
  - Renders with analysis data
  - Allows editing parties (add/remove)
  - Allows editing dates (add/remove)
  - Calls onSave with updated data

#### E2E Tests (Optional)

- [ ] `tests/e2e/browser/document-detail.spec.ts`
  - View document shows AI analysis section
  - Re-analyze triggers and updates display
  - Edit mode saves changes
  - Delete removes document

### Mock Pattern Reminder

Use `mockImplementation` for withFirmDb:

```typescript
vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
  return { id: "doc-1", aiConfidence: 85, extractedParties: [] };
});
```

### Dependencies

- None - all infrastructure exists

---

## QA Approval

**Approved:** 2025-12-19
**Status:** PASS

### Tests Verified

- API Tests: 15 passed (GET, PATCH, DELETE handlers)
- Component Tests: 12 passed (DocumentMetadataEditor)

### Implementation Verified

- DELETE `/api/documents/[id]` implemented with storage cleanup and timeline event
- PATCH supports extractedParties, extractedDates, aiSummary
- Document detail page displays AI analysis with confidence badge, parties, dates, model info
- Re-analyze button with confirmation dialog
- Edit dialog using DocumentMetadataEditor component
- Delete with confirmation dialog
- Matter page DocumentsTab with upload, view, download, edit, delete actions

### Pre-existing Test Failures (Unrelated)

- 39 failures in other features (sidebar mock, timeline utils date edge cases, other API routes)
- Not related to this feature - tracked separately
