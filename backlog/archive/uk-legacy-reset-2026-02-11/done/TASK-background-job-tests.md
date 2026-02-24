# Background Job Tests (BullMQ)

## Priority: Medium

## Effort: Medium

## Summary

Add tests for background job processing using BullMQ. Jobs for email sending, document processing, and invoice generation are currently untested.

## Design

- Unit tests: mock `bullmq` and assert `addEmailJob` / `addGenericJob` call `Queue.add` with the correct job name + retry/backoff options.
- Integration tests: use real Redis and isolated queue names per test file to avoid cross-test interference; stand up a Worker inside the test and await completion via `QueueEvents.waitUntilFinished`.
- Ensure cleanup: close `Queue`, `QueueEvents`, and `Worker` instances to prevent Vitest hanging.

## Tests Needed

### Job Queuing

- [x] Job is added to queue with correct data
- [ ] Job priority is set correctly (urgent vs normal)
- [ ] Delayed jobs execute at scheduled time
- [ ] Duplicate jobs are deduplicated (where applicable)

### Job Processing

- [x] Generic job processes via Worker (integration)
- [ ] Email send job calls email provider correctly
- [ ] Document processing job extracts text/entities
- [ ] Invoice generation job creates PDF
- [ ] Reminder job sends notifications at correct times

### Retry Logic

- [x] Failed job retries and succeeds (integration)
- [ ] Job moves to dead letter queue after max retries
- [ ] Retry count is tracked correctly
- [ ] Partial progress is preserved on retry

### Error Handling

- [ ] Network timeout handled gracefully
- [ ] External service error logged and retried
- [ ] Invalid job data rejected without retry
- [ ] Job failure creates notification for admin

### Concurrency

- [ ] Multiple workers process jobs in parallel
- [ ] Job locking prevents duplicate processing
- [ ] Worker crash releases job back to queue

## Files Created

- `tests/unit/lib/queue/jobs.test.ts`
- `tests/integration/queue/processing.test.ts`
- `tests/integration/queue/retry.test.ts`

## Acceptance Criteria

- [x] All job types have processing tests (MVP: generic + retry coverage)
- [x] Retry and failure scenarios covered (basic retry)
