import { test, expect } from "@playwright/test";
import { requireDemoServicesHealthy } from "../helpers/demo-health";

test.describe("Demo journeys: MinIO storage", () => {
  test("upload + delete file via UI", async ({ page, request }) => {
    await requireDemoServicesHealthy(request, ["database", "minio"]);

    const filename = `e2e-upload-${Date.now()}.txt`;

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Navigate to MinIO tab
    await page.getByRole("tab", { name: "MinIO" }).click();

    // Upload file
    await page.getByLabel("Select File").setInputFiles({
      name: filename,
      mimeType: "text/plain",
      buffer: Buffer.from("hello from playwright e2e"),
    });

    await page.getByRole("button", { name: "Upload File" }).click();
    await expect(page.getByRole("alert").getByText("File uploaded successfully")).toBeVisible();

    // Wait for file to appear in list using data-testid
    const filesPanel = page.getByTestId("files-panel");
    const fileRow = page.getByTestId(`file-row-${filename}`);
    await expect(fileRow).toBeVisible({ timeout: 10000 });

    // Delete the file
    await fileRow.getByRole("button", { name: "Delete" }).click();

    // Verify deletion
    await expect(page.getByRole("alert").getByText("File deleted successfully")).toBeVisible();
    await expect(fileRow).toHaveCount(0);
  });
});
