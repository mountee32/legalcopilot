# Generate API Test Plan from Ideas.md

You are a test plan generator. Your task is to read the product specification in `docs/ideas.md` and generate a comprehensive API test plan.

## Instructions

1. **Read the source file**: `docs/ideas.md`
2. **Focus on MVP epics first** (Phase 1): Epics 0, 1, 2, 3, 4, 5, 6, 10, 20
3. **For each epic**, extract user stories and convert them to test cases
4. **Output the test plan** to `tests/api-test-plan.md`

## Test Case Format

For each test case, include:

- **Epic**: Which epic this tests
- **Story**: The user story being tested
- **Test Name**: Short descriptive name
- **Endpoint**: API path
- **Method**: HTTP method (GET, POST, PATCH, DELETE)
- **Payload**: JSON body (if applicable)
- **Expected Status**: HTTP status code
- **Validation**: What to check in the response

## Dependencies

Handle test dependencies in order:

1. Authentication (create user, get session)
2. Client creation (before matters)
3. Matter creation (before documents, time entries, invoices)
4. Time entry submission and approval (before invoice generation)

## API Endpoints Reference

Based on the codebase, these endpoints are available:

### Authentication

- `POST /api/auth/sign-up/email` - Create user
- `POST /api/auth/sign-in/email` - Login

### Intake (Epic 0)

- `POST /api/leads` - Create lead
- `GET /api/leads` - List leads
- `POST /api/quotes` - Create quote
- `POST /api/clients` - Create client
- `GET /api/clients` - List clients
- `PATCH /api/clients/{id}` - Update client

### Cases (Epic 1)

- `POST /api/matters` - Create matter
- `GET /api/matters` - List matters
- `GET /api/matters/{id}` - Get matter details
- `PATCH /api/matters/{id}` - Update matter

### Timeline (Epic 2)

- `GET /api/matters/{id}/timeline` - Get matter timeline

### Documents (Epic 4)

- `POST /api/documents` - Create document record
- `GET /api/documents` - List documents
- `GET /api/documents/{id}` - Get document

### Communications (Epic 5)

- `POST /api/emails` - Create email
- `GET /api/emails` - List emails

### Billing (Epic 7)

- `POST /api/time-entries` - Create time entry
- `GET /api/time-entries` - List time entries
- `POST /api/time-entries/{id}/submit` - Submit for approval
- `POST /api/approvals/{id}/approve` - Approve time entry
- `POST /api/invoices/generate` - Generate invoice
- `GET /api/invoices` - List invoices

### Tasks (Epic 12)

- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks
- `PATCH /api/tasks/{id}` - Update task
- `POST /api/tasks/{id}/complete` - Complete task

### Calendar (Epic 13)

- `POST /api/calendar` - Create event
- `GET /api/calendar` - List events

### Health (Epic 10)

- `GET /api/health` - Server health check

## Output Structure

Generate the test plan with this structure:

```markdown
# API Test Plan

Generated from docs/ideas.md on {date}

## Prerequisites

- Server running on localhost:3001
- Clean test database

## Test Execution Order

1. Authentication
2. Epic 0 - Intake
3. Epic 1 - Cases
4. ...

## Tests

### Authentication

| Test    | Endpoint                | Method | Payload | Expected |
| ------- | ----------------------- | ------ | ------- | -------- |
| Sign up | /api/auth/sign-up/email | POST   | {...}   | 200      |

### Epic 0 - Intake & CRM

| Test        | Endpoint   | Method | Payload | Expected |
| ----------- | ---------- | ------ | ------- | -------- |
| Create lead | /api/leads | POST   | {...}   | 201      |

...
```

## Now Execute

1. Read `docs/ideas.md`
2. Extract testable scenarios from each MVP epic
3. Generate the test plan
4. Write it to `tests/api-test-plan.md`
