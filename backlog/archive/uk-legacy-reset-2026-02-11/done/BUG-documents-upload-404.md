# BUG: Documents Upload Button Navigates to 404 Page

## Summary

The "Upload" and "Upload Document" buttons on the `/documents` page navigate to a non-existent route (`/documents/upload`) instead of opening an upload dialog or file picker.

## Steps to Reproduce

1. Login to the application as Firm Admin (using fast-login)
2. Navigate to `/documents`
3. Click either the "Upload" button (top right) or "Upload Document" button (in empty state)
4. Observe the page navigates to `/documents/upload`
5. See 404 error: "This page could not be found."

## Expected Behavior

Clicking the upload button should:

- Open a file upload dialog/modal, OR
- Trigger a file picker to select documents to upload, OR
- Navigate to a valid upload page with an upload form

The button should NOT navigate to a non-existent route.

## Actual Behavior

- Button navigates to `/documents/upload` (which returns 404)
- No upload dialog appears
- No file picker opens
- User sees error page: "404 - This page could not be found."

## Environment

- URL: `http://localhost:3000/documents`
- User: Firm Admin (full access)
- Browser: Chromium (Playwright headless)

## Screenshots

- Before click: `screenshot-04-before-upload-click.png` - Shows documents page with "Upload" button
- After click: `screenshot-05-after-upload-click.png` - Shows 404 error page
- Documents page: `screenshot-03-documents-page.png` - Initial page load with upload buttons visible

## Technical Details

- Found 2 upload buttons on the page (one in header, one in empty state)
- Both buttons navigate to: `http://localhost:3000/documents/upload`
- No dialog, modal, or file input elements appear after clicking
- Route `/documents/upload` does not exist (returns Next.js 404 page)

## Severity

**High** - Core functionality (document upload) is completely broken. Users cannot upload documents.

## Root Cause

The documents page (`/app/(app)/documents/page.tsx`) has hardcoded navigation to `/documents/upload`:

- Line 126: `<Button onClick={() => router.push("/documents/upload")}>` (header button)
- Line 172: `<Button onClick={() => router.push("/documents/upload")}>` (empty state button)

However, the route `/app/(app)/documents/upload/page.tsx` does not exist in the codebase.

## Suggested Fix

Either:

1. **Create the missing upload page** at `/app/(app)/documents/upload/page.tsx` with:
   - File upload form
   - Matter selection (required by API - see `CreateDocumentSchema`)
   - Document metadata inputs (title, type, etc.)
   - Integration with `/api/documents` POST endpoint
   - File handling via MinIO/storage layer

2. **Use a modal dialog instead** (better UX):
   - Change buttons to open a client-side modal/dialog
   - Include file picker and form in the modal
   - Keep user on same page after upload
   - Avoid navigation entirely

3. **Direct file input trigger**:
   - Make buttons trigger a hidden file input
   - Handle upload client-side with minimal UI

## API Status

The backend API is functional:

- `POST /api/documents` exists and works
- Requires: `matterId`, `title`, `type`, plus optional file metadata
- Creates document record and timeline event
- No file upload route exists (documents API expects uploadId to be provided)

## Test Script

Automated test script available at: `/home/andy/dev/legalcopilot/test-documents.mjs`

Run with: `node test-documents.mjs`

---

## DESIGN SOLUTION

### Chosen Approach: Modal Dialog

**Modal dialog is preferred** over separate page because:

- Keeps user context on documents list
- Better UX flow (no navigation away)
- Can easily refresh list after upload
- Matches modern SPA patterns
- Existing Dialog component available

### Files to Create

1. **`components/documents/UploadDocumentDialog.tsx`** (NEW)
   - Modal dialog with file upload form
   - Uses shadcn/ui Dialog component
   - Controlled by state in DocumentsPage

2. **`components/documents/UploadDocumentForm.tsx`** (NEW)
   - Form with fields:
     - Matter selector (dropdown, required)
     - Document title (text input, required)
     - Document type (dropdown, required)
     - File input (file picker)
     - Document date (optional date picker)
     - Recipient (optional text)
     - Sender (optional text)
   - Form validation using Zod
   - Submit handler calls POST `/api/documents`

### Changes to Existing Files

1. **`app/(app)/documents/page.tsx`**
   - Add state: `const [uploadDialogOpen, setUploadDialogOpen] = useState(false);`
   - Change buttons: `onClick={() => setUploadDialogOpen(true)}`
   - Add dialog before closing `</div>`: `<UploadDocumentDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />`
   - Add `import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";`
   - Implement query invalidation after upload to refresh list

### Form Fields & Validation

Based on `CreateDocumentSchema` in `/lib/api/schemas/documents.ts`:

```typescript
{
  matterId: UuidSchema,                    // Required - from Matter dropdown
  title: z.string().min(1).max(200),      // Required - 200 char limit
  type: DocumentTypeSchema,                // Required - 11 document types
  uploadId: UuidSchema.optional(),         // For uploaded file
  filename: z.string().optional(),         // Auto-populated from file
  mimeType: z.string().optional(),         // Auto-populated from file
  fileSize: z.number().int().optional(),   // Auto-populated from file
  documentDate: z.union([DateSchema, DateTimeSchema]).optional(),
  recipient: z.string().optional(),
  sender: z.string().optional(),
  extractedText: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
}
```

### File Upload Flow

1. User selects file from native file picker
2. Extract filename, mimeType, fileSize from File object
3. For now: submit metadata without actual file (MinIO integration is separate)
4. API creates document record with status: "draft"
5. Timeline event logged
6. Dialog closes, query refreshed

### Required Data Fetches

1. **Get matters list** - for Matter dropdown
   - Endpoint: `GET /api/matters`
   - Use React Query with firm context

### Error Handling

- Validation errors: Show per-field error messages
- API errors: Toast notification
- File size warnings (if applicable)
- Network errors: Retry button in toast

### Test Strategy

**Unit tests** (`tests/unit/components/documents/`):

- Form rendering with all fields
- Form validation (required fields, max lengths)
- Successful form submission
- Error message display
- File input handling

**Integration tests** (`tests/integration/documents/`):

- Upload dialog opens/closes correctly
- Form submission calls `/api/documents` POST
- Document record created in database
- Timeline event generated
- Query cache invalidated
- Empty state disappears after upload

**E2E tests** (`tests/e2e/browser/`):

- Complete upload flow: open dialog → fill form → select file → submit
- Verify document appears in list
- Test with various document types
- Test validation errors
- Test cancelling upload

### API Integration Notes

- No separate file upload endpoint needed (documents are metadata records)
- File upload (to MinIO) is handled separately by `uploadId` field
- For MVP: uploadId can be null (documents without files)
- Full file storage integration is tracked separately

---
