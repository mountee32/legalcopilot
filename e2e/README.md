# End-to-End Tests

This directory contains E2E tests using Playwright.

## Structure

```
e2e/
├── home.spec.ts    # Tests for home page
├── demo.spec.ts    # Tests for demo page
└── README.md       # This file
```

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Open Playwright UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- e2e/demo.spec.ts

# Run specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    // Navigate to page
    await page.goto("/my-page");

    // Interact with page
    await page.click("button");

    // Assert
    await expect(page.locator("h1")).toHaveText("Expected Text");
  });
});
```

### Common Patterns

#### Navigation and Waiting

```typescript
// Navigate to a page
await page.goto("/");

// Wait for network to be idle
await page.waitForLoadState("networkidle");

// Wait for specific element
await page.waitForSelector("h1");
```

#### Finding Elements

```typescript
// By role (preferred)
const button = page.getByRole("button", { name: /Submit/i });

// By text
const heading = page.getByText("Welcome");

// By label (for form inputs)
const emailInput = page.getByLabel("Email");

// By CSS selector
const element = page.locator(".my-class");

// By test ID
const testElement = page.getByTestId("my-test-id");
```

#### Interactions

```typescript
// Click
await page.click("button");
await page.getByRole("button", { name: "Submit" }).click();

// Type text
await page.fill('input[name="email"]', "test@example.com");
await page.getByLabel("Email").fill("test@example.com");

// Select dropdown
await page.selectOption("select", "value");

// Check checkbox
await page.check('input[type="checkbox"]');

// Upload file
await page.setInputFiles('input[type="file"]', "path/to/file.jpg");
```

#### Assertions

```typescript
// Visibility
await expect(page.locator("h1")).toBeVisible();
await expect(page.locator(".hidden")).not.toBeVisible();

// Text content
await expect(page.locator("h1")).toHaveText("Welcome");
await expect(page.locator("h1")).toContainText("Wel");

// Attributes
await expect(page.locator("button")).toHaveAttribute("disabled");
await expect(page.locator("a")).toHaveAttribute("href", "/home");

// Count
await expect(page.locator("li")).toHaveCount(5);

// URL
expect(page.url()).toBe("http://localhost:3000/");
```

### Setup and Teardown

```typescript
test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Run before each test
    await page.goto("/my-page");
  });

  test.afterEach(async ({ page }) => {
    // Run after each test
    await page.close();
  });

  test("first test", async ({ page }) => {
    // Test code
  });

  test("second test", async ({ page }) => {
    // Test code
  });
});
```

### Testing Different Viewports

```typescript
test("should work on mobile", async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto("/");

  // Your assertions
});
```

### Testing Keyboard Navigation

```typescript
test("should support keyboard navigation", async ({ page }) => {
  await page.goto("/");

  // Press Tab to move focus
  await page.keyboard.press("Tab");

  // Press Enter to activate
  await page.keyboard.press("Enter");

  // Type text
  await page.keyboard.type("Hello World");
});
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- Base URL: http://localhost:3000
- Browsers: Chromium, Firefox, WebKit
- Mobile devices: Pixel 5, iPhone 12
- Automatically starts dev server before tests
- Takes screenshots on failure
- Records video on failure

## Best Practices

1. **Test User Flows**: Focus on real user interactions
2. **Use Accessible Selectors**: Prefer `getByRole`, `getByLabel`, `getByText`
3. **Wait for Elements**: Use `waitForSelector` or built-in waits
4. **Test Mobile**: Include mobile viewport tests
5. **Isolate Tests**: Each test should be independent
6. **Use Page Object Model**: For complex pages, create page objects
7. **Check Accessibility**: Test keyboard navigation and screen reader support
8. **Monitor Console Errors**: Check for JavaScript errors during tests

## Debugging

### Visual Debugging

```bash
# Run with browser visible
npm run test:e2e:headed

# Open Playwright Inspector
npm run test:e2e:debug
```

### Screenshots and Videos

On test failure, Playwright automatically captures:

- Screenshots: `test-results/` directory
- Videos: `test-results/` directory
- Trace files: Can be viewed in Playwright Trace Viewer

### View Test Reports

```bash
# Generate and open HTML report
npx playwright show-report
```

## Examples

See the existing test files in this directory for examples:

- `home.spec.ts` - Basic page load and content tests
- `demo.spec.ts` - Interactive features and tab navigation
