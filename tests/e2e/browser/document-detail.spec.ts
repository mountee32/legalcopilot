import { test, expect } from "@playwright/test";

test("document detail page works", async ({ page }) => {
  // Login
  await page.goto("http://192.168.1.145:3000/login");
  await page.waitForLoadState("networkidle");
  await page.click('button:has-text("Partner")');
  await page.waitForURL(/dashboard/, { timeout: 15000 });

  // Go to documents
  await page.click('a:has-text("Documents")');
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  // Take screenshot of documents list
  await page.screenshot({ path: "/tmp/doc-1-list.png", fullPage: true });
  console.log("Documents list URL:", page.url());

  // Click first document card - the Card component has the onClick handler
  // Find the card that contains the text, then click the card itself
  const firstDocCard = page
    .locator('[class*="cursor-pointer"]:has(h3:has-text("Contract for Sale"))')
    .first();
  await firstDocCard.click();

  // Wait for URL to change to document detail
  await page.waitForURL(/\/documents\//, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  console.log("Document detail URL:", page.url());

  // Take screenshot of document detail
  await page.screenshot({ path: "/tmp/doc-2-detail.png", fullPage: true });

  // Verify we're on document detail page
  await expect(page.locator("text=Document Information")).toBeVisible();

  console.log("Done! Check /tmp/doc-*.png");
});
