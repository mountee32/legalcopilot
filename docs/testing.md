# Testing Guidelines

Legal Copilot uses a comprehensive testing strategy to ensure code quality and prevent regressions.

## Test Stack

| Tool            | Purpose                  | Location                |
| --------------- | ------------------------ | ----------------------- |
| Vitest          | Unit & integration tests | `__tests__/`            |
| Playwright      | E2E browser tests        | `e2e/`                  |
| Testing Library | React component testing  | `__tests__/components/` |

## Running Tests

```bash
# Unit tests
npm test                    # Run all (non-watch)
npm run test:ui             # Interactive UI
npm run test:coverage       # With coverage report
npm test -- path/to/file    # Specific file

# E2E tests
npm run test:e2e            # Run all (headless)
npm run test:e2e:headed     # With browser visible
npm run test:e2e:debug      # Debug mode
npm run test:e2e:ui         # Interactive UI
```

## Directory Structure

```
__tests__/
├── app/
│   └── api/               # API route tests
│       └── demo/
│           └── users/
│               └── route.test.ts
├── lib/
│   ├── db/
│   │   └── schema.test.ts
│   └── utils.test.ts
└── components/            # Component tests

e2e/
├── home.spec.ts
└── demo.spec.ts
```

**Rule**: Mirror the source file structure exactly.

## Writing Unit Tests

### API Route Tests

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
  },
}));

describe("Matters API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/matters", () => {
    it("should return list of matters", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.where).mockResolvedValue([{ id: "1", title: "Test" }]);

      const { GET } = await import("@/app/api/matters/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.matters).toHaveLength(1);
    });

    it("should handle database errors", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.where).mockRejectedValue(new Error("DB error"));

      const { GET } = await import("@/app/api/matters/route");
      const response = await GET();

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/matters", () => {
    it("should create matter with valid data", async () => {
      // ... test implementation
    });

    it("should return 400 for invalid data", async () => {
      const { POST } = await import("@/app/api/matters/route");

      const request = new NextRequest("http://localhost/api/matters", {
        method: "POST",
        body: JSON.stringify({}), // Missing required fields
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
```

### Business Logic Tests

```typescript
import { describe, it, expect } from "vitest";
import { calculateFee, validateMatterRef } from "@/lib/services/matter";

describe("Matter Service", () => {
  describe("calculateFee", () => {
    it("should calculate hourly rate correctly", () => {
      const result = calculateFee({ hours: 2, rate: 250 });
      expect(result).toBe(500);
    });

    it("should apply VAT when specified", () => {
      const result = calculateFee({ hours: 2, rate: 250, includeVAT: true });
      expect(result).toBe(600); // 500 + 20% VAT
    });
  });

  describe("validateMatterRef", () => {
    it("should accept valid format", () => {
      expect(validateMatterRef("ABC-2024-001")).toBe(true);
    });

    it("should reject invalid format", () => {
      expect(validateMatterRef("invalid")).toBe(false);
    });
  });
});
```

### Component Tests

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatterCard } from "@/components/MatterCard";

describe("MatterCard", () => {
  const mockMatter = {
    id: "1",
    title: "Smith v Jones",
    client: "John Smith",
    status: "active",
  };

  it("should render matter details", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText("Smith v Jones")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<MatterCard matter={mockMatter} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("article"));
    expect(handleClick).toHaveBeenCalledWith("1");
  });
});
```

## Writing E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test.describe("Matters Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");
  });

  test("should display matters list", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Matters/i });
    await expect(heading).toBeVisible();
  });

  test("should create new matter", async ({ page }) => {
    await page.click('button:has-text("New Matter")');
    await page.fill('input[name="title"]', "Test Matter");
    await page.fill('input[name="client"]', "Test Client");
    await page.click('button:has-text("Create")');

    await expect(page.getByText("Test Matter")).toBeVisible();
  });

  test("should filter matters by status", async ({ page }) => {
    await page.selectOption('select[name="status"]', "active");

    // Verify only active matters shown
    const matters = page.locator('[data-testid="matter-card"]');
    for (const matter of await matters.all()) {
      await expect(matter).toContainText("Active");
    }
  });
});
```

## Test Coverage Requirements

### Minimum Coverage by Type

| Change Type    | Unit Tests | API Tests  | E2E Tests |
| -------------- | ---------- | ---------- | --------- |
| API endpoint   | Required   | Required   | Optional  |
| Business logic | Required   | -          | -         |
| UI component   | Required   | -          | Optional  |
| Full feature   | Required   | If has API | Required  |
| Bug fix        | Required   | If API     | If UI     |

### What to Test

**Always test:**

- Happy path (valid input → expected output)
- Validation errors (invalid input → 400)
- Error handling (failures → graceful degradation)
- Edge cases (empty arrays, null values, boundaries)

**For APIs, also test:**

- Authentication (401 for unauthenticated)
- Authorization (403 for unauthorized)
- Not found (404 for missing resources)

## Mocking Guidelines

### When to Mock

- External services (database, APIs, file system)
- Time-dependent code
- Random values

### When NOT to Mock

- The code you're testing
- Simple utilities
- Internal dependencies (unless necessary)

### Mock Patterns

```typescript
// Mock module
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

// Mock function
const mockFn = vi.fn().mockReturnValue("result");

// Mock async
vi.fn().mockResolvedValue(data);
vi.fn().mockRejectedValue(new Error("fail"));

// Spy on existing
const spy = vi.spyOn(object, "method");
```

## CI Integration

Tests run automatically on:

- Pull request creation
- Push to main branch
- Nightly regression

```yaml
# Example CI step
- name: Run Tests
  run: |
    npm run test:coverage
    npm run test:e2e
```

## Regression Testing

Before any release or QA approval:

```bash
# Full regression suite
npm test && npm run test:e2e
```

All tests must pass. No exceptions.
