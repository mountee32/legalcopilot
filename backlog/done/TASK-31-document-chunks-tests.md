# TASK-31: Integration Tests for Document Chunks/Entities

## Priority: Medium

## Summary

Add integration tests for document chunk and entity extraction API endpoints.

## Current State Analysis

**Existing coverage in `tests/integration/documents/crud.test.ts`:**

- ✅ Chunking at DB level (lines 528-679)
- ✅ Entity storage in metadata (lines 681-727)
- ✅ Multi-tenancy isolation for chunks (lines 824-891)
- ✅ Cascade delete, unique constraints

**Missing (what this task adds):**

- ❌ API endpoint tests for `GET /api/documents/[id]/chunks`
- ❌ API endpoint tests for `POST /api/documents/[id]/entities` (note: POST, not GET)

## Endpoints Analysis

### `GET /api/documents/[id]/chunks`

- Protected by `withAuth`
- Returns `{ chunks: [...] }` array
- Verifies document belongs to firm
- Orders by `chunkIndex`

### `POST /api/documents/[id]/entities`

- Protected by `withAuth`, `withPermission("documents:write")`, `withPermission("ai:use")`
- Requires OPENROUTER_API_KEY
- Extracts entities via AI, stores in metadata
- Returns `{ success: true, entities: {...} }`
- **Not suitable for integration tests** (requires AI API)

## Solution Design

Create `tests/integration/documents/chunks.test.ts` for chunks API endpoint tests.
Skip entities endpoint tests (requires live AI - better suited for unit tests with mocked AI).

### Test Strategy

## Test Cases (Chunks Endpoint - 5 tests)

- [ ] GET - returns chunks for document with chunks
- [ ] GET - returns empty array for document without chunks
- [ ] GET - returns 404 for non-existent document
- [ ] GET - returns 404 for document from different firm
- [ ] GET - chunks ordered by index

## Acceptance Criteria (Revised)

- [ ] 5+ tests covering chunks endpoint
- [ ] Chunk structure validated
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database
- [ ] Auth properly mocked

## Files to Create

- `tests/integration/documents/chunks.test.ts` (new, ~150 lines)

## Implementation Notes

- Mock `@/lib/auth` and `@/lib/tenancy` like preferences tests
- Seed chunks directly in DB via `documentChunks` table
- Following pattern from `tests/integration/notifications/preferences.test.ts`

---

## QA Approval

**Status:** ✅ APPROVED
**Date:** 2025-12-17
**Tests:** 5/5 passing
**Regression:** No new failures (7 pre-existing in upload-endpoint.test.ts)
**Notes:** Entities endpoint correctly skipped (requires AI API)
