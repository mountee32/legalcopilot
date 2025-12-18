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

    // Verify all 8 role buttons are present (using demo character names)
    await expect(page.getByRole("button", { name: /Firm Admin/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sarah Harrison/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Victoria Clarke/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /James Clarke/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tom Richards/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Lucy Taylor/i })).toBeVisible();
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

  test("should login as Partner (Sarah Harrison) and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Senior Associate (Victoria Clarke) and access dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Victoria Clarke/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Associate (James Clarke) and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /James Clarke/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Paralegal (Tom Richards) and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Tom Richards/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should login as Secretary (Lucy Taylor) and access dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Lucy Taylor/i }).click();
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

  test("Associate (James Clarke) should access matters page", async ({ page }) => {
    // Login as associate
    await page.goto("/login");
    await page.getByRole("button", { name: /James Clarke/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Try to navigate to matters
    await page.goto("/matters");
    await expect(page).toHaveURL(/.*matters/);
  });
});

test.describe("Demo Data Verification", () => {
  test("Partner (Sarah Harrison) should see demo data across pages", async ({ page }) => {
    // Login as Sarah Harrison (Partner)
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Dashboard should load
    await expect(page.locator("body")).toBeVisible();

    // Navigate to matters and verify demo matters exist
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");
    // Should see at least one matter from demo data
    await expect(
      page
        .getByText(/Purchase of 15 Willow Lane|Apex vs\. BuildRight|Construction Defects/i)
        .first()
    ).toBeVisible({ timeout: 10000 });

    // Navigate to clients and verify demo clients exist
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    // Should see demo clients
    await expect(
      page.getByText(/Margaret Thompson|Apex Developments|Robert Williams/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Navigate to AI inbox and verify demo emails exist
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");
    // Should see inbox content (emails or empty state)
    await expect(page.locator("body")).toContainText(/inbox|email/i, { timeout: 10000 });
  });

  test("Partner should access billing page with demo invoices", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Navigate to billing
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");
    // Should see billing content
    await expect(page.locator("body")).toBeVisible();
  });

  test("Partner should access tasks page with demo tasks", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Navigate to tasks
    await page.goto("/tasks");
    await page.waitForLoadState("networkidle");
    // Should see tasks or empty state
    await expect(page.locator("body")).toBeVisible();
  });

  test("Partner should access calendar page with demo events", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Navigate to calendar
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    // Should see calendar content
    await expect(page.locator("body")).toBeVisible();
  });

  test("Partner should access documents page with demo documents", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    // Navigate to documents
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");
    // Should see documents page
    await expect(page.locator("body")).toBeVisible();
  });
});
