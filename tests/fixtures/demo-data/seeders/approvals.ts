import { db } from "@/lib/db";
import { approvalRequests } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedApprovals(ctx: SeederContext) {
  console.log("  Creating approval requests...");

  const now = ctx.now;
  const oneHourAgo = new Date(now.getTime() - 60 * 60000);
  const twoHoursAgo = new Date(now.getTime() - 120 * 60000);
  const twoDaysAgoEmail = new Date(now.getTime() - 48 * 60 * 60000);

  const approvalsData = [
    {
      id: DEMO_IDS.approvals.approval1,
      firmId: DEMO_IDS.firm,
      sourceType: "ai" as const,
      action: "email.send",
      summary: "AI-drafted response to Margaret Thompson's urgent complaint about exchange delays",
      proposedPayload: {
        emailId: DEMO_IDS.emails.email1,
        to: "margaret.thompson@email.com",
        subject: "Re: URGENT: Exchange deadline approaching - need update NOW",
        body: "Dear Mrs Thompson, Thank you for your email and I sincerely apologise for the delay...",
      },
      entityType: "email",
      entityId: DEMO_IDS.emails.email1,
      matterId: DEMO_IDS.matters.conveyancing,
      status: "pending" as const,
      aiMetadata: {
        model: "gpt-4",
        confidence: 0.92,
        reasoning: "High urgency complaint requiring immediate professional response",
      },
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    {
      id: DEMO_IDS.approvals.approval2,
      firmId: DEMO_IDS.firm,
      sourceType: "ai" as const,
      action: "email.send",
      summary: "AI-drafted client notification about successful visa decision",
      proposedPayload: {
        emailId: DEMO_IDS.emails.email9,
        to: "priya.sharma@email.com",
        subject: "Great news - Your visa has been granted!",
        body: "Dear Dr Sharma, I am delighted to inform you that your Skilled Worker visa application has been GRANTED...",
      },
      entityType: "email",
      entityId: DEMO_IDS.emails.email9,
      matterId: DEMO_IDS.matters.immigrationTier2,
      status: "pending" as const,
      aiMetadata: {
        model: "gpt-4",
        confidence: 0.95,
        reasoning: "Positive news notification - straightforward communication",
      },
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    {
      id: DEMO_IDS.approvals.approval3,
      firmId: DEMO_IDS.firm,
      sourceType: "ai" as const,
      action: "task.create",
      summary:
        "Create tasks from court listing notification - confirm attendance and prepare bundle",
      proposedPayload: {
        tasks: [
          {
            title: "Confirm attendance with Manchester Magistrates Court",
            dueInDays: 5,
            priority: "high",
          },
          { title: "Notify George Henderson of hearing date", dueInDays: 1, priority: "high" },
          { title: "Prepare plea hearing bundle", dueInDays: 12, priority: "medium" },
        ],
      },
      entityType: "email",
      entityId: DEMO_IDS.emails.email6,
      matterId: DEMO_IDS.matters.criminalDriving,
      status: "pending" as const,
      aiMetadata: {
        model: "gpt-4",
        confidence: 0.88,
        reasoning: "Court listing requires standard follow-up tasks",
      },
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    {
      id: DEMO_IDS.approvals.approval4,
      firmId: DEMO_IDS.firm,
      sourceType: "ai" as const,
      action: "matter.link",
      summary: "Link new business enquiry to potential commercial property matter",
      proposedPayload: {
        emailId: DEMO_IDS.emails.email5,
        suggestedMatterTitle: "Commercial Lease - TechStartup Ltd",
        suggestedPracticeArea: "commercial",
        suggestedClient: "TechStartup Ltd",
      },
      entityType: "email",
      entityId: DEMO_IDS.emails.email5,
      matterId: null,
      status: "pending" as const,
      aiMetadata: {
        model: "gpt-4",
        confidence: 0.75,
        reasoning: "New enquiry - requires matter creation and conflict check",
      },
      createdAt: twoDaysAgoEmail,
      updatedAt: twoDaysAgoEmail,
    },
    {
      id: DEMO_IDS.approvals.approval5,
      firmId: DEMO_IDS.firm,
      sourceType: "ai" as const,
      action: "email.send",
      summary: "AI-drafted response to opposing counsel refusing extension",
      proposedPayload: {
        emailId: DEMO_IDS.emails.email2,
        to: "r.green@greenwoodpartners.co.uk",
        subject: "Re: Apex v BuildRight - Defence deadline extension request",
        body: "Dear Ms Green, Thank you for your response. While we are disappointed...",
      },
      entityType: "email",
      entityId: DEMO_IDS.emails.email2,
      matterId: DEMO_IDS.matters.litigation,
      status: "approved" as const,
      decidedBy: DEMO_IDS.users.partner,
      decidedAt: oneHourAgo,
      executionStatus: "executed" as const,
      executedAt: oneHourAgo,
      aiMetadata: {
        model: "gpt-4",
        confidence: 0.89,
        reasoning: "Professional response to opposing counsel",
      },
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    },
  ];

  const createdApprovals = [];

  for (const approvalData of approvalsData) {
    const [approval] = await db
      .insert(approvalRequests)
      .values(approvalData)
      .onConflictDoUpdate({
        target: approvalRequests.id,
        set: { updatedAt: now },
      })
      .returning();

    const statusIcon =
      approval.status === "pending"
        ? "[PENDING]"
        : approval.status === "approved"
          ? "[APPROVED]"
          : "[REJECTED]";
    console.log(`    Created approval: ${statusIcon} ${approval.summary?.substring(0, 50)}...`);

    createdApprovals.push({
      id: approval.id,
      summary: approval.summary,
      status: approval.status,
    });
  }

  return createdApprovals;
}
