import { db } from "@/lib/db";
import {
  workflowTemplates,
  workflowStages,
  workflowTaskTemplates,
  matterWorkflows,
  matterStages,
} from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

/**
 * Seeds workflow templates for demo purposes.
 * Creates system templates (no firmId) that are available to all firms.
 *
 * Based on the reference workflow at docs/workflows/residential-purchase.yaml
 * but simplified for demo purposes.
 */
export async function seedWorkflows(ctx: SeederContext) {
  console.log("  Seeding workflow templates...");

  const now = ctx.now;

  // ================================================
  // WORKFLOW TEMPLATES
  // ================================================
  const templatesData = [
    {
      id: DEMO_IDS.workflowTemplates.residentialPurchase,
      key: "residential-purchase",
      name: "Residential Purchase",
      description:
        "Standard workflow for residential property purchases including freehold, leasehold, auction, and new-build transactions. Based on Law Society Conveyancing Protocol and UK Finance Lenders' Handbook requirements.",
      practiceArea: "conveyancing" as const,
      subTypes: ["freehold_purchase", "leasehold_purchase", "auction_purchase", "new_build"],
      version: "1.0.0",
      isActive: true,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTemplates.residentialSale,
      key: "residential-sale",
      name: "Residential Sale",
      description:
        "Standard workflow for residential property sales. Covers preparation of contract pack, responding to enquiries, exchange and completion.",
      practiceArea: "conveyancing" as const,
      subTypes: ["freehold_sale", "leasehold_sale"],
      version: "1.0.0",
      isActive: true,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTemplates.debtRecovery,
      key: "debt-recovery",
      name: "Debt Recovery - Pre-Action to Enforcement",
      description:
        "Full debt recovery workflow from letter before action through court proceedings to enforcement. Follows Pre-Action Protocol for Debt Claims.",
      practiceArea: "litigation" as const,
      subTypes: ["debt_recovery", "commercial_debt"],
      version: "1.0.0",
      isActive: true,
      createdAt: now,
    },
  ];

  for (const template of templatesData) {
    await db
      .insert(workflowTemplates)
      .values(template)
      .onConflictDoUpdate({
        target: workflowTemplates.id,
        set: { isActive: template.isActive },
      });
    console.log(`    Created workflow template: ${template.name}`);
  }

  // ================================================
  // STAGES - Residential Purchase
  // ================================================
  const residentialPurchaseStages = [
    {
      id: DEMO_IDS.workflowStages.rpOnboarding,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "Client Onboarding & Instruction",
      description: "Initial client engagement, retainer, and file opening",
      gateType: "hard" as const,
      completionCriteria: "all_mandatory_tasks",
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowStages.rpAML,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "AML / Compliance",
      description: "Anti-money laundering checks and customer due diligence",
      gateType: "hard" as const,
      completionCriteria: "all_mandatory_tasks",
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowStages.rpInvestigation,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "Investigation / Due Diligence",
      description: "Title investigation, searches, and enquiries",
      gateType: "soft" as const,
      completionCriteria: "all_mandatory_tasks",
      sortOrder: 3,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowStages.rpMortgage,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "Mortgage / Lender Compliance",
      description: "Lender requirements and certificate of title",
      gateType: "hard" as const,
      completionCriteria: "all_mandatory_tasks",
      applicabilityConditions: { has_mortgage: true },
      sortOrder: 4,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowStages.rpExchange,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "Contract / Exchange",
      description: "Contract approval, deposit, and exchange",
      gateType: "hard" as const,
      completionCriteria: "all_mandatory_tasks",
      sortOrder: 5,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowStages.rpCompletion,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "Completion",
      description: "Pre-completion, funds transfer, and keys",
      gateType: "hard" as const,
      completionCriteria: "all_mandatory_tasks",
      sortOrder: 6,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowStages.rpPostCompletion,
      workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
      name: "Post-Completion",
      description: "SDLT, registration, and file closure",
      gateType: "soft" as const,
      completionCriteria: "all_mandatory_tasks",
      sortOrder: 7,
      createdAt: now,
    },
  ];

  for (const stage of residentialPurchaseStages) {
    await db
      .insert(workflowStages)
      .values(stage)
      .onConflictDoUpdate({
        target: workflowStages.id,
        set: { name: stage.name },
      });
  }
  console.log(`    Created ${residentialPurchaseStages.length} stages for Residential Purchase`);

  // ================================================
  // TASK TEMPLATES - Residential Purchase (simplified)
  // ================================================
  const residentialPurchaseTasks = [
    // Stage 1: Onboarding
    {
      id: DEMO_IDS.workflowTaskTemplates.rp1_1,
      stageId: DEMO_IDS.workflowStages.rpOnboarding,
      title: "Record client instruction",
      description:
        "Document the client's instructions including property details, purchase price, and timescales",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "matter_created" as const,
      relativeDueDays: 1,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp1_2,
      stageId: DEMO_IDS.workflowStages.rpOnboarding,
      title: "Issue client care letter",
      description:
        "Send engagement letter with terms of business, costs estimate, and scope of retainer",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "matter_created" as const,
      relativeDueDays: 2,
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp1_3,
      stageId: DEMO_IDS.workflowStages.rpOnboarding,
      title: "Complete conflict check",
      description: "Check for conflicts of interest against all parties",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: true,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "matter_created" as const,
      relativeDueDays: 1,
      sortOrder: 3,
      createdAt: now,
    },
    // Stage 2: AML
    {
      id: DEMO_IDS.workflowTaskTemplates.rp2_1,
      stageId: DEMO_IDS.workflowStages.rpAML,
      title: "Verify client identity",
      description: "Obtain and verify photographic ID (passport/driving licence)",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 3,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp2_2,
      stageId: DEMO_IDS.workflowStages.rpAML,
      title: "Verify source of funds",
      description: "Obtain evidence of source of deposit and completion funds",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 5,
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp2_3,
      stageId: DEMO_IDS.workflowStages.rpAML,
      title: "Complete AML risk assessment",
      description: "Assess client and transaction risk level and document findings",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: true,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 5,
      sortOrder: 3,
      createdAt: now,
    },
    // Stage 3: Investigation
    {
      id: DEMO_IDS.workflowTaskTemplates.rp3_1,
      stageId: DEMO_IDS.workflowStages.rpInvestigation,
      title: "Obtain official copies from Land Registry",
      description: "Order and review official copy of register and title plan",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 2,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp3_2,
      stageId: DEMO_IDS.workflowStages.rpInvestigation,
      title: "Order property searches",
      description: "Submit local authority, drainage, environmental and chancel searches",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 3,
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp3_3,
      stageId: DEMO_IDS.workflowStages.rpInvestigation,
      title: "Raise enquiries with seller's solicitor",
      description: "Submit pre-contract enquiries based on title and search review",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 7,
      sortOrder: 3,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp3_4,
      stageId: DEMO_IDS.workflowStages.rpInvestigation,
      title: "Report to client on title",
      description: "Provide client with summary of title findings and any issues",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 14,
      sortOrder: 4,
      createdAt: now,
    },
    // Stage 4: Mortgage
    {
      id: DEMO_IDS.workflowTaskTemplates.rp4_1,
      stageId: DEMO_IDS.workflowStages.rpMortgage,
      title: "Review mortgage offer",
      description: "Check mortgage offer terms and special conditions",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 3,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp4_2,
      stageId: DEMO_IDS.workflowStages.rpMortgage,
      title: "Prepare certificate of title",
      description: "Complete COT confirming compliance with lender requirements",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: true,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 7,
      sortOrder: 2,
      createdAt: now,
    },
    // Stage 5: Exchange
    {
      id: DEMO_IDS.workflowTaskTemplates.rp5_1,
      stageId: DEMO_IDS.workflowStages.rpExchange,
      title: "Review and approve contract",
      description: "Review draft contract and negotiate amendments",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 7,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp5_2,
      stageId: DEMO_IDS.workflowStages.rpExchange,
      title: "Obtain authority to exchange",
      description: "Get written client authority to exchange contracts",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "urgent" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 10,
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp5_3,
      stageId: DEMO_IDS.workflowStages.rpExchange,
      title: "Exchange contracts",
      description: "Exchange contracts with seller's solicitor using Law Society formula",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "urgent" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 14,
      sortOrder: 3,
      createdAt: now,
    },
    // Stage 6: Completion
    {
      id: DEMO_IDS.workflowTaskTemplates.rp6_1,
      stageId: DEMO_IDS.workflowStages.rpCompletion,
      title: "Request completion funds from client",
      description: "Send completion statement and request balance of funds",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 5,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp6_2,
      stageId: DEMO_IDS.workflowStages.rpCompletion,
      title: "Send completion funds",
      description: "Transfer purchase monies to seller's solicitor",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: true,
      defaultPriority: "urgent" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 0,
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp6_3,
      stageId: DEMO_IDS.workflowStages.rpCompletion,
      title: "Release keys to client",
      description: "Authorise estate agent to release keys and confirm to client",
      isMandatory: true,
      requiresEvidence: false,
      requiresApproval: false,
      defaultPriority: "urgent" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 0,
      sortOrder: 3,
      createdAt: now,
    },
    // Stage 7: Post-Completion
    {
      id: DEMO_IDS.workflowTaskTemplates.rp7_1,
      stageId: DEMO_IDS.workflowStages.rpPostCompletion,
      title: "Submit SDLT return and pay tax",
      description: "File Stamp Duty Land Tax return with HMRC within 14 days",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "urgent" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 14,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: DEMO_IDS.workflowTaskTemplates.rp7_2,
      stageId: DEMO_IDS.workflowStages.rpPostCompletion,
      title: "Submit Land Registry application",
      description: "Lodge AP1 application at Land Registry within OS1 priority period",
      isMandatory: true,
      requiresEvidence: true,
      requiresApproval: false,
      defaultPriority: "high" as const,
      dueDateRelativeTo: "stage_started" as const,
      relativeDueDays: 20,
      sortOrder: 2,
      createdAt: now,
    },
  ];

  for (const task of residentialPurchaseTasks) {
    await db
      .insert(workflowTaskTemplates)
      .values(task)
      .onConflictDoUpdate({
        target: workflowTaskTemplates.id,
        set: { title: task.title },
      });
  }
  console.log(
    `    Created ${residentialPurchaseTasks.length} task templates for Residential Purchase`
  );

  console.log(`  Created ${templatesData.length} workflow templates`);
}

/**
 * Seeds matter workflow activations for demo matters.
 * MUST run AFTER seedMatters since it references matter IDs.
 */
export async function seedMatterWorkflows(ctx: SeederContext) {
  console.log("  Activating workflows on demo matters...");

  const now = ctx.now;

  // ================================================
  // MATTER WORKFLOWS - Activate workflow on MAT-DEMO-001
  // ================================================
  const matterWorkflowData = {
    id: DEMO_IDS.matterWorkflows.mw1,
    matterId: DEMO_IDS.matters.conveyancing,
    firmId: DEMO_IDS.firm,
    workflowTemplateId: DEMO_IDS.workflowTemplates.residentialPurchase,
    workflowVersion: "1.0.0",
    activatedAt: new Date(now.getTime() - 14 * 86400000), // 14 days ago
    activatedById: DEMO_IDS.users.associate,
    currentStageId: DEMO_IDS.matterStages.ms1_5, // Currently in Exchange stage
    createdAt: new Date(now.getTime() - 14 * 86400000),
  };

  await db
    .insert(matterWorkflows)
    .values(matterWorkflowData)
    .onConflictDoUpdate({
      target: matterWorkflows.id,
      set: { currentStageId: matterWorkflowData.currentStageId },
    });
  console.log(`    Activated Residential Purchase workflow on MAT-DEMO-001`);

  // ================================================
  // MATTER STAGES - Create stage instances for MAT-DEMO-001
  // ================================================
  const matterStagesData = [
    {
      id: DEMO_IDS.matterStages.ms1_1,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpOnboarding,
      name: "Client Onboarding & Instruction",
      sortOrder: 1,
      status: "completed" as const,
      startedAt: new Date(now.getTime() - 14 * 86400000),
      completedAt: new Date(now.getTime() - 12 * 86400000),
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      id: DEMO_IDS.matterStages.ms1_2,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpAML,
      name: "AML / Compliance",
      sortOrder: 2,
      status: "completed" as const,
      startedAt: new Date(now.getTime() - 12 * 86400000),
      completedAt: new Date(now.getTime() - 10 * 86400000),
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      id: DEMO_IDS.matterStages.ms1_3,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpInvestigation,
      name: "Investigation / Due Diligence",
      sortOrder: 3,
      status: "completed" as const,
      startedAt: new Date(now.getTime() - 10 * 86400000),
      completedAt: new Date(now.getTime() - 5 * 86400000),
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      id: DEMO_IDS.matterStages.ms1_4,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpMortgage,
      name: "Mortgage / Lender Compliance",
      sortOrder: 4,
      status: "completed" as const,
      startedAt: new Date(now.getTime() - 5 * 86400000),
      completedAt: new Date(now.getTime() - 2 * 86400000),
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      id: DEMO_IDS.matterStages.ms1_5,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpExchange,
      name: "Contract / Exchange",
      sortOrder: 5,
      status: "in_progress" as const,
      startedAt: new Date(now.getTime() - 2 * 86400000),
      completedAt: null,
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      id: DEMO_IDS.matterStages.ms1_6,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpCompletion,
      name: "Completion",
      sortOrder: 6,
      status: "pending" as const,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      id: DEMO_IDS.matterStages.ms1_7,
      matterWorkflowId: DEMO_IDS.matterWorkflows.mw1,
      workflowStageId: DEMO_IDS.workflowStages.rpPostCompletion,
      name: "Post-Completion",
      sortOrder: 7,
      status: "pending" as const,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
  ];

  for (const stageData of matterStagesData) {
    await db
      .insert(matterStages)
      .values(stageData)
      .onConflictDoUpdate({
        target: matterStages.id,
        set: { status: stageData.status },
      });
  }
  console.log(`    Created ${matterStagesData.length} stage instances for MAT-DEMO-001`);
}
