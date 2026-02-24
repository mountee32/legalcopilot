/**
 * Demo Data Seeder — Taxonomy
 *
 * Seeds a firm-owned PI pack (forked from system) and updates the
 * PI RTA matter (MAT-DEMO-008) with a calculated risk score.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { taxonomyPacks, matters } from "@/lib/db/schema";
import { DEMO_IDS, DEMO_FIRM_ID } from "../ids";
import type { SeederContext } from "../types";

const PI_SYSTEM_PACK_ID = "de000000-0000-4000-b200-000000000001";

export async function seedTaxonomy(ctx: SeederContext) {
  console.log("  📚 Seeding taxonomy demo data...");

  // Check if the PI system pack exists (it's seeded separately via test seeds)
  const [systemPack] = await db
    .select({ id: taxonomyPacks.id })
    .from(taxonomyPacks)
    .where(eq(taxonomyPacks.id, PI_SYSTEM_PACK_ID));

  const parentPackId = systemPack ? PI_SYSTEM_PACK_ID : null;

  // 1. Create a firm-owned PI pack (as if forked from system)
  await db
    .insert(taxonomyPacks)
    .values({
      id: DEMO_IDS.taxonomyPacks.piCustom,
      firmId: DEMO_FIRM_ID,
      key: "personal-injury-firm",
      version: "1.0.0",
      name: "Personal Injury (Harrison & Clarke)",
      description:
        "Customized PI extraction pack with adjusted confidence thresholds for firm workflow.",
      practiceArea: "personal_injury",
      isSystem: false,
      isActive: true,
      parentPackId,
    })
    .onConflictDoUpdate({
      target: taxonomyPacks.id,
      set: {
        name: "Personal Injury (Harrison & Clarke)",
        description:
          "Customized PI extraction pack with adjusted confidence thresholds for firm workflow.",
        parentPackId,
      },
    });

  // 2. Update PI RTA matter (MAT-DEMO-008) with a risk score
  const riskFactors = [
    {
      key: "critical_pending",
      label: "Critical pending findings",
      contribution: 30,
      detail: "2 critical findings awaiting review",
    },
    {
      key: "high_impact_ratio",
      label: "High-impact finding ratio",
      contribution: 14,
      detail: "7 of 10 findings are high or critical impact",
    },
    {
      key: "unresolved_pending",
      label: "Unresolved findings",
      contribution: 10,
      detail: "5 findings still pending review",
    },
  ];

  await db
    .update(matters)
    .set({
      riskScore: 62,
      riskFactors,
      riskAssessedAt: new Date("2026-02-20T14:30:00Z"),
      updatedAt: new Date(),
    })
    .where(eq(matters.id, DEMO_IDS.matters.personalInjuryRTA));

  // Also give the litigation matter a moderate risk score
  await db
    .update(matters)
    .set({
      riskScore: 35,
      riskFactors: [
        {
          key: "unresolved_pending",
          label: "Unresolved findings",
          contribution: 8,
          detail: "4 findings still pending review",
        },
        {
          key: "low_confidence",
          label: "Low average confidence",
          contribution: 8,
          detail: "Average confidence 78% across 4 findings",
        },
      ],
      riskAssessedAt: new Date("2026-02-18T10:15:00Z"),
      updatedAt: new Date(),
    })
    .where(eq(matters.id, DEMO_IDS.matters.litigation));

  console.log("    ✓ Firm PI pack created (forked from system)");
  console.log("    ✓ Risk scores set: PI RTA = 62, Litigation = 35");
}
