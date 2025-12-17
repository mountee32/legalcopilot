import { test, expect } from "@playwright/test";
import { requireDemoServicesHealthy } from "../helpers/demo-health";

test.describe("Demo journeys: Redis cache", () => {
  test("set + get + clear via UI", async ({ page, request }) => {
    await requireDemoServicesHealthy(request, ["redis"]);

    const key = `e2e-key-${Date.now()}`;
    const value = `e2e-value-${Date.now()}`;

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    await page.getByRole("tab", { name: "Redis" }).click();

    await page.getByLabel("Cache Key").fill(key);
    await page.getByLabel("Cache Value").fill(value);
    await page.getByLabel("TTL (seconds)").fill("30");

    await page.getByRole("button", { name: "Set Cache" }).click();
    await expect(page.getByRole("alert").getByText("Cache value set successfully")).toBeVisible();

    const resultPanel = page.getByRole("heading", { name: "Cache Result" }).locator("..");
    await expect(resultPanel.getByText("Hit")).toBeVisible();
    await expect(resultPanel.getByText(key, { exact: true })).toBeVisible();
    await expect(resultPanel.getByText(value, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Clear Cache" }).click();
    await expect(page.getByRole("alert").getByText("Cache cleared successfully")).toBeVisible();

    await page.getByRole("button", { name: "Get Cache" }).click();
    await expect(page.getByRole("heading", { name: "Cache Result" })).toBeVisible();
    await expect(page.getByText("Miss")).toBeVisible();
    await expect(page.getByText("null")).toBeVisible();
  });
});
