import { db } from "@/lib/db";
import { pipelineRuns, pipelineFindings, pipelineActions } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import { daysAgo } from "../types";
import type { SeederContext } from "../types";

export async function seedPipeline(ctx: SeederContext) {
  console.log("  Creating pipeline runs, findings, and actions...");

  // ---------------------------------------------------------------------------
  // Pipeline Runs
  // ---------------------------------------------------------------------------

  const runsData = [
    // PI RTA matter (MAT-DEMO-008) — completed run, medical report
    {
      id: DEMO_IDS.pipelineRuns.piRun1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      status: "completed" as const,
      currentStage: "actions" as const,
      stageStatuses: {
        intake: {
          status: "completed",
          startedAt: daysAgo(5).toISOString(),
          completedAt: new Date(daysAgo(5).getTime() + 2000).toISOString(),
        },
        ocr: {
          status: "completed",
          startedAt: new Date(daysAgo(5).getTime() + 2000).toISOString(),
          completedAt: new Date(daysAgo(5).getTime() + 8000).toISOString(),
        },
        classify: {
          status: "completed",
          startedAt: new Date(daysAgo(5).getTime() + 8000).toISOString(),
          completedAt: new Date(daysAgo(5).getTime() + 15000).toISOString(),
        },
        extract: {
          status: "completed",
          startedAt: new Date(daysAgo(5).getTime() + 15000).toISOString(),
          completedAt: new Date(daysAgo(5).getTime() + 45000).toISOString(),
        },
        reconcile: {
          status: "completed",
          startedAt: new Date(daysAgo(5).getTime() + 45000).toISOString(),
          completedAt: new Date(daysAgo(5).getTime() + 48000).toISOString(),
        },
        actions: {
          status: "completed",
          startedAt: new Date(daysAgo(5).getTime() + 48000).toISOString(),
          completedAt: new Date(daysAgo(5).getTime() + 52000).toISOString(),
        },
      },
      documentHash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      classifiedDocType: "medical_report",
      classificationConfidence: "0.945",
      findingsCount: 7,
      actionsCount: 2,
      totalTokensUsed: 3250,
      startedAt: daysAgo(5),
      completedAt: new Date(daysAgo(5).getTime() + 52000),
      createdAt: daysAgo(5),
      updatedAt: new Date(daysAgo(5).getTime() + 52000),
    },
    // PI RTA matter — second run, demand letter
    {
      id: DEMO_IDS.pipelineRuns.piRun2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc9,
      status: "completed" as const,
      currentStage: "actions" as const,
      stageStatuses: {
        intake: {
          status: "completed",
          startedAt: daysAgo(2).toISOString(),
          completedAt: new Date(daysAgo(2).getTime() + 1800).toISOString(),
        },
        ocr: {
          status: "completed",
          startedAt: new Date(daysAgo(2).getTime() + 1800).toISOString(),
          completedAt: new Date(daysAgo(2).getTime() + 6000).toISOString(),
        },
        classify: {
          status: "completed",
          startedAt: new Date(daysAgo(2).getTime() + 6000).toISOString(),
          completedAt: new Date(daysAgo(2).getTime() + 12000).toISOString(),
        },
        extract: {
          status: "completed",
          startedAt: new Date(daysAgo(2).getTime() + 12000).toISOString(),
          completedAt: new Date(daysAgo(2).getTime() + 38000).toISOString(),
        },
        reconcile: {
          status: "completed",
          startedAt: new Date(daysAgo(2).getTime() + 38000).toISOString(),
          completedAt: new Date(daysAgo(2).getTime() + 41000).toISOString(),
        },
        actions: {
          status: "completed",
          startedAt: new Date(daysAgo(2).getTime() + 41000).toISOString(),
          completedAt: new Date(daysAgo(2).getTime() + 44000).toISOString(),
        },
      },
      documentHash: "b2c3d4e5f678901234567890123456789abcdef01234567890abcdef0123456",
      classifiedDocType: "demand_letter",
      classificationConfidence: "0.880",
      findingsCount: 3,
      actionsCount: 1,
      totalTokensUsed: 2100,
      startedAt: daysAgo(2),
      completedAt: new Date(daysAgo(2).getTime() + 44000),
      createdAt: daysAgo(2),
      updatedAt: new Date(daysAgo(2).getTime() + 44000),
    },
    // Conveyancing matter — completed run
    {
      id: DEMO_IDS.pipelineRuns.convRun1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      documentId: DEMO_IDS.documents.doc1,
      status: "completed" as const,
      currentStage: "actions" as const,
      stageStatuses: {
        intake: {
          status: "completed",
          startedAt: daysAgo(10).toISOString(),
          completedAt: new Date(daysAgo(10).getTime() + 1500).toISOString(),
        },
        ocr: {
          status: "completed",
          startedAt: new Date(daysAgo(10).getTime() + 1500).toISOString(),
          completedAt: new Date(daysAgo(10).getTime() + 5000).toISOString(),
        },
        classify: {
          status: "completed",
          startedAt: new Date(daysAgo(10).getTime() + 5000).toISOString(),
          completedAt: new Date(daysAgo(10).getTime() + 11000).toISOString(),
        },
        extract: {
          status: "completed",
          startedAt: new Date(daysAgo(10).getTime() + 11000).toISOString(),
          completedAt: new Date(daysAgo(10).getTime() + 35000).toISOString(),
        },
        reconcile: {
          status: "completed",
          startedAt: new Date(daysAgo(10).getTime() + 35000).toISOString(),
          completedAt: new Date(daysAgo(10).getTime() + 37000).toISOString(),
        },
        actions: {
          status: "completed",
          startedAt: new Date(daysAgo(10).getTime() + 37000).toISOString(),
          completedAt: new Date(daysAgo(10).getTime() + 40000).toISOString(),
        },
      },
      documentHash: "c3d4e5f67890123456789012345678901abcdef012345678901abcdef01234567",
      classifiedDocType: "contract",
      classificationConfidence: "0.920",
      findingsCount: 2,
      actionsCount: 1,
      totalTokensUsed: 1850,
      startedAt: daysAgo(10),
      completedAt: new Date(daysAgo(10).getTime() + 40000),
      createdAt: daysAgo(10),
      updatedAt: new Date(daysAgo(10).getTime() + 40000),
    },
  ];

  for (const run of runsData) {
    await db
      .insert(pipelineRuns)
      .values(run)
      .onConflictDoUpdate({
        target: pipelineRuns.id,
        set: { status: run.status, stageStatuses: run.stageStatuses, updatedAt: run.updatedAt },
      });
  }

  // ---------------------------------------------------------------------------
  // Pipeline Findings
  // ---------------------------------------------------------------------------

  const findingsData = [
    // piRun1 — medical report findings
    {
      id: DEMO_IDS.pipelineFindings.pf1,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "plaintiff_info",
      fieldKey: "plaintiff_name",
      label: "Plaintiff Full Name",
      value: "Robert James Wilson",
      sourceQuote: "Patient: Robert James Wilson, DOB: 03/15/1985",
      confidence: "0.970",
      impact: "high" as const,
      status: "accepted" as const,
      resolvedAt: new Date(daysAgo(4).getTime()),
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf2,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "incident_details",
      fieldKey: "incident_date",
      label: "Date of Incident",
      value: "2025-08-12",
      sourceQuote: "The patient was involved in a motor vehicle accident on August 12, 2025",
      confidence: "0.950",
      impact: "critical" as const,
      status: "auto_applied" as const,
      resolvedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf3,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "medical_treatment",
      fieldKey: "treating_physician",
      label: "Treating Physician",
      value: "Dr. Sarah Martinez, MD",
      sourceQuote: "Examined by Dr. Sarah Martinez, MD, Board Certified Orthopedic Surgeon",
      confidence: "0.920",
      impact: "medium" as const,
      status: "auto_applied" as const,
      resolvedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf4,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "medical_treatment",
      fieldKey: "diagnosis",
      label: "Primary Diagnosis",
      value: "Cervical spine herniated disc (C5-C6), left knee meniscus tear",
      sourceQuote: "Diagnosis: Cervical disc herniation at C5-C6, Grade II meniscus tear left knee",
      confidence: "0.890",
      impact: "high" as const,
      status: "accepted" as const,
      resolvedAt: new Date(daysAgo(4).getTime()),
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf5,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "medical_treatment",
      fieldKey: "treatment_cost",
      label: "Treatment Cost to Date",
      value: "$42,500",
      sourceQuote: null,
      confidence: "0.780",
      impact: "high" as const,
      status: "pending" as const,
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf6,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "medical_treatment",
      fieldKey: "surgery_required",
      label: "Surgery Required",
      value: "Yes — arthroscopic knee surgery recommended",
      sourceQuote: "Recommend arthroscopic surgery for left knee meniscus repair",
      confidence: "0.910",
      impact: "critical" as const,
      status: "accepted" as const,
      resolvedAt: new Date(daysAgo(4).getTime()),
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf7,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc8,
      categoryKey: "damages_calculation",
      fieldKey: "disability_rating",
      label: "Disability Rating",
      value: "18%",
      sourceQuote: "Whole person impairment rating: 18% per AMA Guides 6th Edition",
      confidence: "0.860",
      impact: "high" as const,
      status: "pending" as const,
      createdAt: daysAgo(5),
    },
    // piRun2 — demand letter findings
    {
      id: DEMO_IDS.pipelineFindings.pf8,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun2,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc9,
      categoryKey: "damages_calculation",
      fieldKey: "total_demand",
      label: "Total Demand Amount",
      value: "$650,000",
      sourceQuote: "We hereby demand the sum of $650,000 in full settlement of all claims",
      confidence: "0.980",
      impact: "critical" as const,
      status: "auto_applied" as const,
      resolvedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf9,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun2,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc9,
      categoryKey: "incident_details",
      fieldKey: "incident_date",
      label: "Date of Incident",
      value: "2025-08-12",
      confidence: "0.960",
      impact: "critical" as const,
      status: "auto_applied" as const,
      existingValue: "2025-08-12",
      resolvedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf10,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun2,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      documentId: DEMO_IDS.documents.doc9,
      categoryKey: "defendant_info",
      fieldKey: "defendant_name",
      label: "Defendant Name",
      value: "David Chen",
      sourceQuote: "your insured, David Chen, negligently operated his vehicle",
      confidence: "0.940",
      impact: "high" as const,
      status: "accepted" as const,
      resolvedAt: daysAgo(1),
      createdAt: daysAgo(2),
    },
    // convRun1 — contract findings
    {
      id: DEMO_IDS.pipelineFindings.pf11,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.convRun1,
      matterId: DEMO_IDS.matters.conveyancing,
      documentId: DEMO_IDS.documents.doc1,
      categoryKey: "property_info",
      fieldKey: "property_address",
      label: "Property Address",
      value: "42 Oak Lane, Springfield, IL 62704",
      confidence: "0.985",
      impact: "high" as const,
      status: "auto_applied" as const,
      resolvedAt: daysAgo(10),
      createdAt: daysAgo(10),
    },
    {
      id: DEMO_IDS.pipelineFindings.pf12,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.convRun1,
      matterId: DEMO_IDS.matters.conveyancing,
      documentId: DEMO_IDS.documents.doc1,
      categoryKey: "property_info",
      fieldKey: "purchase_price",
      label: "Purchase Price",
      value: "$425,000",
      confidence: "0.990",
      impact: "critical" as const,
      status: "auto_applied" as const,
      resolvedAt: daysAgo(10),
      createdAt: daysAgo(10),
    },
  ];

  for (const finding of findingsData) {
    await db
      .insert(pipelineFindings)
      .values(finding)
      .onConflictDoUpdate({
        target: pipelineFindings.id,
        set: { status: finding.status, value: finding.value },
      });
  }

  // ---------------------------------------------------------------------------
  // Pipeline Actions
  // ---------------------------------------------------------------------------

  const actionsData = [
    // piRun1 actions
    {
      id: DEMO_IDS.pipelineActions.pa1,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      actionType: "create_deadline" as const,
      title: "Statute of Limitations Deadline",
      description:
        "Filing deadline for personal injury claim — verify state-specific rules for motor vehicle accidents.",
      priority: 0,
      status: "accepted" as const,
      isDeterministic: "true",
      triggerFindingId: DEMO_IDS.pipelineFindings.pf2,
      resolvedAt: daysAgo(4),
      createdAt: daysAgo(5),
    },
    {
      id: DEMO_IDS.pipelineActions.pa2,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun1,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      actionType: "flag_risk" as const,
      title: "Surgery detected — high-value case flag",
      description:
        "Arthroscopic knee surgery recommended. Consider early retention of medical expert for IME.",
      priority: 1,
      status: "pending" as const,
      isDeterministic: "true",
      triggerFindingId: DEMO_IDS.pipelineFindings.pf6,
      createdAt: daysAgo(5),
    },
    // piRun2 actions
    {
      id: DEMO_IDS.pipelineActions.pa3,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.piRun2,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      actionType: "create_task" as const,
      title: "Review demand letter terms",
      description:
        "Total demand of $650,000. Review for completeness and prepare counter-offer analysis.",
      priority: 0,
      status: "pending" as const,
      isDeterministic: "true",
      triggerFindingId: DEMO_IDS.pipelineFindings.pf8,
      createdAt: daysAgo(2),
    },
    // convRun1 actions
    {
      id: DEMO_IDS.pipelineActions.pa4,
      firmId: DEMO_IDS.firm,
      pipelineRunId: DEMO_IDS.pipelineRuns.convRun1,
      matterId: DEMO_IDS.matters.conveyancing,
      actionType: "create_task" as const,
      title: "Verify property title and liens",
      description:
        "Contract extracted — verify property address and purchase price against title records.",
      priority: 0,
      status: "accepted" as const,
      isDeterministic: "true",
      triggerFindingId: DEMO_IDS.pipelineFindings.pf11,
      resolvedAt: daysAgo(9),
      createdAt: daysAgo(10),
    },
  ];

  for (const action of actionsData) {
    await db
      .insert(pipelineActions)
      .values(action)
      .onConflictDoUpdate({
        target: pipelineActions.id,
        set: { status: action.status },
      });
  }

  console.log(`    ✓ ${runsData.length} pipeline runs`);
  console.log(`    ✓ ${findingsData.length} pipeline findings`);
  console.log(`    ✓ ${actionsData.length} pipeline actions`);
}
