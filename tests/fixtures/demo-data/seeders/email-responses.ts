import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emails, tasks, timelineEvents } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedEmailResponses(ctx: SeederContext) {
  console.log("  Creating email responses & email-sourced tasks...");

  const now = ctx.now;
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60000);
  const twoHoursAgo = new Date(now.getTime() - 120 * 60000);

  // Thread IDs matching the original inbound emails
  const threadThompson = "thread-thompson-complaint-001";
  const threadOpposingCounsel = "thread-apex-buildright-001";
  const threadVisa = "thread-visa-decision-001";
  const threadShareholder = "thread-shareholder-agreement-001";

  // Update original inbound emails with threadIds for threading
  for (const [emailId, threadId] of [
    [DEMO_IDS.emails.email1, threadThompson],
    [DEMO_IDS.emails.email2, threadOpposingCounsel],
    [DEMO_IDS.emails.email9, threadVisa],
    [DEMO_IDS.emails.email10, threadShareholder],
  ] as const) {
    await db
      .update(emails)
      .set({ threadId, updatedAt: now })
      .where(eq(emails.id, emailId))
      .catch(() => {
        // Best effort - might already have threadId
      });
  }

  // 4 outbound response emails
  const outboundEmails = [
    // Reply 1: Response to Margaret Thompson's complaint - DELIVERED
    {
      id: DEMO_IDS.outboundEmails.reply1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      direction: "outbound" as const,
      fromAddress: { email: "james.clarke@harrisonclark.demo", name: "James Clarke" },
      toAddresses: [{ email: "margaret.thompson@email.com", name: "Margaret Thompson" }],
      subject: "RE: URGENT: Exchange deadline approaching - need update NOW",
      bodyText: `Dear Mrs Thompson,

Thank you for your email and I sincerely apologise for the delay in responding to your calls. This is not the level of service we strive to provide.

I can confirm:
1. The final contract is ready and will be emailed to you within the hour
2. There are no outstanding title issues - everything has been resolved
3. We are on track for exchange by Friday

I will personally ensure this matter receives priority attention. Please expect my call this afternoon to discuss any remaining concerns.

Kind regards,
James Clarke`,
      bodyHtml: null,
      threadId: threadThompson,
      inReplyTo: "<msg-thompson-complaint-001@email.com>",
      messageId: "<reply-thompson-001@harrisonclark.demo>",
      status: "delivered" as const,
      sentAt: oneHourAgo,
      createdBy: DEMO_IDS.users.associate,
      aiProcessed: false,
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    },
    // Reply 2: Response to opposing counsel - SENT (in transit)
    {
      id: DEMO_IDS.outboundEmails.reply2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      direction: "outbound" as const,
      fromAddress: { email: "sarah.harrison@harrisonclark.demo", name: "Sarah Harrison" },
      toAddresses: [{ email: "r.green@greenwoodpartners.co.uk", name: "Rachel Green" }],
      subject: "RE: Apex v BuildRight - Defence deadline extension request",
      bodyText: `Dear Ms Green,

Thank you for your response. While we are disappointed by your client's position, we understand their commercial concerns.

Please be assured that our Defence will be filed in time. We anticipate serving it by Wednesday to allow adequate time before the deadline.

We would welcome the opportunity to discuss settlement before incurring further costs. Would your client be open to a without prejudice meeting next week?

Kind regards,
Sarah Harrison`,
      bodyHtml: null,
      threadId: threadOpposingCounsel,
      inReplyTo: "<msg-apex-defence-001@greenwoodpartners.co.uk>",
      status: "sent" as const,
      sentAt: thirtyMinsAgo,
      createdBy: DEMO_IDS.users.partner,
      aiProcessed: false,
      createdAt: oneHourAgo,
      updatedAt: thirtyMinsAgo,
    },
    // Reply 3: Response to visa decision - DELIVERED
    {
      id: DEMO_IDS.outboundEmails.reply3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      direction: "outbound" as const,
      fromAddress: { email: "emma.williams@harrisonclark.demo", name: "Emma Williams" },
      toAddresses: [{ email: "priya.sharma@email.com", name: "Dr Priya Sharma" }],
      subject: "Wonderful news - Your visa application has been GRANTED!",
      bodyText: `Dear Dr Sharma,

I am delighted to inform you that your Skilled Worker visa application has been GRANTED!

Your new visa is valid from 18 December 2024 to 18 December 2027. Your Biometric Residence Permit (BRP) will be delivered to your address within the next 10 working days.

Please let me know when you receive your BRP, and we can then close your file.

Congratulations on this positive outcome!

Kind regards,
Emma Williams`,
      bodyHtml: null,
      threadId: threadVisa,
      inReplyTo: "<msg-visa-decision-001@homeoffice.gov.uk>",
      messageId: "<reply-visa-001@harrisonclark.demo>",
      status: "delivered" as const,
      sentAt: twoHoursAgo,
      createdBy: DEMO_IDS.users.associate2,
      aiProcessed: false,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    // Reply 4: Draft response to shareholder agreement - DRAFT (editable)
    {
      id: DEMO_IDS.outboundEmails.reply4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      direction: "outbound" as const,
      fromAddress: { email: "victoria.clarke@harrisonclark.demo", name: "Victoria Clarke" },
      toAddresses: [{ email: "alex.wong@techstartsolutions.com", name: "Alex Wong" }],
      subject: "RE: Shareholder agreement - investor comments",
      bodyText: `Dear Alex,

Thank you for the investor's feedback on the shareholder agreement. I've noted their three proposed amendments.

I have some initial thoughts:
1. Drag-along at 66.67% is common and shouldn't be problematic
2. Pre-emption exclusion for founders needs careful consideration - I'd recommend a 2-year rather than 3-year exclusion
3. The £50k threshold may need adjustment based on your operational needs

I'm available tomorrow at 11am or 3pm to discuss. Shall I call you?

Kind regards,
Victoria Clarke`,
      bodyHtml: null,
      threadId: threadShareholder,
      inReplyTo: "<msg-shareholder-001@techstartsolutions.com>",
      status: "draft" as const,
      createdBy: DEMO_IDS.users.associate,
      aiProcessed: false,
      createdAt: thirtyMinsAgo,
      updatedAt: thirtyMinsAgo,
    },
  ];

  for (const emailData of outboundEmails) {
    await db
      .insert(emails)
      .values(emailData)
      .onConflictDoUpdate({ target: emails.id, set: { updatedAt: now } });

    const statusLabel =
      emailData.status === "delivered"
        ? "[DELIVERED]"
        : emailData.status === "sent"
          ? "[SENT]"
          : "[DRAFT]";
    console.log(`    Created reply: ${statusLabel} ${emailData.subject.substring(0, 45)}...`);
  }

  // 3 email-sourced tasks (from email6 - court listing)
  const emailTasks = [
    {
      id: DEMO_IDS.emailTasks.et1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      title: "Confirm attendance with court",
      description:
        "Respond to Manchester Magistrates Court confirming attendance at plea hearing on 15 December 2024. Reference: MC-2024-08934.",
      priority: "high",
      status: "pending",
      dueDate: new Date(now.getTime() + 5 * 86400000),
      assigneeId: DEMO_IDS.users.partner,
      createdById: null,
      aiGenerated: true,
      aiSource: "email" as const,
      sourceEntityType: "email",
      sourceEntityId: DEMO_IDS.emails.email6,
    },
    {
      id: DEMO_IDS.emailTasks.et2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      title: "Notify client of hearing date",
      description:
        "Contact George Henderson to inform of plea hearing listed for 15 December 2024 at 10:00am, Court Room 2, Manchester Magistrates Court.",
      priority: "urgent",
      status: "pending",
      dueDate: new Date(now.getTime() + 1 * 86400000),
      assigneeId: DEMO_IDS.users.partner,
      createdById: null,
      aiGenerated: true,
      aiSource: "email" as const,
      sourceEntityType: "email",
      sourceEntityId: DEMO_IDS.emails.email6,
    },
    {
      id: DEMO_IDS.emailTasks.et3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      title: "Prepare plea hearing bundle",
      description:
        "Prepare hearing bundle for plea hearing at Manchester Magistrates Court on 15 December 2024. Include all relevant case documents and evidence.",
      priority: "medium",
      status: "pending",
      dueDate: new Date(now.getTime() + 12 * 86400000),
      assigneeId: DEMO_IDS.users.paralegal1,
      createdById: null,
      aiGenerated: true,
      aiSource: "email" as const,
      sourceEntityType: "email",
      sourceEntityId: DEMO_IDS.emails.email6,
    },
  ];

  for (const taskData of emailTasks) {
    await db
      .insert(tasks)
      .values(taskData)
      .onConflictDoUpdate({ target: tasks.id, set: { updatedAt: now } });

    console.log(`    Created email task: ${taskData.title}`);
  }

  // Timeline events for responses + task creation
  const tlEvents = [
    {
      id: "de000000-0000-4000-a017-000000000100",
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "email_sent" as const,
      title: "Email delivered to Margaret Thompson",
      actorType: "system" as const,
      actorId: null,
      entityType: "email",
      entityId: DEMO_IDS.outboundEmails.reply1,
      occurredAt: oneHourAgo,
      metadata: { status: "delivered" },
    },
    {
      id: "de000000-0000-4000-a017-000000000101",
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "email_sent" as const,
      title: "Visa grant notification delivered to Dr Priya Sharma",
      actorType: "system" as const,
      actorId: null,
      entityType: "email",
      entityId: DEMO_IDS.outboundEmails.reply3,
      occurredAt: twoHoursAgo,
      metadata: { status: "delivered" },
    },
    {
      id: "de000000-0000-4000-a017-000000000102",
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      type: "task_created" as const,
      title: "Created 3 task(s) from court listing email",
      actorType: "ai" as const,
      actorId: null,
      entityType: "email",
      entityId: DEMO_IDS.emails.email6,
      occurredAt: oneHourAgo,
      metadata: {
        count: 3,
        taskIds: [DEMO_IDS.emailTasks.et1, DEMO_IDS.emailTasks.et2, DEMO_IDS.emailTasks.et3],
      },
    },
  ];

  for (const evt of tlEvents) {
    await db
      .insert(timelineEvents)
      .values(evt)
      .onConflictDoUpdate({ target: timelineEvents.id, set: { occurredAt: evt.occurredAt } });
  }

  console.log(`    Created ${tlEvents.length} timeline events for email responses`);
}
