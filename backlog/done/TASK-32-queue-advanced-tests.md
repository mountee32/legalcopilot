# TASK-32: Integration Tests for Queue Processing

## Priority: Low

## Summary

Expand BullMQ queue integration test coverage for scheduling, priority, and DLQ features.

## Current State Analysis

**Existing coverage:**

- ✅ Basic job processing (`processing.test.ts` - 1 test)
- ✅ Retry logic (`retry.test.ts` - 1 test)

**Missing (what this task adds):**

- ❌ Delayed/scheduled job execution
- ❌ Priority queue ordering
- ❌ Failed job handling (DLQ equivalent)
- ❌ Job cancellation

## Solution Design

Create `tests/integration/queue/advanced.test.ts` combining all advanced features.

### BullMQ Features to Test

**Scheduling (`delay` option):**

- Jobs with delay execute after specified time
- Delayed jobs can be removed before execution

**Priority (`priority` option):**

- Lower number = higher priority
- Jobs with higher priority processed first

**Failed Jobs (BullMQ "failed" state):**

- Jobs that exhaust all attempts move to "failed" state
- Failed jobs can be retried via `job.retry()`
- Failed jobs can be removed via `job.remove()`

**Cancellation:**

- Pending jobs: `job.remove()`
- Check job state after operations

## Test Strategy

## Test Cases (7 tests)

- [ ] Delayed job executes after delay period
- [ ] Scheduled job can be cancelled before execution
- [ ] Higher priority job (priority=1) processes before lower (priority=10)
- [ ] Job failing all attempts moves to failed state
- [ ] Failed job can be retried and succeeds
- [ ] Failed job can be permanently removed
- [ ] Multiple priorities in queue processed in correct order

## Acceptance Criteria

- [ ] 7+ tests covering advanced features
- [ ] Use short delays (10-50ms) for test speed
- [ ] All tests use real Redis
- [ ] Proper cleanup after tests (obliterate queue)

## Files to Create

- `tests/integration/queue/advanced.test.ts` (new, ~200 lines)

## Implementation Notes

- Use unique queue names per test suite (`test-advanced-${randomUUID()}`)
- Follow pattern from existing `processing.test.ts` and `retry.test.ts`
- Close workers, events, and queues in afterAll
- Use `waitUntilFinished()` for job completion
- Use `job.getState()` to verify job states

---

## QA Approval

**Status:** ✅ APPROVED
**Date:** 2025-12-17
**Tests:** 7/7 passing
**Regression:** Queue tests 9/9 passing
**Notes:** Comprehensive coverage of BullMQ advanced features
