# File Storage Tests (MinIO/S3)

## Priority: Medium

## Effort: Low

## Summary

Add tests for document upload, download, and presigned URL generation using MinIO (S3-compatible storage).

## Design

- Unit tests target `lib/storage/minio.ts` by mocking the `minio` client (`Client`) and asserting calls to `bucketExists/makeBucket/setBucketPolicy/putObject/getObject/presignedGetObject`.
- Add a small helper for presigned uploads (MinIO `presignedPutObject`) so the presigned URL flow can be tested end-to-end.
- Integration tests run against the real MinIO container from `docker-compose.yml` using a per-suite test bucket name, and validate:
  - upload/download round-trip
  - presigned download URL fetch
  - presigned upload URL PUT then fetch
- Keep firm isolation checks at the API boundary (auth/tenancy), and keep storage helper tests focused on storage behavior.

## Tests Needed

### Upload

- [x] Upload document with metadata succeeds (helper-level)
- [ ] Upload creates correct folder structure (firm/matter/document)
- [ ] Upload rejects files exceeding size limit (API-level)
- [ ] Upload rejects disallowed file types (API-level)
- [ ] Upload with duplicate filename generates unique key (API-level)

### Download

- [x] Download returns correct file content (helper-level)
- [ ] Download sets correct Content-Type header (API-level)
- [ ] Download for non-existent file returns 404 (API-level)
- [ ] Download respects firm isolation (cannot access other firm's files) (API-level)

### Presigned URLs

- [x] Presigned upload URL generated (helper-level)
- [x] Presigned download URL generated (helper-level)
- [ ] Presigned URL expires after configured duration (integration)
- [ ] Expired presigned URL returns 403 (integration)

### Metadata

- [ ] File metadata stored correctly (size, type, uploadedBy) (API + DB)
- [ ] File version history tracked on re-upload
- [ ] Soft delete marks file as deleted but preserves data

### Security

- [ ] Cannot access files without valid session (API-level)
- [ ] Cannot access files from another firm (API-level)
- [ ] Virus scan integration (if implemented)

## Files Created / Updated

- `lib/storage/minio.ts` (adds `getPresignedUploadUrl`)
- `tests/unit/lib/storage/minio.test.ts`
- `tests/integration/storage/upload-download.test.ts`
- `tests/integration/storage/presigned-urls.test.ts`

## Acceptance Criteria

- [x] Upload/download round-trip verified (integration test added)
- [x] Presigned URL flow tested (integration test added)
- [ ] Firm isolation enforced (API-level; not covered by storage helper tests)
