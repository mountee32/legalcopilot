import { test, expect } from "@playwright/test";
import { requireDemoServicesHealthy } from "../helpers/demo-health";

test.describe("Demo journeys: Database", () => {
  test("create + delete user via UI", async ({ page, request }) => {
    await requireDemoServicesHealthy(request, ["database"]);

    const email = `e2e-${Date.now()}@test.example.com`;

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Fill in user details and create
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Name (optional)").fill("E2E User");
    await page.getByRole("button", { name: "Create User" }).click();

    // Wait for success message
    await expect(page.getByRole("alert").getByText("User created successfully")).toBeVisible();

    // Wait for the user to appear in the list using data-testid
    const usersPanel = page.getByTestId("users-panel");
    const userRow = page.getByTestId(`user-row-${email}`);
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Delete the user
    await userRow.getByRole("button", { name: "Delete" }).click();

    // Verify deletion
    await expect(page.getByRole("alert").getByText("User deleted successfully")).toBeVisible();
    await expect(userRow).toHaveCount(0);
  });
});
