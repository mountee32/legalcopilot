# Deliver Backlog Items

You are the **Backlog Delivery Orchestrator**. Your job is to deliver ALL items from `backlog/waiting/` through to `backlog/done/` using the kanban workflow.

## The Kanban Stages

```
waiting/ → design/ → dev/ → qa/ → done/
```

## Testing Philosophy

Every feature delivered MUST include tests that serve as:

1. **Verification** - Prove the feature works as designed
2. **Documentation** - Tests describe expected behavior
3. **Regression Prevention** - Future changes won't break existing functionality

### Test Types Required

| Change Type    | Unit Tests               | API Tests      | E2E Tests     |
| -------------- | ------------------------ | -------------- | ------------- |
| API endpoint   | Required                 | Required       | Optional      |
| Business logic | Required                 | -              | -             |
| UI component   | Required                 | -              | Optional      |
| Full feature   | Required                 | If has API     | Required      |
| Bug fix        | Required (reproduce bug) | If API-related | If UI-related |

## Delivery Loop

For EACH item in `backlog/waiting/`, execute this cycle:

### Step 1: Design Phase

```
/design
```

- Pick the next item from `backlog/waiting/`
- Analyze requirements, explore codebase
- Document the solution design in the backlog item
- **Identify test strategy**: What tests are needed? What should they cover?
- Move to `backlog/dev/` when design is complete

### Step 2: Development Phase

```
/dev
```

- Implement the designed solution
- **Write unit tests** in `__tests__/` mirroring source structure
- **Write API tests** for any new/modified endpoints
- Run `bun test` to verify unit tests pass
- Move to `backlog/qa/` when all tests pass

### Step 3: QA Phase

```
/qa
```

- Run full regression suite: `bun test && bun test:e2e`
- Review the implementation AND the tests
- Verify test coverage is adequate
- If PASS: Move to `backlog/done/`
- If FAIL: Item returns to `backlog/dev/` - run `/dev` again to fix

### Step 4: Free Context

After each item reaches `done/`:

```
/compact
```

This clears context so you can continue with the next item.

### Step 5: Repeat

Check `backlog/waiting/` for remaining items. If any exist, go back to Step 1.

## Testing Standards

### Unit Tests (Vitest)

```
__tests__/
├── app/api/          # API route tests
├── lib/              # Library/utility tests
└── components/       # Component tests
```

**Pattern**: Mirror source file structure

- `app/api/matters/route.ts` → `__tests__/app/api/matters/route.test.ts`
- `lib/services/matter.ts` → `__tests__/lib/services/matter.test.ts`

**Commands**:

- `bun test` - Run all unit tests
- `bun test:coverage` - Run with coverage report
- `bun test path/to/file` - Run specific test file

### API Tests (Vitest with mocks)

Test each endpoint for:

- Happy path (valid input → expected output)
- Validation errors (invalid input → 400)
- Auth errors (no/bad auth → 401/403)
- Not found (missing resource → 404)
- Server errors (DB failure → 500)

### E2E Tests (Playwright)

```
e2e/
├── home.spec.ts
├── demo.spec.ts
└── [feature].spec.ts
```

**Commands**:

- `bun test:e2e` - Run all e2e tests
- `bun test:e2e:headed` - Run with browser visible
- `bun test:e2e:debug` - Debug mode

## Rules

1. **One item at a time** - Complete the full cycle before starting the next
2. **No skipping stages** - Every item must go through design → dev → qa → done
3. **Tests are mandatory** - No feature ships without tests
4. **Compact between items** - Always run `/compact` after an item reaches done
5. **QA is the gatekeeper** - Only QA can move items to done
6. **Fix failures immediately** - If QA fails, loop back to dev until it passes
7. **Regression must pass** - Full test suite must pass before QA approval

## Starting the Loop

Begin by checking what's in `backlog/waiting/`:

```bash
ls -la backlog/waiting/
```

Run baseline regression to ensure clean start:

```bash
bun test && bun test:e2e
```

Then start with `/design` for the first item.

## Completion

You're done when:

1. `backlog/waiting/` is empty
2. All items are in `backlog/done/`
3. Full regression suite passes: `bun test && bun test:e2e`
