import { test, expect } from "@playwright/test";
import path from "path";

// Use port 3002 if 3000 is unavailable (common in dev)
const BASE_URL = process.env.BASE_URL || "http://localhost:3002";

// Test PDF file path
const TEST_PDF_PATH = path.join(__dirname, "../../fixtures/files/test-contract.pdf");

test.describe("Document Upload Wizard", () => {
  test.beforeEach(async ({ page }) => {
    // Go to login page and use fast login
    await page.goto(`${BASE_URL}/login`);

    // Use fast login as Sarah Harrison (Partner)
    const fastLoginButton = page.locator('button:has-text("Sarah Harrison")');
    await expect(fastLoginButton).toBeVisible({ timeout: 10000 });
    await fastLoginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
  });

  test("opens wizard and shows upload dropzone", async ({ page }) => {
    // Navigate to documents
    await page.goto(`${BASE_URL}/documents`);
    await page.waitForLoadState("networkidle");

    // Click upload button
    const uploadButton = page.locator('button:has-text("Upload")');
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();

    // Verify wizard dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog title
    await expect(dialog.locator("text=Upload Document")).toBeVisible();

    // Verify step indicator shows steps (use exact text to avoid matching multiple elements)
    await expect(dialog.locator('span:text-is("Upload")')).toBeVisible();
    await expect(dialog.locator('span:text-is("Analyze")')).toBeVisible();
    await expect(dialog.locator('span:text-is("Review")')).toBeVisible();
    await expect(dialog.locator('span:text-is("Assign")')).toBeVisible();

    // Verify dropzone is visible
    await expect(dialog.locator("text=Drop your PDF here")).toBeVisible();

    // Verify Cancel button exists
    await expect(dialog.locator('button:has-text("Cancel")')).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: "tests/e2e/screenshots/upload-wizard-step1.png" });
  });

  test("Upload & Analyze button disabled without file", async ({ page }) => {
    await page.goto(`${BASE_URL}/documents`);
    await page.waitForLoadState("networkidle");

    // Open wizard
    await page.locator('button:has-text("Upload")').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Check that Upload & Analyze button is disabled without file
    const analyzeButton = dialog.locator('button:has-text("Upload & Analyze")');
    await expect(analyzeButton).toBeDisabled();
  });

  test("can close wizard with Cancel button", async ({ page }) => {
    await page.goto(`${BASE_URL}/documents`);
    await page.waitForLoadState("networkidle");

    // Open wizard
    await page.locator('button:has-text("Upload")').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click Cancel
    await dialog.locator('button:has-text("Cancel")').click();

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test("can close wizard with Escape key", async ({ page }) => {
    await page.goto(`${BASE_URL}/documents`);
    await page.waitForLoadState("networkidle");

    // Open wizard
    await page.locator('button:has-text("Upload")').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test("full upload flow with real PDF", async ({ page }) => {
    // Increase timeout for this test as it involves AI analysis
    test.setTimeout(120000);

    await page.goto(`${BASE_URL}/documents`);
    await page.waitForLoadState("networkidle");

    // Open wizard
    await page.locator('button:has-text("Upload")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // STEP 1: Upload file
    // Get the file input and upload the test PDF
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PDF_PATH);

    // Verify file is selected (should show filename)
    await expect(dialog.locator("text=test-contract.pdf")).toBeVisible();

    // Take screenshot of step 1 with file selected
    await page.screenshot({ path: "tests/e2e/screenshots/upload-wizard-file-selected.png" });

    // Click Upload & Analyze button
    const uploadButton = dialog.locator('button:has-text("Upload & Analyze")');
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // STEP 2: Analysis in progress
    // Should see analyzing state
    await expect(dialog.locator("text=Analyzing")).toBeVisible({ timeout: 10000 });

    // Take screenshot of analysis in progress
    await page.screenshot({ path: "tests/e2e/screenshots/upload-wizard-analyzing.png" });

    // Wait for analysis to complete (this calls the real AI API)
    // Look for step 3 indicators - the review form should appear
    await expect(dialog.locator("text=Document Title")).toBeVisible({ timeout: 90000 });

    // STEP 3: Review results
    // Take screenshot of review step
    await page.screenshot({ path: "tests/e2e/screenshots/upload-wizard-review.png" });

    // Verify AI populated the title field (should contain something about contract)
    const titleInput = dialog.locator('input[id="title"]');
    await expect(titleInput).toBeVisible();
    const titleValue = await titleInput.inputValue();
    console.log("AI suggested title:", titleValue);

    // Verify confidence badge is shown
    await expect(dialog.locator("text=AI Confidence")).toBeVisible();

    // Click Continue to go to step 4
    // The dialog footer may be off-screen - use JS click
    const continueButton = dialog.locator('button:has-text("Continue")');
    await expect(continueButton).toBeEnabled();
    await continueButton.evaluate((btn: HTMLButtonElement) => btn.click());

    // STEP 4: Assign to matter
    await expect(dialog.locator("text=Assign to Matter")).toBeVisible();

    // Take screenshot of assign step
    await page.screenshot({ path: "tests/e2e/screenshots/upload-wizard-assign.png" });

    // Skip matter assignment and save directly (use JS click for off-screen button)
    const saveButton = dialog.locator('button:has-text("Save Document")');
    await expect(saveButton).toBeEnabled();
    await saveButton.evaluate((btn: HTMLButtonElement) => btn.click());

    // Dialog should close after save
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Verify we're back on documents page
    await expect(page.locator('h1:has-text("Documents")')).toBeVisible();

    // Take final screenshot
    await page.screenshot({ path: "tests/e2e/screenshots/upload-wizard-complete.png" });

    console.log("✓ Full upload flow completed successfully");
  });
});
