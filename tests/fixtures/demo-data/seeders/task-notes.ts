import { db } from "@/lib/db";
import { taskNotes } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedTaskNotes(ctx: SeederContext) {
  console.log("  Seeding task notes...");
  const result: Array<{ id: string; taskId: string; content: string }> = [];

  const now = ctx.now;
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 172800000);
  const threeDaysAgo = new Date(now.getTime() - 259200000);
  const fourDaysAgo = new Date(now.getTime() - 345600000);
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const twoHoursAgo = new Date(now.getTime() - 7200000);

  const notesData = [
    // Task 31: Review mortgage offer - completed task with progress notes
    {
      id: DEMO_IDS.taskNotes.note1,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task31,
      content:
        "<p>Mortgage offer received from Nationwide. Key terms:</p>" +
        "<ul><li>Loan amount: £675,000</li><li>Interest rate: 4.89% fixed for 5 years</li>" +
        "<li>Term: 25 years</li><li>Monthly payment: £3,892</li></ul>" +
        "<p>Special conditions require buildings insurance evidence before completion.</p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.associate,
      version: 1,
      isCurrent: true,
      createdAt: fourDaysAgo,
    },
    {
      id: DEMO_IDS.taskNotes.note2,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task31,
      content:
        "<p>Reviewed with client. She confirmed:</p>" +
        "<ul><li>Terms acceptable</li><li>Will arrange buildings insurance this week</li>" +
        "<li>Happy to proceed to exchange once searches complete</li></ul>" +
        "<p>Completion date in offer (30 Jan) works for her timeline.</p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.associate,
      version: 1,
      isCurrent: true,
      createdAt: threeDaysAgo,
    },

    // Task 33: Request deposit - in progress task with client-visible note
    {
      id: DEMO_IDS.taskNotes.note3,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task33,
      content:
        "<p>Deposit transfer instructions sent to client by email.</p>" +
        "<p>Bank details provided:</p>" +
        "<ul><li>Sort code: 20-00-00</li><li>Account: Harrison & Clarke Client Account</li>" +
        "<li>Reference: MT-DEMO-001/THOMPSON</li></ul>" +
        "<p>Reminded client to send from her named account only for AML compliance.</p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.paralegal1,
      version: 1,
      isCurrent: true,
      createdAt: yesterday,
    },
    {
      id: DEMO_IDS.taskNotes.note4,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task33,
      content:
        "<p>Thank you for sending your deposit. We have received your bank transfer of £75,000.</p>" +
        "<p>We will confirm receipt by email once cleared funds are in our client account (usually 1-2 business days).</p>" +
        "<p>Please contact us if you have any questions.</p>",
      visibility: "client_visible" as const,
      authorId: DEMO_IDS.users.paralegal1,
      version: 1,
      isCurrent: true,
      createdAt: oneHourAgo,
    },

    // Task 34: Prepare TR1 - internal progress note
    {
      id: DEMO_IDS.taskNotes.note5,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task34,
      content:
        "<p>TR1 drafted. Client confirmed they want to hold as joint tenants (not tenants in common).</p>" +
        "<p>Sent to seller's solicitor (Patel & Co) for approval at 14:30.</p>" +
        "<p>Awaiting their confirmation - will chase tomorrow if no response.</p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.associate,
      version: 1,
      isCurrent: true,
      createdAt: twoHoursAgo,
    },

    // Task 39: Client update call - urgent task with supervisor note
    {
      id: DEMO_IDS.taskNotes.note6,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task39,
      content:
        "<p><strong>Client complaint escalated by reception.</strong></p>" +
        "<p>Mrs Thompson called at 10:15 upset about lack of updates. She said:</p>" +
        "<ul><li>Hasn't heard from us in 5 days</li><li>Worried about exchange deadline</li>" +
        "<li>Considering instructing another firm</li></ul>" +
        "<p><strong>Action required:</strong> Victoria to call client ASAP to reassure and update on progress.</p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.partner,
      version: 1,
      isCurrent: true,
      createdAt: new Date(now.getTime() - 60 * 60000), // 1 hour ago
    },
    {
      id: DEMO_IDS.taskNotes.note7,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task39,
      content:
        "<p>Spoke with Mrs Thompson at 11:45. Call lasted 25 minutes.</p>" +
        "<p>Explained current position:</p>" +
        "<ul><li>Mortgage offer approved and reported to lender</li>" +
        "<li>Searches all back - no concerns</li><li>TR1 sent to seller's solicitor today</li>" +
        "<li>Aiming for exchange next Wednesday</li></ul>" +
        "<p>Client much happier. Apologised for communication gap. Agreed to email weekly updates.</p>" +
        "<p><em>Complaint resolved - no further escalation needed.</em></p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.associate,
      version: 1,
      isCurrent: true,
      createdAt: now,
    },

    // Task 40: Enquiry replies - note about issue discovered
    {
      id: DEMO_IDS.taskNotes.note8,
      firmId: DEMO_IDS.firm,
      taskId: DEMO_IDS.tasks.task40,
      content:
        "<p><strong>Important:</strong> Seller's solicitor has confirmed Japanese knotweed was treated in 2019.</p>" +
        "<p>They've provided:</p>" +
        "<ul><li>Treatment certificate from specialist contractor</li>" +
        "<li>10-year insurance-backed guarantee (expires 2029)</li>" +
        "<li>Independent survey showing no regrowth (dated Oct 2024)</li></ul>" +
        "<p>Need to discuss with client. Lender may require disclosure. Will check Nationwide's specific requirements.</p>",
      visibility: "internal" as const,
      authorId: DEMO_IDS.users.associate,
      version: 1,
      isCurrent: true,
      createdAt: twoHoursAgo,
    },
  ];

  for (const noteData of notesData) {
    const [note] = await db
      .insert(taskNotes)
      .values(noteData)
      .onConflictDoUpdate({
        target: taskNotes.id,
        set: { content: noteData.content },
      })
      .returning();

    result.push({
      id: note.id,
      taskId: note.taskId,
      content: note.content.substring(0, 50) + "...",
    });
    console.log(`    Created task note: ${note.content.substring(3, 40)}...`);
  }

  return result;
}
