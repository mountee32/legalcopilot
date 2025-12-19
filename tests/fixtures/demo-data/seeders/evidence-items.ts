import { db } from "@/lib/db";
import { evidenceItems } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedEvidenceItems(ctx: SeederContext) {
  console.log("  Seeding evidence items...");
  const result: Array<{ id: string; taskId: string; type: string }> = [];

  const now = ctx.now;
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 172800000);
  const threeDaysAgo = new Date(now.getTime() - 259200000);
  const weekAgo = new Date(now.getTime() - 604800000);

  const evidenceData = [
    // Evidence for Task 31: Review mortgage offer - verified
    {
      id: DEMO_IDS.evidenceItems.ev1,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task31,
      type: "proof_of_funds" as const,
      description: "Nationwide Building Society mortgage offer dated 10 December 2024",
      documentId: DEMO_IDS.documents.doc8, // Re-using existing demo document
      addedById: DEMO_IDS.users.associate,
      addedAt: threeDaysAgo,
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: twoDaysAgo,
      verificationMethod: "manual" as const,
      verificationNotes:
        "Offer terms match application. Special conditions noted for buildings insurance.",
      metadata: {
        lender: "Nationwide Building Society",
        loanAmount: "675000",
        interestRate: "4.89",
        expiryDate: "2025-02-10",
      },
      createdAt: threeDaysAgo,
    },

    // Evidence for Task 33: Request deposit - source of funds
    {
      id: DEMO_IDS.evidenceItems.ev2,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task33,
      type: "source_of_wealth" as const,
      description: "Client bank statements showing savings history for deposit",
      documentId: DEMO_IDS.documents.doc9,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: yesterday,
      verifiedById: DEMO_IDS.users.paralegal1,
      verifiedAt: yesterday,
      verificationMethod: "manual" as const,
      verificationNotes:
        "6 months statements from HSBC Premier. Shows regular salary deposits and accumulation of funds. Source of deposit: savings from employment income.",
      metadata: {
        bank: "HSBC",
        accountType: "Premier Current Account",
        periodCovered: "June 2024 - November 2024",
      },
      createdAt: yesterday,
    },
    {
      id: DEMO_IDS.evidenceItems.ev3,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task33,
      type: "proof_of_funds" as const,
      description: "Bank transfer confirmation for £75,000 deposit",
      documentId: null, // Will be uploaded once transfer clears
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: now,
      verifiedById: null, // Not yet verified
      verifiedAt: null,
      verificationMethod: null,
      verificationNotes: null,
      metadata: {
        expectedAmount: "75000",
        reference: "MT-DEMO-001/THOMPSON",
        status: "pending_clearance",
      },
      createdAt: now,
    },

    // Evidence for Task 32: Report to lender - search results
    {
      id: DEMO_IDS.evidenceItems.ev4,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task32,
      type: "search_result" as const,
      description: "Local authority search - London Borough of Richmond",
      documentId: DEMO_IDS.documents.doc10,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: weekAgo,
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: threeDaysAgo,
      verificationMethod: "manual" as const,
      verificationNotes:
        "No adverse entries. No planning applications within 200m. Road is adopted. No tree preservation orders.",
      metadata: {
        searchProvider: "TM Group",
        searchDate: "2024-12-05",
        localAuthority: "Richmond upon Thames",
        resultType: "Official",
      },
      createdAt: weekAgo,
    },
    {
      id: DEMO_IDS.evidenceItems.ev5,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task32,
      type: "title_document" as const,
      description: "Official copy of register of title - SY123456",
      documentId: DEMO_IDS.documents.doc11,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: weekAgo,
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: threeDaysAgo,
      verificationMethod: "manual" as const,
      verificationNotes:
        "Title absolute. Registered owner: David Mitchell. No charges except existing mortgage to be discharged. Restrictive covenants from 1952 - standard residential.",
      metadata: {
        titleNumber: "SY123456",
        edition: "2024",
        propertyAddress: "15 Willow Lane, Richmond, TW10 6PQ",
      },
      createdAt: weekAgo,
    },

    // AML evidence - ID verification for client
    {
      id: DEMO_IDS.evidenceItems.ev6,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task1, // Chase enquiries task - AML would be on separate task in real workflow
      type: "id_document" as const,
      description: "Client passport - Margaret Thompson",
      documentId: DEMO_IDS.documents.doc12,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: new Date(now.getTime() - 14 * 86400000), // 2 weeks ago
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 13 * 86400000),
      verificationMethod: "integration" as const,
      verificationNotes:
        "Verified via Credas ID verification service. Document authentic. Photo match confirmed. No adverse flags.",
      metadata: {
        documentType: "British Passport",
        documentNumber: "123456789",
        expiryDate: "2028-05-15",
        verificationProvider: "Credas",
        verificationId: "VRF-2024-78543",
      },
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
  ];

  for (const evidenceItem of evidenceData) {
    const [evidence] = await db
      .insert(evidenceItems)
      .values(evidenceItem)
      .onConflictDoUpdate({
        target: evidenceItems.id,
        set: { description: evidenceItem.description },
      })
      .returning();

    result.push({
      id: evidence.id,
      taskId: evidence.taskId,
      type: evidence.type,
    });
    console.log(
      `    Created evidence: ${evidence.type} - ${evidence.description?.substring(0, 40)}...`
    );
  }

  return result;
}
