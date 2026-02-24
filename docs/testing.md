# Testing Guide

## Purpose

This guide describes how testing works in the current repository and how to validate changes safely during the US pivot.

---

## 1. Test Stack

- Vitest: unit and integration tests
- Playwright: end-to-end browser and API workflows
- Testing Library: React component tests

---

## 2. Test Layout

All tests live under `tests/`.

- `tests/unit/`: fast isolated tests with mocks
- `tests/integration/`: API and DB behavior with real database
- `tests/e2e/browser/`: browser journeys
- `tests/e2e/api/`: multi-step API scenario tests
- `tests/fixtures/`: factories and seed data
- `tests/helpers/`: shared utilities for db/auth/assertions/mocks

---

## 3. Commands

### Unit and integration (Vitest)

```bash
npm test
npm run test:unit
npm run test:integration
```

### Playwright

```bash
npm run test:e2e
npm run test:e2e:api
npm run test:e2e:browser
```

### Full regression

```bash
npm run test:all
```

### Data seed helpers

```bash
npm run test:seed
npm run demo:seed
npm run demo:reset
npm run demo:clear
```

---

## 4. Environment Requirements

### Unit tests

- No Docker required
- No database required

### Integration tests

- Docker services required (PostgreSQL, Redis, MinIO)
- Current schema required (`npm run db:push`)

### E2E tests

- Docker services required
- App server required (Playwright config may auto-start)

Recommended setup:

```bash
docker compose up -d
npm run db:push
```

---

## 5. Execution Order

Use this order for fast feedback and stability:

1. `npm run test:unit`
2. `npm run test:integration`
3. `npm run test:e2e:api` and/or `npm run test:e2e:browser`

For risky refactors or release candidates, run `npm run test:all`.

---

## 6. What to Test

For each change, cover at least:

- Happy path
- Validation failures
- Authz/authn boundaries when endpoint/UI is protected
- Error handling and fallback behavior
- Edge conditions (empty input, nulls, boundaries)

Additional coverage for AI/pipeline behavior:

- Confidence-threshold behavior
- Conflict detection and resolution behavior
- Approval-gated action execution
- Audit/provenance persistence

---

## 7. Mocking Guidelines

### Mock external dependencies

- External APIs/providers
- Time-based behavior
- Random/UUID where determinism matters

### Do not over-mock core logic

- Avoid mocking the function under test.
- Prefer testing real domain behavior and state transitions.

### Critical pattern: `withFirmDb`

`withFirmDb` takes a callback. Use `mockImplementation`, not `mockResolvedValue`, for predictable behavior.

Pattern:

```typescript
vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
  return { id: "resource-1", firmId };
});
```

---

## 8. Test Data Strategy

- Prefer factories from `tests/fixtures/factories/` for targeted test setup.
- Use demo seed data for manual QA and exploratory testing only.
- During US migration, replace UK-specific fixture assumptions incrementally and keep tests deterministic.

---

## 9. CI Expectations

Minimum CI gates for production-facing changes:

- Lint and type checks
- Unit tests
- Integration tests
- Required E2E subset for changed user journeys

Do not merge when required suites are red.

---

## 10. Migration Notes (UK to US)

As domain assumptions are localized:

- Update tests that encode UK defaults (locale, VAT, postcode, terminology).
- Prioritize behavior-preserving updates first, then semantic/domain updates.
- Keep backward compatibility where migration windows require it.
