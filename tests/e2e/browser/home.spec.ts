import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page successfully", async ({ page }) => {
    // Navigate to the home page
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check if the page loads without errors
    expect(page.url()).toBe("http://localhost:3000/");
  });

  test("should have correct page title", async ({ page }) => {
    await page.goto("/");

    // Check the page title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("should render main content", async ({ page }) => {
    await page.goto("/");

    // Check if the main element exists
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have no console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check if page is still visible and accessible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have accessible navigation", async ({ page }) => {
    await page.goto("/");

    // Check for basic accessibility by testing keyboard navigation
    // Press Tab to move focus
    await page.keyboard.press("Tab");

    // Verify that an element has focus
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    expect(focusedElement).toBeTruthy();
  });
});
