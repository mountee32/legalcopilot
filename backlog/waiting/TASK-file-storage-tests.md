# File Storage Tests (MinIO/S3)

## Priority: Medium

## Effort: Low

## Summary

Add tests for document upload, download, and presigned URL generation using MinIO (S3-compatible storage).

## Tests Needed

### Upload

- [ ] Upload document with metadata succeeds
- [ ] Upload creates correct folder structure (firm/matter/document)
- [ ] Upload rejects files exceeding size limit
- [ ] Upload rejects disallowed file types
- [ ] Upload with duplicate filename generates unique key

### Download

- [ ] Download returns correct file content
- [ ] Download sets correct Content-Type header
- [ ] Download for non-existent file returns 404
- [ ] Download respects firm isolation (cannot access other firm's files)

### Presigned URLs

- [ ] Presigned upload URL allows direct browser upload
- [ ] Presigned download URL allows direct browser download
- [ ] Presigned URL expires after configured duration
- [ ] Expired presigned URL returns 403

### Metadata

- [ ] File metadata stored correctly (size, type, uploadedBy)
- [ ] File version history tracked on re-upload
- [ ] Soft delete marks file as deleted but preserves data

### Security

- [ ] Cannot access files without valid session
- [ ] Cannot access files from another firm
- [ ] Virus scan integration (if implemented)

## Files to Create

- `tests/unit/lib/storage/minio.test.ts`
- `tests/integration/storage/upload-download.test.ts`
- `tests/integration/storage/presigned-urls.test.ts`

## Test Infrastructure

- Use MinIO container in Docker Compose
- Create test bucket per test suite
- Clean up files after tests

## Acceptance Criteria

- Upload/download round-trip verified
- Presigned URL flow tested
- Firm isolation enforced
