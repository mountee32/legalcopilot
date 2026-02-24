# Edge Case & Boundary Tests

## Priority: Low

## Effort: Low

## Summary

Add focused tests for highest-risk edge cases. Keep scope small to avoid slow/flaky tests.

## Design

- Keep these as fast unit tests (no DB, no network) targeting:
  - pure functions (`lib/billing/money.ts`)
  - Zod validation boundaries where applicable
  - string handling safety (unicode, injection-like inputs) in helpers that build queries/prompts
- Avoid “security theater” (we’re not proving XSS protection here); instead ensure we don’t crash, throw unexpected errors, or generate invalid SQL/payloads.

## Tests Needed (Scoped to High-Risk)

### Unicode & Security (Highest Risk)

- [x] Client names with accents (José, Müller, 中文)
- [x] SQL injection attempts in text fields (name, notes, search) (validation-level)
- [x] XSS attempts in text fields that render in UI (validation-level)

### Numeric Boundaries (Money Handling)

- [x] Invoice with £0.00 amount (format/parse)
- [ ] Negative amounts rejected (domain rule; not implemented at money helper)
- [x] Money precision preserved (no floating point errors)

### Empty & Null States

- [x] Search with no results returns empty array (schema allows empty list)
- [x] Client with all optional fields null (response schema)
- [ ] Pagination page beyond total returns empty (endpoint-level behavior, covered elsewhere)

### State Transitions

- [ ] Invalid matter status transitions rejected (not implemented)
- [ ] Invalid invoice status transitions rejected (not implemented)

## Files Created

- `tests/unit/edge-cases/security.test.ts`
- `tests/unit/edge-cases/money.test.ts`
- `tests/unit/edge-cases/empty-states.test.ts`

## Acceptance Criteria

- [x] No crashes on unusual input
- [x] Security-sensitive boundaries covered
- [x] Tests run fast (< 5 seconds total)
