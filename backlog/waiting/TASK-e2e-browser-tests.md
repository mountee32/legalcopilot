# E2E Browser Tests

## Priority: Medium

## Effort: High

## Summary

Add end-to-end browser tests using Playwright to verify real user workflows through the UI.

## Tests Needed

### Authentication Flows

- [ ] Login with email/password
- [ ] Login with magic link
- [ ] Logout clears session
- [ ] Session timeout redirects to login
- [ ] Password reset flow

### Dashboard

- [ ] Dashboard loads with correct data
- [ ] Widgets display accurate counts
- [ ] Quick actions navigate correctly
- [ ] Notifications panel shows recent items

### Client Management

- [ ] Create new individual client
- [ ] Create new company client
- [ ] Edit client details
- [ ] Search and filter clients
- [ ] View client's matters

### Matter Management

- [ ] Create matter for existing client
- [ ] Edit matter details
- [ ] Change matter status
- [ ] Add tasks to matter
- [ ] View matter timeline

### Time & Billing

- [ ] Record time entry
- [ ] Submit time for approval
- [ ] Generate invoice from time entries
- [ ] Mark invoice as sent
- [ ] Record payment

### Document Management

- [ ] Upload document to matter
- [ ] Download document
- [ ] Request e-signature
- [ ] View document versions

### Calendar

- [ ] View calendar events
- [ ] Create new event
- [ ] Edit existing event
- [ ] Delete event

### Approval Workflow

- [ ] View pending approvals
- [ ] Approve request
- [ ] Reject request with reason
- [ ] View approval history

## Files to Create

- `tests/e2e/browser/auth.spec.ts`
- `tests/e2e/browser/dashboard.spec.ts`
- `tests/e2e/browser/clients.spec.ts`
- `tests/e2e/browser/matters.spec.ts`
- `tests/e2e/browser/billing.spec.ts`
- `tests/e2e/browser/documents.spec.ts`
- `tests/e2e/browser/calendar.spec.ts`
- `tests/e2e/browser/approvals.spec.ts`

## Test Infrastructure

- Seed database with test data before each suite
- Use Playwright's built-in fixtures
- Run against local dev server
- Screenshot on failure for debugging

## Acceptance Criteria

- Critical user journeys have E2E coverage
- Tests run in CI pipeline
- Flaky tests identified and stabilized
