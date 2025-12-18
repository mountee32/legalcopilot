import { test, expect } from "@playwright/test";

test("fast-login works from network IP with screenshot proof", async ({ page }) => {
  // Navigate to login page via network IP
  console.log("1. Navigating to login page...");
  await page.goto("http://192.168.1.145:3001/login");
  await page.waitForLoadState("networkidle");

  // Take screenshot of login page
  await page.screenshot({ path: "/tmp/1-login-page.png", fullPage: true });
  console.log("Screenshot saved: /tmp/1-login-page.png");

  // Click firm_admin fast login button
  console.log("2. Clicking firm_admin fast login button...");
  await page.click('button:has-text("firm_admin")');

  // Wait for navigation to dashboard
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  console.log("3. Successfully logged in!");
  await page.screenshot({ path: "/tmp/2-dashboard-after-login.png", fullPage: true });
  console.log("Screenshot saved: /tmp/2-dashboard-after-login.png");

  // Refresh to verify session persists
  console.log("4. Refreshing to verify session...");
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Should still be on dashboard
  await expect(page).toHaveURL(/dashboard/);
  await page.screenshot({ path: "/tmp/3-dashboard-after-refresh.png", fullPage: true });
  console.log("Screenshot saved: /tmp/3-dashboard-after-refresh.png");
  console.log("✅ SUCCESS: Session persisted after refresh!");
});
