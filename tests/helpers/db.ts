/**
 * Database helpers for test setup and cleanup
 */
import { db } from "@/lib/db";
import {
  firms,
  roles,
  users,
  clients,
  matters,
  documents,
  documentChunks,
  uploads,
  timeEntries,
  invoiceLineItems,
  invoices,
  payments,
  approvalRequests,
  timelineEvents,
  auditLogs,
  notificationPreferences,
  notifications,
  jobs,
  emailAccounts,
  emailProviderEvents,
  calendarAccounts,
  calendarProviderEvents,
  paymentProviderAccounts,
  paymentProviderEvents,
  accountingConnections,
  accountingSyncEvents,
  signatureRequests,
  esignatureProviderEvents,
} from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * Clean up all test data for a specific firm
 * Deletes in reverse dependency order to avoid FK violations
 */
export async function cleanupTestFirm(firmId: string): Promise<void> {
  // Delete in reverse dependency order
  const userRows = await db.select({ id: users.id }).from(users).where(eq(users.firmId, firmId));
  const userIds = userRows.map((u) => u.id);

  if (userIds.length > 0) {
    await db.delete(uploads).where(inArray(uploads.userId, userIds));
  }

  await db
    .delete(jobs)
    .where(sql`(${jobs.data} ->> 'firmId') = ${firmId}`)
    .catch(() => {});

  await db.delete(esignatureProviderEvents).where(eq(esignatureProviderEvents.firmId, firmId));
  await db.delete(signatureRequests).where(eq(signatureRequests.firmId, firmId));

  await db.delete(accountingSyncEvents).where(eq(accountingSyncEvents.firmId, firmId));
  await db.delete(accountingConnections).where(eq(accountingConnections.firmId, firmId));

  await db.delete(paymentProviderEvents).where(eq(paymentProviderEvents.firmId, firmId));
  await db.delete(paymentProviderAccounts).where(eq(paymentProviderAccounts.firmId, firmId));

  await db.delete(calendarProviderEvents).where(eq(calendarProviderEvents.firmId, firmId));
  await db.delete(calendarAccounts).where(eq(calendarAccounts.firmId, firmId));

  await db.delete(emailProviderEvents).where(eq(emailProviderEvents.firmId, firmId));
  await db.delete(emailAccounts).where(eq(emailAccounts.firmId, firmId));

  await db.delete(notifications).where(eq(notifications.firmId, firmId));
  await db.delete(notificationPreferences).where(eq(notificationPreferences.firmId, firmId));

  await db.delete(auditLogs).where(eq(auditLogs.firmId, firmId));
  await db.delete(timelineEvents).where(eq(timelineEvents.firmId, firmId));
  await db.delete(approvalRequests).where(eq(approvalRequests.firmId, firmId));

  await db.delete(payments).where(eq(payments.firmId, firmId));
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.firmId, firmId));
  await db.delete(documentChunks).where(eq(documentChunks.firmId, firmId));
  await db.delete(documents).where(eq(documents.firmId, firmId));
  await db.delete(timeEntries).where(eq(timeEntries.firmId, firmId));
  await db.delete(invoices).where(eq(invoices.firmId, firmId));
  await db.delete(matters).where(eq(matters.firmId, firmId));
  await db.delete(clients).where(eq(clients.firmId, firmId));
  await db.delete(users).where(eq(users.firmId, firmId));
  await db.delete(roles).where(eq(roles.firmId, firmId));
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
  await db.delete(esignatureProviderEvents);
  await db.delete(signatureRequests);
  await db.delete(accountingSyncEvents);
  await db.delete(accountingConnections);
  await db.delete(paymentProviderEvents);
  await db.delete(paymentProviderAccounts);
  await db.delete(calendarProviderEvents);
  await db.delete(calendarAccounts);
  await db.delete(emailProviderEvents);
  await db.delete(emailAccounts);
  await db.delete(notifications);
  await db.delete(notificationPreferences);
  await db.delete(auditLogs);
  await db.delete(timelineEvents);
  await db.delete(approvalRequests);
  await db.delete(payments);
  await db.delete(invoiceLineItems);
  await db.delete(documentChunks);
  await db.delete(documents);
  await db.delete(uploads);
  await db.delete(jobs);
  await db.delete(timeEntries);
  await db.delete(invoices);
  await db.delete(matters);
  await db.delete(clients);
  await db.delete(users);
  await db.delete(roles);
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
