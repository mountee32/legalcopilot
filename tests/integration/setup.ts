/**
 * Integration Test Setup
 *
 * Provides setup and teardown utilities for integration tests
 * that hit the real database.
 */
import { beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { firms } from "@/lib/db/schema";
import { waitForDatabase, cleanupTestFirm } from "@tests/helpers/db";
import { ensureTestDatabaseMigrated } from "@tests/helpers/migrations";
import { createFirm, TestFirm } from "@tests/fixtures/factories/firm";

/**
 * Integration test context
 * Provides a test firm and cleanup utilities
 */
export interface IntegrationContext {
  firm: TestFirm;
  firmId: string;
}

/**
 * Setup integration test suite with a test firm
 *
 * @example
 * import { setupIntegrationSuite } from "@tests/integration/setup";
 *
 * describe("My Integration Test", () => {
 *   const ctx = setupIntegrationSuite();
 *
 *   it("should work", async () => {
 *     const client = await createClient({ firmId: ctx.firmId });
 *     // ...
 *   });
 * });
 */
export function setupIntegrationSuite(): IntegrationContext {
  const ctx: IntegrationContext = {
    firm: null!,
    firmId: "",
  };

  beforeAll(async () => {
    ensureTestDatabase();
    await ensureTestDatabaseMigrated();

    // Ensure database is ready
    await waitForDatabase();

    // Create a test firm for this suite
    ctx.firm = await createFirm({
      name: `Integration Test ${Date.now()}`,
    });
    ctx.firmId = ctx.firm.id;
  });

  afterAll(async () => {
    // Clean up the test firm and all related data
    if (ctx.firmId) {
      await cleanupTestFirm(ctx.firmId);
    }
  });

  return ctx;
}

/**
 * Setup for tests that need a fresh firm per test
 *
 * @example
 * import { setupFreshFirmPerTest } from "@tests/integration/setup";
 *
 * describe("Isolation Tests", () => {
 *   const ctx = setupFreshFirmPerTest();
 *
 *   it("test 1", () => {
 *     // ctx.firmId is unique to this test
 *   });
 *
 *   it("test 2", () => {
 *     // ctx.firmId is different from test 1
 *   });
 * });
 */
export function setupFreshFirmPerTest(): IntegrationContext {
  const ctx: IntegrationContext = {
    firm: null!,
    firmId: "",
  };

  const firmIds: string[] = [];

  beforeAll(async () => {
    ensureTestDatabase();
    await ensureTestDatabaseMigrated();
    await waitForDatabase();
  });

  beforeEach(async () => {
    ctx.firm = await createFirm();
    ctx.firmId = ctx.firm.id;
    firmIds.push(ctx.firmId);
  });

  afterAll(async () => {
    // Clean up all firms created during tests
    for (const firmId of firmIds) {
      await cleanupTestFirm(firmId);
    }
  });

  return ctx;
}

/**
 * Check if we're running against a test database
 */
export function ensureTestDatabase(): void {
  const dbUrl = process.env.DATABASE_URL || "";

  if (!dbUrl.includes("test") && process.env.NODE_ENV !== "test") {
    throw new Error(
      "Integration tests must run against a test database. " +
        "Ensure DATABASE_URL contains 'test' or NODE_ENV=test"
    );
  }
}
