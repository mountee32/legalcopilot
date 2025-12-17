# Unit Tests

This directory contains unit and integration tests using Vitest.

## Structure

Tests should mirror the source code structure:

```
__tests__/
├── lib/
│   ├── utils.test.ts          # Tests for lib/utils.ts
│   └── db/
│       └── schema.test.ts     # Tests for lib/db/schema/
└── app/
    └── api/
        └── demo/
            └── users/
                └── route.test.ts  # Tests for app/api/demo/users/route.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- __tests__/lib/utils.test.ts

# Run tests with coverage
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test";

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### Mocking

Use `vi.mock()` to mock modules:

```typescript
import { vi, describe, it, expect } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
  },
}));

describe("Database Test", () => {
  it("should query database", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.where).mockResolvedValue([{ id: 1 }]);

    // Your test code here
  });
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **One Assertion Per Test**: Keep tests focused on a single behavior
2. **Descriptive Names**: Use clear, descriptive test names
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Database, APIs, file system, etc.
5. **Test Edge Cases**: Include error conditions and boundary values
6. **Keep Tests Fast**: Unit tests should run in milliseconds
7. **Independent Tests**: Each test should be able to run independently

## Examples

See the existing test files in this directory for examples:

- `lib/utils.test.ts` - Testing utility functions
- `lib/db/schema.test.ts` - Testing Zod schema validation (template tables)
- `app/api/demo/users/route.test.ts` - Testing API routes with mocks
