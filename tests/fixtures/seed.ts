/**
 * Test Data Seeder
 *
 * Creates a realistic dataset for end-to-end testing.
 * Run with: npm run test:seed
 *
 * This creates:
 * - 2 law firms (one large, one small)
 * - Multiple users per firm with different roles
 * - Various clients (individuals and companies)
 * - Matters across different practice areas
 * - Sample time entries and documents
 */

import { db } from "@/lib/db";
import { firms, users, clients, matters } from "@/lib/db/schema";
import { randomUUID } from "crypto";

const TEST_PREFIX = "TEST_SEED_";

interface SeedResult {
  firms: { id: string; name: string }[];
  users: { id: string; email: string; firmId: string }[];
  clients: { id: string; name: string; firmId: string }[];
  matters: { id: string; title: string; clientId: string }[];
}

async function seed(): Promise<SeedResult> {
  console.log("Seeding test data...\n");

  const result: SeedResult = {
    firms: [],
    users: [],
    clients: [],
    matters: [],
  };

  // Create two test firms
  const firmData = [
    {
      id: randomUUID(),
      name: `${TEST_PREFIX}Smith & Partners LLP`,
      sraNumber: "SRA123456",
      status: "active" as const,
      plan: "enterprise" as const,
      email: "info@smithpartners.test",
    },
    {
      id: randomUUID(),
      name: `${TEST_PREFIX}Jones Legal`,
      sraNumber: "SRA789012",
      status: "active" as const,
      plan: "professional" as const,
      email: "hello@joneslegal.test",
    },
  ];

  for (const data of firmData) {
    const [firm] = await db
      .insert(firms)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    result.firms.push({ id: firm.id, name: firm.name });
    console.log(`  Created firm: ${firm.name}`);
  }

  // Create users for each firm
  const roles = ["partner", "associate", "paralegal", "secretary"];

  for (const firm of result.firms) {
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const userData = {
        id: randomUUID(),
        firmId: firm.id,
        email: `${role}@${firm.name.toLowerCase().replace(/\s+/g, "")}.test`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [user] = await db.insert(users).values(userData).returning();
      result.users.push({ id: user.id, email: user.email!, firmId: firm.id });
      console.log(`    Created user: ${user.email}`);
    }
  }

  // Create clients for each firm
  const clientTemplates = [
    { type: "individual" as const, name: "John Smith" },
    { type: "individual" as const, name: "Sarah Johnson" },
    { type: "company" as const, name: "Acme Properties Ltd" },
    { type: "company" as const, name: "Tech Innovations Inc" },
    { type: "individual" as const, name: "Michael Brown" },
  ];

  for (const firm of result.firms) {
    for (const template of clientTemplates) {
      const clientData = {
        id: randomUUID(),
        firmId: firm.id,
        type: template.type,
        name: `${TEST_PREFIX}${template.name}`,
        email: `${template.name.toLowerCase().replace(/\s+/g, ".")}@example.test`,
        reference: `CLI-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [client] = await db.insert(clients).values(clientData).returning();
      result.clients.push({
        id: client.id,
        name: client.name,
        firmId: firm.id,
      });
      console.log(`    Created client: ${client.name}`);
    }
  }

  // Create matters for each client
  const matterTemplates = [
    { practiceArea: "conveyancing", title: "Property Purchase" },
    { practiceArea: "conveyancing", title: "Property Sale" },
    { practiceArea: "civil_litigation", title: "Contract Dispute" },
    { practiceArea: "wills_probate", title: "Estate Administration" },
    { practiceArea: "family", title: "Divorce Proceedings" },
  ];

  for (const client of result.clients) {
    // Each client gets 1-2 random matters
    const numMatters = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numMatters; i++) {
      const template = matterTemplates[Math.floor(Math.random() * matterTemplates.length)];
      const matterData = {
        id: randomUUID(),
        firmId: client.firmId,
        clientId: client.id,
        title: `${template.title} - ${client.name}`,
        reference: `MAT-${Date.now().toString(36).toUpperCase()}`,
        practiceArea: template.practiceArea,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [matter] = await db.insert(matters).values(matterData).returning();
      result.matters.push({
        id: matter.id,
        title: matter.title,
        clientId: client.id,
      });
      console.log(`      Created matter: ${matter.title}`);
    }
  }

  console.log("\nSeed complete!");
  console.log(`  Firms: ${result.firms.length}`);
  console.log(`  Users: ${result.users.length}`);
  console.log(`  Clients: ${result.clients.length}`);
  console.log(`  Matters: ${result.matters.length}`);

  return result;
}

async function cleanup(): Promise<void> {
  console.log("Cleaning up seeded test data...\n");

  // Find all test firms by prefix and delete cascade
  const testFirms = await db.select().from(firms);
  const seededFirms = testFirms.filter((f) => f.name.startsWith(TEST_PREFIX));

  for (const firm of seededFirms) {
    // Delete in reverse dependency order
    await db.delete(matters).where(eq(matters.firmId, firm.id));
    await db.delete(clients).where(eq(clients.firmId, firm.id));
    await db.delete(users).where(eq(users.firmId, firm.id));
    await db.delete(firms).where(eq(firms.id, firm.id));
    console.log(`  Deleted firm: ${firm.name}`);
  }

  console.log("\nCleanup complete!");
}

// Import eq for cleanup
import { eq } from "drizzle-orm";

// CLI entrypoint
const command = process.argv[2];

if (command === "cleanup") {
  cleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Cleanup failed:", err);
      process.exit(1);
    });
} else {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
