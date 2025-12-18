# TASK: Document file access (viewer-friendly downloads)

## Goal

Enable secure viewing/downloading of stored document blobs in UI.

## Scope

- Define pattern for file access:
  - presigned URLs (recommended) or streaming proxy endpoint
- Support content-disposition for browser viewer/download
- Ensure strict firm scoping + permission checks

## Acceptance Criteria

- Frontend can reliably render PDFs/images and allow downloads
- Access is time-limited and logged where required

## References

- `app/api/storage/upload/route.ts`
- `docs/backend-design.md` (storage strategy)

## Design

### Endpoint

`GET /api/documents/:id/download`

### Query Parameters

- `disposition=inline|attachment` (default: inline)
- `expires=300` (optional, seconds, default 3600, max 86400)

### Flow

1. Authenticate via `withAuth`, check `documents:read` permission
2. Look up document by ID with firm scoping
3. Join to `uploads` table to get `bucket` and `path`
4. Generate presigned URL via `getPresignedUrl()` from `lib/storage/minio.ts`
5. Log access to audit_logs
6. Return `{ url, expiresAt, contentDisposition, filename, mimeType }`

### Schema Addition

Add `DocumentDownloadResponseSchema` to `lib/api/schemas/documents.ts`

### Test Strategy

- Unit: mock MinIO, verify firm scoping and permission checks
- Integration: real database, verify document-upload join
- E2E: complete flow with uploaded file
