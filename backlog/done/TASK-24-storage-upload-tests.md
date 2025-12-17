# TASK-24: Integration Tests for Storage Upload

## Priority: High

## Summary

Add integration tests for the file storage upload endpoint and expand MinIO coverage.

## Endpoints to Test

### `/api/storage/upload` (POST)

- Upload file via multipart form
- Generate unique storage key
- Store file in MinIO
- Return file metadata (key, url, size, type)
- Multi-tenancy: files scoped to firm
- Validation: file size limits, allowed types

## Test Scenarios

### Upload Endpoint

1. Upload small file - success
2. Upload with metadata (description, tags)
3. Upload - file too large (should fail)
4. Upload - disallowed file type (should fail)
5. Upload - no file provided (should fail)
6. Verify file accessible via presigned URL

### Storage Operations

1. Upload and download round-trip
2. Delete file
3. List files for firm
4. Multi-tenancy: firm A cannot access firm B files

## Acceptance Criteria

- [ ] 8+ tests covering upload endpoint
- [ ] File type/size validation tested
- [ ] Multi-tenancy isolation verified
- [ ] MinIO integration working
- [ ] All tests use real storage backend

## Files to Create/Modify

- `tests/integration/storage/upload-endpoint.test.ts` (new)

## Notes

- Requires MinIO running via docker-compose
- Test files should be small (< 1MB) for speed
