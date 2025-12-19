import { db } from "@/lib/db";
import { timelineEvents } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

/**
 * Seed timeline events - case history across all demo matters
 *
 * Creates 66 timeline events across 9 matters showing realistic legal workflows:
 * - Conveyancing: Property purchase progress from opening to exchange
 * - Litigation: Construction dispute from letter before action to CMC
 * - Personal Injury: RTA claim from accident report to medical evidence
 * - Family: Divorce proceedings from petition to FDA
 * - Employment: Unfair dismissal from ACAS to ET hearing
 * - Probate: Estate administration from will to grant application
 * - Criminal: Drink driving defence from police station to first hearing
 * - Immigration: Skilled Worker visa from CoS to biometrics
 * - Commercial: Shareholder agreement from term sheet to negotiation
 *
 * Events include actorType (user, system, ai) and metadata for AI actions.
 */
export async function seedTimelineEvents(ctx: SeederContext): Promise<number> {
  console.log("  Creating timeline events...");

  // Helper to create dates in the past
  const daysAgo = (days: number) => new Date(ctx.now.getTime() - days * 24 * 60 * 60 * 1000);

  // Timeline events organized by matter type with realistic UK legal workflow
  const timelineEventsData = [
    // =========================================================================
    // CONVEYANCING - Purchase of 15 Willow Lane (MAT-DEMO-001)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl1,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "New purchase matter opened for Mrs Margaret Thompson. Property: 15 Willow Lane, Richmond, TW9 1AA. Purchase price: £850,000.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(45),
    },
    {
      id: DEMO_IDS.timelineEvents.tl2,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "conflict_check_run" as const,
      title: "Conflict check completed",
      description:
        "No conflicts identified. Seller's solicitors: Browne & Partners. Seller: Mr & Mrs Davidson.",
      actorType: "system" as const,
      occurredAt: daysAgo(45),
    },
    {
      id: DEMO_IDS.timelineEvents.tl3,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "document_uploaded" as const,
      title: "ID verification documents received",
      description: "Passport and utility bill uploaded for AML compliance.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(44),
    },
    {
      id: DEMO_IDS.timelineEvents.tl4,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "email_sent" as const,
      title: "Initial letter sent to seller's solicitors",
      description: "Requested draft contract pack and supporting documents.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(43),
    },
    {
      id: DEMO_IDS.timelineEvents.tl5,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "document_uploaded" as const,
      title: "Contract pack received",
      description:
        "Draft contract, title deeds, property information form, fixtures list received from seller's solicitors.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(40),
    },
    {
      id: DEMO_IDS.timelineEvents.tl6,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "task_created" as const,
      title: "Searches ordered",
      description: "Local authority, drainage, environmental, and chancel repair searches ordered.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(39),
    },
    {
      id: DEMO_IDS.timelineEvents.tl7,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "document_summarized" as const,
      title: "AI: Title analysis complete",
      description:
        "AI reviewed title deeds. Property is freehold with no restrictive covenants affecting proposed use. Good and marketable title confirmed.",
      actorType: "ai" as const,
      occurredAt: daysAgo(38),
      metadata: { model: "gpt-4", confidence: 0.94 },
    },
    {
      id: DEMO_IDS.timelineEvents.tl8,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "email_sent" as const,
      title: "Enquiries raised",
      description:
        "15 preliminary enquiries sent to seller's solicitors regarding boundaries, disputes, and alterations.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(35),
    },
    {
      id: DEMO_IDS.timelineEvents.tl9,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "document_uploaded" as const,
      title: "Search results received",
      description: "All searches returned clear. No adverse entries.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(28),
    },
    {
      id: DEMO_IDS.timelineEvents.tl10,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "email_received" as const,
      title: "Enquiry replies received",
      description: "Seller's solicitors responded to all 15 enquiries. Reviewing for completeness.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(21),
    },
    {
      id: DEMO_IDS.timelineEvents.tl11,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "document_uploaded" as const,
      title: "Mortgage offer received",
      description:
        "Nationwide mortgage offer received. £680,000 advance at 4.25% fixed for 5 years.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(14),
    },
    {
      id: DEMO_IDS.timelineEvents.tl12,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.conveyancing,
      type: "email_sent" as const,
      title: "Report on title sent to client",
      description:
        "Comprehensive report on title sent to Mrs Thompson with contract for signature.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(10),
    },

    // =========================================================================
    // LITIGATION - Apex vs BuildRight Construction Defects (MAT-DEMO-002)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl13,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "New litigation matter opened. Client: Apex Developments Ltd. Defendant: BuildRight Construction Ltd. Claim value: £2.4m for defective foundation works.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(120),
    },
    {
      id: DEMO_IDS.timelineEvents.tl14,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "conflict_check_cleared" as const,
      title: "Conflict check cleared",
      description: "No conflicts with BuildRight Construction or related parties.",
      actorType: "system" as const,
      occurredAt: daysAgo(120),
    },
    {
      id: DEMO_IDS.timelineEvents.tl15,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "document_uploaded" as const,
      title: "Building contract uploaded",
      description: "JCT Design and Build Contract 2016 uploaded for review.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(118),
    },
    {
      id: DEMO_IDS.timelineEvents.tl16,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "email_sent" as const,
      title: "Letter before action sent",
      description:
        "Pre-action letter sent to BuildRight in accordance with Practice Direction - Pre-Action Conduct.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(115),
    },
    {
      id: DEMO_IDS.timelineEvents.tl17,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "document_uploaded" as const,
      title: "Expert report received",
      description:
        "Structural engineer's report confirming foundation defects. Estimated remediation cost: £1.8m.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(100),
    },
    {
      id: DEMO_IDS.timelineEvents.tl18,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "email_received" as const,
      title: "Defendant's response received",
      description:
        "BuildRight denies liability, claims defects due to ground conditions not disclosed by client.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(90),
    },
    {
      id: DEMO_IDS.timelineEvents.tl19,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "document_uploaded" as const,
      title: "Claim form issued",
      description:
        "Claim form N1 issued in the Technology and Construction Court. Claim number: HT-2024-000892.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(75),
    },
    {
      id: DEMO_IDS.timelineEvents.tl20,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "document_uploaded" as const,
      title: "Particulars of claim filed",
      description: "Detailed particulars of claim filed with supporting evidence schedule.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(60),
    },
    {
      id: DEMO_IDS.timelineEvents.tl21,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "document_uploaded" as const,
      title: "Defence received",
      description:
        "Defence and counterclaim for £450,000 received. Counterclaim alleges project delays caused by client.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(32),
    },
    {
      id: DEMO_IDS.timelineEvents.tl22,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.litigation,
      type: "calendar_event_created" as const,
      title: "CMC scheduled",
      description: "Case management conference listed for preliminary directions.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(25),
    },

    // =========================================================================
    // PERSONAL INJURY - RTA M6 Collision (MAT-DEMO-008)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl23,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "RTA personal injury claim opened. Client: Mr Robert Williams. Accident on M6 near junction 19. Whiplash and soft tissue injuries.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(90),
    },
    {
      id: DEMO_IDS.timelineEvents.tl24,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "document_uploaded" as const,
      title: "Accident report obtained",
      description: "Police accident report obtained. Third party admitted liability at scene.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(88),
    },
    {
      id: DEMO_IDS.timelineEvents.tl25,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "email_sent" as const,
      title: "Letter of claim sent",
      description: "CNF submitted to third party insurer (Admiral Insurance) via Claims Portal.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(85),
    },
    {
      id: DEMO_IDS.timelineEvents.tl26,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "email_received" as const,
      title: "Liability admitted",
      description: "Admiral Insurance confirmed admission of liability. Proceeding to quantum.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(75),
    },
    {
      id: DEMO_IDS.timelineEvents.tl27,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "task_created" as const,
      title: "Medical expert instructed",
      description:
        "Dr Sarah Evans (consultant orthopaedic surgeon) instructed for independent medical examination.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(70),
    },
    {
      id: DEMO_IDS.timelineEvents.tl28,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "document_uploaded" as const,
      title: "Medical report received",
      description:
        "Medical report confirms Grade II whiplash. Prognosis: full recovery within 12-18 months.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.partner,
      occurredAt: daysAgo(45),
    },
    {
      id: DEMO_IDS.timelineEvents.tl29,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      type: "document_summarized" as const,
      title: "AI: Medical report analysed",
      description:
        "AI analysis suggests PSLA bracket: £4,500-£7,500 based on JC Guidelines. Special damages estimated at £2,800.",
      actorType: "ai" as const,
      occurredAt: daysAgo(45),
      metadata: { model: "gpt-4", confidence: 0.88 },
    },

    // =========================================================================
    // FAMILY - Thompson Divorce (MAT-DEMO-012)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl30,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "Divorce proceedings opened. Petitioner: Mrs Jennifer Adams. Respondent: Mr Thomas Adams. No-fault divorce application.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(60),
    },
    {
      id: DEMO_IDS.timelineEvents.tl31,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      type: "document_uploaded" as const,
      title: "Divorce application filed",
      description:
        "Application for divorce filed online via HMCTS portal. Application reference: D80009412.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(58),
    },
    {
      id: DEMO_IDS.timelineEvents.tl32,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      type: "email_received" as const,
      title: "Acknowledgement received",
      description: "Respondent acknowledged service. No intention to defend.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(45),
    },
    {
      id: DEMO_IDS.timelineEvents.tl33,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      type: "document_uploaded" as const,
      title: "Form E drafted",
      description:
        "Financial statement Form E completed. Matrimonial assets: £1.2m including family home.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(40),
    },
    {
      id: DEMO_IDS.timelineEvents.tl34,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      type: "task_created" as const,
      title: "Pension valuations requested",
      description: "CETV requests sent to 3 pension providers.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(38),
    },
    {
      id: DEMO_IDS.timelineEvents.tl35,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.familyDivorce,
      type: "calendar_event_created" as const,
      title: "FDA scheduled",
      description: "First Directions Appointment listed at Central Family Court.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(30),
    },

    // =========================================================================
    // EMPLOYMENT - Unfair Dismissal (MAT-DEMO-015)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl36,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "Unfair dismissal claim opened. Claimant: Mr Michael O'Brien. Respondent: Northern Manufacturing plc. 15 years service, senior manager.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(75),
    },
    {
      id: DEMO_IDS.timelineEvents.tl37,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "document_uploaded" as const,
      title: "Contract and dismissal letter uploaded",
      description: "Employment contract, dismissal letter, and appeal correspondence uploaded.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(74),
    },
    {
      id: DEMO_IDS.timelineEvents.tl38,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "task_created" as const,
      title: "ACAS Early Conciliation started",
      description: "ACAS notification submitted. EC certificate expected within 6 weeks.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(73),
    },
    {
      id: DEMO_IDS.timelineEvents.tl39,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "document_uploaded" as const,
      title: "ACAS certificate received",
      description:
        "Early Conciliation certificate received. No settlement achieved. Proceeding to ET.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(50),
    },
    {
      id: DEMO_IDS.timelineEvents.tl40,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "document_uploaded" as const,
      title: "ET1 filed",
      description:
        "ET1 claim form submitted online. Claims: unfair dismissal, wrongful dismissal, failure to follow ACAS code.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(48),
    },
    {
      id: DEMO_IDS.timelineEvents.tl41,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "document_uploaded" as const,
      title: "ET3 response received",
      description: "Respondent's ET3 received. Denies unfair dismissal, claims gross misconduct.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(20),
    },
    {
      id: DEMO_IDS.timelineEvents.tl42,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.employmentDismissal,
      type: "calendar_event_created" as const,
      title: "Preliminary hearing listed",
      description: "Case management preliminary hearing listed at Manchester Employment Tribunal.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate3,
      occurredAt: daysAgo(15),
    },

    // =========================================================================
    // PROBATE - Estate of John Roberts (MAT-DEMO-018)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl43,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "Probate matter opened. Deceased: John Roberts. Date of death: 3 months ago. Executor: Mrs George Henderson (son).",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(80),
    },
    {
      id: DEMO_IDS.timelineEvents.tl44,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      type: "document_uploaded" as const,
      title: "Will and death certificate received",
      description: "Original will dated 2019 and death certificate uploaded.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(78),
    },
    {
      id: DEMO_IDS.timelineEvents.tl45,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      type: "task_created" as const,
      title: "Asset enquiries sent",
      description:
        "Letters sent to banks, building societies, and pension providers to establish asset values.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(75),
    },
    {
      id: DEMO_IDS.timelineEvents.tl46,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      type: "document_uploaded" as const,
      title: "Property valuation received",
      description: "RICS valuation for 42 Oak Avenue: £385,000.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(60),
    },
    {
      id: DEMO_IDS.timelineEvents.tl47,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      type: "document_uploaded" as const,
      title: "IHT400 prepared",
      description:
        "Inheritance Tax account prepared. Gross estate: £450,000. Net estate: £445,000. No IHT payable (spouse exemption).",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(45),
    },
    {
      id: DEMO_IDS.timelineEvents.tl48,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.probateEstate,
      type: "document_uploaded" as const,
      title: "Grant of probate applied for",
      description: "PA1P application submitted to Newcastle Probate Registry.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal2,
      occurredAt: daysAgo(40),
    },

    // =========================================================================
    // CRIMINAL - Drink Driving Defence (MAT-DEMO-021)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl49,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "Criminal defence matter opened. Client: Mr George Henderson. Charge: Driving with excess alcohol (95μg, limit 35μg).",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(30),
    },
    {
      id: DEMO_IDS.timelineEvents.tl50,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      type: "note_added" as const,
      title: "Police station attendance",
      description:
        "Attended police station. Client interviewed under caution. Advised no comment interview.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(30),
    },
    {
      id: DEMO_IDS.timelineEvents.tl51,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      type: "document_uploaded" as const,
      title: "Advance disclosure received",
      description: "MG5 summary, breath test printout, and CCTV stills received from CPS.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(25),
    },
    {
      id: DEMO_IDS.timelineEvents.tl52,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      type: "task_created" as const,
      title: "Intoximeter records requested",
      description: "Section 8 PACE request sent for calibration records and maintenance logs.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(23),
    },
    {
      id: DEMO_IDS.timelineEvents.tl53,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.criminalDriving,
      type: "calendar_event_created" as const,
      title: "First hearing listed",
      description: "Plea hearing listed at Westminster Magistrates' Court.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate,
      occurredAt: daysAgo(20),
    },

    // =========================================================================
    // IMMIGRATION - Skilled Worker Visa (MAT-DEMO-023)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl54,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "Immigration matter opened. Applicant: Ms Fatima Hassan. Sponsor: TechStart Solutions Ltd. Role: Senior Software Engineer.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(35),
    },
    {
      id: DEMO_IDS.timelineEvents.tl55,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "document_uploaded" as const,
      title: "Certificate of Sponsorship issued",
      description: "CoS reference number issued by sponsor. Salary: £65,000. SOC code: 2134.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(33),
    },
    {
      id: DEMO_IDS.timelineEvents.tl56,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "document_uploaded" as const,
      title: "Supporting documents gathered",
      description:
        "Passport, TB test certificate, English language evidence, and bank statements uploaded.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.paralegal1,
      occurredAt: daysAgo(30),
    },
    {
      id: DEMO_IDS.timelineEvents.tl57,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "document_uploaded" as const,
      title: "Application submitted",
      description: "Skilled Worker visa application submitted online. GWF reference: GWF123456789.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(25),
    },
    {
      id: DEMO_IDS.timelineEvents.tl58,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "calendar_event_created" as const,
      title: "Biometrics appointment booked",
      description: "Biometric enrolment scheduled at VFS Global centre.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(24),
    },
    {
      id: DEMO_IDS.timelineEvents.tl59,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.immigrationTier2,
      type: "note_added" as const,
      title: "Biometrics completed",
      description: "Client attended biometrics appointment. All documents submitted.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.associate2,
      occurredAt: daysAgo(20),
    },

    // =========================================================================
    // COMMERCIAL - Shareholder Agreement (MAT-DEMO-025)
    // =========================================================================
    {
      id: DEMO_IDS.timelineEvents.tl60,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "matter_created" as const,
      title: "Matter opened",
      description:
        "Commercial matter opened. Client: TechStart Solutions Ltd. Matter: Shareholders agreement for Series A funding round.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.seniorPartner,
      occurredAt: daysAgo(40),
    },
    {
      id: DEMO_IDS.timelineEvents.tl61,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "conflict_check_cleared" as const,
      title: "Conflict check cleared",
      description: "No conflicts with incoming investors or existing shareholders.",
      actorType: "system" as const,
      occurredAt: daysAgo(40),
    },
    {
      id: DEMO_IDS.timelineEvents.tl62,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "document_uploaded" as const,
      title: "Term sheet received",
      description: "Term sheet from lead investor uploaded. Investment: £2m for 20% equity.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.seniorPartner,
      occurredAt: daysAgo(38),
    },
    {
      id: DEMO_IDS.timelineEvents.tl63,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "document_summarized" as const,
      title: "AI: Term sheet analysis",
      description:
        "AI identified key terms requiring negotiation: liquidation preference (2x), anti-dilution (broad-based), board composition.",
      actorType: "ai" as const,
      occurredAt: daysAgo(38),
      metadata: { model: "gpt-4", confidence: 0.91 },
    },
    {
      id: DEMO_IDS.timelineEvents.tl64,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "document_uploaded" as const,
      title: "Draft SHA circulated",
      description: "First draft shareholders agreement circulated to all parties.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.seniorPartner,
      occurredAt: daysAgo(30),
    },
    {
      id: DEMO_IDS.timelineEvents.tl65,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "email_received" as const,
      title: "Investor comments received",
      description: "Marked-up draft received from investor's counsel with 23 comments.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.seniorPartner,
      occurredAt: daysAgo(20),
    },
    {
      id: DEMO_IDS.timelineEvents.tl66,
      firmId: DEMO_IDS.firm,
      matterId: DEMO_IDS.matters.commercialShareholder,
      type: "note_added" as const,
      title: "Negotiation call completed",
      description:
        "2-hour call with investor counsel. Agreed on liquidation preference (1.5x), board seat provisions.",
      actorType: "user" as const,
      actorId: DEMO_IDS.users.seniorPartner,
      occurredAt: daysAgo(15),
    },
  ];

  // Insert timeline events
  for (const event of timelineEventsData) {
    await db.insert(timelineEvents).values(event).onConflictDoNothing();
  }

  console.log(
    `    Created ${timelineEventsData.length} timeline events across ${new Set(timelineEventsData.map((e) => e.matterId)).size} matters`
  );

  return timelineEventsData.length;
}
