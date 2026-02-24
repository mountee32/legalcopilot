/**
 * Demo Data Seeder — Document Templates
 *
 * Seeds a system-level PI Demand Letter template with merge fields
 * and AI narrative sections for document generation.
 */

import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

const PI_DEMAND_LETTER_CONTENT = `{{firm.name}}

{{today}}

{{client.name}}
{{client.address}}

Dear {{client.firstName}},

Re: Personal Injury Claim — {{matter.reference}}
    {{matter.title}}

We write on your behalf in connection with the above matter.

BACKGROUND

Our client, {{client.name}}, suffered injuries as a result of the negligence of {{findings.defendant_name}} on or about {{findings.incident_date}} at {{findings.incident_location}}.

LIABILITY

{{AI:liability_narrative}}

INJURIES AND TREATMENT

{{AI:injury_narrative}}

DAMAGES AND QUANTUM

{{AI:damages_narrative}}

DEMAND

In light of the foregoing, our client demands the sum of {{findings.total_demand}} in full and final settlement of this claim. This sum comprises general damages for pain, suffering, and loss of amenity, together with special damages as set out above.

We invite your response within 21 days of the date of this letter. In the absence of a satisfactory response, our client reserves the right to commence proceedings without further notice.

Yours faithfully,

{{feeEarner.name}}
{{firm.name}}`;

const MERGE_FIELDS = {
  "firm.name": { source: "firm", description: "Law firm name" },
  today: { source: "system", description: "Current date" },
  "client.name": { source: "client", description: "Full client name" },
  "client.firstName": { source: "client", description: "Client first name" },
  "client.address": { source: "client", description: "Client address" },
  "matter.reference": { source: "matter", description: "Matter reference number" },
  "matter.title": { source: "matter", description: "Matter title" },
  "findings.defendant_name": {
    source: "findings",
    description: "Defendant name from pipeline extraction",
  },
  "findings.incident_date": {
    source: "findings",
    description: "Date of incident from pipeline extraction",
  },
  "findings.incident_location": {
    source: "findings",
    description: "Location of incident from pipeline extraction",
  },
  "findings.total_demand": {
    source: "findings",
    description: "Total demand amount from pipeline extraction",
  },
  "feeEarner.name": { source: "user", description: "Assigned fee earner name" },
  "AI:liability_narrative": {
    source: "ai",
    description: "AI-generated liability narrative based on extracted findings",
  },
  "AI:injury_narrative": {
    source: "ai",
    description: "AI-generated injury description based on medical findings",
  },
  "AI:damages_narrative": {
    source: "ai",
    description: "AI-generated damages calculation narrative",
  },
};

export async function seedTemplates(ctx: SeederContext) {
  console.log("  📝 Seeding document templates...");

  // System-level PI Demand Letter template (firmId = null)
  await db
    .insert(templates)
    .values({
      id: DEMO_IDS.documentTemplates.piDemandLetter,
      firmId: null,
      name: "PI Demand Letter",
      type: "document",
      category: "personal_injury",
      content: PI_DEMAND_LETTER_CONTENT,
      mergeFields: MERGE_FIELDS,
      isActive: true,
      version: 1,
    })
    .onConflictDoUpdate({
      target: templates.id,
      set: {
        name: "PI Demand Letter",
        content: PI_DEMAND_LETTER_CONTENT,
        mergeFields: MERGE_FIELDS,
        updatedAt: new Date(),
      },
    });

  console.log("    ✓ PI Demand Letter template (system)");
}
