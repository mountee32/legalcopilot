# TASK-30: Integration Tests for Notification Preferences

## Priority: Medium

## Summary

Add integration tests for notification preferences and bulk read operations via API endpoints.

## Current State Analysis

**Existing coverage in `tests/integration/notifications/crud.test.ts`:**

- ✅ Preferences CRUD at database level (660 lines, 50+ tests)
- ✅ Multi-tenancy isolation for preferences
- ✅ Data integrity and constraints

**Missing (what this task adds):**

- ❌ API endpoint tests for `/api/notifications/preferences` (GET/PATCH)
- ❌ API endpoint tests for `/api/notifications/read-all` (POST)

## Solution Design

Create `tests/integration/notifications/preferences.test.ts` to test API endpoints directly.

### Endpoints to Test

**`/api/notifications/preferences` (GET/PATCH)**

- Uses `withAuth` middleware
- GET: Returns `{ preferences, updatedAt }` for authenticated user
- PATCH: Deep-merges new preferences with existing, returns updated

**`/api/notifications/read-all` (POST)**

- Uses `withAuth` middleware
- Marks all unread notifications as read for current user
- Returns `{ success: true }`

### Test Strategy

## Test Cases

### Preferences Endpoint (5 tests)

- [ ] GET - returns empty preferences for new user
- [ ] GET - returns saved preferences
- [ ] PATCH - creates preferences if none exist
- [ ] PATCH - updates existing preferences (deep merge)
- [ ] PATCH - preserves unrelated preferences on partial update

### Read All Endpoint (3 tests)

- [ ] POST - marks all unread as read
- [ ] POST - returns success even with no unread (no-op)
- [ ] POST - only affects current user's notifications

## Acceptance Criteria

- [ ] 8+ tests covering both endpoints
- [ ] Preference persistence verified
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database

## Files to Create

- `tests/integration/notifications/preferences.test.ts` (new, ~150 lines)

## Implementation Notes

- Tests will call route handlers directly with mocked auth
- Following pattern from existing tests in `tests/integration/`
- Need to mock `withAuth` to inject test user/firm

---

## QA Approval

**Status:** ✅ APPROVED
**Date:** 2025-12-17
**Tests:** 8/8 passing
**Regression:** No new failures (7 pre-existing in upload-endpoint.test.ts)
