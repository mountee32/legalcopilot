import { test, expect } from "@playwright/test";

test("fast-login shows demo data", async ({ page }) => {
  const ts = Date.now();

  // Navigate to login page
  console.log("1. Navigating to login page...");
  await page.goto("http://192.168.1.145:3001/login");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `/tmp/demo-${ts}-1-login.png`, fullPage: true });

  // Click Partner fast login (has access to most data)
  console.log("2. Clicking Partner fast login button...");
  await page.click('button:has-text("Partner")');

  // Wait for dashboard to load
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  // Wait for skeleton to be replaced with actual content
  console.log("Waiting for dashboard data to load...");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `/tmp/demo-${ts}-2-dashboard.png`, fullPage: true });
  console.log("Dashboard loaded");

  // Navigate to Clients page and wait for data
  console.log("3. Checking Clients page...");
  await page.click('a:has-text("Clients")');
  await page.waitForLoadState("networkidle");

  // Wait for client data to appear (should have 15 clients from demo data)
  try {
    await page.waitForSelector('table tbody tr, [data-testid="client-card"]', { timeout: 10000 });
    console.log("Client data loaded!");
  } catch (e) {
    console.log("No client rows found - checking page content...");
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/demo-${ts}-3-clients.png`, fullPage: true });

  // Check page content
  const pageContent = await page.textContent("body");
  console.log('Page contains "No clients":', pageContent?.includes("No clients"));
  console.log('Page contains "Harrison":', pageContent?.includes("Harrison"));

  // Navigate to Cases/Matters page
  console.log("4. Checking Cases page...");
  await page.click('a:has-text("Cases")');
  await page.waitForLoadState("networkidle");
  try {
    await page.waitForSelector('table tbody tr, [data-testid="matter-card"]', { timeout: 10000 });
    console.log("Cases data loaded!");
  } catch (e) {
    console.log("No case rows found");
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/demo-${ts}-4-cases.png`, fullPage: true });

  console.log(`✅ Screenshots saved: ls /tmp/demo-${ts}-*.png`);
});
