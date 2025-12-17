import { test, expect } from "@playwright/test";
import { requireDemoServicesHealthy } from "../helpers/demo-health";

test.describe("Demo journeys: MinIO storage", () => {
  test("upload + delete file via UI", async ({ page, request }) => {
    await requireDemoServicesHealthy(request, ["database", "minio"]);

    const filename = `e2e-upload-${Date.now()}.txt`;

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    await page.getByRole("tab", { name: "MinIO" }).click();

    await page.getByLabel("Select File").setInputFiles({
      name: filename,
      mimeType: "text/plain",
      buffer: Buffer.from("hello from playwright e2e"),
    });

    await page.getByRole("button", { name: "Upload File" }).click();
    await expect(page.getByRole("alert").getByText("File uploaded successfully")).toBeVisible();

    const uploadsPanel = page
      .getByRole("heading", { name: /Uploaded Files \\(\\d+\\)/ })
      .locator("..");
    await expect(uploadsPanel.getByText(filename, { exact: true })).toBeVisible();

    const row = uploadsPanel.getByText(filename, { exact: true }).locator("..").locator("..");
    await row.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("alert").getByText("File deleted successfully")).toBeVisible();
    await expect(uploadsPanel.getByText(filename, { exact: true })).toHaveCount(0);
  });
});
