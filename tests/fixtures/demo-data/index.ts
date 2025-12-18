/**
 * Demo Data Seeder
 *
 * Creates a comprehensive demo dataset for sales demos, QA testing, and developer onboarding.
 * Uses a deterministic firm ID and DEMO_ prefix for easy identification and cleanup.
 *
 * Commands:
 *   npm run demo:seed   - Load demo dataset (creates or updates)
 *   npm run demo:reset  - Clear and reload demo data
 *   npm run demo:clear  - Remove demo data only
 *
 * This MVP version creates minimal data to prove the mechanism:
 * - 1 firm (Harrison & Clarke Solicitors)
 * - 2 users (partner, associate)
 * - 2 clients (1 individual, 1 company)
 * - 2 matters (conveyancing, litigation)
 * - 4 time entries (2 per matter)
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
  notifications,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// Deterministic UUIDs for demo data - allows idempotent seeding
// Using valid UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (hex only)
export const DEMO_FIRM_ID = "de000000-0000-4000-a000-000000000001";
export const DEMO_PREFIX = "DEMO_";

// Deterministic IDs for core entities (all valid UUIDs, "de" prefix = demo)
const DEMO_IDS = {
  firm: DEMO_FIRM_ID,
  users: {
    partner: "de000000-0000-4000-a001-000000000001",
    associate: "de000000-0000-4000-a001-000000000002",
    associate2: "de000000-0000-4000-a001-000000000003",
    associate3: "de000000-0000-4000-a001-000000000004",
    paralegal1: "de000000-0000-4000-a001-000000000005",
    paralegal2: "de000000-0000-4000-a001-000000000006",
    seniorPartner: "de000000-0000-4000-a001-000000000007",
    receptionist: "de000000-0000-4000-a001-000000000008",
  },
  clients: {
    individual: "de000000-0000-4000-a002-000000000001",
    company: "de000000-0000-4000-a002-000000000002",
    individual3: "de000000-0000-4000-a002-000000000003",
    individual4: "de000000-0000-4000-a002-000000000004",
    individual5: "de000000-0000-4000-a002-000000000005",
    individual6: "de000000-0000-4000-a002-000000000006",
    individual7: "de000000-0000-4000-a002-000000000007",
    individual8: "de000000-0000-4000-a002-000000000008",
    company3: "de000000-0000-4000-a002-000000000009",
    company4: "de000000-0000-4000-a002-000000000010",
    company5: "de000000-0000-4000-a002-000000000011",
    company6: "de000000-0000-4000-a002-000000000012",
    company7: "de000000-0000-4000-a002-000000000013",
    trust1: "de000000-0000-4000-a002-000000000014",
    estate1: "de000000-0000-4000-a002-000000000015",
  },
  matters: {
    conveyancing: "de000000-0000-4000-a003-000000000001",
    litigation: "de000000-0000-4000-a003-000000000002",
    conveyancingSale: "de000000-0000-4000-a003-000000000003",
    conveyancingRemortgage: "de000000-0000-4000-a003-000000000004",
    conveyancingLeasehold: "de000000-0000-4000-a003-000000000005",
    litigationDebt: "de000000-0000-4000-a003-000000000006",
    litigationContract: "de000000-0000-4000-a003-000000000007",
    personalInjuryRTA: "de000000-0000-4000-a003-000000000008",
    personalInjuryWorkplace: "de000000-0000-4000-a003-000000000009",
    personalInjurySlip: "de000000-0000-4000-a003-000000000010",
    personalInjuryCICA: "de000000-0000-4000-a003-000000000011",
    familyDivorce: "de000000-0000-4000-a003-000000000012",
    familyChild: "de000000-0000-4000-a003-000000000013",
    familyPrenup: "de000000-0000-4000-a003-000000000014",
    employmentDismissal: "de000000-0000-4000-a003-000000000015",
    employmentRedundancy: "de000000-0000-4000-a003-000000000016",
    employmentSettlement: "de000000-0000-4000-a003-000000000017",
    probateEstate: "de000000-0000-4000-a003-000000000018",
    probateDispute: "de000000-0000-4000-a003-000000000019",
    probateGrant: "de000000-0000-4000-a003-000000000020",
    criminalDriving: "de000000-0000-4000-a003-000000000021",
    criminalFraud: "de000000-0000-4000-a003-000000000022",
    immigrationTier2: "de000000-0000-4000-a003-000000000023",
    immigrationSpouse: "de000000-0000-4000-a003-000000000024",
    commercialShareholder: "de000000-0000-4000-a003-000000000025",
  },
  timeEntries: {
    te1: "de000000-0000-4000-a004-000000000001",
    te2: "de000000-0000-4000-a004-000000000002",
    te3: "de000000-0000-4000-a004-000000000003",
    te4: "de000000-0000-4000-a004-000000000004",
    te5: "de000000-0000-4000-a004-000000000005",
    te6: "de000000-0000-4000-a004-000000000006",
    te7: "de000000-0000-4000-a004-000000000007",
    te8: "de000000-0000-4000-a004-000000000008",
    te9: "de000000-0000-4000-a004-000000000009",
    te10: "de000000-0000-4000-a004-000000000010",
    te11: "de000000-0000-4000-a004-000000000011",
    te12: "de000000-0000-4000-a004-000000000012",
    te13: "de000000-0000-4000-a004-000000000013",
    te14: "de000000-0000-4000-a004-000000000014",
    te15: "de000000-0000-4000-a004-000000000015",
    te16: "de000000-0000-4000-a004-000000000016",
    te17: "de000000-0000-4000-a004-000000000017",
    te18: "de000000-0000-4000-a004-000000000018",
    te19: "de000000-0000-4000-a004-000000000019",
    te20: "de000000-0000-4000-a004-000000000020",
    te21: "de000000-0000-4000-a004-000000000021",
    te22: "de000000-0000-4000-a004-000000000022",
    te23: "de000000-0000-4000-a004-000000000023",
    te24: "de000000-0000-4000-a004-000000000024",
    te25: "de000000-0000-4000-a004-000000000025",
    te26: "de000000-0000-4000-a004-000000000026",
    te27: "de000000-0000-4000-a004-000000000027",
    te28: "de000000-0000-4000-a004-000000000028",
    te29: "de000000-0000-4000-a004-000000000029",
    te30: "de000000-0000-4000-a004-000000000030",
    te31: "de000000-0000-4000-a004-000000000031",
    te32: "de000000-0000-4000-a004-000000000032",
    te33: "de000000-0000-4000-a004-000000000033",
    te34: "de000000-0000-4000-a004-000000000034",
    te35: "de000000-0000-4000-a004-000000000035",
    te36: "de000000-0000-4000-a004-000000000036",
    te37: "de000000-0000-4000-a004-000000000037",
    te38: "de000000-0000-4000-a004-000000000038",
    te39: "de000000-0000-4000-a004-000000000039",
    te40: "de000000-0000-4000-a004-000000000040",
    te41: "de000000-0000-4000-a004-000000000041",
    te42: "de000000-0000-4000-a004-000000000042",
    te43: "de000000-0000-4000-a004-000000000043",
    te44: "de000000-0000-4000-a004-000000000044",
    te45: "de000000-0000-4000-a004-000000000045",
    te46: "de000000-0000-4000-a004-000000000046",
    te47: "de000000-0000-4000-a004-000000000047",
    te48: "de000000-0000-4000-a004-000000000048",
    te49: "de000000-0000-4000-a004-000000000049",
    te50: "de000000-0000-4000-a004-000000000050",
  },
  invoices: {
    inv1: "de000000-0000-4000-a006-000000000001",
    inv2: "de000000-0000-4000-a006-000000000002",
    inv3: "de000000-0000-4000-a006-000000000003",
    inv4: "de000000-0000-4000-a006-000000000004",
    inv5: "de000000-0000-4000-a006-000000000005",
    inv6: "de000000-0000-4000-a006-000000000006",
    inv7: "de000000-0000-4000-a006-000000000007",
    inv8: "de000000-0000-4000-a006-000000000008",
    inv9: "de000000-0000-4000-a006-000000000009",
    inv10: "de000000-0000-4000-a006-000000000010",
  },
  payments: {
    pay1: "de000000-0000-4000-a007-000000000001",
    pay2: "de000000-0000-4000-a007-000000000002",
    pay3: "de000000-0000-4000-a007-000000000003",
    pay4: "de000000-0000-4000-a007-000000000004",
    pay5: "de000000-0000-4000-a007-000000000005",
  },
  tasks: {
    task1: "de000000-0000-4000-a005-000000000001",
    task2: "de000000-0000-4000-a005-000000000002",
    task3: "de000000-0000-4000-a005-000000000003",
    task4: "de000000-0000-4000-a005-000000000004",
    task5: "de000000-0000-4000-a005-000000000005",
    task6: "de000000-0000-4000-a005-000000000006",
    task7: "de000000-0000-4000-a005-000000000007",
    task8: "de000000-0000-4000-a005-000000000008",
    task9: "de000000-0000-4000-a005-000000000009",
    task10: "de000000-0000-4000-a005-000000000010",
    task11: "de000000-0000-4000-a005-000000000011",
    task12: "de000000-0000-4000-a005-000000000012",
    task13: "de000000-0000-4000-a005-000000000013",
    task14: "de000000-0000-4000-a005-000000000014",
    task15: "de000000-0000-4000-a005-000000000015",
    task16: "de000000-0000-4000-a005-000000000016",
    task17: "de000000-0000-4000-a005-000000000017",
    task18: "de000000-0000-4000-a005-000000000018",
    task19: "de000000-0000-4000-a005-000000000019",
    task20: "de000000-0000-4000-a005-000000000020",
    task21: "de000000-0000-4000-a005-000000000021",
    task22: "de000000-0000-4000-a005-000000000022",
    task23: "de000000-0000-4000-a005-000000000023",
    task24: "de000000-0000-4000-a005-000000000024",
    task25: "de000000-0000-4000-a005-000000000025",
    task26: "de000000-0000-4000-a005-000000000026",
    task27: "de000000-0000-4000-a005-000000000027",
    task28: "de000000-0000-4000-a005-000000000028",
    task29: "de000000-0000-4000-a005-000000000029",
    task30: "de000000-0000-4000-a005-000000000030",
  },
};

interface SeedResult {
  firm: { id: string; name: string };
  users: { id: string; name: string; email: string }[];
  clients: { id: string; name: string; type: string }[];
  matters: { id: string; title: string; practiceArea: string }[];
  timeEntries: { id: string; description: string; amount: string }[];
  tasks: { id: string; title: string; status: string }[];
}

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

  // Delete in reverse dependency order
  // Most tables have cascade delete from firm, but we'll be explicit
  const tables = [
    { name: "notifications", table: notifications },
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
        // @ts-expect-error - dynamic table access
        await db.delete(table).where(eq(table.firmId, DEMO_FIRM_ID));
      }
      console.log(`  Cleared ${name}`);
    } catch {
      // Table might not have firmId or might be empty
    }
  }

  console.log("\nDemo data cleared!\n");
}

/**
 * Seed demo data
 */
export async function seedDemoData(): Promise<SeedResult> {
  console.log("Seeding demo data...\n");

  const result: SeedResult = {
    firm: { id: "", name: "" },
    users: [],
    clients: [],
    matters: [],
    timeEntries: [],
    tasks: [],
  };

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];

  // 1. Create firm
  const [firm] = await db
    .insert(firms)
    .values({
      id: DEMO_IDS.firm,
      name: `${DEMO_PREFIX}Harrison & Clarke Solicitors`,
      sraNumber: "SRA123456",
      status: "active",
      plan: "enterprise",
      email: "info@harrisonclark.demo",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: firms.id,
      set: { updatedAt: now },
    })
    .returning();

  result.firm = { id: firm.id, name: firm.name };
  console.log(`  Created firm: ${firm.name}`);

  // 2. Create users
  const usersData = [
    {
      id: DEMO_IDS.users.partner,
      firmId: DEMO_IDS.firm,
      email: "sarah.harrison@harrisonclark.demo",
      name: `${DEMO_PREFIX}Sarah Harrison`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.associate,
      firmId: DEMO_IDS.firm,
      email: "james.clarke@harrisonclark.demo",
      name: `${DEMO_PREFIX}James Clarke`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.seniorPartner,
      firmId: DEMO_IDS.firm,
      email: "victoria.clarke@harrisonclark.demo",
      name: `${DEMO_PREFIX}Victoria Clarke`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.associate2,
      firmId: DEMO_IDS.firm,
      email: "emma.williams@harrisonclark.demo",
      name: `${DEMO_PREFIX}Emma Williams`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.associate3,
      firmId: DEMO_IDS.firm,
      email: "david.chen@harrisonclark.demo",
      name: `${DEMO_PREFIX}David Chen`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.paralegal1,
      firmId: DEMO_IDS.firm,
      email: "tom.richards@harrisonclark.demo",
      name: `${DEMO_PREFIX}Tom Richards`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.paralegal2,
      firmId: DEMO_IDS.firm,
      email: "sophie.brown@harrisonclark.demo",
      name: `${DEMO_PREFIX}Sophie Brown`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.receptionist,
      firmId: DEMO_IDS.firm,
      email: "lucy.taylor@harrisonclark.demo",
      name: `${DEMO_PREFIX}Lucy Taylor`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const userData of usersData) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { updatedAt: now },
      })
      .returning();

    result.users.push({ id: user.id, name: user.name!, email: user.email! });
    console.log(`    Created user: ${user.name}`);
  }

  // 3. Create clients
  const clientsData = [
    {
      id: DEMO_IDS.clients.individual,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-001",
      firstName: `${DEMO_PREFIX}Margaret`,
      lastName: "Thompson",
      email: "margaret.thompson@example.demo",
      phone: "020 7123 4567",
      addressLine1: "42 Kensington Gardens",
      city: "London",
      postcode: "W8 4PX",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.company,
      firmId: DEMO_IDS.firm,
      type: "company" as const,
      status: "active" as const,
      reference: "CLI-DEMO-002",
      companyName: `${DEMO_PREFIX}Apex Developments Ltd`,
      companyNumber: "12345678",
      email: "legal@apexdev.demo",
      phone: "0161 234 5678",
      addressLine1: "100 Deansgate",
      city: "Manchester",
      postcode: "M3 2GP",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.individual3,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-003",
      firstName: `${DEMO_PREFIX}Robert`,
      lastName: "Williams",
      email: "robert.williams@example.demo",
      phone: "0161 789 4567",
      addressLine1: "58 Oxford Road",
      city: "Manchester",
      postcode: "M1 6EU",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.individual4,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-004",
      firstName: `${DEMO_PREFIX}Jennifer`,
      lastName: "Adams",
      email: "jennifer.adams@example.demo",
      phone: "0121 456 7890",
      addressLine1: "23 Colmore Row",
      city: "Birmingham",
      postcode: "B3 2BS",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.individual5,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-005",
      firstName: `${DEMO_PREFIX}Michael`,
      lastName: "O'Brien",
      email: "michael.obrien@example.demo",
      phone: "0151 234 5678",
      addressLine1: "77 Bold Street",
      city: "Liverpool",
      postcode: "L1 4HF",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.individual6,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-006",
      firstName: `${DEMO_PREFIX}Fatima`,
      lastName: "Hassan",
      email: "fatima.hassan@example.demo",
      phone: "0113 987 6543",
      addressLine1: "14 Park Square East",
      city: "Leeds",
      postcode: "LS1 2LH",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.individual7,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-007",
      firstName: `${DEMO_PREFIX}George`,
      lastName: "Henderson",
      email: "george.henderson@example.demo",
      phone: "0117 456 7890",
      addressLine1: "89 Whiteladies Road",
      city: "Bristol",
      postcode: "BS8 2NT",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.individual8,
      firmId: DEMO_IDS.firm,
      type: "individual" as const,
      status: "active" as const,
      reference: "CLI-DEMO-008",
      firstName: `${DEMO_PREFIX}Elizabeth`,
      lastName: "Carter",
      email: "elizabeth.carter@example.demo",
      phone: "0131 234 5678",
      addressLine1: "32 Charlotte Square",
      city: "Edinburgh",
      postcode: "EH2 4ET",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.company3,
      firmId: DEMO_IDS.firm,
      type: "company" as const,
      status: "active" as const,
      reference: "CLI-DEMO-009",
      companyName: `${DEMO_PREFIX}TechStart Solutions Ltd`,
      companyNumber: "23456789",
      email: "legal@techstart.demo",
      phone: "020 7890 1234",
      addressLine1: "15 Old Street",
      city: "London",
      postcode: "EC1V 9HL",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.company4,
      firmId: DEMO_IDS.firm,
      type: "company" as const,
      status: "active" as const,
      reference: "CLI-DEMO-010",
      companyName: `${DEMO_PREFIX}Northern Manufacturing plc`,
      companyNumber: "34567890",
      email: "legal@northernmfg.demo",
      phone: "0191 345 6789",
      addressLine1: "Industrial Estate Road",
      city: "Newcastle",
      postcode: "NE4 7YH",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.company5,
      firmId: DEMO_IDS.firm,
      type: "company" as const,
      status: "active" as const,
      reference: "CLI-DEMO-011",
      companyName: `${DEMO_PREFIX}Riverside Properties Ltd`,
      companyNumber: "45678901",
      email: "legal@riverside.demo",
      phone: "0161 567 8901",
      addressLine1: "Quay Street",
      city: "Manchester",
      postcode: "M3 3JE",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.company6,
      firmId: DEMO_IDS.firm,
      type: "company" as const,
      status: "active" as const,
      reference: "CLI-DEMO-012",
      companyName: `${DEMO_PREFIX}Global Imports Ltd`,
      companyNumber: "56789012",
      email: "legal@globalimports.demo",
      phone: "020 3456 7890",
      addressLine1: "Docklands Business Centre",
      city: "London",
      postcode: "E14 9SH",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.company7,
      firmId: DEMO_IDS.firm,
      type: "company" as const,
      status: "active" as const,
      reference: "CLI-DEMO-013",
      companyName: `${DEMO_PREFIX}Healthcare Plus Ltd`,
      companyNumber: "67890123",
      email: "legal@healthcareplus.demo",
      phone: "0121 678 9012",
      addressLine1: "Medical Quarter",
      city: "Birmingham",
      postcode: "B15 2TH",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.trust1,
      firmId: DEMO_IDS.firm,
      type: "trust" as const,
      status: "active" as const,
      reference: "CLI-DEMO-014",
      companyName: `${DEMO_PREFIX}Henderson Family Trust`,
      email: "trustees@hendersontrust.demo",
      phone: "0117 789 0123",
      addressLine1: "89 Whiteladies Road",
      city: "Bristol",
      postcode: "BS8 2NT",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.clients.estate1,
      firmId: DEMO_IDS.firm,
      type: "trust" as const,
      status: "active" as const,
      reference: "CLI-DEMO-015",
      companyName: `${DEMO_PREFIX}Carter Estate`,
      email: "executors@carterestate.demo",
      phone: "0131 890 1234",
      addressLine1: "32 Charlotte Square",
      city: "Edinburgh",
      postcode: "EH2 4ET",
      country: "United Kingdom",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const clientData of clientsData) {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .onConflictDoUpdate({
        target: clients.id,
        set: { updatedAt: now },
      })
      .returning();

    const displayName =
      client.type === "individual" ? `${client.firstName} ${client.lastName}` : client.companyName;

    result.clients.push({ id: client.id, name: displayName!, type: client.type });
    console.log(`    Created client: ${displayName}`);
  }

  // 4. Create matters
  const mattersData = [
    {
      id: DEMO_IDS.matters.conveyancing,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual,
      title: "Purchase of 15 Willow Lane, Richmond",
      reference: "MAT-DEMO-001",
      practiceArea: "conveyancing" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate,
      description: "Freehold residential purchase. Price: £850,000. Mortgage with Nationwide.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.litigation,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company,
      title: "Apex vs. BuildRight - Construction Defects Claim",
      reference: "MAT-DEMO-002",
      practiceArea: "litigation" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.partner,
      description: "Claim against contractor for defective foundation works. Value: £2.4m.",
      createdAt: now,
      updatedAt: now,
    },
    // Conveyancing matters (3 more)
    {
      id: DEMO_IDS.matters.conveyancingSale,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual,
      title: "Sale of 42 Kensington Gardens, London",
      reference: "MAT-DEMO-003",
      practiceArea: "conveyancing" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate2,
      description: "Freehold sale. Price: £1,250,000. Chain of 3 properties.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.conveyancingRemortgage,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company,
      title: "Remortgage of 100 Deansgate, Manchester",
      reference: "MAT-DEMO-004",
      practiceArea: "conveyancing" as const,
      status: "closed" as const,
      feeEarnerId: DEMO_IDS.users.paralegal1,
      description: "Commercial remortgage. Value: £3.5m with HSBC.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.conveyancingLeasehold,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual6,
      title: "Leasehold Purchase - Flat 4B, The Galleries, Leeds",
      reference: "MAT-DEMO-005",
      practiceArea: "conveyancing" as const,
      status: "lead" as const,
      feeEarnerId: DEMO_IDS.users.associate2,
      description: "Leasehold flat purchase. Price: £320,000. 99 years remaining on lease.",
      createdAt: now,
      updatedAt: now,
    },
    // Litigation matters (2 more)
    {
      id: DEMO_IDS.matters.litigationDebt,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company,
      title: "Debt Recovery - Outstanding Invoice £45,000",
      reference: "MAT-DEMO-006",
      practiceArea: "litigation" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate3,
      description: "Recovering unpaid invoices from former client. Claim issued in County Court.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.litigationContract,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company4,
      title: "Breach of Contract - Supply Agreement Dispute",
      reference: "MAT-DEMO-007",
      practiceArea: "litigation" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.seniorPartner,
      description: "Supplier failed to deliver materials per agreement. Claim value: £180,000.",
      createdAt: now,
      updatedAt: now,
    },
    // Personal Injury matters (4)
    {
      id: DEMO_IDS.matters.personalInjuryRTA,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual3,
      title: "RTA Personal Injury - M6 Motorway Collision",
      reference: "MAT-DEMO-008",
      practiceArea: "personal_injury" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.partner,
      description:
        "Whiplash and soft tissue injuries. Liability admitted. Medical reports pending.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.personalInjuryWorkplace,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual4,
      title: "Workplace Accident - Slipped Disc Injury",
      reference: "MAT-DEMO-009",
      practiceArea: "personal_injury" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.partner,
      description:
        "Manual handling injury at warehouse. Employer liability claim. Off work 6 months.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.personalInjurySlip,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual5,
      title: "Slip and Fall - Supermarket Public Liability",
      reference: "MAT-DEMO-010",
      practiceArea: "personal_injury" as const,
      status: "closed" as const,
      feeEarnerId: DEMO_IDS.users.associate,
      description: "Fractured wrist from wet floor. Settled at £8,500 plus costs.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.personalInjuryCICA,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual6,
      title: "CICA Criminal Injuries Compensation Application",
      reference: "MAT-DEMO-011",
      practiceArea: "personal_injury" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.partner,
      description: "Assault victim. Psychological injury claim. CICA application submitted.",
      createdAt: now,
      updatedAt: now,
    },
    // Family matters (3)
    {
      id: DEMO_IDS.matters.familyDivorce,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual,
      title: "Divorce - Thompson Matrimonial Proceedings",
      reference: "MAT-DEMO-012",
      practiceArea: "family" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate2,
      description: "Divorce petition filed. Financial disclosure ongoing. No children.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.familyChild,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual7,
      title: "Child Arrangements Order Application",
      reference: "MAT-DEMO-013",
      practiceArea: "family" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate2,
      description: "Seeking shared custody arrangement. CAFCASS report ordered.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.familyPrenup,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual8,
      title: "Prenuptial Agreement - High Net Worth",
      reference: "MAT-DEMO-014",
      practiceArea: "family" as const,
      status: "lead" as const,
      feeEarnerId: DEMO_IDS.users.seniorPartner,
      description: "Drafting prenup for wedding in 3 months. Assets include property portfolio.",
      createdAt: now,
      updatedAt: now,
    },
    // Employment matters (3)
    {
      id: DEMO_IDS.matters.employmentDismissal,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual3,
      title: "Unfair Dismissal Tribunal Claim",
      reference: "MAT-DEMO-015",
      practiceArea: "employment" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate3,
      description: "Senior manager dismissed without proper procedure. ET claim lodged.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.employmentRedundancy,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual4,
      title: "Redundancy - Selection Process Challenge",
      reference: "MAT-DEMO-016",
      practiceArea: "employment" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate3,
      description: "Challenging unfair redundancy selection criteria. 15 years service.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.employmentSettlement,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual5,
      title: "Settlement Agreement Negotiation",
      reference: "MAT-DEMO-017",
      practiceArea: "employment" as const,
      status: "closed" as const,
      feeEarnerId: DEMO_IDS.users.associate3,
      description: "Exit package negotiated. £75,000 settlement plus legal costs.",
      createdAt: now,
      updatedAt: now,
    },
    // Probate matters (3)
    {
      id: DEMO_IDS.matters.probateEstate,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.estate1,
      title: "Estate Administration - Estate of John Roberts",
      reference: "MAT-DEMO-018",
      practiceArea: "probate" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.paralegal2,
      description: "Standard probate. Estate value £450,000. Three beneficiaries.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.probateDispute,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual7,
      title: "Will Dispute - Inheritance Act Claim",
      reference: "MAT-DEMO-019",
      practiceArea: "probate" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.seniorPartner,
      description: "Adult child excluded from will. Reasonable provision claim under I(PFD)A 1975.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.probateGrant,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual8,
      title: "Grant of Probate Application - Intestacy",
      reference: "MAT-DEMO-020",
      practiceArea: "probate" as const,
      status: "lead" as const,
      feeEarnerId: DEMO_IDS.users.paralegal2,
      description: "Died without will. Spouse and two children. Estate value £280,000.",
      createdAt: now,
      updatedAt: now,
    },
    // Criminal matters (2)
    {
      id: DEMO_IDS.matters.criminalDriving,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual3,
      title: "Drink Driving Defence - Magistrates Court",
      reference: "MAT-DEMO-021",
      practiceArea: "criminal" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate,
      description: "Client charged with drink driving. Reading 95mg. Procedural defence possible.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.criminalFraud,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual4,
      title: "Fraud by False Representation - Crown Court",
      reference: "MAT-DEMO-022",
      practiceArea: "criminal" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.seniorPartner,
      description: "Company director charged with VAT fraud. Value £120,000. Trial listed.",
      createdAt: now,
      updatedAt: now,
    },
    // Immigration matters (2)
    {
      id: DEMO_IDS.matters.immigrationTier2,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company3,
      title: "Skilled Worker Visa Application - Software Engineer",
      reference: "MAT-DEMO-023",
      practiceArea: "immigration" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.associate2,
      description: "Certificate of Sponsorship issued. Application prepared for submission.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.matters.immigrationSpouse,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual6,
      title: "Spouse Visa Extension Application",
      reference: "MAT-DEMO-024",
      practiceArea: "immigration" as const,
      status: "lead" as const,
      feeEarnerId: DEMO_IDS.users.associate2,
      description: "Initial visa expires in 2 months. Financial requirement evidence gathering.",
      createdAt: now,
      updatedAt: now,
    },
    // Commercial matter (1)
    {
      id: DEMO_IDS.matters.commercialShareholder,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company3,
      title: "Shareholder Agreement - Tech Startup",
      reference: "MAT-DEMO-025",
      practiceArea: "commercial" as const,
      status: "active" as const,
      feeEarnerId: DEMO_IDS.users.seniorPartner,
      description: "Drafting shareholders agreement. Series A funding. 4 founders.",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const matterData of mattersData) {
    const [matter] = await db
      .insert(matters)
      .values(matterData)
      .onConflictDoUpdate({
        target: matters.id,
        set: { updatedAt: now },
      })
      .returning();

    result.matters.push({
      id: matter.id,
      title: matter.title,
      practiceArea: matter.practiceArea,
    });
    console.log(`    Created matter: ${matter.title}`);
  }

  // 5. Create time entries
  const timeEntriesData = [
    {
      id: DEMO_IDS.timeEntries.te1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      feeEarnerId: DEMO_IDS.users.associate,
      workDate: yesterday,
      description: "Review of title documents and property information forms",
      durationMinutes: 90,
      hourlyRate: "200.00",
      amount: "300.00",
      status: "approved" as const,
      source: "manual" as const,
      isBillable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.timeEntries.te2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      feeEarnerId: DEMO_IDS.users.associate,
      workDate: today,
      description: "Drafting enquiries to seller's solicitors",
      durationMinutes: 60,
      hourlyRate: "200.00",
      amount: "200.00",
      status: "draft" as const,
      source: "manual" as const,
      isBillable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.timeEntries.te3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      feeEarnerId: DEMO_IDS.users.partner,
      workDate: yesterday,
      description: "Conference with client and expert witness",
      durationMinutes: 120,
      hourlyRate: "350.00",
      amount: "700.00",
      status: "approved" as const,
      source: "calendar" as const,
      isBillable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.timeEntries.te4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      feeEarnerId: DEMO_IDS.users.partner,
      workDate: today,
      description: "Reviewing expert report on foundation defects",
      durationMinutes: 180,
      hourlyRate: "350.00",
      amount: "1050.00",
      status: "submitted" as const,
      source: "document_activity" as const,
      isBillable: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const teData of timeEntriesData) {
    const [te] = await db
      .insert(timeEntries)
      .values(teData)
      .onConflictDoUpdate({
        target: timeEntries.id,
        set: { updatedAt: now },
      })
      .returning();

    result.timeEntries.push({
      id: te.id,
      description: te.description,
      amount: te.amount,
    });
    console.log(`    Created time entry: ${te.description.substring(0, 40)}...`);
  }

  // 6. Create tasks
  const twoDaysAgo = new Date(now.getTime() - 172800000).toISOString();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString();
  const nextWeek = new Date(now.getTime() + 604800000).toISOString();
  const nextMonth = new Date(now.getTime() + 2592000000).toISOString();

  const tasksData = [
    // Conveyancing tasks
    {
      id: DEMO_IDS.tasks.task1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Chase seller's solicitors for replies to enquiries",
      description: "Follow up on outstanding responses to property enquiries sent last week",
      status: "in_progress" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(today),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Order local searches",
      description: "Submit search application to local authority",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Draft contract report for client",
      description: "Prepare detailed report on contract terms and searches",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    // Litigation tasks
    {
      id: DEMO_IDS.tasks.task4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "Review expert report on construction defects",
      description: "Detailed review of structural engineer's findings",
      status: "completed" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.partner,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(yesterday),
      completedAt: now,
      createdAt: new Date(twoDaysAgo),
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task5,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "Draft particulars of claim",
      description: "Prepare detailed statement of case for court filing",
      status: "in_progress" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.partner,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(today),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task6,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "Prepare court bundle",
      description: "Compile all documents for trial bundle in accordance with CPR",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task7,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationDebt,
      title: "File claim form at court",
      description: "Issue claim form N1 for debt recovery",
      status: "completed" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate3,
      createdById: DEMO_IDS.users.associate3,
      dueDate: new Date(yesterday),
      completedAt: now,
      createdAt: new Date(twoDaysAgo),
      updatedAt: now,
    },
    // Personal Injury tasks
    {
      id: DEMO_IDS.tasks.task8,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      title: "Obtain medical records",
      description: "Request full medical records from GP and hospital",
      status: "in_progress" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.paralegal2,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task9,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      title: "Send letter of claim to defendant",
      description: "Prepare and send detailed letter of claim under PI protocol",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.partner,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task10,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryWorkplace,
      title: "Instruct medical expert",
      description: "Appoint orthopaedic consultant for back injury assessment",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.partner,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    // Family law tasks
    {
      id: DEMO_IDS.tasks.task11,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      title: "Complete Form E financial disclosure",
      description: "Full financial disclosure form with supporting documents",
      status: "in_progress" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate2,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task12,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      title: "Review pension valuation",
      description: "Analyse pension sharing options with client",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.associate2,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(nextMonth),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task13,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyChild,
      title: "Review CAFCASS report",
      description: "Analyse recommendations and discuss with client",
      status: "pending" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.associate2,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(today),
      createdAt: now,
      updatedAt: now,
    },
    // Employment tasks
    {
      id: DEMO_IDS.tasks.task14,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      title: "Prepare witness statements",
      description: "Draft witness statements from client and colleagues",
      status: "in_progress" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate3,
      createdById: DEMO_IDS.users.associate3,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task15,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentRedundancy,
      title: "Challenge redundancy selection matrix",
      description: "Prepare detailed analysis of scoring inconsistencies",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.associate3,
      createdById: DEMO_IDS.users.associate3,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    // Probate tasks
    {
      id: DEMO_IDS.tasks.task16,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      title: "Apply for grant of probate",
      description: "Submit PA1P application with IHT forms",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.paralegal2,
      createdById: DEMO_IDS.users.paralegal2,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task17,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      title: "Value estate assets",
      description: "Obtain valuations for property and investments",
      status: "in_progress" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.paralegal2,
      createdById: DEMO_IDS.users.paralegal2,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task18,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateDispute,
      title: "Draft letter of claim under Inheritance Act",
      description: "Prepare detailed claim for reasonable financial provision",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.seniorPartner,
      createdById: DEMO_IDS.users.seniorPartner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    // Criminal tasks
    {
      id: DEMO_IDS.tasks.task19,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      title: "Review breathalyser calibration records",
      description: "Obtain and analyse device maintenance logs",
      status: "in_progress" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(today),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task20,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalFraud,
      title: "Prepare defence case statement",
      description: "Draft detailed defence under CPIA requirements",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.seniorPartner,
      createdById: DEMO_IDS.users.seniorPartner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    // Immigration tasks
    {
      id: DEMO_IDS.tasks.task21,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      title: "Submit visa application online",
      description: "Complete and submit application via UK Visas portal",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate2,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task22,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationSpouse,
      title: "Gather financial evidence",
      description: "Collect 6 months payslips and bank statements",
      status: "in_progress" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(today),
      createdAt: now,
      updatedAt: now,
    },
    // Commercial tasks
    {
      id: DEMO_IDS.tasks.task23,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      title: "Draft drag-along rights clause",
      description: "Prepare protective provisions for minority shareholders",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.seniorPartner,
      createdById: DEMO_IDS.users.seniorPartner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task24,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      title: "Review investor term sheet",
      description: "Analyse Series A funding terms and conditions",
      status: "completed" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.seniorPartner,
      createdById: DEMO_IDS.users.seniorPartner,
      dueDate: new Date(yesterday),
      completedAt: now,
      createdAt: new Date(twoDaysAgo),
      updatedAt: now,
    },
    // Additional conveyancing tasks
    {
      id: DEMO_IDS.tasks.task25,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancingSale,
      title: "Obtain energy performance certificate",
      description: "Arrange EPC inspection for property sale",
      status: "pending" as const,
      priority: "low" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(nextMonth),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task26,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancingSale,
      title: "Complete property information forms",
      description: "TA6 and TA10 forms with client",
      status: "in_progress" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.associate2,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task27,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancingLeasehold,
      title: "Review lease terms and restrictions",
      description: "Check lease for onerous covenants and ground rent",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate2,
      createdById: DEMO_IDS.users.associate2,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
    },
    // Overdue tasks
    {
      id: DEMO_IDS.tasks.task28,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationContract,
      title: "Chase witness statement from client",
      description: "Follow up - statement now 3 days overdue",
      status: "pending" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.seniorPartner,
      createdById: DEMO_IDS.users.seniorPartner,
      dueDate: new Date(twoDaysAgo),
      createdAt: new Date(twoDaysAgo),
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task29,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryCICA,
      title: "Submit CICA application",
      description: "Complete online CICA claim form - deadline approaching",
      status: "pending" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.partner,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(yesterday),
      createdAt: new Date(twoDaysAgo),
      updatedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task30,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyPrenup,
      title: "Arrange independent legal advice for client's partner",
      description: "Refer partner to separate solicitor for ILA on prenup",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.seniorPartner,
      createdById: DEMO_IDS.users.seniorPartner,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const taskData of tasksData) {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .onConflictDoUpdate({
        target: tasks.id,
        set: { updatedAt: now },
      })
      .returning();

    result.tasks.push({
      id: task.id,
      title: task.title,
      status: task.status,
    });
    console.log(`    Created task: ${task.title.substring(0, 50)}...`);
  }

  // 7. Create invoices
  const invoicesData = [
    // Draft invoices (2)
    {
      id: DEMO_IDS.invoices.inv1,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual,
      matterId: DEMO_IDS.matters.conveyancing,
      invoiceNumber: "INV-2024-001",
      status: "draft" as const,
      invoiceDate: "2024-11-01",
      dueDate: "2024-12-01",
      subtotal: "500.00",
      vatAmount: "100.00",
      vatRate: "20.00",
      total: "600.00",
      paidAmount: "0.00",
      balanceDue: "600.00",
      terms: "Payment due within 30 days",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv2,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company,
      matterId: DEMO_IDS.matters.litigation,
      invoiceNumber: "INV-2024-002",
      status: "draft" as const,
      invoiceDate: "2024-11-05",
      dueDate: "2024-12-05",
      subtotal: "1750.00",
      vatAmount: "350.00",
      vatRate: "20.00",
      total: "2100.00",
      paidAmount: "0.00",
      balanceDue: "2100.00",
      terms: "Payment due within 30 days",
      createdAt: now,
      updatedAt: now,
    },
    // Sent invoices (3)
    {
      id: DEMO_IDS.invoices.inv3,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual3,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      invoiceNumber: "INV-2024-003",
      status: "sent" as const,
      invoiceDate: "2024-10-15",
      dueDate: "2024-11-15",
      subtotal: "1250.00",
      vatAmount: "250.00",
      vatRate: "20.00",
      total: "1500.00",
      paidAmount: "0.00",
      balanceDue: "1500.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-10-15T10:00:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv4,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company3,
      matterId: DEMO_IDS.matters.commercialShareholder,
      invoiceNumber: "INV-2024-004",
      status: "sent" as const,
      invoiceDate: "2024-10-20",
      dueDate: "2024-11-20",
      subtotal: "3500.00",
      vatAmount: "700.00",
      vatRate: "20.00",
      total: "4200.00",
      paidAmount: "0.00",
      balanceDue: "4200.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-10-20T14:30:00Z"),
      viewedAt: new Date("2024-10-21T09:15:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv5,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual4,
      matterId: DEMO_IDS.matters.employmentDismissal,
      invoiceNumber: "INV-2024-005",
      status: "sent" as const,
      invoiceDate: "2024-10-25",
      dueDate: "2024-11-25",
      subtotal: "2800.00",
      vatAmount: "560.00",
      vatRate: "20.00",
      total: "3360.00",
      paidAmount: "0.00",
      balanceDue: "3360.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-10-25T16:00:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    // Partially paid invoices (2)
    {
      id: DEMO_IDS.invoices.inv6,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company4,
      matterId: DEMO_IDS.matters.litigationContract,
      invoiceNumber: "INV-2024-006",
      status: "partially_paid" as const,
      invoiceDate: "2024-09-15",
      dueDate: "2024-10-15",
      subtotal: "5000.00",
      vatAmount: "1000.00",
      vatRate: "20.00",
      total: "6000.00",
      paidAmount: "3000.00",
      balanceDue: "3000.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-09-15T11:00:00Z"),
      viewedAt: new Date("2024-09-15T15:30:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv7,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual7,
      matterId: DEMO_IDS.matters.familyChild,
      invoiceNumber: "INV-2024-007",
      status: "partially_paid" as const,
      invoiceDate: "2024-09-20",
      dueDate: "2024-10-20",
      subtotal: "4500.00",
      vatAmount: "900.00",
      vatRate: "20.00",
      total: "5400.00",
      paidAmount: "2000.00",
      balanceDue: "3400.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-09-20T09:30:00Z"),
      viewedAt: new Date("2024-09-20T11:45:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    // Paid invoices (3)
    {
      id: DEMO_IDS.invoices.inv8,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual5,
      matterId: DEMO_IDS.matters.personalInjurySlip,
      invoiceNumber: "INV-2024-008",
      status: "paid" as const,
      invoiceDate: "2024-08-10",
      dueDate: "2024-09-10",
      subtotal: "850.00",
      vatAmount: "170.00",
      vatRate: "20.00",
      total: "1020.00",
      paidAmount: "1020.00",
      balanceDue: "0.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-08-10T10:00:00Z"),
      viewedAt: new Date("2024-08-10T14:20:00Z"),
      paidAt: new Date("2024-08-25T11:30:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv9,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company5,
      matterId: DEMO_IDS.matters.conveyancingRemortgage,
      invoiceNumber: "INV-2024-009",
      status: "paid" as const,
      invoiceDate: "2024-08-05",
      dueDate: "2024-09-05",
      subtotal: "2500.00",
      vatAmount: "500.00",
      vatRate: "20.00",
      total: "3000.00",
      paidAmount: "3000.00",
      balanceDue: "0.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-08-05T09:00:00Z"),
      viewedAt: new Date("2024-08-05T10:15:00Z"),
      paidAt: new Date("2024-08-20T14:00:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv10,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual5,
      matterId: DEMO_IDS.matters.employmentSettlement,
      invoiceNumber: "INV-2024-010",
      status: "paid" as const,
      invoiceDate: "2024-07-20",
      dueDate: "2024-08-20",
      subtotal: "3750.00",
      vatAmount: "750.00",
      vatRate: "20.00",
      total: "4500.00",
      paidAmount: "4500.00",
      balanceDue: "0.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-07-20T10:30:00Z"),
      viewedAt: new Date("2024-07-20T16:00:00Z"),
      paidAt: new Date("2024-08-05T09:45:00Z"),
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const invoiceData of invoicesData) {
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .onConflictDoUpdate({
        target: invoices.id,
        set: { updatedAt: now },
      })
      .returning();

    console.log(`    Created invoice: ${invoice.invoiceNumber} - ${invoice.status}`);
  }

  // 8. Create payments
  const paymentsData = [
    // Payment for inv6 (partially paid)
    {
      id: DEMO_IDS.payments.pay1,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv6,
      amount: "3000.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-10-01",
      reference: "BACS-123456",
      notes: "Partial payment - balance to follow",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv7 (partially paid)
    {
      id: DEMO_IDS.payments.pay2,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv7,
      amount: "2000.00",
      method: "card" as const,
      paymentDate: "2024-10-05",
      reference: "CARD-789012",
      notes: "Initial payment via client portal",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv8 (paid in full)
    {
      id: DEMO_IDS.payments.pay3,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv8,
      amount: "1020.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-08-25",
      reference: "BACS-345678",
      notes: "Full payment received",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv9 (paid in full)
    {
      id: DEMO_IDS.payments.pay4,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv9,
      amount: "3000.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-08-20",
      reference: "BACS-456789",
      notes: "Remortgage completion payment",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv10 (paid in full)
    {
      id: DEMO_IDS.payments.pay5,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv10,
      amount: "4500.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-08-05",
      reference: "BACS-567890",
      notes: "Settlement agreement fee paid",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
  ];

  for (const paymentData of paymentsData) {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .onConflictDoUpdate({
        target: payments.id,
        set: { createdAt: now },
      })
      .returning();

    console.log(`    Created payment: ${payment.reference} - £${payment.amount}`);
  }

  console.log("\n✓ Demo data seeded successfully!\n");
  console.log("Summary:");
  console.log(`  Firm: ${result.firm.name}`);
  console.log(`  Users: ${result.users.length}`);
  console.log(`  Clients: ${result.clients.length}`);
  console.log(`  Matters: ${result.matters.length}`);
  console.log(`  Time Entries: ${result.timeEntries.length}`);
  console.log(`  Tasks: ${result.tasks.length}`);
  console.log(`  Invoices: ${invoicesData.length}`);
  console.log(`  Payments: ${paymentsData.length}`);

  return result;
}

/**
 * Reset demo data (clear then seed)
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
