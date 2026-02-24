/**
 * Demo Data Seeder - Orchestrator
 *
 * Creates a comprehensive demo dataset for sales demos, QA testing, and developer onboarding.
 * Uses deterministic UUIDs for idempotent seeding.
 *
 * Commands:
 *   npm run demo:seed   - Load demo dataset (creates or updates)
 *   npm run demo:reset  - Clear and reload demo data
 *   npm run demo:clear  - Remove demo data only
 */

// Re-export IDs for external consumers
export { DEMO_IDS, DEMO_FIRM_ID, DEMO_PREFIX } from "./ids";

// Re-export types
export type { SeedResult, SeederContext } from "./types";
import { createSeederContext, type SeedResult } from "./types";

// Re-export clearDemoData
export { clearDemoData } from "./clear";
import { clearDemoData } from "./clear";

// Import seeders (order matters - respect foreign key dependencies)
import { seedFirm } from "./seeders/firm";
import { seedTaskTemplates } from "./seeders/task-templates";
import { seedClients } from "./seeders/clients";
import { seedMatters } from "./seeders/matters";
import { seedTasks } from "./seeders/tasks";
import { seedTaskNotes } from "./seeders/task-notes";
import { seedEvidenceItems } from "./seeders/evidence-items";
import { seedTaskExceptions } from "./seeders/task-exceptions";
import { seedTimeEntries } from "./seeders/time-entries";
import { seedInvoices } from "./seeders/invoices";
import { seedDocuments } from "./seeders/documents";
import { seedCalendarEvents } from "./seeders/calendar-events";
import { seedNotifications } from "./seeders/notifications";
import { seedCompliance } from "./seeders/compliance";
import { seedTimelineEvents } from "./seeders/timeline-events";
import { seedEmails } from "./seeders/emails";
import { seedApprovals } from "./seeders/approvals";
import { seedWorkflows, seedMatterWorkflows } from "./seeders/workflows";
import { seedPipeline } from "./seeders/pipeline";

/**
 * Seeds all demo data in the correct order.
 * Uses upsert semantics - safe to run multiple times.
 */
export async function seedDemoData(): Promise<SeedResult> {
  console.log("\n🌱 Seeding demo data...\n");
  const ctx = createSeederContext();

  // 1. Core entities (must come first)
  await seedFirm(ctx);
  await seedTaskTemplates(ctx);
  await seedWorkflows(ctx); // System-level workflow templates
  await seedClients(ctx);
  await seedMatters(ctx);

  // 2. Activate workflows on matters (must come after matters, before tasks)
  await seedMatterWorkflows(ctx);

  // 3. Matter-related data
  await seedTasks(ctx);
  await seedTaskNotes(ctx);
  await seedTaskExceptions(ctx); // After tasks (exceptions reference tasks)
  await seedTimeEntries(ctx);
  await seedDocuments(ctx);
  await seedEvidenceItems(ctx); // After documents (evidence can reference documents)
  await seedTimelineEvents(ctx);

  // 3. Billing
  await seedInvoices(ctx);

  // 4. Communications & scheduling
  await seedCalendarEvents(ctx);
  await seedNotifications(ctx);
  await seedEmails(ctx);

  // 5. AI & compliance
  await seedCompliance(ctx);
  await seedApprovals(ctx);

  // 6. Pipeline (AI document processing)
  await seedPipeline(ctx);

  console.log("\n✅ Demo data seeding complete!\n");
  console.log("Summary:");
  console.log(`  - Firm: ${ctx.result.firm.name}`);
  console.log(`  - Users: ${ctx.result.users.length}`);
  console.log(`  - Clients: ${ctx.result.clients.length}`);
  console.log(`  - Matters: ${ctx.result.matters.length}`);
  console.log(`  - Time entries: ${ctx.result.timeEntries.length}`);
  console.log(`  - Tasks: ${ctx.result.tasks.length} (with notes & evidence)`);
  console.log("");

  return ctx.result;
}

/**
 * Clears all demo data and re-seeds fresh.
 */
export async function resetDemoData(): Promise<SeedResult> {
  await clearDemoData();
  return seedDemoData();
}

// CLI entrypoint
const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case "clear":
        await clearDemoData();
        break;
      case "reset":
        await resetDemoData();
        break;
      case "seed":
      default:
        await seedDemoData();
        break;
    }
    process.exit(0);
  } catch (err) {
    console.error("Demo data operation failed:", err);
    process.exit(1);
  }
}

main();
