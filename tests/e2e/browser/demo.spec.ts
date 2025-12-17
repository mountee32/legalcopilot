import { test, expect } from "@playwright/test";

test.describe("Demo Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page before each test
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should load the demo page successfully", async ({ page }) => {
    // Check if the page URL is correct
    expect(page.url()).toBe("http://localhost:3000/demo");

    // Check if the main heading is visible
    const heading = page.getByRole("heading", { name: /Technology Demo Dashboard/i });
    await expect(heading).toBeVisible();
  });

  test("should display all tab options", async ({ page }) => {
    // Check if all tabs are present
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    const redisTab = page.getByRole("tab", { name: /Redis/i });
    const minioTab = page.getByRole("tab", { name: /MinIO/i });
    const bullmqTab = page.getByRole("tab", { name: /BullMQ/i });
    const aiTab = page.getByRole("tab", { name: /AI/i });
    const validationTab = page.getByRole("tab", { name: /Validation/i });
    const healthTab = page.getByRole("tab", { name: /Health/i });

    await expect(databaseTab).toBeVisible();
    await expect(redisTab).toBeVisible();
    await expect(minioTab).toBeVisible();
    await expect(bullmqTab).toBeVisible();
    await expect(aiTab).toBeVisible();
    await expect(validationTab).toBeVisible();
    await expect(healthTab).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    // Click on Redis tab
    const redisTab = page.getByRole("tab", { name: /Redis/i });
    await redisTab.click();

    // Check if Redis content is visible
    const redisSectionHeading = page.getByRole("heading", { name: /Redis Cache/i });
    await expect(redisSectionHeading).toBeVisible();

    // Click on AI tab
    const aiTab = page.getByRole("tab", { name: /AI/i });
    await aiTab.click();

    // Check if AI content is visible
    const aiSectionHeading = page.getByRole("heading", { name: /AI Integration/i });
    await expect(aiSectionHeading).toBeVisible();
  });

  test("should display Database tab content by default", async ({ page }) => {
    // Check if Database tab is selected by default
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    await expect(databaseTab).toHaveAttribute("data-state", "active");

    // Check if Database content is visible
    const heading = page.getByRole("heading", { name: /PostgreSQL \+ Drizzle ORM/i });
    await expect(heading).toBeVisible();

    // Check for email input field
    const emailInput = page.getByLabel(/Email/i);
    await expect(emailInput).toBeVisible();
  });

  test("should have functional form inputs in Database tab", async ({ page }) => {
    // Type in the email input
    const emailInput = page.getByLabel("Email", { exact: true });
    await emailInput.fill("test@example.com");

    // Verify the value was set
    await expect(emailInput).toHaveValue("test@example.com");

    // Type in the name input
    const nameInput = page.getByLabel("Name (optional)");
    await nameInput.fill("Test User");

    // Verify the value was set
    await expect(nameInput).toHaveValue("Test User");
  });

  test("should display Cache tab content when clicked", async ({ page }) => {
    // Click on Cache/Redis tab
    const redisTab = page.getByRole("tab", { name: /Redis/i });
    await redisTab.click();

    // Check if Redis content is visible
    const heading = page.getByRole("heading", { name: /Redis Cache/i });
    await expect(heading).toBeVisible();

    // Check for cache key input
    const cacheKeyInput = page.getByLabel(/Cache Key/i);
    await expect(cacheKeyInput).toBeVisible();

    // Check for buttons
    const setCacheButton = page.getByRole("button", { name: /Set Cache/i });
    const getCacheButton = page.getByRole("button", { name: /Get Cache/i });
    await expect(setCacheButton).toBeVisible();
    await expect(getCacheButton).toBeVisible();
  });

  test("should display Validation tab with form", async ({ page }) => {
    // Click on Validation tab
    const validationTab = page.getByRole("tab", { name: /Validation/i });
    await validationTab.click();

    // Check if Validation content is visible
    const heading = page.getByRole("heading", { name: /Form Validation.*Zod/i });
    await expect(heading).toBeVisible();

    // Check for form inputs
    const emailInput = page.locator("#formEmail");
    const passwordInput = page.locator("#formPassword");
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check for validation button
    const validateButton = page.getByRole("button", { name: /Validate Form/i });
    await expect(validateButton).toBeVisible();
  });

  test("should display Health tab with service status", async ({ page }) => {
    // Click on Health tab
    const healthTab = page.getByRole("tab", { name: /Health/i });
    await healthTab.click();

    // Check if Health content is visible
    const heading = page.getByRole("heading", { name: /Service Health Status/i });
    await expect(heading).toBeVisible();

    // Check for refresh button
    const refreshButton = page.getByRole("button", { name: /Refresh Status/i });
    await expect(refreshButton).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page with mobile viewport
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Check if main heading is still visible
    const heading = page.getByRole("heading", { name: /Technology Demo Dashboard/i });
    await expect(heading).toBeVisible();

    // Check if tabs are visible (may be wrapped/stacked on mobile)
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    await expect(databaseTab).toBeVisible();
  });

  test("should navigate using keyboard", async ({ page }) => {
    // Focus on the first tab
    const databaseTab = page.getByRole("tab", { name: /Database/i });
    await databaseTab.focus();

    // Press ArrowRight to move to next tab
    await page.keyboard.press("ArrowRight");

    // Check if focus moved (Redis tab should now be focused)
    const redisTab = page.getByRole("tab", { name: /Redis/i });
    await expect(redisTab).toBeFocused();
  });

  test("should handle no console errors on page load", async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
