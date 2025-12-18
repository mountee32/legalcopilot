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
