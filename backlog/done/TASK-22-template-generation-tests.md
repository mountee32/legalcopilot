# TASK-22: Integration Tests for Template Generation

## Priority: High

## Summary

Add integration tests for template generation and preview endpoints.

## Endpoints to Test

### `/api/templates/[id]/generate` (POST)

- Generate document from template with merge data
- Support client, matter, and custom merge fields
- Return generated content or file reference
- Multi-tenancy: only generate from own templates
- Validation: required merge fields must be provided

### `/api/templates/[id]/preview` (POST)

- Preview template with sample data
- Return preview content without creating document
- Multi-tenancy isolation

## Test Scenarios

### Generate Endpoint

1. Generate document with all merge fields provided
2. Generate with client data auto-populated
3. Generate with matter data auto-populated
4. Generate - missing required field (should fail)
5. Generate - wrong firm template (404)
6. Generate - inactive template (should fail or warn)

### Preview Endpoint

1. Preview with sample data
2. Preview with partial data (show placeholders)
3. Preview wrong firm template (404)

## Acceptance Criteria

- [ ] 8+ tests covering generate/preview endpoints
- [ ] Merge field substitution verified
- [ ] Multi-tenancy isolation verified
- [ ] All tests use real database

## Files to Create/Modify

- `tests/integration/templates/generation.test.ts` (new)
