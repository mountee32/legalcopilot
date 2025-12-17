# Test Coverage Report

> Last updated: 2025-12-17

This report tracks test coverage per functional area, with emphasis on **integration tests** that exercise real API endpoints and database operations with realistic data scenarios.

## Coverage Summary

| Area                           | Integration Tests | Real DB | Real API | Multi-Tenancy | Coverage |
| ------------------------------ | ----------------- | ------- | -------- | ------------- | -------- |
| **AI Features**                | 33 tests          | Yes     | Yes      | Yes           | 85%      |
| **Approvals**                  | 41 tests          | Yes     | Yes      | Yes           | 90%      |
| **Auth/RBAC**                  | 42 tests          | Yes     | Yes      | Yes           | 85%      |
| **Calendar**                   | 26 tests          | Yes     | Yes      | Yes           | 85%      |
| **Clients**                    | 21 tests          | Yes     | Yes      | Yes           | 95%      |
| **Conflicts**                  | 16 tests          | Yes     | Yes      | Yes           | 90%      |
| **DB Constraints**             | 17 tests          | Yes     | N/A      | Yes           | 85%      |
| **Documents**                  | 27 tests          | Yes     | Yes      | Yes           | 80%      |
| **Emails**                     | 40 tests          | Yes     | Yes      | Yes           | 95%      |
| **Firm Settings**              | 49 tests          | Yes     | Yes      | Yes           | 95%      |
| **Intake (Leads/Quotes)**      | 33 tests          | Yes     | Yes      | Yes           | 90%      |
| **Integrations**               | 37 tests          | Yes     | Yes      | Yes           | 90%      |
| **Invoices**                   | 38 tests          | Yes     | Yes      | Yes           | 90%      |
| **Matters**                    | 29 tests          | Yes     | Yes      | Yes           | 85%      |
| **Notifications**              | 38 tests          | Yes     | Yes      | Yes           | 90%      |
| **Payments**                   | 36 tests          | Yes     | Yes      | Yes           | 90%      |
| **Queue (BullMQ)**             | 2 tests           | Yes     | N/A      | N/A           | 30%      |
| **Search (Semantic)**          | 32 tests          | Yes     | Yes      | Yes           | 90%      |
| **Signatures**                 | 30 tests          | Yes     | Yes      | Yes           | 85%      |
| **Storage (MinIO)**            | 2 tests           | Yes     | N/A      | N/A           | 40%      |
| **Sync (Calendar/Accounting)** | 4 tests           | Yes     | N/A      | N/A           | 30%      |
| **Tasks**                      | 31 tests          | Yes     | Yes      | Yes           | 85%      |
| **Templates**                  | 24 tests          | Yes     | Yes      | Yes           | 85%      |
| **Time Entries**               | 37 tests          | Yes     | Yes      | Yes           | 90%      |
| **Webhooks**                   | 24 tests          | Yes     | Yes      | N/A           | 70%      |

**Total: 645 integration tests (641 passing)**

---

## Detailed Coverage by Functional Area

### 1. Clients API (95%)

**File:** `tests/integration/clients/crud.test.ts` (21 tests)

| Scenario                     | Tested |
| ---------------------------- | ------ |
| Create individual client     | Yes    |
| Create company client        | Yes    |
| Retrieve client by ID        | Yes    |
| List clients with pagination | Yes    |
| Update client fields         | Yes    |
| Delete (soft) client         | Yes    |
| Filter by status/type        | Yes    |
| Search by name               | Yes    |
| Multi-tenancy isolation      | Yes    |

**Missing:** Bulk operations, export functionality

---

### 2. Matters API (85%)

**File:** `tests/integration/matters/crud.test.ts` (29 tests)

| Scenario                           | Tested |
| ---------------------------------- | ------ |
| Create matter with client          | Yes    |
| CRUD operations                    | Yes    |
| Status transitions                 | Yes    |
| Practice area/billing type filters | Yes    |
| Multi-tenancy isolation            | Yes    |

**Missing:**

- `/api/matters/[id]/timeline` endpoint
- `/api/matters/[id]/search` endpoint
- AI task generation endpoint

---

### 3. Documents API (80%)

**File:** `tests/integration/documents/crud.test.ts` (27 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Document CRUD           | Yes    |
| Matter linkage          | Yes    |
| Version tracking        | Yes    |
| Multi-tenancy isolation | Yes    |

**Missing:**

- `/api/documents/[id]/chunks` endpoint
- `/api/documents/[id]/entities` endpoint
- `/api/documents/[id]/extract` AI endpoint
- `/api/documents/[id]/summarize` AI endpoint

---

### 4. Calendar Events API (85%)

**File:** `tests/integration/calendar/crud.test.ts` (26 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Event CRUD              | Yes    |
| Matter linkage          | Yes    |
| Date range filtering    | Yes    |
| Attendee management     | Yes    |
| Multi-tenancy isolation | Yes    |

**Missing:**

- `/api/calendar/upcoming` endpoint
- External calendar sync testing

---

### 5. Tasks API (85%)

**File:** `tests/integration/tasks/crud.test.ts` (31 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Task CRUD               | Yes    |
| User assignment         | Yes    |
| Status transitions      | Yes    |
| Due date tracking       | Yes    |
| Multi-tenancy isolation | Yes    |

**Missing:**

- `/api/tasks/[id]/complete` endpoint
- Bulk task operations

---

### 6. Time Entries API (90%)

**File:** `tests/integration/time-entries/crud.test.ts` (37 tests)

| Scenario                                       | Tested |
| ---------------------------------------------- | ------ |
| Time entry CRUD                                | Yes    |
| Amount calculation                             | Yes    |
| Status workflow (draft → submitted → approved) | Yes    |
| Matter association                             | Yes    |
| Multi-tenancy isolation                        | Yes    |

**Missing:**

- `/api/time-entries/bulk/submit` endpoint

---

### 7. Emails API (95%)

**File:** `tests/integration/emails/crud.test.ts` (40 tests)

| Scenario                      | Tested |
| ----------------------------- | ------ |
| Inbound/outbound/draft emails | Yes    |
| Email threading               | Yes    |
| Matter linkage                | Yes    |
| AI processing metadata        | Yes    |
| All filtering scenarios       | Yes    |
| Multi-tenancy isolation       | Yes    |

**Missing:**

- `/api/emails/[id]/ai/process` endpoint

---

### 8. Templates API (85%)

**File:** `tests/integration/templates/crud.test.ts` (24 tests)

| Scenario                 | Tested |
| ------------------------ | ------ |
| Document/email templates | Yes    |
| Merge fields             | Yes    |
| Versioning               | Yes    |
| System vs firm templates | Yes    |
| Multi-tenancy isolation  | Yes    |

**Missing:**

- `/api/templates/[id]/generate` endpoint
- `/api/templates/[id]/preview` endpoint
- `/api/templates/propose` AI endpoint

---

### 9. Conflicts API (90%)

**File:** `tests/integration/conflicts/search.test.ts` (16 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Party name search       | Yes    |
| Conflict detection      | Yes    |
| Status workflow         | Yes    |
| Audit trail             | Yes    |
| Multi-tenancy isolation | Yes    |

**Missing:**

- `/api/conflicts/[id]/clear` endpoint API tests
- `/api/conflicts/[id]/waive` endpoint API tests

---

### 10. Leads & Quotes API (90%)

**File:** `tests/integration/intake/leads-quotes.test.ts` (33 tests)

| Scenario                 | Tested |
| ------------------------ | ------ |
| Lead CRUD                | Yes    |
| Quote workflow           | Yes    |
| Lead → Client conversion | Yes    |
| Line item calculations   | Yes    |
| Multi-tenancy isolation  | Yes    |

**Missing:**

- `/api/leads/[id]/convert` endpoint direct testing

---

### 11. Invoices API (90%)

**File:** `tests/integration/invoices/crud.test.ts` (38 tests)

| Scenario                     | Tested |
| ---------------------------- | ------ |
| Invoice CRUD                 | Yes    |
| Generation from time entries | Yes    |
| Line items                   | Yes    |
| VAT calculation              | Yes    |
| Status transitions           | Yes    |
| Multi-tenancy isolation      | Yes    |

**Missing:**

- `/api/invoices/[id]/send` endpoint
- `/api/invoices/[id]/void` endpoint

---

### 12. Payments API (90%)

**File:** `tests/integration/payments/crud.test.ts` (36 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Payment CRUD            | Yes    |
| Invoice association     | Yes    |
| Payment methods         | Yes    |
| Refunds                 | Yes    |
| Multi-tenancy isolation | Yes    |

---

### 13. Approvals API (90%)

**File:** `tests/integration/approvals/crud.test.ts` (41 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Approval CRUD           | Yes    |
| Approve/reject actions  | Yes    |
| Bulk operations         | Yes    |
| Status workflow         | Yes    |
| Multi-tenancy isolation | Yes    |

---

### 14. Notifications API (90%)

**File:** `tests/integration/notifications/crud.test.ts` (38 tests)

| Scenario                   | Tested |
| -------------------------- | ------ |
| Notification CRUD          | Yes    |
| Mark as read               | Yes    |
| Filter by type/read status | Yes    |
| Multi-tenancy isolation    | Yes    |

**Missing:**

- `/api/notifications/preferences` endpoint
- `/api/notifications/read-all` endpoint

---

### 15. Auth/RBAC (85%)

**Files:** `tests/integration/auth/*.test.ts` (42 tests)

| Scenario               | Tested |
| ---------------------- | ------ |
| Session management     | Yes    |
| Role assignment        | Yes    |
| Permission enforcement | Yes    |
| Cross-firm isolation   | Yes    |

**Missing:**

- `/api/users/[id]/role` endpoint testing
- Custom permission sets

---

### 16. AI Features (85%)

**File:** `tests/integration/ai/features.test.ts` (33 tests)

| Scenario          | Tested |
| ----------------- | ------ |
| AI chat endpoint  | Yes    |
| Response handling | Yes    |
| Error handling    | Yes    |

**Missing:**

- `/api/matters/[id]/ai/ask` endpoint
- `/api/matters/[id]/ai/generate-tasks` endpoint
- `/api/matters/[id]/ai/suggest-calendar` endpoint

---

### 17. Semantic Search (90%)

**File:** `tests/integration/search/semantic.test.ts` (32 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Vector embeddings       | Yes    |
| Cosine distance search  | Yes    |
| Document chunk search   | Yes    |
| Matter-scoped search    | Yes    |
| Multi-tenancy isolation | Yes    |

---

### 18. Signature Requests (85%)

**File:** `tests/integration/signatures/requests.test.ts` (30 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Request CRUD            | Yes    |
| Status workflow         | Yes    |
| Document association    | Yes    |
| Multi-tenancy isolation | Yes    |

---

### 19. Firm Settings (95%)

**File:** `tests/integration/firm/settings.test.ts` (49 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| Get/update settings     | Yes    |
| Billing settings        | Yes    |
| Branding settings       | Yes    |
| AI settings             | Yes    |
| Feature flags           | Yes    |
| Nested JSON storage     | Yes    |
| Multi-tenancy isolation | Yes    |

---

### 20. Integration Accounts (90%)

**File:** `tests/integration/integrations/accounts.test.ts` (37 tests)

| Scenario                | Tested |
| ----------------------- | ------ |
| All integration types   | Yes    |
| All providers           | Yes    |
| Status workflow         | Yes    |
| Multi-tenancy isolation | Yes    |

---

### 21. Webhooks (70%)

**Files:** `tests/integration/webhooks/*.test.ts` (24 tests)

| Scenario                | Tested  |
| ----------------------- | ------- |
| Stripe payment webhooks | Yes     |
| GoCardless webhooks     | Partial |
| Email provider webhooks | Partial |
| Handler routing         | Yes     |
| Signature validation    | Yes     |

**Missing:**

- Calendar sync webhooks
- Accounting sync webhooks
- E-signature webhooks

---

### 22. Storage (40%)

**Files:** `tests/integration/storage/*.test.ts` (2 tests)

| Scenario                   | Tested |
| -------------------------- | ------ |
| Upload/download round-trip | Yes    |
| Presigned URLs             | Yes    |

**Missing:**

- `/api/storage/upload` endpoint
- Large file handling
- File deletion
- Multi-tenancy isolation

---

### 23. Queue Processing (30%)

**Files:** `tests/integration/queue/*.test.ts` (2 tests)

| Scenario             | Tested |
| -------------------- | ------ |
| Basic job processing | Yes    |
| Retry logic          | Yes    |

**Missing:**

- Job scheduling
- Priority queues
- Dead letter handling
- Job cancellation

---

### 24. External Sync (30%)

**Files:** `tests/integration/sync/*.test.ts` (4 tests)

| Scenario              | Tested  |
| --------------------- | ------- |
| Google Calendar sync  | Partial |
| Outlook Calendar sync | Partial |
| Xero accounting sync  | Partial |

**Missing:**

- Full sync cycle testing
- Conflict resolution
- Error recovery

---

## API Endpoints Missing Integration Tests

| Endpoint                                | Priority | Notes                      |
| --------------------------------------- | -------- | -------------------------- |
| `/api/matters/[id]/timeline`            | High     | Matter activity timeline   |
| `/api/matters/[id]/ai/ask`              | Medium   | AI Q&A for matters         |
| `/api/matters/[id]/ai/generate-tasks`   | Medium   | AI task generation         |
| `/api/matters/[id]/ai/suggest-calendar` | Medium   | AI calendar suggestions    |
| `/api/calendar/upcoming`                | Medium   | Upcoming events endpoint   |
| `/api/tasks/[id]/complete`              | Medium   | Task completion action     |
| `/api/time-entries/bulk/submit`         | Medium   | Bulk time entry submission |
| `/api/invoices/[id]/send`               | High     | Send invoice action        |
| `/api/invoices/[id]/void`               | High     | Void invoice action        |
| `/api/documents/[id]/chunks`            | Medium   | Document chunking          |
| `/api/documents/[id]/entities`          | Medium   | Entity extraction results  |
| `/api/documents/[id]/extract`           | Low      | AI entity extraction       |
| `/api/documents/[id]/summarize`         | Low      | AI summarization           |
| `/api/templates/[id]/generate`          | High     | Generate from template     |
| `/api/templates/[id]/preview`           | Medium   | Template preview           |
| `/api/templates/propose`                | Low      | AI template proposal       |
| `/api/notifications/preferences`        | Medium   | User preferences           |
| `/api/notifications/read-all`           | Low      | Bulk mark as read          |
| `/api/emails/[id]/ai/process`           | Medium   | AI email processing        |
| `/api/leads/[id]/convert`               | High     | Lead conversion action     |
| `/api/storage/upload`                   | High     | File upload endpoint       |
| `/api/webhooks/calendar/*`              | Medium   | Calendar sync webhooks     |
| `/api/webhooks/accounting/*`            | Medium   | Accounting sync webhooks   |
| `/api/webhooks/esignature/*`            | Medium   | E-signature webhooks       |

---

## Test Execution

```bash
# Run all integration tests
npm run test:integration

# Results: 645 tests, 641 passing (4 auth config issues)
```

### Known Issues

1. **Auth config issues** - 4 tests fail due to Better Auth session configuration
2. **E2E API tests** - Some blocked by auth UUID format

---

## Next Steps for Full Coverage

### High Priority

1. Add tests for `/api/invoices/[id]/send` and `/api/invoices/[id]/void`
2. Add tests for `/api/templates/[id]/generate`
3. Add tests for `/api/leads/[id]/convert`
4. Add tests for `/api/storage/upload`
5. Add tests for `/api/matters/[id]/timeline`

### Medium Priority

1. Add tests for matter AI endpoints (ask, generate-tasks, suggest-calendar)
2. Add tests for `/api/calendar/upcoming`
3. Add tests for task completion and bulk time entry endpoints
4. Expand webhook coverage for calendar/accounting/e-signature
5. Add tests for notification preferences

### Low Priority

1. Document AI endpoints (extract, summarize)
2. AI template proposal
3. Full external sync testing
4. Queue scheduling and dead letter handling
