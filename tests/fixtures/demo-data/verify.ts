/**
 * Verify demo data exists in database
 */
import { db } from "@/lib/db";
import { firms, users, clients, matters, timeEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEMO_FIRM_ID } from "./index";

async function verify() {
  console.log("Verifying demo data...\n");

  // Check firm
  const firmRows = await db.select().from(firms).where(eq(firms.id, DEMO_FIRM_ID));
  console.log(`Firms: ${firmRows.length}`);
  if (firmRows.length > 0) {
    console.log(`  - ${firmRows[0].name}`);
  }

  // Check users
  const userRows = await db.select().from(users).where(eq(users.firmId, DEMO_FIRM_ID));
  console.log(`\nUsers: ${userRows.length}`);
  for (const u of userRows) {
    console.log(`  - ${u.name} <${u.email}>`);
  }

  // Check clients
  const clientRows = await db.select().from(clients).where(eq(clients.firmId, DEMO_FIRM_ID));
  console.log(`\nClients: ${clientRows.length}`);
  for (const c of clientRows) {
    const name = c.type === "individual" ? `${c.firstName} ${c.lastName}` : c.companyName;
    console.log(`  - ${name} (${c.type})`);
  }

  // Check matters
  const matterRows = await db.select().from(matters).where(eq(matters.firmId, DEMO_FIRM_ID));
  console.log(`\nMatters: ${matterRows.length}`);
  for (const m of matterRows) {
    console.log(`  - ${m.reference}: ${m.title} (${m.practiceArea}, ${m.status})`);
  }

  // Check time entries
  const teRows = await db.select().from(timeEntries).where(eq(timeEntries.firmId, DEMO_FIRM_ID));
  console.log(`\nTime Entries: ${teRows.length}`);
  let totalBillable = 0;
  for (const te of teRows) {
    console.log(
      `  - ${te.workDate}: ${te.description.substring(0, 40)}... (£${te.amount}, ${te.status})`
    );
    totalBillable += parseFloat(te.amount);
  }
  console.log(`  Total billable: £${totalBillable.toFixed(2)}`);

  console.log("\n✓ Verification complete!");
}

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
