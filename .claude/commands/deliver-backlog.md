# Deliver Backlog Items

You are the **Backlog Delivery Orchestrator**. Your job is to deliver ALL items from `backlog/waiting/` through to `backlog/done/` using the kanban workflow.

## The Kanban Stages

```
waiting/ → design/ → dev/ → qa/ → done/
```

---

## Lessons Learned (Apply These!)

### 1. Check for Existing Code First

Before implementing, ALWAYS search for existing implementations:

```bash
# Check if endpoint already exists
ls app/api/[feature]/
grep -r "functionName" lib/
```

Many features may already be partially or fully implemented.

### 2. Mock Pattern for `withFirmDb`

**CRITICAL**: The `withFirmDb` function takes a callback. Standard mock patterns fail silently.

❌ **WRONG** (doesn't work):

```typescript
vi.mocked(withFirmDb).mockResolvedValueOnce(result);
vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("..."));
```

✅ **CORRECT** (use mockImplementation):

```typescript
// For success cases:
vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
  return { id: "1", status: "success" };
});

// For error cases:
vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
  throw new NotFoundError("Resource not found");
});
```

See `tests/helpers/mocks.ts` for reusable mock utilities.

### 3. Schema Exports Checklist

When creating new schemas in `lib/api/schemas/`:

- [ ] Create the schema file with `.openapi()` annotations
- [ ] Add export to `lib/api/schemas/index.ts`
- [ ] Verify with: `grep "export \* from" lib/api/schemas/index.ts`

### 4. Auth Middleware in Unit Tests

Authenticated endpoints return 401 if auth middleware isn't mocked:

```typescript
// Mock the auth context in your test
const mockUser = {
  user: { id: "user-123", email: "test@example.com" },
  session: { id: "session-123" },
};
```

### 5. Frontend Items Have API Dependencies

Before starting frontend features, verify required APIs exist:

```bash
# Check API routes for a feature
ls app/api/[feature]/
grep -l "[feature]" lib/api/schemas/*.ts
```

---

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

- optionally if likely impacted Run full regression suite: `bun test && bun test:e2e`
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

1. **No skipping stages** - Every item must go through design → dev → qa → done
2. **Tests are mandatory** - No feature ships without tests
3. **Compact between items** - Always run `/compact` after an item reaches done
4. **QA is the gatekeeper** - Only QA can move items to done
5. **Fix failures immediately** - If QA fails, loop back to dev until it passes
6. **Regression must pass** - Full test suite must pass before QA approval
7. **Move backlog files** - Agent MUST move file to next stage folder when complete

---

## Parallel Execution (Recommended for Speed)

When multiple items are independent, use parallel Task agents:

### Batch by Type

Group similar items for parallel processing:

- **API endpoints**: Can run in parallel if they don't share schemas
- **Frontend pages**: Can run in parallel if they don't share components
- **Bug fixes**: Usually independent, safe to parallelize

### Parallel Design Phase

```
Launch Task agents in parallel for design:
- Agent 1: Design FEAT-frontend-inbox
- Agent 2: Design FEAT-frontend-calendar
- Agent 3: Design FEAT-frontend-tasks
```

### Parallel Dev Phase

After designs complete, launch dev agents in parallel:

```
- Agent 1: Implement FEAT-frontend-inbox
- Agent 2: Implement FEAT-frontend-calendar
- Agent 3: Implement FEAT-frontend-tasks
```

### Monitor and Collect

- Use `TaskOutput` to check agent completion
- Run QA tests once ALL parallel agents complete
- Move all completed items to done/ together

### Dependency Order

Process in this order to avoid blockers:

1. **Schemas first** - `lib/api/schemas/*.ts`
2. **API routes second** - `app/api/**`
3. **Frontend last** - `app/(app)/**`, `components/**`

---

## Context Management (Prevent Crashes)

Subagent transcripts include ALL tool calls and can quickly fill context, causing compaction failures.

### 1. Instruct Agents to Return Concise Results

Always include this in agent prompts:

```
IMPORTANT: Your final output must be a BRIEF summary (max 20 lines):
- Files created/modified (paths only)
- Tests: X passed, Y failed
- Backlog file moved to: [path]
- Any blocking issues

Do NOT include: file contents, full test output, or tool call details.
```

### 2. Use Non-Blocking TaskOutput Checks

Poll agents without blocking to avoid timeout accumulation:

```typescript
// Check status without waiting
TaskOutput({ task_id: "xxx", block: false });
```

### 3. Batch Size Limits

- **Maximum 5-6 agents per parallel batch**
- Run `/compact` after EACH batch completes
- Don't start next batch until compaction succeeds

### 4. Compact Aggressively

```
After completing a batch:
1. Verify all agents done
2. Run /compact immediately
3. Confirm context reduced before next batch
```

### 5. If Context Gets Too Large

Signs of trouble:

- Responses getting slow
- Partial outputs
- Tool calls failing

Recovery:

1. Stop launching new agents
2. Wait for running agents to complete
3. Record their final status manually (files changed, tests passed)
4. Run /compact
5. Resume with fresh context

### 6. Supervisor Summary Pattern

When checking TaskOutput, immediately summarize and discard:

```
Agent X completed:
- Created: app/api/foo/route.ts, tests/unit/app/api/foo/route.test.ts
- Tests: 5 passed
- Moved: backlog/dev/TASK-foo.md → backlog/done/

[Don't retain the full transcript - just this summary]
```

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
