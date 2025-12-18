import { db } from "@/lib/db";
import { riskEvaluations, complianceRules } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedCompliance(ctx: SeederContext) {
  console.log("  Seeding compliance data...");

  const now = ctx.now;

  // 1. Create risk evaluations
  const riskEvaluationsData = [
    // Low risk (10-33): routine conveyancing
    {
      id: DEMO_IDS.riskEvaluations.risk1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      score: 15,
      severity: "low" as const,
      factors: [
        { factor: "routine_matter", weight: 0.5, evidence: "Standard residential purchase" },
        { factor: "experienced_handler", weight: 0.3, evidence: "Senior partner assigned" },
        { factor: "adequate_timeline", weight: 0.2, evidence: "4 weeks to completion" },
      ],
      recommendations: [
        "Continue with standard conveyancing procedures",
        "Ensure all searches are ordered promptly",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-10-01T09:00:00Z"),
    },
    {
      id: DEMO_IDS.riskEvaluations.risk2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancingSale,
      score: 22,
      severity: "low" as const,
      factors: [
        { factor: "routine_matter", weight: 0.5, evidence: "Standard property sale" },
        { factor: "clear_title", weight: 0.3, evidence: "No title issues identified" },
        { factor: "cooperative_parties", weight: 0.2, evidence: "Both parties engaged" },
      ],
      recommendations: ["Proceed with standard sale process", "Monitor completion timeline"],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-09-15T10:30:00Z"),
    },
    // Medium risk (34-66): standard litigation
    {
      id: DEMO_IDS.riskEvaluations.risk3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      score: 45,
      severity: "medium" as const,
      factors: [
        { factor: "value_at_stake", weight: 0.4, evidence: "£85k claim value" },
        { factor: "witness_availability", weight: 0.3, evidence: "Key witness located overseas" },
        {
          factor: "legal_complexity",
          weight: 0.3,
          evidence: "Breach of contract with counterclaim",
        },
      ],
      recommendations: [
        "Secure witness testimony via video link",
        "Consider mediation to reduce costs",
        "Maintain detailed case chronology",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-10-05T14:20:00Z"),
    },
    {
      id: DEMO_IDS.riskEvaluations.risk4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationDebt,
      score: 52,
      severity: "medium" as const,
      factors: [
        {
          factor: "debtor_solvency",
          weight: 0.4,
          evidence: "Debtor showing signs of financial distress",
        },
        { factor: "evidence_strength", weight: 0.3, evidence: "Strong documentary evidence" },
        {
          factor: "enforcement_risk",
          weight: 0.3,
          evidence: "May require enforcement proceedings",
        },
      ],
      recommendations: [
        "Consider statutory demand before proceedings",
        "Investigate debtor assets for enforcement",
        "Prepare for potential insolvency",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-09-20T11:15:00Z"),
    },
    {
      id: DEMO_IDS.riskEvaluations.risk5,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      score: 58,
      severity: "medium" as const,
      factors: [
        {
          factor: "high_conflict",
          weight: 0.4,
          evidence: "Parties unable to communicate effectively",
        },
        { factor: "child_custody", weight: 0.3, evidence: "Disputed child arrangements" },
        {
          factor: "asset_complexity",
          weight: 0.3,
          evidence: "Multiple properties and pensions to divide",
        },
      ],
      recommendations: [
        "Recommend mediation for child arrangements",
        "Obtain pension valuations early",
        "Consider counsel for financial remedy hearing",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-09-10T16:45:00Z"),
    },
    // High risk (67-89): complex employment
    {
      id: DEMO_IDS.riskEvaluations.risk6,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      score: 72,
      severity: "high" as const,
      factors: [
        {
          factor: "discrimination_claim",
          weight: 0.4,
          evidence: "Client alleges age discrimination",
        },
        {
          factor: "weak_documentation",
          weight: 0.3,
          evidence: "Employer's dismissal procedure poorly documented",
        },
        {
          factor: "reputational_risk",
          weight: 0.3,
          evidence: "High-profile company with media interest",
        },
      ],
      recommendations: [
        "Engage specialist discrimination counsel immediately",
        "Prepare comprehensive witness statements",
        "Consider early settlement to avoid publicity",
        "Ensure ACAS early conciliation completed",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-10-08T13:30:00Z"),
    },
    {
      id: DEMO_IDS.riskEvaluations.risk7,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationContract,
      score: 76,
      severity: "high" as const,
      factors: [
        { factor: "high_value", weight: 0.4, evidence: "£500k+ claim value" },
        {
          factor: "complex_contract",
          weight: 0.3,
          evidence: "Multiple jurisdictions and governing laws",
        },
        { factor: "tight_deadline", weight: 0.3, evidence: "Limitation period expires in 6 weeks" },
      ],
      recommendations: [
        "Instruct leading counsel urgently",
        "Conduct detailed conflicts check",
        "Issue protective proceedings before limitation",
        "Consider jurisdiction challenges",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-10-10T09:00:00Z"),
    },
    {
      id: DEMO_IDS.riskEvaluations.risk8,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateDispute,
      score: 68,
      severity: "high" as const,
      factors: [
        {
          factor: "will_challenge",
          weight: 0.4,
          evidence: "Validity of will disputed on capacity grounds",
        },
        { factor: "family_conflict", weight: 0.3, evidence: "Multiple beneficiaries in dispute" },
        {
          factor: "asset_valuation",
          weight: 0.3,
          evidence: "Estate includes business interests requiring valuation",
        },
      ],
      recommendations: [
        "Obtain medical evidence on testamentary capacity",
        "Consider professional executor appointment",
        "Engage business valuation expert",
        "Explore mediation between beneficiaries",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-09-05T15:20:00Z"),
    },
    // Critical risk (90-100): high-value fraud case
    {
      id: DEMO_IDS.riskEvaluations.risk9,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalFraud,
      score: 95,
      severity: "critical" as const,
      factors: [
        { factor: "serious_charge", weight: 0.4, evidence: "Conspiracy to defraud exceeding £2m" },
        {
          factor: "crown_court_trial",
          weight: 0.3,
          evidence: "Complex multi-handed trial estimated 8 weeks",
        },
        {
          factor: "disclosure_volume",
          weight: 0.15,
          evidence: "Over 10,000 pages of unused material",
        },
        {
          factor: "client_risk",
          weight: 0.15,
          evidence: "Client previously failed to attend hearings",
        },
      ],
      recommendations: [
        "URGENT: Instruct leading QC and junior counsel immediately",
        "Engage forensic accountant for expert evidence",
        "Implement strict client liaison protocol",
        "Request case management hearing for disclosure issues",
        "Consider costs implications and funding arrangements",
        "Ensure adequate professional indemnity insurance coverage",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-10-12T08:00:00Z"),
    },
    {
      id: DEMO_IDS.riskEvaluations.risk10,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      score: 88,
      severity: "critical" as const,
      factors: [
        { factor: "high_value", weight: 0.4, evidence: "£10m company valuation dispute" },
        {
          factor: "injunction_risk",
          weight: 0.3,
          evidence: "Client seeking urgent freezing order",
        },
        {
          factor: "jurisdictional_issues",
          weight: 0.2,
          evidence: "Offshore assets and entities involved",
        },
        { factor: "time_critical", weight: 0.1, evidence: "Application required within 48 hours" },
      ],
      recommendations: [
        "CRITICAL: Prepare without notice application immediately",
        "Instruct commercial QC for urgent advice",
        "Conduct comprehensive asset trace",
        "Prepare detailed evidence of risk of dissipation",
        "Consider cross-border enforcement mechanisms",
        "Obtain senior partner approval for undertaking exposure",
      ],
      aiModel: "gpt-4",
      evaluatedAt: new Date("2024-10-11T17:30:00Z"),
    },
  ];

  const createdRiskEvaluations = [];

  for (const riskData of riskEvaluationsData) {
    const [risk] = await db
      .insert(riskEvaluations)
      .values(riskData)
      .onConflictDoUpdate({
        target: riskEvaluations.id,
        set: { evaluatedAt: riskData.evaluatedAt },
      })
      .returning();

    createdRiskEvaluations.push(risk);

    console.log(
      `    Created risk evaluation: Matter ${risk.matterId.slice(0, 8)}... - ${risk.severity} (score: ${risk.score})`
    );
  }

  // 2. Create compliance rules
  const complianceRulesData = [
    {
      id: DEMO_IDS.complianceRules.rule1,
      firmId: DEMO_IDS.firm,
      name: "Deadline Warning",
      description:
        "Alert fee earners 7 days before matter deadlines to ensure adequate preparation time",
      type: "deadline" as const,
      isActive: true,
      condition: {
        type: "deadline",
        warningDays: 7,
        criticalDays: 2,
        practiceAreas: ["conveyancing", "litigation", "employment", "immigration"],
      },
      alertPriority: "warning" as const,
      alertTemplate:
        "Matter {{matterReference}} has a deadline in {{daysRemaining}} days: {{deadlineDescription}}",
      checkInterval: 86400, // Daily
      createdBy: DEMO_IDS.users.seniorPartner,
    },
    {
      id: DEMO_IDS.complianceRules.rule2,
      firmId: DEMO_IDS.firm,
      name: "Workload Limit",
      description:
        "Warn supervisors when fee earners exceed 25 active matters to prevent burnout and maintain quality",
      type: "workload" as const,
      isActive: true,
      condition: {
        type: "workload",
        maxActiveMatters: 25,
        threshold: "warning",
        excludeStatuses: ["completed", "archived"],
      },
      alertPriority: "warning" as const,
      alertTemplate: "{{userName}} currently has {{activeMatterCount}} active matters (limit: 25)",
      checkInterval: 86400, // Daily
      createdBy: DEMO_IDS.users.seniorPartner,
    },
    {
      id: DEMO_IDS.complianceRules.rule3,
      firmId: DEMO_IDS.firm,
      name: "Supervision Required",
      description:
        "Ensure trainee solicitors have adequate supervision on all matters per SRA requirements",
      type: "supervision" as const,
      isActive: true,
      condition: {
        type: "supervision",
        requiresSupervisor: true,
        roles: ["trainee", "paralegal"],
        minSupervisionLevel: "associate",
      },
      alertPriority: "urgent" as const,
      alertTemplate:
        "Matter {{matterReference}} assigned to {{userName}} (trainee) has no assigned supervisor",
      checkInterval: 3600, // Hourly
      createdBy: DEMO_IDS.users.seniorPartner,
    },
    {
      id: DEMO_IDS.complianceRules.rule4,
      firmId: DEMO_IDS.firm,
      name: "Conflict Check",
      description:
        "Require conflict checks before matter opening and periodic reviews for ongoing matters",
      type: "conflict" as const,
      isActive: true,
      condition: {
        type: "conflict",
        checkOnOpen: true,
        periodicReviewDays: 90,
        includePotentialConflicts: true,
      },
      alertPriority: "critical" as const,
      alertTemplate:
        "Matter {{matterReference}} requires conflict check review (last checked: {{lastCheckDate}})",
      checkInterval: 86400, // Daily
      createdBy: DEMO_IDS.users.seniorPartner,
    },
    {
      id: DEMO_IDS.complianceRules.rule5,
      firmId: DEMO_IDS.firm,
      name: "Document Retention",
      description:
        "Ensure compliance with SRA document retention requirements (7 years for most matters)",
      type: "document" as const,
      isActive: true,
      condition: {
        type: "document",
        retentionYears: 7,
        warningDays: 30, // Warn 30 days before deletion
        exemptPracticeAreas: [], // All areas subject to retention
      },
      alertPriority: "info" as const,
      alertTemplate:
        "Matter {{matterReference}} documents are due for review/deletion in {{daysRemaining}} days",
      checkInterval: 604800, // Weekly
      createdBy: DEMO_IDS.users.seniorPartner,
    },
  ];

  const createdComplianceRules = [];

  for (const ruleData of complianceRulesData) {
    const [rule] = await db
      .insert(complianceRules)
      .values(ruleData)
      .onConflictDoUpdate({
        target: complianceRules.id,
        set: { updatedAt: now },
      })
      .returning();

    createdComplianceRules.push(rule);

    console.log(`    Created compliance rule: ${rule.name} (${rule.type})`);
  }

  return {
    riskEvaluations: createdRiskEvaluations,
    complianceRules: createdComplianceRules,
  };
}
