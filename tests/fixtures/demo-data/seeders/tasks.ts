import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedTasks(ctx: SeederContext) {
  console.log("  Seeding tasks...");
  const result: Array<{ id: string; title: string; status: string }> = [];

  const now = ctx.now;
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);

  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 172800000).toISOString();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString();
  const nextWeek = new Date(now.getTime() + 604800000).toISOString();
  const nextMonth = new Date(now.getTime() + 2592000000).toISOString();

  const tasksData = [
    // Conveyancing tasks - linked to workflow stages
    {
      id: DEMO_IDS.tasks.task1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Chase seller's solicitors for replies to enquiries",
      description: "Follow up on outstanding responses to property enquiries sent last week",
      status: "completed" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(today),
      completedAt: new Date(now.getTime() - 6 * 86400000),
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 6 * 86400000),
      // Link to workflow stage
      matterStageId: DEMO_IDS.matterStages.ms1_3, // Investigation stage
      source: "workflow" as const,
      isMandatory: true,
    },
    {
      id: DEMO_IDS.tasks.task2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Order local searches",
      description: "Submit search application to local authority",
      status: "completed" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(tomorrow),
      completedAt: new Date(now.getTime() - 8 * 86400000),
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 8 * 86400000),
      // Link to workflow stage
      matterStageId: DEMO_IDS.matterStages.ms1_3, // Investigation stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true,
    },
    {
      id: DEMO_IDS.tasks.task3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Draft contract report for client",
      description: "Prepare detailed report on contract terms and searches",
      status: "completed" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(nextWeek),
      completedAt: new Date(now.getTime() - 5 * 86400000),
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 5 * 86400000),
      // Link to workflow stage
      matterStageId: DEMO_IDS.matterStages.ms1_3, // Investigation stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true,
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
    // ==========================================================
    // MAT-DEMO-001 Showcase Tasks - Full Conveyancing Workflow
    // Purchase of 15 Willow Lane, Richmond for Margaret Thompson
    // Enhanced Task Model fields demonstrated
    // ==========================================================
    {
      id: DEMO_IDS.tasks.task31,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Review mortgage offer from Nationwide",
      description:
        "Client's mortgage offer received. Review terms, conditions, and any special conditions. Check completion date aligns with exchange deadline. Confirm solicitor's undertaking requirements.",
      status: "completed" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(twoDaysAgo),
      completedAt: new Date(yesterday),
      createdAt: new Date(now.getTime() - 5 * 86400000),
      updatedAt: new Date(yesterday),
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_4, // Mortgage stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // Mortgage offer document required
      requiresApproval: false,
    },
    {
      id: DEMO_IDS.tasks.task32,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Report to lender on title",
      description:
        "Complete Certificate of Title for Nationwide Building Society. Confirm no material matters affecting title. Submit via portal with supporting documentation.",
      status: "completed" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(yesterday),
      completedAt: now,
      createdAt: new Date(now.getTime() - 4 * 86400000),
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_4, // Mortgage stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // Search results and title docs required
      requiresApproval: true,
      requiredApproverRole: "partner",
      approvalStatus: "approved",
      approvedById: DEMO_IDS.users.partner,
      approvedAt: now,
    },
    {
      id: DEMO_IDS.tasks.task33,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Request deposit from client",
      description:
        "Client needs to transfer 10% deposit (£75,000) to client account. Provide bank details and reference. Remind client about source of funds documentation.",
      status: "in_progress" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(today),
      createdAt: new Date(yesterday),
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_5, // Exchange stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // Source of funds evidence required
      requiresApproval: false,
    },
    {
      id: DEMO_IDS.tasks.task34,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Prepare transfer deed (TR1)",
      description:
        "Draft TR1 transfer form. Include declaration of trust as joint tenants. Submit to seller's solicitor for approval before exchange.",
      status: "in_progress" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(tomorrow),
      createdAt: new Date(yesterday),
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_5, // Exchange stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // Signed TR1 required
      requiresApproval: true,
      requiredApproverRole: "partner",
      approvalStatus: "pending", // Awaiting partner review
    },
    {
      id: DEMO_IDS.tasks.task35,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Calculate completion statement",
      description:
        "Prepare detailed completion statement showing purchase price, deposit, mortgage advance, legal fees, disbursements, and Stamp Duty Land Tax. Send to client for approval.",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_6, // Completion stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: false,
      requiresApproval: false,
    },
    {
      id: DEMO_IDS.tasks.task36,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Request OS1 priority search",
      description:
        "Order official search with priority at Land Registry. Provides 30-day protection period for registration. Time for exchange.",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(tomorrow),
      createdAt: now,
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_5, // Exchange stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // OS1 search result required
      requiresApproval: false,
    },
    {
      id: DEMO_IDS.tasks.task37,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Arrange exchange of contracts",
      description:
        "Coordinate exchange with seller's solicitor. Agree completion date (14 days after exchange). Use Law Society formula C for telephone exchange.",
      status: "pending" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_5, // Exchange stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // Signed contracts required
      requiresApproval: true,
      requiredApproverRole: "partner",
    },
    {
      id: DEMO_IDS.tasks.task38,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Prepare SDLT return",
      description:
        "Complete Stamp Duty Land Tax return ready for submission on completion. SDLT due: £18,750 (additional property rate applies). Submit within 14 days of completion.",
      status: "pending" as const,
      priority: "medium" as const,
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(nextWeek),
      createdAt: now,
      updatedAt: now,
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_7, // Post-Completion stage
      source: "workflow" as const,
      isMandatory: true,
      requiresEvidence: true, // SDLT5 certificate required
      requiresApproval: false,
    },
    {
      id: DEMO_IDS.tasks.task39,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Call client to update on progress",
      description:
        "Urgent: Client called upset about lack of updates. Call to explain current position, next steps, and realistic exchange timeline. Document conversation in file note.",
      status: "in_progress" as const,
      priority: "urgent" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.partner,
      dueDate: new Date(today),
      createdAt: new Date(now.getTime() - 60 * 60000), // 1 hour ago
      updatedAt: now,
      // Enhanced Task Model fields - communication tasks are typically optional
      // No stage - this is a manual task not part of workflow
      source: "manual" as const,
      isMandatory: false,
      requiresEvidence: false,
      requiresApproval: false,
    },
    {
      id: DEMO_IDS.tasks.task40,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Review seller's replies to additional enquiries",
      description:
        "Seller's solicitor responded to our additional enquiries about Japanese knotweed report and boundary dispute mentioned in title. Review and advise client.",
      status: "pending" as const,
      priority: "high" as const,
      assigneeId: DEMO_IDS.users.associate,
      createdById: DEMO_IDS.users.associate,
      dueDate: new Date(tomorrow),
      createdAt: new Date(now.getTime() - 2 * 60 * 60000), // 2 hours ago
      updatedAt: now,
      // Enhanced Task Model fields - additional enquiry follow-up
      // No stage - this is a manual follow-up task
      source: "manual" as const,
      isMandatory: false, // Optional follow-up task
      requiresEvidence: false,
      requiresApproval: false,
    },
    // ==========================================================
    // Additional showcase tasks demonstrating skipped/not_applicable
    // ==========================================================
    // Task 41: Skipped task - building survey declined
    // Exception record in task-exceptions.ts provides the reason
    {
      id: DEMO_IDS.tasks.task41,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Arrange building survey",
      description:
        "Optional full building survey. Client advised but declined - proceeding with mortgage valuation only.",
      status: "skipped" as const,
      priority: "low" as const,
      assigneeId: null,
      createdById: DEMO_IDS.users.associate,
      dueDate: null,
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 8 * 86400000),
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_3, // Investigation stage (skipped)
      source: "workflow" as const,
      isMandatory: false,
      requiresEvidence: false,
      requiresApproval: false,
    },
    // Task 42: Not applicable task - Help to Buy ISA not relevant
    // Exception record in task-exceptions.ts provides the reason
    {
      id: DEMO_IDS.tasks.task42,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Review Help to Buy ISA",
      description: "Check client's Help to Buy ISA bonus eligibility and transfer requirements.",
      status: "not_applicable" as const,
      priority: "low" as const,
      assigneeId: null,
      createdById: DEMO_IDS.users.associate,
      dueDate: null,
      createdAt: new Date(now.getTime() - 10 * 86400000),
      updatedAt: new Date(now.getTime() - 9 * 86400000),
      // Enhanced Task Model fields
      matterStageId: DEMO_IDS.matterStages.ms1_4, // Mortgage stage (N/A - client not using Help to Buy)
      source: "workflow" as const,
      isMandatory: false,
      requiresEvidence: false,
      requiresApproval: false,
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

    result.push({
      id: task.id,
      title: task.title,
      status: task.status,
    });
    console.log(`    Created task: ${task.title.substring(0, 50)}...`);
  }

  return result;
}
