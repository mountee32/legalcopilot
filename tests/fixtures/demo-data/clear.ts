/**
 * Demo Data Cleanup
 *
 * Clears all demo data from the database and MinIO storage.
 */

import { db } from "@/lib/db";
import {
  firms,
  users,
  clients,
  matters,
  timeEntries,
  documents,
  invoices,
  invoiceLineItems,
  payments,
  tasks,
  taskNotes,
  taskExceptions,
  evidenceItems,
  notifications,
  calendarEvents,
  uploads,
  emails,
  approvalRequests,
  timelineEvents,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getMinioClient } from "@/lib/storage/minio";
import { DEMO_FIRM_ID } from "./ids";

/**
 * Clear all demo data from the database
 */
export async function clearDemoData(): Promise<void> {
  console.log("Clearing demo data...\n");

  // Check if demo firm exists
  const existingFirm = await db.select().from(firms).where(eq(firms.id, DEMO_FIRM_ID));

  if (existingFirm.length === 0) {
    console.log("  No demo data found.\n");
    return;
  }

  // Try to clear demo files from MinIO
  try {
    const minioClient = getMinioClient();
    const demoPath = `demo/${DEMO_FIRM_ID}/`;
    const objectsList = minioClient.listObjects("uploads", demoPath, true);
    const objectsToDelete: string[] = [];

    for await (const obj of objectsList) {
      if (obj.name) objectsToDelete.push(obj.name);
    }

    if (objectsToDelete.length > 0) {
      await minioClient.removeObjects("uploads", objectsToDelete);
      console.log(`  Cleared ${objectsToDelete.length} files from MinIO`);
    }
  } catch {
    // MinIO might not be available
  }

  // Delete uploads with demo IDs (start with de000000-0000-4000-b000-)
  try {
    await db.delete(uploads).where(sql`id LIKE 'de000000-0000-4000-b000-%'`);
    console.log("  Cleared uploads");
  } catch {
    // Uploads table might be empty
  }

  // Delete in reverse dependency order
  // Most tables have cascade delete from firm, but we'll be explicit
  const tables = [
    { name: "emails", table: emails },
    { name: "approval_requests", table: approvalRequests },
    { name: "timeline_events", table: timelineEvents },
    { name: "notifications", table: notifications },
    { name: "calendar_events", table: calendarEvents },
    { name: "task_exceptions", table: taskExceptions },
    { name: "task_notes", table: taskNotes },
    { name: "evidence_items", table: evidenceItems },
    { name: "tasks", table: tasks },
    { name: "payments", table: payments },
    { name: "invoice_line_items", table: invoiceLineItems },
    { name: "invoices", table: invoices },
    { name: "time_entries", table: timeEntries },
    { name: "documents", table: documents },
    { name: "matters", table: matters },
    { name: "clients", table: clients },
    { name: "users", table: users },
    { name: "firms", table: firms },
  ];

  for (const { name, table } of tables) {
    try {
      if (name === "firms") {
        await db.delete(table).where(eq(firms.id, DEMO_FIRM_ID));
      } else if ("firmId" in table) {
        await db.delete(table).where(eq((table as typeof clients).firmId, DEMO_FIRM_ID));
      }
      console.log(`  Cleared ${name}`);
    } catch {
      // Table might not have firmId or might be empty
    }
  }

  console.log("\nDemo data cleared!\n");
}
