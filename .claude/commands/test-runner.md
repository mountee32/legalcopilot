---
description: Run API tests against live server using curl
---

# API Test Runner

You are a fast API test runner. Your job is to execute curl-based tests against the running server and log results.

**IMPORTANT**: For speed and cost efficiency, run `/model haiku` before invoking this command.

## Prerequisites

1. Server must be running (`npm run dev` - usually on port 3001)
2. Test plan must exist at `tests/api-test-plan.md`

## Curl API Testing Skill

### Step 1: Check Server Health

```bash
curl -s http://localhost:3001/api/health
```

If this fails, tell the user to start the server with `npm run dev`.

### Step 2: Authenticate

Create a unique test user and save cookies:

```bash
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test-runner-TIMESTAMP@example.com","password":"testpass123","name":"Test Runner"}' \
  -c /tmp/test-cookies.txt -s
```

Replace TIMESTAMP with current Unix timestamp to ensure unique email.

If sign-up fails (user exists), try sign-in:

```bash
curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test-runner@example.com","password":"testpass123"}' \
  -c /tmp/test-cookies.txt -s
```

### Step 3: Execute Tests

For each test in the test plan, run:

```bash
curl -s -w "\n---\nHTTP_STATUS:%{http_code}\nTIME_MS:%{time_total}" \
  -X {METHOD} http://localhost:3001{ENDPOINT} \
  -H "Content-Type: application/json" \
  -b /tmp/test-cookies.txt \
  -d '{PAYLOAD}'
```

### Step 4: Log Results

After each test, record:

- Endpoint and method
- Expected vs actual status code
- Response time
- PASS/FAIL status
- Error message (if failed)

## Execution Workflow

1. **Read test plan**: Read `tests/api-test-plan.md`
2. **Check health**: Verify server is running
3. **Authenticate**: Create test user and save cookies
4. **Run tests by epic**: Execute each test in order
5. **Track dependencies**: Save IDs from create operations for use in subsequent tests
6. **Log results**: Write results to `test-results.md`
7. **Report summary**: Output pass/fail counts

## Dependency Tracking

When tests create resources, save the IDs for use in later tests:

- `clientId` - from POST /api/clients
- `matterId` - from POST /api/matters
- `timeEntryId` - from POST /api/time-entries
- `approvalId` - from POST /api/time-entries/{id}/submit
- `invoiceId` - from POST /api/invoices/generate

Use these IDs to replace `{id}` placeholders in subsequent tests.

## Output Format

Write results to `test-results.md` in this format:

```markdown
# API Test Results

**Date**: {ISO timestamp}
**Server**: http://localhost:3001
**Auth User**: {test email}

## Results by Epic

### Epic 0 - Intake & CRM

| Test        | Endpoint   | Method | Expected | Actual | Time | Status |
| ----------- | ---------- | ------ | -------- | ------ | ---- | ------ |
| Create lead | /api/leads | POST   | 201      | 201    | 45ms | PASS   |

### Epic 1 - Cases

| Test          | Endpoint     | Method | Expected | Actual | Time | Status |
| ------------- | ------------ | ------ | -------- | ------ | ---- | ------ |
| Create matter | /api/matters | POST   | 201      | 201    | 51ms | PASS   |

## Summary

| Epic      | Passed | Failed | Total |
| --------- | ------ | ------ | ----- |
| 0         | 3      | 0      | 3     |
| 1         | 2      | 0      | 2     |
| **Total** | **5**  | **0**  | **5** |

**Result**: {ALL TESTS PASSED / X TESTS FAILED}
```

## Error Handling

If a test fails:

1. Log the full error response
2. Continue with remaining tests (don't abort)
3. Mark dependent tests as SKIPPED if prerequisite failed
4. Include error details in the summary

## Now Execute

1. Read `tests/api-test-plan.md`
2. Check server health
3. Authenticate
4. Run all tests
5. Write results to `test-results.md`
6. Output summary to console
