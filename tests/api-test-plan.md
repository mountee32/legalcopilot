# API Test Plan

Generated from docs/ideas.md on 2025-12-17

## Prerequisites

- Server running on localhost:3001 (`npm run dev`)
- Clean test database or isolated test user

## Test Execution Order

Tests must run in this order due to dependencies:

1. Health Check
2. Authentication (creates test user)
3. Epic 0 - Intake (creates lead, client)
4. Epic 1 - Cases (creates matter, needs client)
5. Epic 2 - Timeline (needs matter)
6. Epic 3 - Parties (uses client)
7. Epic 4 - Documents (needs matter)
8. Epic 5 - Communications (needs matter)
9. Epic 7 - Billing (needs matter, full workflow)
10. Epic 12 - Tasks (needs matter)
11. Epic 13 - Calendar (needs matter)

## Dependency Variables

Track these IDs during test execution:

- `$CLIENT_ID` - from POST /api/clients
- `$MATTER_ID` - from POST /api/matters
- `$TIME_ENTRY_ID` - from POST /api/time-entries
- `$APPROVAL_ID` - from POST /api/time-entries/{id}/submit
- `$INVOICE_ID` - from POST /api/invoices/generate
- `$TASK_ID` - from POST /api/tasks
- `$LEAD_ID` - from POST /api/leads

---

## Tests

### Health Check

| Test          | Endpoint    | Method | Payload | Expected | Story              |
| ------------- | ----------- | ------ | ------- | -------- | ------------------ |
| Server health | /api/health | GET    | -       | 200      | System operational |

### Authentication

| Test    | Endpoint                | Method | Payload                                                                                | Expected | Story            |
| ------- | ----------------------- | ------ | -------------------------------------------------------------------------------------- | -------- | ---------------- |
| Sign up | /api/auth/sign-up/email | POST   | `{"email":"test-{timestamp}@example.com","password":"testpass123","name":"Test User"}` | 200      | Create test user |

---

### Epic 0 - AI-Powered Client Intake & CRM

**Goal**: AI qualifies leads, checks conflicts, generates quotes, and onboards clients

| Test                       | Endpoint                  | Method | Payload                                                                                                                                                                         | Expected | Story                   |
| -------------------------- | ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- |
| Create lead                | /api/leads                | POST   | `{"firstName":"Jane","lastName":"Smith","email":"jane@example.com","phone":"07700900123","source":"website","enquiryType":"conveyancing","message":"Need help buying a house"}` | 201      | AI captures enquiries   |
| List leads                 | /api/leads                | GET    | -                                                                                                                                                                               | 200      | View pipeline           |
| Get lead                   | /api/leads/{$LEAD_ID}     | GET    | -                                                                                                                                                                               | 200      | View lead details       |
| Create client (individual) | /api/clients              | POST   | `{"type":"individual","firstName":"John","lastName":"Doe","email":"john.doe@example.com","phone":"07700900456","source":"lead_conversion"}`                                     | 201      | Convert lead to client  |
| Create client (company)    | /api/clients              | POST   | `{"type":"company","companyName":"Acme Ltd","email":"legal@acme.com","phone":"02012345678","source":"referral"}`                                                                | 201      | Corporate client intake |
| List clients               | /api/clients              | GET    | -                                                                                                                                                                               | 200      | View all clients        |
| Get client                 | /api/clients/{$CLIENT_ID} | GET    | -                                                                                                                                                                               | 200      | View client details     |
| Update client              | /api/clients/{$CLIENT_ID} | PATCH  | `{"phone":"07700900789"}`                                                                                                                                                       | 200      | Update client info      |

---

### Epic 1 - Intelligent Case Command Centre

**Goal**: AI manages the case lifecycle; humans make decisions

| Test                 | Endpoint                  | Method | Payload                                                                                                                                               | Expected | Story                       |
| -------------------- | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------- |
| Create matter        | /api/matters              | POST   | `{"clientId":"$CLIENT_ID","title":"Property Purchase - 123 High Street","practiceArea":"conveyancing","description":"Residential freehold purchase"}` | 201      | AI creates case from intake |
| List matters         | /api/matters              | GET    | -                                                                                                                                                     | 200      | View all cases              |
| Get matter           | /api/matters/{$MATTER_ID} | GET    | -                                                                                                                                                     | 200      | View case dashboard         |
| Update matter status | /api/matters/{$MATTER_ID} | PATCH  | `{"status":"active"}`                                                                                                                                 | 200      | Progress case lifecycle     |
| Update matter risk   | /api/matters/{$MATTER_ID} | PATCH  | `{"riskScore":25,"riskFactors":[{"factor":"First-time buyer","weight":10}]}`                                                                          | 200      | AI calculates risk score    |

---

### Epic 2 - AI-Curated Case Timeline

**Goal**: AI builds and maintains the timeline automatically

| Test         | Endpoint                           | Method | Payload | Expected | Story                 |
| ------------ | ---------------------------------- | ------ | ------- | -------- | --------------------- |
| Get timeline | /api/matters/{$MATTER_ID}/timeline | GET    | -       | 200      | AI-generated timeline |

---

### Epic 3 - AI Party Intelligence

**Goal**: AI manages parties, relationships, and contact intelligence

| Test                  | Endpoint                  | Method | Payload                                           | Expected | Story              |
| --------------------- | ------------------------- | ------ | ------------------------------------------------- | -------- | ------------------ |
| Get client details    | /api/clients/{$CLIENT_ID} | GET    | -                                                 | 200      | Party intelligence |
| Update client address | /api/clients/{$CLIENT_ID} | PATCH  | `{"address":"123 Main Street, London, SW1A 1AA"}` | 200      | Enrich party data  |

---

### Epic 4 - Deep Document Intelligence

**Goal**: AI reads, understands, and manages all documents

| Test                   | Endpoint                      | Method | Payload                                                                                                       | Expected | Story               |
| ---------------------- | ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| Create document record | /api/documents                | POST   | `{"matterId":"$MATTER_ID","name":"Contract of Sale.pdf","type":"contract","storageKey":"documents/test.pdf"}` | 201      | Document upload     |
| List documents         | /api/documents                | GET    | `?matterId=$MATTER_ID`                                                                                        | 200      | View case documents |
| Get document           | /api/documents/{$DOCUMENT_ID} | GET    | -                                                                                                             | 200      | Document details    |

---

### Epic 5 - Autonomous Communications Copilot

**Goal**: AI handles 80% of routine correspondence

| Test                | Endpoint    | Method | Payload                                                                                                                                                                                         | Expected | Story                    |
| ------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------ |
| Create email record | /api/emails | POST   | `{"matterId":"$MATTER_ID","direction":"inbound","from":"client@example.com","to":"solicitor@firm.com","subject":"Question about completion date","body":"When do you expect we can complete?"}` | 201      | AI monitors emails       |
| List emails         | /api/emails | GET    | `?matterId=$MATTER_ID`                                                                                                                                                                          | 200      | View case correspondence |

---

### Epic 7 - AI-Assisted Billing (Full Workflow)

**Goal**: AI captures time, generates invoices, and optimises revenue

| Test                | Endpoint                                  | Method | Payload                                                                                                                                                                                       | Expected | Story                  |
| ------------------- | ----------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| Create time entry   | /api/time-entries                         | POST   | `{"matterId":"$MATTER_ID","description":"Initial consultation and file review","durationMinutes":60,"hourlyRate":"250.00","workDate":"2025-12-17","source":"ai_suggested","isBillable":true}` | 201      | AI suggests time entry |
| List time entries   | /api/time-entries                         | GET    | `?matterId=$MATTER_ID`                                                                                                                                                                        | 200      | View unbilled time     |
| Submit for approval | /api/time-entries/{$TIME_ENTRY_ID}/submit | POST   | -                                                                                                                                                                                             | 201      | Submit time for review |
| Approve time entry  | /api/approvals/{$APPROVAL_ID}/approve     | POST   | `{"decisionReason":"Approved for billing"}`                                                                                                                                                   | 200      | Approve time entry     |
| Generate invoice    | /api/invoices/generate                    | POST   | `{"matterId":"$MATTER_ID","clientId":"$CLIENT_ID","timeEntryIds":["$TIME_ENTRY_ID"],"vatRate":"20.00"}`                                                                                       | 201      | AI generates invoice   |
| List invoices       | /api/invoices                             | GET    | -                                                                                                                                                                                             | 200      | View all invoices      |
| Get invoice         | /api/invoices/{$INVOICE_ID}               | GET    | -                                                                                                                                                                                             | 200      | Invoice details        |

---

### Epic 12 - AI Task Orchestration

**Goal**: AI manages tasks; humans execute high-value work

| Test          | Endpoint                       | Method | Payload                                                                                                                                                       | Expected | Story                 |
| ------------- | ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- |
| Create task   | /api/tasks                     | POST   | `{"matterId":"$MATTER_ID","title":"Review contract","description":"Review contract of sale and identify key terms","dueDate":"2025-12-24","priority":"high"}` | 201      | AI generates task     |
| List tasks    | /api/tasks                     | GET    | `?matterId=$MATTER_ID`                                                                                                                                        | 200      | View task list        |
| Update task   | /api/tasks/{$TASK_ID}          | PATCH  | `{"status":"in_progress"}`                                                                                                                                    | 200      | Start working on task |
| Complete task | /api/tasks/{$TASK_ID}/complete | POST   | -                                                                                                                                                             | 200      | Mark task done        |

---

### Epic 13 - AI Calendar Intelligence

**Goal**: AI manages time; humans show up prepared

| Test                  | Endpoint               | Method | Payload                                                                                                                                   | Expected | Story              |
| --------------------- | ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| Create calendar event | /api/calendar          | POST   | `{"matterId":"$MATTER_ID","title":"Client meeting","type":"meeting","startTime":"2025-12-20T10:00:00Z","endTime":"2025-12-20T11:00:00Z"}` | 201      | Schedule meeting   |
| List events           | /api/calendar          | GET    | -                                                                                                                                         | 200      | View calendar      |
| Get upcoming          | /api/calendar/upcoming | GET    | -                                                                                                                                         | 200      | Upcoming deadlines |

---

## Error Case Tests

| Test                   | Endpoint                                          | Method | Payload                 | Expected | Story                  |
| ---------------------- | ------------------------------------------------- | ------ | ----------------------- | -------- | ---------------------- |
| Missing auth           | /api/clients                                      | GET    | (no cookie)             | 401      | Security: require auth |
| Invalid client ID      | /api/clients/invalid-uuid                         | GET    | -                       | 404      | Handle not found       |
| Invalid matter ID      | /api/matters/00000000-0000-0000-0000-000000000000 | GET    | -                       | 404      | Handle not found       |
| Missing required field | /api/clients                                      | POST   | `{"type":"individual"}` | 400      | Validation error       |
| Invalid payload        | /api/matters                                      | POST   | `{"invalid":"data"}`    | 400      | Validation error       |

---

## Summary

| Epic          | Tests  | Focus                    |
| ------------- | ------ | ------------------------ |
| Health        | 1      | Server operational       |
| Auth          | 1      | User creation            |
| 0 - Intake    | 8      | Lead & client management |
| 1 - Cases     | 5      | Matter lifecycle         |
| 2 - Timeline  | 1      | Case timeline            |
| 3 - Parties   | 2      | Party intelligence       |
| 4 - Documents | 3      | Document management      |
| 5 - Comms     | 2      | Email handling           |
| 7 - Billing   | 7      | Full billing workflow    |
| 12 - Tasks    | 4      | Task orchestration       |
| 13 - Calendar | 3      | Calendar management      |
| Errors        | 5      | Error handling           |
| **Total**     | **42** |                          |
