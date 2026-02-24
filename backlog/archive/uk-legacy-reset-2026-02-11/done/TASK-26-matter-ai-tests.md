# TASK-26: Integration Tests for Matter AI Endpoints

## Priority: Medium

## Summary

Add integration tests for AI-powered matter endpoints.

## Endpoints to Test

### `/api/matters/[id]/ai/ask` (POST)

- Ask questions about matter context
- Use matter documents/emails for context
- Return AI-generated response
- Multi-tenancy isolation

### `/api/matters/[id]/ai/generate-tasks` (POST)

- Generate suggested tasks based on matter type/stage
- Return task list (not yet created)
- Support accepting/rejecting suggestions
- Multi-tenancy isolation

### `/api/matters/[id]/ai/suggest-calendar` (POST)

- Suggest calendar events based on matter deadlines
- Consider matter type (e.g., court deadlines)
- Return suggested events
- Multi-tenancy isolation

## Test Scenarios

1. Ask question - success (mocked AI response)
2. Ask question - wrong firm matter (404)
3. Generate tasks - success
4. Generate tasks - verify task structure
5. Suggest calendar - success
6. Suggest calendar - verify event structure
7. All endpoints - handle AI errors gracefully

## Acceptance Criteria

- [ ] 7+ tests covering AI endpoints
- [ ] AI calls mocked for deterministic tests
- [ ] Response structure validated
- [ ] Multi-tenancy isolation verified
- [ ] Error handling tested

## Files to Create/Modify

- `tests/integration/matters/ai.test.ts` (new)

## Notes

- Mock OpenRouter/AI calls to avoid real API costs
- Focus on endpoint behavior, not AI quality
