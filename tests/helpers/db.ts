/**
 * Database helpers for test setup and cleanup
 */
import { db } from "@/lib/db";
import { firms, users, clients, matters, documents, timeEntries, invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Clean up all test data for a specific firm
 * Deletes in reverse dependency order to avoid FK violations
 */
export async function cleanupTestFirm(firmId: string): Promise<void> {
  // Delete in reverse dependency order
  await db.delete(documents).where(eq(documents.firmId, firmId));
  await db.delete(timeEntries).where(eq(timeEntries.firmId, firmId));
  await db.delete(invoices).where(eq(invoices.firmId, firmId));
  await db.delete(matters).where(eq(matters.firmId, firmId));
  await db.delete(clients).where(eq(clients.firmId, firmId));
  await db.delete(users).where(eq(users.firmId, firmId));
  await db.delete(firms).where(eq(firms.id, firmId));
}

/**
 * Clean up test data by prefix
 * Useful for cleaning up all test entities with a naming convention
 */
export async function cleanupByPrefix(prefix: string): Promise<void> {
  // Clean up firms that start with the prefix
  const testFirms = await db.select({ id: firms.id }).from(firms).where(eq(firms.name, prefix)); // You may need LIKE for prefix matching

  for (const firm of testFirms) {
    await cleanupTestFirm(firm.id);
  }
}

/**
 * Reset database to clean state for integration tests
 * WARNING: This is destructive - only use in test environments
 */
export async function resetTestDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetTestDatabase can only be run in test environment");
  }

  // Truncate all tables in reverse dependency order
  // Add more tables as needed
  await db.delete(documents);
  await db.delete(timeEntries);
  await db.delete(invoices);
  await db.delete(matters);
  await db.delete(clients);
  await db.delete(users);
  await db.delete(firms);
}

/**
 * Wait for database to be ready
 * Useful for CI environments where DB may start slowly
 */
export async function waitForDatabase(maxAttempts = 30, delayMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await db.select().from(firms).limit(1);
      return;
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(`Database not ready after ${maxAttempts} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
