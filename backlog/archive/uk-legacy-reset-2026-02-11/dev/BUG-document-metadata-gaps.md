# BUG: Document Metadata Fields Missing from UI/API

## Summary

Several document fields exist in the database schema but are not exposed through the API or UI, preventing users from managing important document metadata.

## Current State

The document edit UI (`DocumentMetadataEditor`) and API (`PATCH /api/documents/[id]`) only support a subset of the available document fields.

## Gaps Identified

### 1. Status Field (High Priority)

**Impact:** Users cannot change document workflow status

| Status Value     | Description              |
| ---------------- | ------------------------ |
| `draft`          | Being created/edited     |
| `pending_review` | Awaiting approval        |
| `approved`       | Approved for sending/use |
| `sent`           | Sent to recipient        |
| `archived`       | No longer active         |

**Current State:**

- Database: `status` field exists with enum values
- API PATCH: Does NOT accept `status` field
- UI: Does NOT display status selector

**Fix Required:**

1. Add `status` to `UpdateDocumentMetadataSchema` in `lib/api/schemas/documents.ts`
2. Handle `status` in PATCH handler in `app/api/documents/[id]/route.ts`
3. Add status dropdown to `DocumentMetadataEditor` component
4. Display current status on document detail page

### 2. Recipient/Sender Fields (Medium Priority)

**Impact:** Users cannot set/edit correspondence metadata for letters and emails

**Current State:**

- Database: `recipient` and `sender` fields exist
- API PATCH: Accepts these fields (already supported)
- UI: Does NOT display these fields

**Fix Required:**

1. Add recipient/sender inputs to `DocumentMetadataEditor`
2. Only show for correspondence types: `letter_in`, `letter_out`, `email_in`, `email_out`
3. Update `DocumentMetadata` interface to include these fields

### 3. Matter Reassignment (Low Priority)

**Impact:** Users cannot move a document to a different matter

**Current State:**

- Database: `matterId` field exists
- API PATCH: Accepts `matterId` (already supported)
- UI: Does NOT allow changing matter assignment

**Fix Required:**

1. Add matter selector to document detail page or edit dialog
2. Allow setting `matterId` to reassign document
3. Consider confirmation dialog for reassignment

## Files to Modify

| File                                                | Changes                                         |
| --------------------------------------------------- | ----------------------------------------------- |
| `lib/api/schemas/documents.ts`                      | Add `status` to `UpdateDocumentMetadataSchema`  |
| `app/api/documents/[id]/route.ts`                   | Handle `status` field in PATCH                  |
| `components/documents/document-metadata-editor.tsx` | Add status, recipient, sender, matterId fields  |
| `app/(app)/documents/[id]/page.tsx`                 | Pass new fields to editor, display status badge |

## Acceptance Criteria

- [ ] Users can change document status via dropdown
- [ ] Status changes create timeline/audit events
- [ ] Recipient/sender fields shown for correspondence document types
- [ ] Users can reassign document to different matter
- [ ] All new fields have unit tests

## Field Reference

### Currently Editable (6 fields)

- `title`
- `type`
- `documentDate`
- `aiSummary`
- `extractedParties`
- `extractedDates`

### Should Be Editable (4 fields to add)

- `status` - workflow status
- `recipient` - for correspondence
- `sender` - for correspondence
- `matterId` - matter reassignment

### Read-Only (correct - no changes needed)

- `id`, `firmId`, `createdBy`, `createdAt`, `updatedAt`
- `uploadId`, `filename`, `mimeType`, `fileSize`
- `aiConfidence`, `aiModel`, `aiTokensUsed`, `analyzedAt`
- `extractedText`, `chunkedAt`, `chunkCount`
- `version`, `parentId`, `metadata`

## Priority

Medium

## Estimate

Small (1 day)
