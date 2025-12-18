import { test, expect } from "@playwright/test";

test.describe("Fast Login Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test("should display fast login buttons on login page", async ({ page }) => {
    await page.goto("/login");

    // Check that the fast login section is visible
    await expect(page.getByText("Quick Login")).toBeVisible();
    await expect(page.getByText("Dev Only")).toBeVisible();

    // Verify all 8 role buttons are present
    await expect(page.getByRole("button", { name: /Firm Admin/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Partner/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sr Associate/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^👩‍💼 Associate/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Paralegal/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Secretary/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Client/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Super Admin/i })).toBeVisible();
  });

  test("should login as Firm Admin and access dashboard", async ({ page }) => {
    await page.goto("/login");

    // Click the Firm Admin button
    await page.getByRole("button", { name: /Firm Admin/i }).click();

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Verify we're logged in by checking for dashboard content
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Partner and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Partner/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Senior Associate and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sr Associate/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Associate and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "👩‍💼 Associate Fee earner" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Paralegal and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Paralegal/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Secretary and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Secretary/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Client and redirect to portal", async ({ page }) => {
    await page.goto("/login");
    await page
      .getByRole("button", { name: /Client/i })
      .first()
      .click();
    // Client should be redirected to portal dashboard
    await page.waitForURL("**/portal/**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*portal/);
  });

  test("should login as Super Admin and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Super Admin/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe("Dashboard Access After Fast Login", () => {
  test("Firm Admin should see all dashboard features", async ({ page }) => {
    // Login as firm admin
    await page.goto("/login");
    await page.getByRole("button", { name: /Firm Admin/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Check dashboard loads successfully
    await expect(page.locator("body")).toBeVisible();

    // Try to navigate to matters
    await page.goto("/matters");
    await expect(page).toHaveURL(/.*matters/);
  });

  test("Associate should access matters page", async ({ page }) => {
    // Login as associate
    await page.goto("/login");
    await page.getByRole("button", { name: "👩‍💼 Associate Fee earner" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Try to navigate to matters
    await page.goto("/matters");
    await expect(page).toHaveURL(/.*matters/);
  });
});
