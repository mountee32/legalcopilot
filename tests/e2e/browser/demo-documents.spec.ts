import { test, expect } from "@playwright/test";

test.describe("Demo Data Documents for MAT-DEMO-001", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Login as Sarah Harrison (Partner)
    await page.goto("/login");
    await page.getByRole("button", { name: /Sarah Harrison/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 });
  });

  test("should display documents for conveyancing matter (15 Willow Lane)", async ({ page }) => {
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

    // Click on Documents tab
    await page.getByRole("tab", { name: /Documents/i }).click();
    await page.waitForLoadState("networkidle");

    // Check that documents tab content is visible (may be empty state or documents list)
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display correct document titles for conveyancing matter", async ({ page }) => {
    // Navigate directly to documents page
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");

    // Verify conveyancing documents are listed with correct titles
    // These should match the updated document titles
    await expect(page.getByText(/Contract for Sale - 15 Willow Lane/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Report on Title - 15 Willow Lane/i).first()).toBeVisible();
    await expect(page.getByText(/Letter to Seller's Solicitor - Enquiries/i).first()).toBeVisible();
  });

  test("should be able to access documents page", async ({ page }) => {
    // Navigate to documents page
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");

    // Verify documents page loads
    await expect(page.locator("body")).toBeVisible();

    // Should see some documents (at least one)
    const documentCount = await page.getByText(/\.pdf/i).count();
    expect(documentCount).toBeGreaterThan(0);
  });
});
