# Document 11A: Toolkit Extensions Deep Dive

**Series**: Leglise Product Specification
**Date**: February 23, 2026
**Status**: Creative Exploration (No Technical Implementation)
**Purpose**: Expand the toolkit catalog with new toolkit ideas and deeper specifications for existing toolkits -- all at the product level, no technical implementation
**Companion Documents**: [11 -- Firm-Wide Extensions](./11-firm-wide-extensions.md), [00 -- Platform Overview](./00-platform-overview.md), [10 -- The Extension System](./10-the-extension-system.md)

---

> **This document extends [Document 11](./11-firm-wide-extensions.md).** Document 11 catalogs 15 firm-wide toolkits across five categories. This document does two things: (1) proposes 7 additional toolkits that fill gaps in the original catalog, and (2) deepens the specifications of 6 existing toolkits with detailed features, user scenarios, AI behaviors, and edge cases. Everything here is product-level -- no database schemas, no API designs, no code.

---

## Part 1: New Toolkit Ideas

The original catalog covers operational, knowledge, client-facing, strategic, and document toolkits. These 7 additions fill gaps that become visible when you imagine a firm running the full platform day to day.

---

### 1.1 Vendor & Expert Network

Every litigation firm depends on external experts -- IME rebuttal physicians, vocational counselors, economists, life care planners, court reporters, interpreters. Managing these relationships today means scattered contact lists, personal Rolodexes, and institutional knowledge that lives in one attorney's head. When that attorney leaves, the firm loses years of expert intelligence.

The Vendor & Expert Network centralizes expert management into a searchable, rated, AI-connected directory.

**Why it matters:** In workers' comp, the quality of your expert witnesses directly affects case outcomes. An economist who explains future wage loss clearly to a BIIA judge is worth more than one who is technically correct but incomprehensible. A treating physician who writes detailed reports with clear causation opinions strengthens every case they touch. Firms that systematically track expert quality make better choices on every case.

**Key features:**

- **Expert directory.** Searchable by specialty, jurisdiction, availability, rate, and quality score. Every expert the firm has ever used -- medical providers, vocational counselors, economists, life care planners, translators, court reporters -- in one place. New experts are added during case work; the directory grows organically.

- **Quality scoring.** After every engagement, the attorney rates the expert on responsiveness, report quality, testimony effectiveness, and value for cost. Scores accumulate across cases. A vocational counselor who consistently produces thorough assessments and testifies well rises to the top. One who misses deadlines and writes thin reports falls. Quality scores are visible firm-wide.

- **Testimony outcome tracking.** For experts who testify at hearings or depositions, track whether the case outcome aligned with their opinions. Did the BIIA judge credit Dr. Johnson's impairment rating? Did the vocational counselor's earning capacity assessment hold up? Over time, this builds a track record of which experts are most persuasive in which forums.

- **Availability and scheduling.** Track expert availability windows, typical lead times, and scheduling preferences. When an attorney needs an IME rebuttal physician, the system shows who is available in the next 30 days, what their rate is, and how they have performed on similar cases. Integration with the Scheduling toolkit (1.5) for multi-party coordination.

- **Rate tracking and budget impact.** Historical rates per expert, rate trends, and per-case cost projections. Before engaging an expert, the attorney sees: "Dr. Chen charges $3,500 for a records review and report, $5,000 if deposition is required. Your case budget has $8,000 remaining for expert costs." Links to the Expense tracker (Toolkit 1.6) for cost advance management.

- **Specialty matching.** When a case needs an expert in a specific area -- say, a physician specializing in cervical radiculopathy who has testified before Judge Thompson -- the system filters the directory by specialty, jurisdiction experience, and judge familiarity. If no matching expert exists in the directory, the system flags the gap.

- **Conflict screening.** Before engaging an expert, the system checks whether the expert has been retained by opposing counsel in any active case, whether the expert has provided adverse opinions in prior firm cases, or whether any other conflict exists.

**Virtual Associate surface:** The AI recommends experts when cases need them. "This case needs a vocational assessment. Based on the injury type, case complexity, and budget, I recommend Dr. Rivera (quality score: 4.6/5, 8 prior engagements, available in 2 weeks) or Dr. Huang (4.3/5, 3 engagements, available immediately)." It flags expert conflicts during case preparation. It generates expert performance reports for managing partners. When drafting a motion that cites expert testimony, the AI pulls the expert's quality history to help the attorney assess how much weight to give the opinion.

---

### 1.2 Compliance & Risk Monitor

Malpractice in legal practice is not usually dramatic negligence -- it is a missed deadline, an overlooked conflict, an understaffed case where no one noticed the client had not been contacted in 90 days. These failures are preventable with systematic monitoring, but most firms rely on individual vigilance. The Compliance & Risk Monitor replaces individual vigilance with proactive, firm-wide risk detection.

**Why it matters:** In WA workers' comp, missing a 60-day protest deadline makes an L&I order final. Missing a BIIA appeal deadline ends the case. An ethical conflict that surfaces after months of work can force withdrawal and create malpractice exposure. These are not hypothetical risks -- they are the most common sources of legal malpractice claims.

**Key features:**

- **Deadline risk scoring.** Every approaching deadline is assigned a risk score based on: days remaining, whether preparatory tasks are complete, whether the responsible attorney is available, and whether the case has adequate staffing. A protest deadline in 10 days with no draft protest letter and the assigned attorney on vacation is a critical risk. The system escalates before the failure happens, not after.

- **Client communication monitoring.** Track the last substantive communication with every client. When a client has not been contacted in a configurable period (default: 30 days for active cases), the system generates a communication alert. Persistent communication gaps escalate to the managing partner. In WA, lack of communication is the #1 bar complaint category.

- **Conflict of interest monitoring.** Beyond the intake conflict check (Toolkit 2.9 in Document 11). As new parties, witnesses, and entities are added to cases throughout their lifecycle, the system continuously rescreens for conflicts. If a new expert witness is added to Case A and that expert was previously retained by opposing counsel in Case B, the conflict surfaces immediately -- not when someone happens to notice.

- **Ethical wall enforcement.** When a conflict is identified and waived or managed, the system enforces access restrictions. An attorney who has a conflict on a specific case cannot access that case's documents, notes, or chat history. Access attempts are logged and flagged. This is not a courtesy -- it is an enforced control.

- **Trust account compliance alerts.** Monitor IOLTA and trust account transactions for rule violations: commingling risk (firm funds in trust), negative client balances, disbursements without proper authorization, failure to promptly deposit client funds. Washington RPC 1.15A requires specific handling of client funds -- violations carry severe consequences.

- **Staffing adequacy monitoring.** Cases that are understaffed relative to their complexity and upcoming deadlines are flagged. A complex surgical WC case with an upcoming hearing, no paralegal assigned, and the attorney carrying 40 other active cases is a risk. The system does not wait for a deadline to be missed -- it identifies the staffing gap proactively.

- **Bar compliance tracking.** WSBA licensing requirements, CLE credit tracking (links to Training toolkit 2.7), trust account certification deadlines, mandatory reporting obligations. Automated reminders before compliance deadlines.

- **Risk dashboard.** A firm-wide view of all active risk indicators: deadline risks, communication gaps, staffing alerts, trust account warnings, conflict flags. The managing partner sees the firm's risk posture at a glance and can drill into any indicator.

**Virtual Associate surface:** The AI generates a daily risk briefing for managing partners: "2 deadline risks (protest deadline in 5 days on Martinez, no draft prepared; BIIA appeal deadline in 12 days on Thompson, draft in review). 3 communication gaps exceeding 30 days. Trust account balance is $2,100 below expected minimum." It suggests remediation actions for each risk. It monitors for patterns ("Attorney Rodriguez's cases have communication gaps 2x the firm average -- this may indicate a capacity issue rather than negligence").

---

### 1.3 Communication Hub

Attorneys and paralegals communicate across email, phone, portal messages, text messages, fax (yes, still), and in-person meetings. Case-relevant communication is scattered across these channels with no unified view. The Communication Hub brings every channel into a single, case-linked interface.

**Why it matters:** When a client calls asking about their case, the paralegal needs to see the full communication history -- not just emails, but portal messages, phone call logs, text exchanges, and letter correspondence. Today this requires checking 3-4 different systems. A unified communication view means the paralegal answers the client's question in one minute instead of five, and nothing falls through the cracks.

**Key features:**

- **Unified inbox.** Every incoming communication -- email, portal message, SMS, fax, voicemail transcript -- appears in a single stream, automatically linked to its case. The paralegal sees one inbox, not five. Communications are threaded by conversation, not by channel.

- **Case-linked threading.** Every communication thread is associated with a case. Open the Martinez case and see every communication in chronological order regardless of channel. Filter by channel, by participant, by date range, or by topic.

- **AI triage and routing.** Incoming communications are analyzed and routed to the right person. An email from L&I with an attached order is routed to the assigned attorney with urgency flagging. A client portal message asking about appointment scheduling is routed to the paralegal. A message from opposing counsel is flagged and routed to the attorney with a suggested priority.

- **Response time tracking.** Per-channel, per-case, per-person response times. The firm sets SLAs (e.g., client emails responded to within 4 hours, portal messages within 2 hours). Breaches trigger escalation. Response time data feeds into the Client Satisfaction toolkit (2.10) and Compliance & Risk Monitor (1.2).

- **Template responses.** Pre-built response templates for common communications: acknowledgment of document receipt, appointment confirmation, status update, information request. Templates auto-populate with case data. The attorney or paralegal customizes and sends.

- **Communication preferences.** Clients specify their preferred communication channel (email, portal, SMS, phone). The system routes outbound communications to the preferred channel. Some clients check email constantly; others only check the portal. Respecting preferences improves responsiveness and satisfaction.

- **Dictation and transcription.** Voice-to-text for phone call summaries. The attorney dictates a call summary immediately after hanging up; the system transcribes, links to the case, and files as a case note. Voicemail messages are automatically transcribed and routed.

**Virtual Associate surface:** The AI drafts response suggestions for routine communications ("The client is asking about their next appointment -- here is a draft response with the scheduled date and preparation instructions"). It summarizes communication history on demand ("Give me a summary of all communications with L&I on the Martinez case in the last 30 days"). It identifies communication patterns that suggest issues ("The adjuster has not responded to 3 consecutive emails over 2 weeks -- consider escalating via phone or formal letter"). It generates communication reports for the managing partner.

---

### 1.4 Document Template Studio

Document 11's Document Composer (Phase 2 core capability) handles AI-assisted writing. But before the Composer opens, someone has to create and maintain the templates that attorneys start from. The Document Template Studio is the template management layer -- where templates are designed, versioned, governed, and analyzed.

**Why it matters:** WA workers' comp firms use dozens of template types: protest letters, demand letters, doctor questionnaires, client intake forms, fee agreements, release of information forms, hearing briefs, settlement worksheets. Today these templates live in Word files on a shared drive, maintained by whoever last edited them, with no version history, no governance, and no analytics on which templates are actually used. When a paralegal uses an outdated protest letter template that is missing a required section, the error is not caught until the attorney reviews it (if then).

**Key features:**

- **Template library with categorization.** All firm templates in one searchable library, organized by document type, practice area, and purpose. Protest Letter (WC), Demand Letter (PI), Doctor Questionnaire (Medical), Fee Agreement (Intake), Hearing Brief (WC/BIIA). Each template has a description, usage instructions, and the last-modified date.

- **Version control.** Every template change is tracked with full history. Who changed what, when, and why. Roll back to any previous version. Compare versions side by side. When the BIIA changes its hearing procedures, the firm updates the hearing brief template and every attorney sees the current version -- not the one they saved to their desktop six months ago.

- **Conditional logic.** Template sections that appear or hide based on case data. A demand letter template that includes a PPD calculation section only when the case has PPD entities extracted. A protest letter that includes specific statutory citations based on the L&I order type being protested. The attorney does not need to manually delete irrelevant sections -- the template adapts to the case.

- **Variable system.** Template placeholders that auto-fill from case data: client name, claim number, injury date, attorney name, opposing counsel, treating physician, relevant diagnoses, key dates. Variables are standardized across all templates -- change a client's name in the case, and every template referencing that client updates.

- **Firm-wide governance.** Template ownership and approval workflows. The senior partner owns the demand letter template. Changes require their approval before the updated version becomes the firm default. Prevents rogue template edits that introduce errors or deviate from firm standards.

- **Usage analytics.** Which templates are used most frequently? Which templates generate the most revision cycles during QA review (suggesting the template itself needs improvement)? Which templates have not been used in 6+ months (suggesting they may be obsolete)? Analytics guide template maintenance priorities.

- **Template effectiveness scoring.** When templates are used in documents that go through QA review (Toolkit 2.6), track whether the final document required significant structural changes. Templates that consistently produce documents needing major revision are flagged for redesign. Templates that produce clean first drafts are models for other templates.

**Virtual Associate surface:** The AI suggests the right template when an attorney starts a new document ("Based on this case's current phase and the L&I order you are responding to, I recommend the Protest Letter -- Order on Treatment template"). It identifies missing variables during template population ("The template requires a treating physician name, but no treating physician entity has been extracted for this case -- would you like to add one?"). It suggests template improvements based on QA data ("The hearing brief template's 'Medical Evidence' section required restructuring in 60% of uses -- consider redesigning this section"). It drafts new template sections from firm precedent when existing templates do not cover a scenario.

---

### 1.5 Scheduling & Availability

The Calendar & Deadline Management capability in Document 0's MVP handles deadline tracking and escalating alerts. But deadline tracking is reactive -- it monitors dates. Scheduling is proactive -- it coordinates people, rooms, and availability to make things happen. The Scheduling & Availability toolkit handles the coordination side.

**Why it matters:** Scheduling a deposition in a WC case involves coordinating 4-6 parties: the attorney, opposing counsel, the court reporter, the deponent (often a medical provider with limited availability), sometimes an interpreter, and sometimes a videographer. Today this coordination happens via phone and email over days or weeks. A self-scheduling system with availability matching reduces 10 emails to 1 click.

**Key features:**

- **Client self-scheduling.** Clients book appointments (consultations, case reviews, preparation sessions) through the Client Experience Portal (Toolkit 2.8) using available time slots published by the firm. Time slots are generated from attorney availability and firm scheduling rules (e.g., no client meetings after 4 PM, no back-to-back consultations). Confirmations and reminders are automatic.

- **Multi-party deposition scheduling.** Propose deposition dates to all parties simultaneously. Each party marks available dates. The system identifies mutual availability and proposes the optimal date. If no mutual availability exists within the target window, the system identifies the smallest schedule adjustment needed. Once confirmed, the date flows into the case calendar and generates preparation deadline chains (from the Workflow Automations toolkit, 2.3).

- **Expert scheduling.** Coordinate with external experts for records reviews, report preparation, and testimony. Track expert availability windows and typical lead times. When a case needs a vocational assessment, the system checks the Vendor & Expert Network (Toolkit 1.1) for available vocational counselors and proposes scheduling options.

- **Room and resource booking.** Conference rooms, video conferencing links, recording equipment, and other shared resources. Prevent double-booking. Associate room bookings with case events so the audit trail shows where meetings occurred.

- **Buffer and travel time.** Automatic buffer time between appointments based on type (15 minutes between phone calls, 30 minutes between in-person meetings, 60 minutes between hearings at different locations). Travel time estimation between locations for attorneys who attend hearings, depositions, and client meetings at different venues.

- **Schedule optimization.** When an attorney's calendar has scheduling conflicts or inefficient gaps, the system suggests reorganization. "Moving the Thompson consultation from Tuesday at 2 PM to Wednesday at 10 AM would eliminate a 90-minute gap and free a contiguous afternoon block for hearing preparation."

**Virtual Associate surface:** The AI handles scheduling requests conversationally. "Schedule a deposition for Dr. Martinez in the next 3 weeks" triggers multi-party scheduling coordination. It identifies scheduling conflicts proactively ("You have a hearing and a client meeting on the same afternoon -- the hearing may run long based on historical data for this judge"). It suggests optimal scheduling for preparation tasks ("The hearing is in 14 days. Based on your typical preparation workflow, you should block 3 hours next Tuesday and 2 hours the following Monday").

---

### 1.6 Expense & Cost Advance Tracker

Time & Billing (Toolkit 2.4) handles attorney time. But WC and PI firms advance significant hard costs on behalf of clients: filing fees, medical record retrieval costs ($15-50 per provider), expert witness fees ($3,000-10,000+), deposition costs (court reporter, transcript, videographer), copying and postage, independent medical examination costs. These cost advances are a separate financial obligation from attorney fees -- they are client debts that must be tracked, recovered, and accounted for separately.

**Why it matters:** In contingency fee cases (common in WC and universal in PI), the firm advances all costs and recovers them from the settlement or award. A complex WC case can accumulate $15,000-25,000 in advanced costs over its lifetime. If the firm does not track these costs precisely, it under-recovers at settlement. If it over-charges, it faces ethical issues. Cost tracking is both a financial necessity and an ethical obligation.

**Key features:**

- **Per-case cost ledger.** Every cost advanced on a case is logged: amount, date, vendor, category (medical records, filing fees, expert fees, deposition costs, copying, postage, other), and authorization. The ledger is the definitive record of what the firm has spent on behalf of the client.

- **Cost categories and budgeting.** Pre-defined cost categories with per-case budgets. The firm knows that a typical conservative treatment WC case costs $3,000-5,000 in advances, while a surgical case with depositions costs $15,000-25,000. Per-case budgets set expectations. Budget overruns trigger alerts.

- **Vendor invoice management.** Attach vendor invoices to cost entries. When the court reporter sends a $2,500 invoice for a deposition transcript, the invoice is linked to the case, the cost category (deposition), and the specific deposition event on the timeline. Invoice approval workflows ensure costs are authorized before payment.

- **Cost recovery tracking.** At settlement or award, the disbursement worksheet pulls all advanced costs automatically. The attorney sees exactly what the firm is owed. Cost recovery is tracked as a separate line from attorney fees. Outstanding cost advances on closed cases are flagged for collection or write-off.

- **Multi-case cost aggregation.** Firm-wide view of total costs advanced across all active cases. Cash outflow projections for upcoming expected costs (scheduled depositions, pending expert reports, anticipated record requests). This feeds into Revenue Forecasting (Toolkit 2.12) for cash flow planning.

- **Client cost transparency.** Through the Client Experience Portal (Toolkit 2.8), clients can see costs being advanced on their behalf -- in plain language, with explanations of what each cost is for. "Your attorney has requested your medical records from 3 providers. The cost for this is approximately $75-150 and will be recovered from your settlement or award." Transparency builds trust and reduces surprise at disbursement.

**Virtual Associate surface:** The AI tracks cost accumulation against budgets. "The Martinez case has accumulated $18,500 in costs against a $20,000 budget. Upcoming expected costs: $2,500 for vocational assessment, $3,000 for economist report. You may need to discuss cost expectations with the client." It suggests cost-effective alternatives ("You have 3 deposition transcripts pending at $2,500 each. A summary transcript option at $800 each may be sufficient for non-key witnesses"). It generates cost recovery worksheets at settlement. It flags cases with disproportionate cost-to-expected-fee ratios.

---

### 1.7 Conflict Management System

Document 11's Intake & CRM (Toolkit 2.9) includes conflict screening at intake. But conflicts do not only arise at intake. New parties are added throughout a case's life -- expert witnesses, treating physicians named in litigation, employers who become adversarial, family members who file related claims. The Conflict Management System provides continuous, comprehensive conflict monitoring throughout the case lifecycle.

**Why it matters:** In WA workers' comp, a firm might represent multiple injured workers from the same employer. If the employer becomes adversarial in one case, a conflict may arise with other cases involving the same employer. A firm that hires a vocational counselor who previously provided adverse opinions for L&I in another client's case has a potential conflict. These are not hypothetical -- they are routine complexities in WC practice that must be managed carefully.

**Key features:**

- **Continuous conflict screening.** Every time a new party, entity, or relationship is added to any case -- whether through document extraction, manual entry, or AI discovery -- the system screens against the firm's entire case history and entity graph. This is not a one-time intake check. It runs continuously.

- **Multi-dimensional conflict detection.** Conflicts checked across multiple dimensions: parties (is this person or entity involved in another case?), relationships (is this expert retained by opposing counsel elsewhere?), corporate affiliations (is this employer a subsidiary of another client's employer?), historical relationships (did this attorney previously represent the opposing party?).

- **Conflict severity classification.** Not every conflict is disqualifying. The system classifies conflicts by severity: absolute (must decline or withdraw), waivable (can proceed with informed consent), potential (should be monitored), and informational (worth knowing but not actionable). Classification is based on RPC rules and WA-specific ethics opinions.

- **Ethical wall management.** When a conflict is identified and the firm proceeds with a waiver or manages through an ethical wall, the system enforces access restrictions. The conflicted attorney cannot view, edit, or access the restricted case. Access attempts are logged. The wall is not a policy -- it is an enforced barrier within the platform.

- **Waiver tracking.** When a waivable conflict is identified, the system generates a conflict disclosure and waiver letter for the affected clients. Track: which clients were notified, when, whether they consented, and any conditions on the waiver. Waiver documents are stored as Sources in the affected cases.

- **Conflict graph visualization.** A visual representation of conflict relationships across the firm's cases. Nodes are parties, entities, and cases. Edges are relationships. The graph reveals conflict clusters that text-based screening might miss -- for example, three cases involving the same employer, two different law firms representing L&I, and one expert witness who has appeared on both sides.

- **Historical conflict archive.** Even after cases close, conflict data persists. A declined matter from two years ago still creates a conflict record. Former clients retain conflict protection. The archive is the firm's complete conflict history, searchable and current.

**Virtual Associate surface:** The AI runs conflict checks proactively during case work. "You are about to add Dr. Harris as an expert witness. Dr. Harris provided an IME report adverse to your client in the Johnson case (closed 2024). This is a potential conflict -- would you like me to generate a conflict analysis?" It alerts during intake conversations ("The potential client's employer is also the employer in the active Rodriguez case -- please note the potential conflict before proceeding"). It generates conflict reports for the managing partner. It monitors for emerging conflicts as case entities are updated ("A new L&I order in the Martinez case names Dr. Chen as the treating physician. Dr. Chen is an expert witness in the Thompson case -- flagging for review").

---

## Part 2: Deeper Specifications for Existing Toolkits

The following sections expand on 6 existing toolkits from Document 11, adding detailed features, user scenarios, AI behaviors, and edge cases. These specifications complement Document 11's entries -- they do not replace them.

---

### 2.1 Firm Knowledge Base (Toolkit 2.5) -- Deep Dive

Document 11 establishes the Knowledge Base as a searchable repository of institutional intelligence: procedures, precedent work product, war stories, judge profiles, opposing counsel notes, and provider assessments. This deep dive expands on how knowledge enters the system, how it accumulates, and how the AI uses it.

#### How War Stories Are Captured

War stories -- anonymized case lessons learned -- are the most valuable and hardest-to-capture form of institutional knowledge. They represent what an experienced attorney _knows_ but never writes down.

**Post-resolution capture.** When a case closes, the system prompts the assigned attorney with a structured war story form. The form is short -- 5 fields, 10 minutes to complete:

1. **What was the key strategic decision?** (free text, 2-3 sentences)
2. **What worked?** (free text, with auto-suggested highlights from case data)
3. **What would you do differently?** (free text)
4. **Key factors that influenced the outcome** (multi-select from case entities: judge, opposing counsel, expert witnesses, injury type, employer, specific evidence)
5. **Tags** (injury type, strategy type, outcome type -- auto-suggested from case metadata)

The AI pre-populates suggestions based on case data. If the case involved a successful protest of an L&I order, the AI suggests: "Successful protest of [order type] before [judge name] using [key evidence]." The attorney edits, adds context, and saves. Five minutes of attorney time produces years of institutional value.

**Conversational capture.** During case chat conversations, the AI detects when an attorney shares strategic insight. "The key to winning this one was getting Dr. Martinez's supplemental report before the hearing -- it completely undermined the IME." The AI recognizes this as potential institutional knowledge and asks: "That sounds like a valuable lesson. Would you like me to save this as a war story for the firm knowledge base?" If the attorney agrees, the AI drafts a structured entry from the conversational context.

**Organic growth.** War stories are not a separate activity -- they emerge from work. Entity corrections, chat conversations, case outcomes, and even the pattern of which documents an attorney references most frequently contribute data points that the AI synthesizes into knowledge over time.

#### How Judge Profiles Accumulate

Judge profiles are not written once and filed. They grow with every case the firm handles before that judge.

**Automatic enrichment.** After every hearing before a judge, the system prompts the attorney: "How did Judge Thompson handle the case? Any notable preferences, rulings, or procedural observations?" The prompt is specific to the hearing type (BIIA hearing vs. discovery motion vs. settlement conference).

**Cross-case synthesis.** When the firm has handled 5+ cases before the same judge, the AI generates a synthesized profile: "Based on 7 cases before Judge Thompson (2022-2026), patterns include: (1) prefers concise hearing briefs under 15 pages, (2) gives significant weight to treating physician opinions over IME opinions, (3) strict on discovery deadlines with no extensions granted in 5 of 7 cases, (4) average PPD rating in your cases: 15% higher than state average for similar injuries." The synthesis is presented to the managing partner for review and approval before it becomes the firm's official judge profile.

**Decay and freshness.** Judges change over time. A profile based on 2022 data may not reflect 2026 behavior. The system marks profile entries with dates and flags profiles that have not been updated in 12+ months. "Judge Thompson's profile has not been updated since the Henderson case in January 2025. The next case before Judge Thompson is in 3 weeks -- consider refreshing the profile."

#### How Provider Intelligence Crosses Cases

The Knowledge Base maintains provider intelligence -- medical provider patterns, IME examiner tendencies, vocational counselor quality -- that is inherently cross-case.

**Example flow:** Attorney A handles a case where Dr. Richardson (IME examiner) produces a report with significant ROM measurement discrepancies compared to the treating physician. The AI flags the discrepancy (core IME Analysis capability). Attorney A reviews the flag and notes: "Dr. Richardson consistently under-reports ROM limitations." This observation is saved to Dr. Richardson's provider profile.

Six months later, Attorney B receives a new case with a Dr. Richardson IME report. Before Attorney B even opens the report, the AI surfaces: "Dr. Richardson has been involved in 4 prior firm cases. Key patterns: consistently under-reports ROM limitations (noted by Attorney A), findings contradict treating physicians in 3 of 4 cases, opinions not challenged in 1 case that resulted in unfavorable outcome. Suggested approach: compare ROM measurements against treating physician records with particular attention to measurement methodology."

Attorney B starts their analysis with the firm's accumulated intelligence rather than discovering Dr. Richardson's patterns from scratch.

#### How Precedent Bank Search Works

The precedent bank is not a file search. It is an intelligent retrieval system that understands what makes a past document relevant to a current task.

**Contextual search.** When an attorney opens the Document Composer to draft a demand letter, the AI automatically searches the precedent bank for similar demand letters -- matching on injury type, case complexity, opposing counsel, case outcome, and settlement range. The results are ranked by relevance, not by date. A demand letter from 2023 that resulted in a $75,000 settlement for a similar rotator cuff case is more relevant than a demand letter from last week for a carpal tunnel case.

**Structural borrowing.** Attorneys do not just read precedent -- they borrow structure. "Use the argument structure from the Henderson demand letter but with the Martinez medical evidence." The AI understands structural components of legal documents: the opening, the liability section, the medical evidence narrative, the damages calculation, the demand amount. It can transplant structural patterns from one document to another while populating with current case data.

**Anti-staleness.** Precedent that references outdated statutes, superseded regulations, or reversed case law is flagged. "This precedent demand letter cites RCW 51.32.080 with a calculation method that was revised in 2025. The current calculation method is..." The attorney knows which parts of the precedent are still valid and which need updating.

#### Edge Cases

**Small firms (1-3 attorneys).** The Knowledge Base is valuable even with limited data. A solo practitioner's war stories, judge notes, and opposing counsel observations -- even a few dozen entries -- create a searchable resource that prevents reinventing the wheel. The AI does not require statistical significance to be useful; even 2-3 data points about a judge create a more informed starting point than zero.

**New firms.** A firm starting from scratch has an empty Knowledge Base. The system accelerates initial population: during the first 90 days, the AI prompts more aggressively for observations and war stories. As each case progresses, the system asks targeted questions: "This is your first case before Judge Thompson. After the hearing, I will ask about Judge Thompson's preferences and procedures so we can start building a profile."

**Knowledge conflicts.** Two attorneys may record contradictory observations about the same judge. Attorney A notes "Judge Thompson is strict on page limits" while Attorney B notes "Judge Thompson accepted our 25-page brief without comment." The system does not resolve the conflict -- it presents both observations with context (dates, case types) and lets the reader assess. Over time, patterns emerge from aggregate data.

---

### 2.2 Matter Board (Toolkit 2.1) -- Deep Dive

Document 11 describes the Matter Board as a kanban visualization with phase-based case flow, drag-and-drop transitions, and stalled case detection. This deep dive expands on how the board adapts to different practices, how managing partners use it, and how stalled case analysis actually works.

#### Phase Customization

The Matter Board's power comes from practice-area-aware phases that reflect how cases actually move -- not generic project management stages.

**WC default phases:** Intake → Active Treatment → MMI Evaluation → Negotiation → Hearing Preparation → Hearing → Post-Hearing → Settlement/Award → Closed. Each phase has a default expected duration based on firm data (or industry averages until the firm accumulates data).

**Phase sub-states.** Phases are not binary (in/not in). Cases within a phase can have sub-states that provide granularity without cluttering the board. Within "Active Treatment": Awaiting Records, Treatment Ongoing, Approaching MMI, MMI Disputed. Sub-states appear when you drill into a phase column, not on the top-level board.

**Custom phase creation.** Firms customize phases based on their workflow. Some firms add "L&I Decision Pending" as a phase between Active Treatment and MMI. Others split "Hearing Preparation" into "Discovery" and "Hearing Prep." The board adapts to the firm's actual process, not the other way around.

**Multi-practice boards.** A firm doing both WC and PI sees unified boards and filtered boards. The unified board shows all cases with color-coded practice area indicators. Filtered boards show only WC or only PI cases, each with their practice-area-specific phases. Toggle between views with one click.

#### Managing Partner Workflows

The managing partner does not use the Matter Board the same way an attorney does. The attorney sees their cases. The managing partner sees the firm.

**Morning board review.** The managing partner opens the Matter Board at 8 AM and sees: total cases by phase, cases that changed phase overnight, stalled cases, cases with upcoming deadlines in the next 7 days, and new cases in Intake. This 5-minute review replaces a 30-minute staff meeting.

**Drill-down by attorney.** Click an attorney's name to see their caseload on the board. How many cases are in each phase? Are any stalled? How does their caseload distribution compare to other attorneys? Is anyone overloaded in a specific phase (e.g., 8 cases in Hearing Preparation when the average is 3)?

**Board-level metrics strip.** A persistent metrics bar above the board shows: total active cases, average days in current phase, cases at risk (stalled or deadline-approaching), and week-over-week movement. The metrics bar provides instant context without opening a separate analytics dashboard.

**Triage mode.** When multiple new cases arrive in Intake, the managing partner can triage from the board: assign attorney, set priority, flag for expedited processing, or defer. Triage decisions are visible to the assigned attorney immediately.

#### Stalled Case Analysis

Stalled case detection is the Matter Board's killer feature. But "stalled" is not just "been in this phase too long." It is a contextual assessment.

**What "stalled" means.** A case is flagged as stalled when it exceeds the expected duration for its phase AND has no active progress indicators. A case in Active Treatment for 90 days is not stalled if medical appointments are being attended, records are being received, and the treating physician has not reached MMI. A case in Active Treatment for 45 days with no new documents, no case notes, and no scheduled appointments is stalled.

**Root cause analysis.** When a case is flagged as stalled, the AI does not just say "this case is stalled." It analyzes the case data and suggests why:

- "No medical records received in 45 days. Last provider contact was 60 days ago. The client may have stopped attending treatment."
- "L&I order received 30 days ago but no protest letter drafted. The 60-day protest deadline is in 30 days."
- "IME report received 21 days ago but not yet reviewed. The assigned attorney has 5 other cases in Hearing Preparation -- this may be a capacity issue."

**Stalled case drill-down.** Click a stalled case on the board to see: days in current phase, last activity date, next scheduled event (if any), AI root cause analysis, and suggested next actions. The attorney or managing partner can take action directly from the drill-down: assign a task, schedule a follow-up, or move the case to a different phase.

**Stalled patterns.** The AI identifies firm-wide stalling patterns. "Cases stall in the MMI Evaluation phase 40% more often than any other phase. The typical cause is waiting for treating physician MMI determination. Consider implementing a proactive MMI check at the 60-day mark." Pattern detection turns individual case issues into systemic improvements.

---

### 2.3 QA & Review (Toolkit 2.6) -- Deep Dive

Document 11 introduces the PR-model review workflow, inline commenting, filing checklists, automated quality checks, and QA metrics. This deep dive expands on how the review flow actually works, how checklists compose with practice areas, and how quality metrics drive improvement.

#### The PR-Model Review Flow

The review workflow borrows directly from software engineering's pull request model. Every piece of outgoing work product goes through a defined review process.

**Step 1: Draft.** The attorney or paralegal creates a document in the Document Composer (or imports from Word). The document has a status of "Draft" -- it is work product, editable, and private to the creator.

**Step 2: Submit for Review.** When the draft is ready, the creator clicks "Submit for Review" and selects a reviewer (typically a senior attorney or the supervising partner). The document status changes to "In Review." The system runs automated quality checks before the reviewer sees it.

**Step 3: Automated Pre-Review.** Before the human reviewer opens the document, the AI runs automated checks:

- Spelling and grammar
- Citation format compliance (firm standard)
- Template structure compliance (does the document follow the expected structure?)
- Entity consistency (does the claim number match throughout? Are party names consistent?)
- Completeness (are all required sections present for this document type?)
- Evidence support (do factual claims have citations to source documents?)

The reviewer sees the auto-check results alongside the document. Mechanical errors are already flagged -- the reviewer can focus on substance.

**Step 4: Inline Review.** The reviewer reads the document and adds comments directly on specific paragraphs, sentences, or phrases. Comments are categorized:

- **Must fix** -- substantive errors, missing evidence, incorrect legal analysis
- **Should fix** -- style improvements, stronger evidence available, structural suggestions
- **Note** -- observations, questions, or compliments ("Good use of the surgical records here")

Comments are threaded. The creator can respond to comments, creating a conversation within the review.

**Step 5: Approve or Request Changes.** The reviewer makes a decision:

- **Approve** -- the document is ready for finalization. Status changes to "Approved."
- **Request Changes** -- the document needs revision. Status returns to "Draft" with review comments visible. The creator addresses comments and resubmits.
- **Approve with Minor Changes** -- the document is nearly ready. The reviewer marks specific minor changes needed. The creator makes them and the document is auto-approved (no second review cycle).

**Step 6: Finalize and Graduate.** An approved document is finalized -- no further edits. If the document is being sent externally (demand letter, protest letter, filing), it graduates from a Note to a Source in the Sources/Notes framework. The sent version is frozen in the case record.

#### How Filing Checklists Compose with Practice Areas

Filing checklists are not generic. They are tailored by document type, and document types come from the loaded practice area module.

**WC Protest Letter checklist:**

- [ ] Claim number verified and matches L&I order being protested
- [ ] L&I order date confirmed and protest is within 60-day deadline
- [ ] All disputed findings specifically identified
- [ ] Supporting medical evidence cited with page references
- [ ] Treating physician opinion clearly stated
- [ ] Client signature obtained (if required by firm practice)
- [ ] Service list complete (L&I, employer, employer counsel if applicable)
- [ ] All exhibits attached and numbered
- [ ] Spell-check passed
- [ ] Second attorney review completed

**PI Demand Letter checklist:**

- [ ] Liability section cites all relevant evidence (police report, witness statements, photos)
- [ ] Medical evidence section includes all treating providers
- [ ] Damages calculation includes economic and non-economic components
- [ ] Settlement demand amount approved by supervising attorney
- [ ] Lien amounts verified and current
- [ ] All exhibits attached and numbered
- [ ] Service delivery method confirmed

Checklists are firm-customizable. The firm can add, remove, or modify checklist items for any document type. New checklist items are created when recurring issues are identified through QA metrics ("We keep missing service list entries -- add a service list verification step").

#### Quality Metrics Dashboards

Quality metrics are not punitive -- they are developmental. The dashboard shows trends, not just scores.

**Per-attorney metrics:**

- **First-pass approval rate** -- percentage of documents approved without revision. An attorney at 85% is producing high-quality work. One at 55% needs support.
- **Average revision cycles** -- how many review rounds before approval. 1.2 average is healthy. 2.5+ suggests misalignment between the drafter and the reviewer.
- **Error category distribution** -- what types of issues are most common? Citation errors, factual errors, structural issues, evidentiary gaps, formatting problems. The distribution reveals where each attorney needs development.
- **Trend over time** -- is the attorney improving? A new associate at 45% first-pass approval in Month 1 who rises to 75% by Month 6 is developing well. One who remains at 45% may need a different kind of support.

**Firm-wide metrics:**

- **Overall quality score** -- firm-wide first-pass approval rate
- **Most common error categories** -- across all attorneys, what issues appear most frequently? If "missing evidence citations" is the #1 issue firm-wide, the firm's training program should address citation practices.
- **Template quality** -- which templates produce the highest first-pass approval rates? Which produce the lowest? Low-performing templates should be redesigned.
- **Review turnaround time** -- how long do documents wait in the review queue? If the average is 3 days, reviews may be a bottleneck.

---

### 2.4 Workload & Capacity Manager (Toolkit 2.2) -- Deep Dive

Document 11 describes capacity tracking, workload heatmaps, skill-based routing, delegation tracking, and vacation planning. This deep dive expands on how capacity is scored, how skill matching works, and how the system handles the messy reality of law firm workloads.

#### Capacity Scoring Model

Capacity is not just "number of active cases." A junior attorney with 15 simple conservative-treatment WC cases may have more actual capacity than a senior attorney with 8 complex surgical cases approaching hearings. The capacity score reflects actual workload, not just case count.

**Factors in the capacity score:**

1. **Case count** -- baseline, but adjusted by complexity
2. **Case complexity** -- each case has a complexity rating (1-5) based on injury type, procedural phase, number of parties, and active disputes. A complex surgical case with depositions scheduled and a hearing in 60 days is a 5. A routine conservative treatment case with no upcoming events is a 1.
3. **Upcoming deadlines** -- cases with deadlines in the next 30 days consume more capacity than cases in early phases. The weight increases as deadlines approach.
4. **Scheduled events** -- hearings, depositions, client meetings, and other scheduled events each consume a defined capacity block
5. **Review queue** -- documents waiting for this attorney's review (from QA workflow) add capacity pressure
6. **Historical time data** -- if Time & Billing data shows an attorney typically spends 6 hours/week on each hearing-prep case, that informs the capacity calculation more accurately than a rule-based estimate

**Capacity display:** Green (below 70% capacity), yellow (70-90%), red (above 90%). The managing partner sees colors; the detail is available on drill-down.

#### Skill-Matching Logic

When a new case arrives, the optimal assignment considers three dimensions: expertise, capacity, and development.

**Expertise matching.** The system tracks each attorney's case history: injury types handled, case outcomes, document types reviewed, hearing experience by judge. An attorney who has handled 15 rotator cuff surgical cases and won 12 is a strong match for a new rotator cuff surgical case. An attorney who has never handled a surgical case is not a good match unless development is the goal.

**Development factor.** Junior attorneys need to develop expertise. The system allows the managing partner to flag "development assignments" -- cases assigned to build expertise rather than optimize for outcome. A junior attorney assigned a moderately complex case receives additional oversight (more review checkpoints in the QA workflow, automatic check-ins from the assigned mentor).

**Capacity-weighted recommendations.** The system presents ranked recommendations:

1. "Attorney Chen: Best expertise match (12 similar cases, 85% favorable outcomes), capacity at 65% (green). Recommended."
2. "Attorney Rodriguez: Good expertise match (6 similar cases), capacity at 82% (yellow). Available but approaching overload."
3. "Attorney Park: Limited expertise (2 similar cases) but capacity at 40% (green). Good development opportunity with mentor oversight."

The managing partner makes the final decision. The system recommends -- it does not assign.

#### Delegation Chains

Senior attorneys delegate tasks to junior attorneys and paralegals. Delegation tracking makes these assignments visible and accountable.

**Delegation creation.** The senior attorney creates a delegation from any case view: select the task (e.g., "Draft initial medical summary"), assign to a delegate, set a deadline, and specify the review standard (e.g., "Submit for my review before sending to client"). The delegation appears in both the delegator's and delegate's task lists.

**Status visibility.** The delegator sees all active delegations: who is working on what, whether the task is on track, and whether any delegations are overdue. No more verbal check-ins -- the status is always current.

**Delegation quality tracking.** When delegated work goes through QA review, the quality data is tracked by delegation pair (who assigned + who executed). Over time, the system identifies which delegation relationships are productive and which need adjustment. "Tasks delegated from Attorney Chen to Paralegal Kim have a 90% first-pass approval rate. Tasks delegated from Attorney Chen to Paralegal Lee have a 55% rate -- additional training or a different assignment pattern may help."

#### Leave Coverage

When an attorney takes leave, their cases need coverage. Today this is managed ad hoc -- the departing attorney sends an email listing their active cases and the covering attorney responds with questions. The Workload Manager systematizes this.

**Leave declaration.** The attorney marks leave dates in the system. The system generates a coverage report: all active cases, their current phases, upcoming deadlines during the leave period, and critical tasks.

**Coverage assignment.** The managing partner assigns coverage for each case, informed by capacity scores and expertise matching. The covering attorney receives a coverage briefing: case summary, current status, pending items, upcoming deadlines, and any specific instructions from the primary attorney.

**Automatic reassignment.** During the leave period, new documents, communications, and tasks for covered cases are routed to the covering attorney. When the primary attorney returns, routing reverts. The primary attorney receives a return briefing: what happened on each case during their absence, what decisions were made, and what requires their attention.

---

### 2.5 Client Experience Portal (Toolkit 2.8) -- Deep Dive

Document 11 describes the Client Experience Portal with plain-language status, milestone notifications, document upload, secure messaging, questionnaires, digital signing, FAQ, and onboarding journeys. This deep dive expands on how plain-language translation works, how the onboarding journey adapts, and how milestone notifications are triggered.

#### Plain-Language Translation Examples

The gap between legal/system terminology and what a client understands is enormous. The portal does not show clients system data -- it translates every piece of information into clear, human language.

**Status translation examples:**

| System State                                                | Client Sees                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `phase: active_treatment, sub_state: awaiting_records`      | "Your case is in the medical treatment phase. We are waiting to receive your medical records from Dr. Johnson's office. This usually takes 1-2 weeks."                                                                               |
| `phase: mmi_evaluation, deadline: ime_scheduled_2026-03-15` | "Your doctor has determined you have reached maximum medical improvement. An independent medical examination has been scheduled for March 15, 2026 with Dr. Harris. Your attorney will contact you to prepare for this appointment." |
| `phase: negotiation, event: demand_sent`                    | "We have sent a formal demand to L&I on your behalf. They typically respond within 30-60 days. Your attorney will contact you as soon as we receive a response."                                                                     |
| `phase: hearing_prep, deadline: hearing_2026-05-01`         | "Your hearing before the Board of Industrial Insurance Appeals is scheduled for May 1, 2026. Over the next few weeks, your attorney will be preparing your case and will contact you to review what to expect."                      |

**The translation principle:** Every status message answers three questions: (1) What is happening right now? (2) What happens next? (3) When will you hear from us? Clients do not need to understand legal phases -- they need to know what to expect.

#### Onboarding Journey Stages

The onboarding journey is a guided sequence that transforms a new client from "signed the fee agreement" to "fully informed and engaged participant in their case." Each stage has a purpose, a deliverable, and a trigger for the next stage.

**Stage 1: Welcome (Day 0).** Triggered by fee agreement signing. The client receives a welcome message introducing their legal team (attorney name, paralegal name, office manager), explaining how to use the portal, and setting expectations for communication frequency. Deliverable: client has portal access and knows who to contact.

**Stage 2: Information Collection (Days 1-7).** The client receives a sequence of questionnaires, prioritized by importance: personal information, injury details, employment history, medical provider list, current symptoms and limitations. Each questionnaire has explanatory text explaining why the information is needed. Auto-save prevents lost work. Deliverable: the firm has the baseline case data needed to begin work.

**Stage 3: Document Checklist (Days 3-10).** The client receives a personalized document checklist: "Please gather and upload the following documents: (1) Any medical records you have at home, (2) Your most recent pay stubs (last 3 months), (3) Any correspondence from L&I, (4) Photos of your injury if available." The checklist adapts to the case type -- a WC case asks for L&I documents; a PI case asks for the police report and insurance information. Deliverable: initial document upload.

**Stage 4: Process Explanation (Days 7-14).** A guided explanation of the WC process tailored to the client's specific case type. "Your case is a workers' compensation claim for a shoulder injury. Here is what to expect over the coming months..." The explanation covers treatment, IME, timelines, hearings, and potential outcomes in plain language. Deliverable: the client understands what their case involves and what their role is.

**Stage 5: First Check-In (Day 14-21).** The system schedules a brief check-in call or portal message between the client and their paralegal. Purpose: answer questions, confirm information collected is accurate, identify any missing documents, and reinforce the communication channel. Deliverable: confirmed engagement and open communication line.

**Adaptive pacing.** If the client completes Stage 2 questionnaires in 2 days, Stage 3 triggers immediately. If the client has not completed Stage 2 after 5 days, a gentle reminder is sent. After 10 days with no activity, the paralegal receives an alert to follow up personally. The journey adapts to the client's pace rather than firing on a rigid schedule.

#### Milestone Notification Triggers

Milestone notifications are triggered by platform events -- they are not manually composed. The system detects the event, generates the notification, and sends it through the client's preferred channel.

**Event-to-notification mapping:**

| Platform Event                         | Notification                                                                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Document uploaded by firm              | "New documents have been added to your case file."                                                                                            |
| Medical records received from provider | "We received your medical records from [provider name]. Our team is reviewing them."                                                          |
| IME scheduled                          | "An independent medical examination has been scheduled for [date] with [examiner]. Your attorney will contact you to prepare."                |
| L&I order received                     | "We received a decision from the Department of Labor & Industries. Your attorney is reviewing it and will contact you to discuss next steps." |
| Demand letter sent                     | "We have sent a formal demand on your behalf. We will contact you when we receive a response."                                                |
| Hearing date set                       | "Your hearing has been scheduled for [date]. Your attorney will begin preparing and will contact you to discuss what to expect."              |
| Settlement offer received              | "We received a settlement offer. Your attorney will contact you to discuss the offer and your options."                                       |
| Case phase changed                     | "[Translated status update for the new phase]"                                                                                                |

**Notification preferences.** Each notification type has a configurable delivery channel: portal only, portal + email, portal + email + SMS, or portal + phone call (for critical events like hearing dates or settlement offers). The client sets their preferences during onboarding. The firm sets minimum notification levels (e.g., hearing dates always trigger at least portal + email).

---

### 2.6 Intake & CRM (Toolkit 2.9) -- Deep Dive

Document 11 describes lead capture, pipeline visualization, automated follow-up, conflict checking, engagement letter generation, and referral tracking. This deep dive expands on the AI conversational intake flow, lead scoring, referral ROI, and the conflict check workflow.

#### AI Conversational Intake Flow

The AI conducts initial intake through the Client Experience Portal or the firm's website, gathering case details through natural conversation rather than a form.

**How it works.** A potential client clicks "Get Started" on the firm's website. Instead of a static form, they enter a conversational interface:

> **AI:** "Welcome. I would like to understand your situation so we can determine how we can help. Can you tell me briefly what happened?"
>
> **Client:** "I hurt my back at work about 3 months ago lifting heavy boxes. I've been seeing a doctor but I'm not getting better and my employer is pressuring me to come back."
>
> **AI:** "I'm sorry to hear that. It sounds like you may have a workers' compensation claim. Let me ask a few questions to understand your situation better. Where did the injury happen -- which state?"
>
> **Client:** "Washington."
>
> **AI:** "Have you filed a claim with the Department of Labor & Industries?"
>
> **Client:** "Yes, my claim number is AB12345."

The AI extracts structured data from the conversation: injury type (lumbar strain), injury mechanism (lifting), employment status (active), L&I claim filed (yes), claim number (AB12345), treatment status (ongoing, not improving), employer behavior (pressure to return). This structured data pre-populates the intake record.

**Handoff.** When the AI has gathered sufficient information, it offers to schedule a consultation: "Based on what you have described, this sounds like a workers' compensation case that our firm handles. Would you like to schedule a free consultation with one of our attorneys?" The client self-schedules (via the Scheduling toolkit, 1.5), and the attorney receives the complete intake summary before the call.

**After-hours coverage.** The AI intake is available 24/7. A potential client who visits the website at 11 PM can complete the intake conversation, receive a preliminary assessment, and schedule a consultation -- all without a human being involved. The firm receives the intake data the next morning.

#### Lead Scoring Criteria

Not every inquiry becomes a case. Lead scoring helps the firm prioritize follow-up on leads most likely to convert and most valuable to pursue.

**Scoring factors:**

- **Case viability** (0-40 points): Does the situation describe a valid legal claim? Is there an identifiable injury? Is there an employer or at-fault party? Is the statute of limitations intact? Has an L&I claim been filed?
- **Case value** (0-30 points): Based on injury type and severity, what is the expected case value? A surgical rotator cuff tear with documented impairment scores higher than a mild strain that resolved with conservative treatment.
- **Engagement signals** (0-20 points): Did the lead complete the full intake conversation? Did they schedule a consultation? Did they upload documents? Higher engagement correlates with higher conversion.
- **Referral quality** (0-10 points): Leads from high-converting referral sources score higher. If Dr. Martinez's referrals convert at 80% and website inquiries convert at 15%, a Dr. Martinez referral gets more points.

**Score interpretation:** 80-100 = hot lead (contact within 2 hours), 50-79 = warm lead (contact within 24 hours), 20-49 = cool lead (automated follow-up), 0-19 = unlikely viable (flag for manual review of viability concerns).

#### Referral ROI Calculation

Referral sources are the lifeblood of WC and PI firms. Understanding which sources produce the best cases -- not just the most cases -- drives marketing investment.

**Per-source metrics:**

- **Lead volume** -- how many leads from this source per month/quarter/year
- **Conversion rate** -- what percentage of leads become active cases
- **Average case value** -- average fee earned from cases originating from this source
- **Cost per lead** -- if the source involves marketing spend (advertising, sponsorships), what is the cost per lead
- **Cost per case** -- marketing spend divided by cases originated
- **Lifetime ROI** -- total fees earned from this source minus total marketing spend

**Example insight:** "Google Ads generates 40 leads/month with a 12% conversion rate and $2,800 average case value. Total monthly investment: $3,000. Monthly return: 4.8 cases × $2,800 = $13,440. ROI: 348%. Dr. Martinez generates 3 leads/month with an 80% conversion rate and $8,500 average case value. Monthly investment: $0 (organic referral). Monthly return: 2.4 cases × $8,500 = $20,400. ROI: infinite. Recommendation: maintain Dr. Martinez relationship, continue Google Ads at current spend."

#### Conflict Check Workflow

The intake conflict check runs automatically but requires human judgment for resolution.

**Automatic screening.** When a new lead enters the pipeline, the system extracts all identifiable parties (potential client, employer, insurer, opposing parties mentioned) and screens them against:

- All current and former clients
- All opposing parties in current and former cases
- All entities in the firm's case history

**Screening results:**

- **No conflicts found** -- proceed with intake. The system logs the negative result for the record.
- **Potential conflict identified** -- the system presents: which party triggered the conflict, which existing case is involved, the nature of the relationship (former client, current opposing party, related party), and the applicable RPC rule. The attorney reviews and decides: decline the matter, seek a waiver, or determine the conflict is not actual (e.g., same last name but different person).
- **Definite conflict** -- the system flags the conflict as disqualifying (e.g., the potential client's employer is a current client in another matter). The lead is marked as conflicted with the reason recorded. The firm sends a declination letter (auto-generated) and, if appropriate, a referral to another firm.

**Ongoing screening.** The Conflict Management System (Toolkit 1.7) continues screening throughout the case lifecycle. The intake check is the first line of defense, not the only one.

---

## Series Navigation

This document is part of the Leglise Product Specification series.

| #       | Document                                             | What It Covers                                                                                           |
| ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **0**   | [Platform Overview](./00-platform-overview.md)       | Launch product: WA workers' comp, phased capabilities, MVP classification                                |
| **0A**  | [Long-Term Vision](./00a-long-term-vision.md)        | Full platform story: multi-practice-area expansion, extension model, firm intelligence                   |
| **1**   | [The Workspace Shell](./01-the-workspace-shell.md)   | Five-zone layout, navigation model, Sources/Notes hemispheres, where AI lives, key design decisions      |
| **2**   | [Agentic Features Map](./02-agentic-features-map.md) | Every AI feature mapped to its precise workspace location                                                |
| 3       | The Explorer (planned)                               | Left sidebar: Sources, Notes, Search, Tags, Starred tabs with advanced filtering                         |
| 4       | The Context Panel (planned)                          | Right sidebar: Links, Details, AI Chat, Tasks tabs                                                       |
| 5       | The Workspace Engine (planned)                       | Multi-pane splits, tabs, peek drawer, popout windows, saved workspaces                                   |
| 6       | The Command Surface (planned)                        | Command palette (Cmd+K), skill activation, natural language + slash commands                             |
| 7       | The Graph and Canvas (planned)                       | Case knowledge graph, spatial canvas, cross-case entity networks                                         |
| 8       | The Hover Layer (planned)                            | Hover previews, transclusion, block references, progressive disclosure                                   |
| 9       | The AI Gardener (planned)                            | Emergence detection, progressive enrichment, standing orders, morning briefings                          |
| **10**  | [The Extension System](./10-the-extension-system.md) | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system |
| **11**  | [Firm-Wide Extensions](./11-firm-wide-extensions.md) | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                |
| **11A** | **Toolkit Deep Dive** (this document)                | New toolkit ideas and deeper specifications for existing toolkits                                        |

---

_This document extends [Document 11](./11-firm-wide-extensions.md) with 7 new toolkit proposals and deeper specifications for 6 existing toolkits. [Document 11](./11-firm-wide-extensions.md) provides the original catalog of 15 toolkits. [Document 10](./10-the-extension-system.md) defines the extension architecture._
