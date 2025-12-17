# Edge Case & Boundary Tests

## Priority: Low

## Effort: Medium

## Summary

Add tests for edge cases, boundary conditions, and unusual inputs that may cause unexpected behavior.

## Tests Needed

### Large Payloads

- [ ] Create 100+ tasks in single approval request
- [ ] Upload document at max size limit (e.g., 50MB)
- [ ] List endpoint with 10,000+ records paginates correctly
- [ ] Bulk import of 1000 clients succeeds
- [ ] Very long text fields (notes, descriptions) at max length

### Unicode & Special Characters

- [ ] Client names with accents (José, Müller, 中文)
- [ ] Email addresses with international domains
- [ ] Document titles with emojis
- [ ] Search queries with special regex characters
- [ ] SQL injection attempts in all text fields

### Date & Time Edge Cases

- [ ] Calendar events spanning midnight
- [ ] Calendar events spanning daylight saving transition
- [ ] Due dates on leap day (Feb 29)
- [ ] Time entries for exactly 24 hours
- [ ] Date filters at year boundaries (Dec 31 to Jan 1)

### Numeric Edge Cases

- [ ] Invoice with £0.00 amount
- [ ] Time entry with 0 minutes
- [ ] Hourly rate with many decimal places
- [ ] Negative amounts rejected
- [ ] Currency conversion edge cases

### Empty & Null States

- [ ] Firm with no clients, matters, or users
- [ ] Matter with no documents, tasks, or time entries
- [ ] Client with null optional fields
- [ ] Search with no results
- [ ] Pagination page beyond total pages

### State Transitions

- [ ] Matter status transitions (lead → active → closed → archived)
- [ ] Invoice status transitions (draft → sent → paid → void)
- [ ] Invalid state transitions rejected
- [ ] Re-opening closed matter

## Files to Create

- `tests/unit/edge-cases/large-payloads.test.ts`
- `tests/unit/edge-cases/unicode.test.ts`
- `tests/unit/edge-cases/dates.test.ts`
- `tests/unit/edge-cases/numeric.test.ts`
- `tests/unit/edge-cases/empty-states.test.ts`

## Acceptance Criteria

- All boundary conditions tested
- No crashes on unusual input
- Appropriate error messages for invalid input
