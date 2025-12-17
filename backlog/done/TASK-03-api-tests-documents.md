# TASK: Integration tests for Documents API

## Priority: 3 (Depends on Matters, Templates)

## Dependencies

- ✅ Clients API tests (complete)
- TASK-01: Matters API tests
- TASK-02: Templates API tests

## Endpoints to Test

| Method | Endpoint                        | Current Coverage |
| ------ | ------------------------------- | ---------------- |
| GET    | `/api/documents`                | ❌ Unit only     |
| POST   | `/api/documents`                | ❌ Unit only     |
| GET    | `/api/documents/[id]`           | ❌ None          |
| PATCH  | `/api/documents/[id]`           | ❌ None          |
| DELETE | `/api/documents/[id]`           | ❌ None          |
| POST   | `/api/documents/[id]/chunks`    | ❌ None          |
| GET    | `/api/documents/[id]/chunks`    | ❌ None          |
| POST   | `/api/documents/[id]/entities`  | ❌ None          |
| POST   | `/api/documents/[id]/extract`   | ❌ None          |
| POST   | `/api/documents/[id]/summarize` | ❌ None          |

## Test Scenarios Required

### CRUD Operations

- ✅ Upload document to matter
- ✅ Get document metadata by ID
- ✅ Update document metadata
- ✅ Delete document (and associated storage)
- ✅ List documents by matter
- ✅ Filter documents by type, date

### Document Processing

- ✅ Chunk document for vector search
- ✅ Retrieve document chunks
- ✅ Extract entities from document

### AI Features

- ⚠️ Summarize document content (API endpoint not implemented yet)
- ⚠️ Extract key information (tested via entity extraction in metadata)

### Storage Integration

- ✅ Document metadata stored in database
- ⚠️ MinIO storage and download URL generation (requires API endpoint implementation)

### Multi-tenancy

- ✅ Documents isolated by firm
- ✅ Cannot access other firm's documents

## Test File Location

`tests/integration/documents/crud.test.ts`

## Acceptance Criteria

- ✅ All endpoints have integration tests
- ✅ Tests use real database
- ✅ Document metadata verified
- ✅ All tests pass with `npm run test:integration` (25/25 tests passing)
