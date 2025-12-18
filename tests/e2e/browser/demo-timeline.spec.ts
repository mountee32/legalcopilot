import { test, expect } from "@playwright/test";

test.describe("Demo Data Timeline Events", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Login as Sarah Harrison (Partner)
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
  });

  test("should display timeline events for conveyancing matter", async ({ page }) => {
    // Navigate to matters page
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");

    // Click on the conveyancing matter (Purchase of 15 Willow Lane)
    await page
      .getByText(/Purchase of 15 Willow Lane|Willow Lane/i)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Verify we're on the matter detail page
    await expect(page.getByText(/MAT-DEMO-001|Willow Lane/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Click on Timeline tab
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify timeline events are displayed (use role or exact text to avoid strict mode violations)
    await expect(
      page
        .getByRole("heading", { name: "Matter opened" })
        .or(page.getByText("Matter opened", { exact: true }))
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Conflict check completed", { exact: true })).toBeVisible();
    await expect(page.getByText(/Contract pack received/i).first()).toBeVisible();
    await expect(page.getByText(/Searches ordered/i).first()).toBeVisible();
  });

  test("should display AI events with badge", async ({ page }) => {
    // Navigate to conveyancing matter
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");
    await page
      .getByText(/Purchase of 15 Willow Lane|Willow Lane/i)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Click on Timeline tab
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify AI event is displayed with badge
    await expect(page.getByText(/AI: Title analysis complete/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("AI").first()).toBeVisible();
  });

  test("should display timeline events for litigation matter", async ({ page }) => {
    // Navigate to matters page
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");

    // Click on the litigation matter (Apex vs BuildRight)
    await page
      .getByText(/Apex vs\. BuildRight|BuildRight|Construction Defects/i)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Click on Timeline tab
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify litigation-specific timeline events (use exact text to avoid duplicates)
    await expect(page.getByText("Matter opened", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Letter before action sent", { exact: true })).toBeVisible();
    await expect(page.getByText("Claim form issued", { exact: true })).toBeVisible();
    await expect(page.getByText("Defence received", { exact: true })).toBeVisible();
  });

  test("should display system events with badge", async ({ page }) => {
    // Navigate to matters page
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");

    // Click on any matter
    await page
      .getByText(/Purchase of 15 Willow Lane|Willow Lane/i)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Click on Timeline tab
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify System badge is displayed for conflict check
    await expect(page.getByText("Conflict check completed", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("System").first()).toBeVisible();
  });

  test("should display event descriptions", async ({ page }) => {
    // Navigate to conveyancing matter
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");
    await page
      .getByText(/Purchase of 15 Willow Lane|Willow Lane/i)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Click on Timeline tab
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify descriptions are displayed
    await expect(page.getByText(/No conflicts identified/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Nationwide mortgage offer/i).first()).toBeVisible();
  });

  test("should display timeline events for employment matter", async ({ page }) => {
    // Navigate to matters page
    await page.goto("/matters");
    await page.waitForLoadState("networkidle");

    // Click on the employment matter
    await page
      .getByText(/Unfair Dismissal|Northern Manufacturing/i)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Click on Timeline tab
    await page.getByRole("tab", { name: /Timeline/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify employment-specific timeline events (use exact text)
    await expect(page.getByText("Matter opened", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("ACAS Early Conciliation started", { exact: true })).toBeVisible();
    await expect(page.getByText("ET1 filed", { exact: true })).toBeVisible();
  });
});
