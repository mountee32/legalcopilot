import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedCalendarEvents(ctx: SeederContext) {
  console.log("  Seeding calendar events...");

  const now = ctx.now;

  // Date helpers for calendar events
  const oneWeek = new Date(now.getTime() + 7 * 86400000);
  const twoWeeks = new Date(now.getTime() + 14 * 86400000);
  const threeWeeks = new Date(now.getTime() + 21 * 86400000);
  const oneMonth = new Date(now.getTime() + 30 * 86400000);
  const twoMonths = new Date(now.getTime() + 60 * 86400000);

  const calendarEventsData = [
    // Court hearings
    {
      id: DEMO_IDS.calendarEvents.event1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "County Court Hearing - Preliminary Directions",
      description:
        "Preliminary directions hearing for breach of contract claim. Prepare case management bundle.",
      eventType: "hearing" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(oneWeek.setHours(10, 30, 0, 0)),
      endAt: new Date(oneWeek.getTime() + 90 * 60000), // 90 minutes
      allDay: false,
      location: "Manchester County Court, Court Room 3",
      attendees: [DEMO_IDS.users.partner, DEMO_IDS.clients.company],
      reminderMinutes: [1440, 60], // 1 day and 1 hour before
      createdById: DEMO_IDS.users.partner,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigationContract,
      title: "High Court Trial - Day 1",
      description: "Commercial contract dispute trial. Full day hearing with witness evidence.",
      eventType: "hearing" as const,
      status: "scheduled" as const,
      priority: "critical" as const,
      startAt: new Date(twoMonths.setHours(10, 0, 0, 0)),
      endAt: new Date(twoMonths.getTime() + 360 * 60000), // 6 hours
      allDay: false,
      location: "Royal Courts of Justice, Strand, London",
      attendees: [
        DEMO_IDS.users.seniorPartner,
        DEMO_IDS.users.associate,
        DEMO_IDS.clients.company3,
      ],
      reminderMinutes: [10080, 1440, 60], // 1 week, 1 day, 1 hour before
      createdById: DEMO_IDS.users.seniorPartner,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      title: "Family Court - Financial Remedy Hearing",
      description: "First directions appointment for financial settlement.",
      eventType: "hearing" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(threeWeeks.setHours(14, 0, 0, 0)),
      endAt: new Date(threeWeeks.getTime() + 60 * 60000), // 1 hour
      allDay: false,
      location: "Birmingham Family Court",
      attendees: [DEMO_IDS.users.associate2, DEMO_IDS.clients.individual4],
      reminderMinutes: [1440, 120], // 1 day and 2 hours before
      createdById: DEMO_IDS.users.associate2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      title: "Magistrates Court - Plea Hearing",
      description: "Client to enter plea for driving without due care and attention.",
      eventType: "hearing" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(new Date(now.getTime() + 10 * 86400000).setHours(9, 30, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 10 * 86400000).setHours(10, 30, 0, 0)),
      allDay: false,
      location: "Manchester Magistrates Court",
      attendees: [DEMO_IDS.users.associate3, DEMO_IDS.clients.individual6],
      reminderMinutes: [1440, 60],
      createdById: DEMO_IDS.users.associate3,
      createdAt: now,
      updatedAt: now,
    },

    // Filing deadlines
    {
      id: DEMO_IDS.calendarEvents.event5,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      title: "DEADLINE: Defence and Counterclaim",
      description: "File and serve Defence and Counterclaim at court. Must be done by 4pm.",
      eventType: "filing_deadline" as const,
      status: "scheduled" as const,
      priority: "critical" as const,
      startAt: new Date(new Date(now.getTime() + 5 * 86400000).setHours(16, 0, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 5 * 86400000).setHours(16, 0, 0, 0)),
      allDay: false,
      location: null,
      attendees: [DEMO_IDS.users.partner, DEMO_IDS.users.paralegal1],
      reminderMinutes: [2880, 1440, 240], // 2 days, 1 day, 4 hours before
      createdById: DEMO_IDS.users.partner,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event6,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      title: "DEADLINE: ET1 Claim Form Submission",
      description: "Submit Employment Tribunal claim form before limitation expires.",
      eventType: "filing_deadline" as const,
      status: "scheduled" as const,
      priority: "critical" as const,
      startAt: new Date(new Date(now.getTime() + 12 * 86400000).setHours(23, 59, 0, 0)),
      endAt: null,
      allDay: true,
      location: null,
      attendees: [DEMO_IDS.users.associate, DEMO_IDS.users.paralegal2],
      reminderMinutes: [4320, 1440, 480], // 3 days, 1 day, 8 hours
      createdById: DEMO_IDS.users.associate,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event7,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      title: "DEADLINE: Witness Statements",
      description: "Exchange witness statements with defendant's solicitors.",
      eventType: "filing_deadline" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(oneMonth.setHours(17, 0, 0, 0)),
      endAt: null,
      allDay: false,
      location: null,
      attendees: [DEMO_IDS.users.associate2],
      reminderMinutes: [10080, 2880, 1440], // 1 week, 2 days, 1 day
      createdById: DEMO_IDS.users.associate2,
      createdAt: now,
      updatedAt: now,
    },

    // Client meetings
    {
      id: DEMO_IDS.calendarEvents.event8,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      title: "Client Meeting - Property Purchase Update",
      description: "Discuss search results and contract queries with buyers.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "medium" as const,
      startAt: new Date(new Date(now.getTime() + 3 * 86400000).setHours(11, 0, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 3 * 86400000).setHours(12, 0, 0, 0)),
      allDay: false,
      location: "Meeting Room 1, Harrison & Clarke Offices",
      attendees: [DEMO_IDS.users.associate, DEMO_IDS.clients.individual],
      reminderMinutes: [1440, 30],
      createdById: DEMO_IDS.users.associate,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event9,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      title: "Client Meeting - Shareholder Agreement Review",
      description: "Review draft shareholder agreement and discuss governance provisions.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(twoWeeks.setHours(15, 0, 0, 0)),
      endAt: new Date(twoWeeks.getTime() + 90 * 60000),
      allDay: false,
      location: "Client Offices, MediaCityUK",
      attendees: [
        DEMO_IDS.users.seniorPartner,
        DEMO_IDS.users.associate,
        DEMO_IDS.clients.company5,
      ],
      reminderMinutes: [2880, 60],
      createdById: DEMO_IDS.users.seniorPartner,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event10,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      title: "Client Meeting - Estate Administration Progress",
      description: "Update beneficiaries on estate valuation and probate application status.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "medium" as const,
      startAt: new Date(new Date(now.getTime() + 8 * 86400000).setHours(10, 0, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 8 * 86400000).setHours(11, 0, 0, 0)),
      allDay: false,
      location: "Video Call (Microsoft Teams)",
      attendees: [DEMO_IDS.users.associate3, DEMO_IDS.clients.estate1],
      reminderMinutes: [1440, 15],
      createdById: DEMO_IDS.users.associate3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event11,
      firmId: DEMO_IDS.firm,
      matterId: null, // New business consultation
      title: "New Client Consultation - Immigration Matter",
      description: "Initial consultation for potential Tier 2 Visa sponsorship case.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "medium" as const,
      startAt: new Date(new Date(now.getTime() + 4 * 86400000).setHours(14, 30, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 4 * 86400000).setHours(15, 30, 0, 0)),
      allDay: false,
      location: "Meeting Room 2, Harrison & Clarke Offices",
      attendees: [DEMO_IDS.users.associate2],
      reminderMinutes: [1440, 60],
      createdById: DEMO_IDS.users.receptionist,
      createdAt: now,
      updatedAt: now,
    },

    // Team meetings
    {
      id: DEMO_IDS.calendarEvents.event12,
      firmId: DEMO_IDS.firm,
      matterId: null,
      title: "Litigation Team Weekly Case Review",
      description: "Review active litigation cases, upcoming deadlines, and resource allocation.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "medium" as const,
      startAt: new Date(new Date(now.getTime() + 7 * 86400000).setHours(9, 0, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 7 * 86400000).setHours(10, 0, 0, 0)),
      allDay: false,
      location: "Conference Room A",
      attendees: [
        DEMO_IDS.users.seniorPartner,
        DEMO_IDS.users.partner,
        DEMO_IDS.users.associate,
        DEMO_IDS.users.paralegal1,
      ],
      reminderMinutes: [60],
      createdById: DEMO_IDS.users.seniorPartner,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event13,
      firmId: DEMO_IDS.firm,
      matterId: null,
      title: "Conveyancing Department Meeting",
      description:
        "Monthly conveyancing team meeting. Discuss completions, searches, and client updates.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "low" as const,
      startAt: new Date(twoWeeks.setHours(16, 0, 0, 0)),
      endAt: new Date(twoWeeks.getTime() + 60 * 60000),
      allDay: false,
      location: "Conference Room B",
      attendees: [DEMO_IDS.users.partner, DEMO_IDS.users.associate, DEMO_IDS.users.paralegal2],
      reminderMinutes: [1440],
      createdById: DEMO_IDS.users.partner,
      createdAt: now,
      updatedAt: now,
    },

    // Consultations
    {
      id: DEMO_IDS.calendarEvents.event14,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyChild,
      title: "Client Consultation - Child Arrangement Order",
      description: "Discuss CAFCASS report and prepare for final hearing.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(new Date(now.getTime() + 6 * 86400000).setHours(13, 30, 0, 0)),
      endAt: new Date(new Date(now.getTime() + 6 * 86400000).setHours(14, 30, 0, 0)),
      allDay: false,
      location: "Meeting Room 1, Harrison & Clarke Offices",
      attendees: [DEMO_IDS.users.associate2, DEMO_IDS.clients.individual5],
      reminderMinutes: [2880, 60],
      createdById: DEMO_IDS.users.associate2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.calendarEvents.event15,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentSettlement,
      title: "Without Prejudice Settlement Meeting",
      description:
        "Confidential settlement discussion with opposing party. Aim to reach compromise agreement.",
      eventType: "meeting" as const,
      status: "scheduled" as const,
      priority: "high" as const,
      startAt: new Date(threeWeeks.setHours(10, 30, 0, 0)),
      endAt: new Date(threeWeeks.getTime() + 120 * 60000), // 2 hours
      allDay: false,
      location: "Neutral Venue - Holiday Inn Manchester City Centre",
      attendees: [DEMO_IDS.users.associate, DEMO_IDS.clients.individual8],
      reminderMinutes: [2880, 1440, 60],
      createdById: DEMO_IDS.users.associate,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const createdEvents = [];

  for (const eventData of calendarEventsData) {
    const [event] = await db
      .insert(calendarEvents)
      .values(eventData)
      .onConflictDoUpdate({
        target: calendarEvents.id,
        set: { updatedAt: now },
      })
      .returning();

    createdEvents.push({ id: event.id, title: event.title });
    console.log(`    Created calendar event: ${event.title}`);
  }

  return createdEvents;
}
