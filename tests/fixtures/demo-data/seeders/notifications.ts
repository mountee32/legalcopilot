import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedNotifications(ctx: SeederContext) {
  console.log("  Seeding notifications...");

  const now = ctx.now;

  const notificationsData = [
    // Task assigned notifications (3)
    {
      id: DEMO_IDS.notifications.notif1,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate,
      type: "task_assigned" as const,
      title: "New task assigned: Chase seller's solicitors",
      body: "Sarah Harrison has assigned you a high priority task for the Willow Lane conveyancing matter.",
      link: `/matters/${DEMO_IDS.matters.conveyancing}/tasks`,
      read: false,
      createdAt: new Date(now.getTime() - 3600000), // 1 hour ago
    },
    {
      id: DEMO_IDS.notifications.notif2,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.paralegal1,
      type: "task_assigned" as const,
      title: "New task assigned: Order local searches",
      body: "James Clarke has assigned you a task for the Willow Lane conveyancing matter.",
      link: `/matters/${DEMO_IDS.matters.conveyancing}/tasks`,
      read: true,
      readAt: new Date(now.getTime() - 1800000), // 30 mins ago
      createdAt: new Date(now.getTime() - 7200000), // 2 hours ago
    },
    {
      id: DEMO_IDS.notifications.notif3,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate2,
      type: "task_assigned" as const,
      title: "New task assigned: Prepare completion statement",
      body: "Victoria Clarke has assigned you a task for the Kensington Gardens sale.",
      link: `/matters/${DEMO_IDS.matters.conveyancingSale}/tasks`,
      read: false,
      createdAt: new Date(now.getTime() - 10800000), // 3 hours ago
    },
    // Task due reminders (5)
    {
      id: DEMO_IDS.notifications.notif4,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate,
      type: "task_due" as const,
      title: "Task due today: Chase seller's solicitors",
      body: "Your task 'Chase seller's solicitors for replies to enquiries' is due today.",
      link: `/matters/${DEMO_IDS.matters.conveyancing}/tasks`,
      read: false,
      createdAt: new Date(now.getTime() - 14400000), // 4 hours ago
    },
    {
      id: DEMO_IDS.notifications.notif5,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.partner,
      type: "task_due" as const,
      title: "Task due tomorrow: Review expert report",
      body: "Your task 'Review expert report on construction defects' is due tomorrow.",
      link: `/matters/${DEMO_IDS.matters.litigation}/tasks`,
      read: true,
      readAt: new Date(now.getTime() - 10800000),
      createdAt: new Date(now.getTime() - 18000000), // 5 hours ago
    },
    {
      id: DEMO_IDS.notifications.notif6,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate3,
      type: "task_due" as const,
      title: "Task due in 2 days: Draft particulars of claim",
      body: "Your task for the debt recovery matter is due in 2 days.",
      link: `/matters/${DEMO_IDS.matters.litigationDebt}/tasks`,
      read: false,
      createdAt: new Date(now.getTime() - 21600000), // 6 hours ago
    },
    {
      id: DEMO_IDS.notifications.notif7,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate2,
      type: "task_due" as const,
      title: "Task due today: Update client on progress",
      body: "Your task for the family divorce matter is due today.",
      link: `/matters/${DEMO_IDS.matters.familyDivorce}/tasks`,
      read: true,
      readAt: new Date(now.getTime() - 14400000),
      createdAt: new Date(now.getTime() - 25200000), // 7 hours ago
    },
    {
      id: DEMO_IDS.notifications.notif8,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate3,
      type: "task_due" as const,
      title: "Task due today: Submit ET-1 form",
      body: "Your task 'Submit ET-1 form to tribunal' is due today for the unfair dismissal case.",
      link: `/matters/${DEMO_IDS.matters.employmentDismissal}/tasks`,
      read: false,
      createdAt: new Date(now.getTime() - 28800000), // 8 hours ago
    },
    // Invoice paid notifications (4)
    {
      id: DEMO_IDS.notifications.notif9,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.partner,
      type: "invoice_paid" as const,
      title: "Invoice INV-2024-008 paid in full",
      body: "Margaret Thompson has paid invoice INV-2024-008 (£1,020.00) via bank transfer.",
      link: `/billing/invoices/${DEMO_IDS.invoices.inv8}`,
      read: true,
      readAt: new Date(now.getTime() - 21600000),
      createdAt: new Date(now.getTime() - 43200000), // 12 hours ago
    },
    {
      id: DEMO_IDS.notifications.notif10,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate,
      type: "invoice_paid" as const,
      title: "Invoice INV-2024-009 paid in full",
      body: "Apex Developments Ltd has paid invoice INV-2024-009 (£3,000.00) for the remortgage matter.",
      link: `/billing/invoices/${DEMO_IDS.invoices.inv9}`,
      read: false,
      createdAt: new Date(now.getTime() - 86400000), // 1 day ago
    },
    {
      id: DEMO_IDS.notifications.notif11,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate3,
      type: "invoice_paid" as const,
      title: "Invoice INV-2024-010 paid in full",
      body: "Michael O'Brien has paid invoice INV-2024-010 (£4,500.00) for the settlement agreement.",
      link: `/billing/invoices/${DEMO_IDS.invoices.inv10}`,
      read: true,
      readAt: new Date(now.getTime() - 64800000),
      createdAt: new Date(now.getTime() - 172800000), // 2 days ago
    },
    {
      id: DEMO_IDS.notifications.notif12,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.receptionist,
      type: "payment_received" as const,
      title: "Payment received: £1,500.00",
      body: "Partial payment received for invoice INV-2024-003. Balance remaining: £1,500.00",
      link: `/billing/invoices/${DEMO_IDS.invoices.inv3}`,
      read: false,
      createdAt: new Date(now.getTime() - 259200000), // 3 days ago
    },
    // Document uploaded notifications (3)
    {
      id: DEMO_IDS.notifications.notif13,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate,
      type: "document_uploaded" as const,
      title: "New document: Contract Pack.pdf",
      body: "Sarah Harrison uploaded a new document to the Willow Lane conveyancing matter.",
      link: `/matters/${DEMO_IDS.matters.conveyancing}/documents`,
      read: true,
      readAt: new Date(now.getTime() - 172800000),
      createdAt: new Date(now.getTime() - 345600000), // 4 days ago
    },
    {
      id: DEMO_IDS.notifications.notif14,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.partner,
      type: "document_uploaded" as const,
      title: "New document: Expert Report - Structural.pdf",
      body: "James Clarke uploaded a new document to the construction defects litigation matter.",
      link: `/matters/${DEMO_IDS.matters.litigation}/documents`,
      read: false,
      createdAt: new Date(now.getTime() - 432000000), // 5 days ago
    },
    {
      id: DEMO_IDS.notifications.notif15,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate2,
      type: "document_uploaded" as const,
      title: "New document: Title Deeds.pdf",
      body: "Tom Richards uploaded title deeds for the Kensington Gardens sale.",
      link: `/matters/${DEMO_IDS.matters.conveyancingSale}/documents`,
      read: true,
      readAt: new Date(now.getTime() - 432000000),
      createdAt: new Date(now.getTime() - 518400000), // 6 days ago
    },
    // Deadline approaching notifications (3)
    {
      id: DEMO_IDS.notifications.notif16,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate,
      type: "deadline_approaching" as const,
      title: "Deadline approaching: Exchange of contracts",
      body: "Exchange deadline for Willow Lane purchase is in 3 days (2024-11-15).",
      link: `/matters/${DEMO_IDS.matters.conveyancing}`,
      read: false,
      createdAt: new Date(now.getTime() - 604800000), // 7 days ago
    },
    {
      id: DEMO_IDS.notifications.notif17,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.partner,
      type: "deadline_approaching" as const,
      title: "Deadline approaching: Defence filing deadline",
      body: "Defence must be filed by 2024-11-20 for the construction defects claim.",
      link: `/matters/${DEMO_IDS.matters.litigation}`,
      read: true,
      readAt: new Date(now.getTime() - 604800000),
      createdAt: new Date(now.getTime() - 691200000), // 8 days ago
    },
    {
      id: DEMO_IDS.notifications.notif18,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.associate3,
      type: "deadline_approaching" as const,
      title: "Deadline approaching: ET response deadline",
      body: "Employment tribunal response deadline is in 5 days for the unfair dismissal case.",
      link: `/matters/${DEMO_IDS.matters.employmentDismissal}`,
      read: false,
      createdAt: new Date(now.getTime() - 777600000), // 9 days ago
    },
    // System notifications (2)
    {
      id: DEMO_IDS.notifications.notif19,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.partner,
      type: "system" as const,
      title: "Monthly billing summary ready",
      body: "Your October 2024 billing summary is ready to review. Total billed: £45,600.00",
      link: "/billing/reports",
      read: true,
      readAt: new Date(now.getTime() - 691200000),
      createdAt: new Date(now.getTime() - 864000000), // 10 days ago
    },
    {
      id: DEMO_IDS.notifications.notif20,
      firmId: DEMO_IDS.firm,
      userId: DEMO_IDS.users.seniorPartner,
      type: "system" as const,
      title: "Firm compliance review complete",
      body: "Your quarterly SRA compliance review has been completed. No issues identified.",
      link: "/compliance/reviews",
      read: false,
      createdAt: new Date(now.getTime() - 1209600000), // 14 days ago
    },
  ];

  const createdNotifications = [];

  for (const notificationData of notificationsData) {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .onConflictDoUpdate({
        target: notifications.id,
        set: { createdAt: notificationData.createdAt },
      })
      .returning();

    createdNotifications.push(notification);
    console.log(
      `    Created notification: ${notification.title.substring(0, 50)}... (${notification.read ? "read" : "unread"})`
    );
  }

  return createdNotifications;
}
