import { test, expect } from "@playwright/test";
import { requireDemoServicesHealthy } from "../helpers/demo-health";

test.describe("Demo journeys: Redis cache", () => {
  test("set + get + clear via UI", async ({ page, request }) => {
    await requireDemoServicesHealthy(request, ["redis"]);

    const key = `e2e-key-${Date.now()}`;
    const value = `e2e-value-${Date.now()}`;

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Navigate to Redis tab
    await page.getByRole("tab", { name: "Redis" }).click();

    // Fill cache values
    await page.getByLabel("Cache Key").fill(key);
    await page.getByLabel("Cache Value").fill(value);
    await page.getByLabel("TTL (seconds)").fill("30");

    // Set cache
    await page.getByRole("button", { name: "Set Cache" }).click();
    await expect(page.getByRole("alert").getByText("Cache value set successfully")).toBeVisible();

    // Verify cache result using data-testid selectors
    const resultPanel = page.getByTestId("cache-result-panel");
    await expect(resultPanel).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("cache-hit")).toBeVisible();
    await expect(page.getByTestId("cache-key")).toHaveText(key);
    await expect(page.getByTestId("cache-value")).toHaveText(value);

    // Clear cache
    await page.getByRole("button", { name: "Clear Cache" }).click();
    await expect(page.getByRole("alert").getByText("Cache cleared successfully")).toBeVisible();

    // Get cache and verify miss
    await page.getByRole("button", { name: "Get Cache" }).click();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("cache-miss")).toBeVisible();
    await expect(page.getByTestId("cache-value")).toHaveText("null");
  });
});
