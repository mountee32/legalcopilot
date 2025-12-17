import { test, expect } from "@playwright/test";
import { requireDemoServicesHealthy } from "../helpers/demo-health";

test.describe("Demo journeys: Database", () => {
  test("create + delete user via UI", async ({ page, request }) => {
    await requireDemoServicesHealthy(request, ["database"]);

    const email = `e2e-${Date.now()}@test.example.com`;

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Name (optional)").fill("E2E User");
    await page.getByRole("button", { name: "Create User" }).click();

    await expect(page.getByRole("alert").getByText("User created successfully")).toBeVisible();

    const usersPanel = page.getByRole("heading", { name: /Users \\(\\d+\\)/ }).locator("..");
    await expect(usersPanel.getByText(email, { exact: true })).toBeVisible();

    const row = usersPanel.getByText(email, { exact: true }).locator("..").locator("..");
    await row.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("alert").getByText("User deleted successfully")).toBeVisible();
    await expect(usersPanel.getByText(email, { exact: true })).toHaveCount(0);
  });
});
