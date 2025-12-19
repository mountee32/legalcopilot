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

    // ==========================================================
    // AML Stage Evidence (Stage 2)
    // ==========================================================
    // Evidence for Task 46: Verify client identity
    {
      id: DEMO_IDS.evidenceItems.ev6,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task46, // Verify client identity task
      type: "id_document" as const,
      description: "Client passport - Margaret Thompson",
      documentId: DEMO_IDS.documents.doc12,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: new Date(now.getTime() - 11 * 86400000),
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 11 * 86400000),
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
      createdAt: new Date(now.getTime() - 11 * 86400000),
    },

    // Evidence for Task 47: Verify source of funds
    {
      id: DEMO_IDS.evidenceItems.ev10,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task47,
      type: "source_of_wealth" as const,
      description: "HSBC bank statements (6 months) showing savings accumulation",
      documentId: DEMO_IDS.documents.doc9,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: new Date(now.getTime() - 10 * 86400000),
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 10 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Bank statements from HSBC Premier account. Regular salary deposits from Unilever (Senior Marketing Manager). Savings accumulated over 18 months. Source of deposit: employment income.",
      metadata: {
        bank: "HSBC",
        accountType: "Premier Current Account",
        periodCovered: "June 2024 - November 2024",
        monthlyIncome: "8500",
        employer: "Unilever UK Ltd",
      },
      createdAt: new Date(now.getTime() - 10 * 86400000),
    },

    // Evidence for Task 48: Complete AML risk assessment
    {
      id: DEMO_IDS.evidenceItems.ev11,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task48,
      type: "other" as const,
      description: "AML Risk Assessment Form - completed",
      documentId: null, // Internal form, no document upload
      addedById: DEMO_IDS.users.associate,
      addedAt: new Date(now.getTime() - 10 * 86400000),
      verifiedById: DEMO_IDS.users.partner,
      verifiedAt: new Date(now.getTime() - 10 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Risk Assessment: LOW. UK national, employed professional, source of funds verified from employment. No PEP indicators. No adverse sanctions/media checks. Standard residential purchase within expected range for income level.",
      metadata: {
        riskLevel: "LOW",
        pepCheck: "Clear",
        sanctionsCheck: "Clear",
        adverseMediaCheck: "Clear",
        assessmentDate: "2024-12-09",
      },
      createdAt: new Date(now.getTime() - 10 * 86400000),
    },

    // ==========================================================
    // Onboarding Stage Evidence (Stage 1)
    // ==========================================================
    // Evidence for Task 43: Record client instruction
    {
      id: DEMO_IDS.evidenceItems.ev7,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task43,
      type: "other" as const,
      description: "Initial client instruction file note",
      documentId: null, // Internal file note
      addedById: DEMO_IDS.users.associate,
      addedAt: new Date(now.getTime() - 13 * 86400000),
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 13 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Client instruction recorded: Purchase 15 Willow Lane, Richmond TW10 6PQ. Price £850,000. Mortgage via Nationwide (£675,000). Target completion 4-6 weeks. First-time buyer status confirmed.",
      metadata: {
        propertyAddress: "15 Willow Lane, Richmond, TW10 6PQ",
        purchasePrice: "850000",
        mortgageAmount: "675000",
        lender: "Nationwide Building Society",
        instructionDate: "2024-12-06",
      },
      createdAt: new Date(now.getTime() - 13 * 86400000),
    },

    // Evidence for Task 44: Issue client care letter
    {
      id: DEMO_IDS.evidenceItems.ev8,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task44,
      type: "signed_authority" as const,
      description: "Signed client care letter and terms of engagement",
      documentId: DEMO_IDS.documents.doc1, // Linking to existing doc
      addedById: DEMO_IDS.users.associate,
      addedAt: new Date(now.getTime() - 12 * 86400000),
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 12 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Client care letter sent 7 Dec 2024. Signed copy received by email. Fee estimate: £1,850 + VAT + disbursements. Scope: standard residential freehold purchase.",
      metadata: {
        sentDate: "2024-12-07",
        signedDate: "2024-12-07",
        feeEstimate: "1850",
        vatApplicable: "true",
      },
      createdAt: new Date(now.getTime() - 12 * 86400000),
    },

    // Evidence for Task 45: Complete conflict check
    {
      id: DEMO_IDS.evidenceItems.ev9,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task45,
      type: "other" as const,
      description: "Conflict of interest check result - clear",
      documentId: null, // Internal system check
      addedById: DEMO_IDS.users.associate,
      addedAt: new Date(now.getTime() - 13 * 86400000),
      verifiedById: DEMO_IDS.users.partner,
      verifiedAt: new Date(now.getTime() - 13 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Conflict check completed. No existing relationships with: seller (Mr & Mrs Davidson), estate agent (Savills Richmond), or lender (Nationwide). Clear to proceed.",
      metadata: {
        sellerName: "Mr & Mrs Davidson",
        estateAgent: "Savills Richmond",
        lender: "Nationwide Building Society",
        checkResult: "CLEAR",
        checkDate: "2024-12-06",
      },
      createdAt: new Date(now.getTime() - 13 * 86400000),
    },

    // ==========================================================
    // Investigation Stage Evidence (Stage 3)
    // ==========================================================
    // Evidence for Task 2: Order local searches
    {
      id: DEMO_IDS.evidenceItems.ev12,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task2,
      type: "search_result" as const,
      description: "Local authority search - Richmond upon Thames",
      documentId: DEMO_IDS.documents.doc10,
      addedById: DEMO_IDS.users.paralegal1,
      addedAt: new Date(now.getTime() - 8 * 86400000),
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 8 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Official local authority search received. No adverse entries. Road adopted. No planning applications affecting property. No tree preservation orders. No conservation area restrictions.",
      metadata: {
        searchProvider: "TM Group",
        localAuthority: "London Borough of Richmond upon Thames",
        searchDate: "2024-12-11",
        searchReference: "LAS-2024-87654",
      },
      createdAt: new Date(now.getTime() - 8 * 86400000),
    },

    // Evidence for Task 3: Draft contract report
    {
      id: DEMO_IDS.evidenceItems.ev13,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task3,
      type: "client_instruction" as const,
      description: "Contract report to client - acknowledged",
      documentId: DEMO_IDS.documents.doc2,
      addedById: DEMO_IDS.users.associate,
      addedAt: new Date(now.getTime() - 5 * 86400000),
      verifiedById: DEMO_IDS.users.associate,
      verifiedAt: new Date(now.getTime() - 5 * 86400000),
      verificationMethod: "manual" as const,
      verificationNotes:
        "Comprehensive contract report sent to client. Covers title analysis, search results, contract terms, and recommendations. Client confirmed receipt and understanding.",
      metadata: {
        reportDate: "2024-12-14",
        sentMethod: "Email",
        clientAcknowledged: "true",
      },
      createdAt: new Date(now.getTime() - 5 * 86400000),
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
