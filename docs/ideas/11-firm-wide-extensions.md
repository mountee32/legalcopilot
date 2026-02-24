# Document 11: Firm-Wide Extensions -- The Toolkit Catalog

**Series**: Leglise Product Specification
**Date**: February 21, 2026
**Status**: Creative Exploration (No Technical Implementation)
**Purpose**: Comprehensive catalog of firm-wide toolkit extensions -- practice-area-agnostic capabilities that give every firm operational, analytical, and strategic superpowers
**Companion Documents**: [00 -- Platform Overview](./00-platform-overview.md), [10 -- The Extension System](./10-the-extension-system.md), [02 -- Agentic Features Map](./02-agentic-features-map.md)

---

## Series Overview

| #      | Title                                                | Scope                                                                                                    | Status            |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------- |
| 0      | [Platform Overview](./00-platform-overview.md)       | Launch product: WA workers' comp, phased capabilities, MVP classification                                | Complete          |
| 0A     | [Long-Term Vision](./00a-long-term-vision.md)        | Full platform story: multi-practice-area expansion, extension model, firm intelligence                   | Complete          |
| 1      | [The Workspace Shell](./01-the-workspace-shell.md)   | Core layout, navigation, info architecture, where AI lives                                               | Complete          |
| 2      | [Agentic Features Map](./02-agentic-features-map.md) | Maps every AI feature to its workspace location                                                          | Complete          |
| 3      | The Explorer                                         | Left sidebar: tabbed modes, advanced filtering, tag manager                                              | Planned           |
| 4      | The Context Panel                                    | Right sidebar: links, details, AI chat, tasks                                                            | Planned           |
| 5      | The Workspace Engine                                 | Multi-pane splits, saved layouts, tabs, peek drawer                                                      | Planned           |
| 6      | The Command Surface                                  | Command palette (Cmd+K), skill activation, quick switcher                                                | Planned           |
| 7      | The Graph and Canvas                                 | Knowledge graph, case canvas, spatial strategy                                                           | Planned           |
| 8      | The Hover Layer                                      | Hover previews, transclusion, block references                                                           | Planned           |
| 9      | The AI Gardener                                      | Emergence, progressive enrichment, standing orders, briefings                                            | Planned           |
| 10     | [The Extension System](./10-the-extension-system.md) | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system | Complete          |
| **11** | **Firm-Wide Extensions**                             | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                | **This document** |

---

## 1. Introduction

### Toolkits vs. Practice Areas

[Document 10](./10-the-extension-system.md) defines three extension categories: Practice Areas, Integrations, and Toolkits. Practice Areas teach the platform a domain of law -- entity types, document taxonomies, calculators, jurisdiction rules, AI prompts. They are deep and domain-specific. A workers' comp module knows what a PPD rating is. A personal injury module knows what a demand package is.

Toolkits are different. Toolkits give the firm operational superpowers that work across every practice area. A Matter Board visualizes case flow whether the cases are workers' comp, personal injury, or family law. A Quality Assurance workflow reviews documents regardless of their domain. A Business Intelligence dashboard aggregates outcomes across every practice area the firm handles.

If practice areas are the _what_ (what kind of law), toolkits are the _how_ (how the firm operates, learns, serves clients, and grows).

### The Legal Tech Gap

Most legal practice management platforms handle four things well: billing, calendaring, document storage, and contact management. Clio, MyCase, PracticePanther -- they all cover these basics. Some add intake CRM (Clio Grow, Lawmatics). A few offer analytics dashboards (Litify, Filevine). But almost none handle:

- **Knowledge management** -- institutional memory, precedent banks, judge profiles, opposing counsel intelligence
- **Quality assurance** -- structured review workflows, automated quality checks, QA metrics
- **Resource planning** -- capacity tracking, skill-based routing, workload optimization
- **Strategic analytics** -- outcome correlation, revenue forecasting, case profitability analysis
- **Client experience** -- proactive communication, milestone notifications, onboarding journeys
- **Training and development** -- competency frameworks, contextual coaching, onboarding programs

These gaps exist because legal tech has historically treated firms as document repositories with billing attached. Leglise treats firms as intelligence organizations that happen to practice law. The toolkit catalog fills every operational gap with capabilities that are AI-native from the ground up.

### How to Read This Document

Each toolkit is a self-contained extension with its own views, AI tools, and value proposition. A firm loads the toolkits it needs -- a solo practitioner might use only Matter Board, Time & Billing, and Client Portal. A 50-attorney firm loads the full catalog.

Every toolkit follows the same structure:

- **What it does** -- the core capability
- **Key features** -- specific views, workflows, and data
- **Inspired by** -- cross-industry and legal tech products that informed the design
- **Virtual Associate surface** -- how the AI participates (this is the differentiator)

---

## 2. The Toolkit Catalog

### Operational Toolkits -- How the Firm Runs

---

#### 2.1 Matter Board (Kanban & Workflow Visualization)

The Matter Board is how managing partners and office managers see the firm's caseload at a glance. Every case lives on a board, organized by phase, and the board makes stalled work visible.

**Key features:**

- **Kanban view by phase.** Cases flow through configurable phases defined by the loaded practice area module. Workers' comp: Intake → Active Treatment → MMI → Negotiation → Hearing → Closed. Personal injury: Incident → Treatment → Demand → Negotiation → Litigation → Resolution. The phases are not hardcoded -- they come from the practice area extension, so a firm doing both WC and PI sees the right phases for each case type.

- **Drag-and-drop phase transitions.** Moving a case from "Active Treatment" to "MMI" is a drag operation that triggers automatic task generation: update the medical summary, request updated impairment ratings, notify the client, check if vocational evaluation is needed. The tasks generated are configurable per phase transition.

- **Stalled case detection.** Cases that sit in a phase beyond a configurable threshold (default: 30 days for treatment, 14 days for negotiation) are visually flagged. The board surfaces stalled cases before they become problems.

- **Multiple board views.** By attorney (who owns what), by case type (WC vs. PI), by urgency (deadline proximity), by phase (where are things bottlenecked). Swimlane and list views alongside the default kanban.

- **Phase duration analytics.** Average time in each phase by case type, attorney, and injury category. Which phases are bottlenecks? Which attorneys move cases through faster?

**Inspired by:** Linear (cycles, triage queues, team-based boards), Filevine (phase-based case management), Monday.com (workload views and dashboards), Trello (simple kanban with power-ups).

**Virtual Associate surface:** The AI flags stalled cases proactively ("3 cases have been in Active Treatment for 45+ days -- here is what is holding each one up"). It suggests phase transitions based on case data ("The Martinez case has received MMI confirmation from the treating physician -- ready to move to Negotiation?"). It generates weekly board summaries for managing partners with case movement, bottlenecks, and recommended actions.

---

#### 2.2 Workload & Capacity Manager

Case assignment is one of the highest-leverage decisions a firm makes. Assign too many cases to one attorney and quality drops. Assign the wrong case type to an attorney and outcomes suffer. Most firms manage this with gut feel and spreadsheets. The Workload & Capacity Manager replaces gut feel with data.

**Key features:**

- **Per-person capacity tracking.** Active cases, upcoming deadlines, hours committed this week/month, and a capacity score for every attorney and paralegal. The capacity score accounts for case complexity -- a complex surgical WC case with an upcoming hearing consumes more capacity than a routine conservative treatment case.

- **Workload heatmap.** A visual grid showing who is overloaded (red), at capacity (yellow), or available (green). Roll over any person to see their current caseload, upcoming deadlines, and estimated hours committed.

- **Skill-based case routing.** New cases are matched to attorneys by expertise (who has handled this injury type before?), capacity (who has bandwidth?), and development goals (is a junior attorney being groomed for this case type?). The routing considers the full picture, not just who has the fewest cases.

- **Delegation tracking.** Senior → junior task delegation with status and deadline visibility. The managing partner sees which delegated tasks are overdue, which are in progress, and which are completed. No more checking in verbally to ask "did you finish that motion?"

- **Vacation and leave planning.** Mark attorneys as unavailable for case assignment during planned leave. The system redistributes incoming work and flags cases that need coverage.

**Inspired by:** Float (visual resource planning with capacity heatmaps), Harvest (actual vs. estimated time), Productive (capacity + revenue integration), Resource Guru (team scheduling with availability).

**Virtual Associate surface:** The AI suggests optimal case assignment when a new case arrives ("Based on attorney expertise and current capacity, Sarah Chen is the best fit for this rotator cuff surgical case -- she has handled 12 similar cases and has capacity for 2 more"). It flags overcommitment risks ("Attorney Rodriguez has 3 hearings scheduled within 5 days next month -- consider redistributing the Thompson case"). It generates workload reports for managing partners with trends, imbalances, and recommendations.

---

#### 2.3 Workflow Automations

Every firm has processes that follow predictable patterns: when a hearing date is set, a countdown of preparation tasks begins. When a document is classified as an L&I Order, it is routed to the assigned attorney with a review deadline. When a case reaches settlement, a disbursement worksheet is generated. Today, these processes live in paralegal checklists and attorney habits. The Workflow Automations toolkit makes them explicit, automated, and visible.

**Key features:**

- **Visual workflow builder.** Drag-and-drop construction of firm processes. Triggers (document uploaded, phase changed, deadline approaching) connect to actions (assign task, send notification, generate document, update status). Conditional branches handle variations ("If case type is WC and document is L&I Order, then route to attorney with 14-day deadline; if case type is PI and document is demand response, then route to attorney with 7-day deadline").

- **Event-driven triggers.** Workflows fire on platform events: document classified, entity extracted, phase changed, deadline approaching, client message received, standing order completed. The trigger system is composable -- complex workflows chain simple triggers.

- **Deadline chains.** A hearing date set 90 days out automatically generates: 90-day discovery deadline → 60-day deposition deadline → 30-day motions deadline → 14-day hearing binder deadline → 7-day client preparation deadline. Each step fires only when the previous step completes or its date arrives. Missing a step triggers an escalation.

- **Status update automation.** Case phase changes trigger client notifications ("Your case has entered the negotiation phase"). Document receipt triggers acknowledgment ("We received your medical records from Dr. Smith"). These notifications flow through the Client Experience Portal (Toolkit 2.8) when loaded.

- **Workflow templates.** Pre-built workflows for common patterns: new case intake, hearing preparation countdown, settlement disbursement, document routing by type, client onboarding sequence. Firms customize templates rather than building from scratch.

**Inspired by:** n8n (already integrated as the AI chat orchestrator -- the same event-driven philosophy extends to firm workflows), Zapier (trigger → action simplicity), Temporal (durable workflow execution with retry and recovery), Make (visual workflow composition).

**Virtual Associate surface:** The AI suggests workflow improvements based on observed patterns ("Cases that include a 60-day deposition reminder resolve 15% faster than those that do not -- should I add this step to the hearing prep workflow?"). It identifies bottlenecks in automated workflows ("The document routing workflow is backed up -- 8 L&I Orders are waiting for attorney review with an average wait time of 4 days"). It can execute workflow steps that involve AI reasoning (generating a document summary, running a contradiction scan, drafting a notification).

---

#### 2.4 Time & Billing

Time tracking and billing are table stakes for legal practice management, but most implementations are disconnected from the actual work. Attorneys track time in one system, do work in another, and reconstruct what they did at the end of the day. The Time & Billing toolkit integrates billing into the work itself -- time is captured as work happens, not reconstructed from memory.

**Key features:**

- **Timer-based and manual time entry.** Click-to-start timers attached to specific cases and tasks. Manual entry with UTBMS/LEDES task codes for firms that need standardized billing categories. Both approaches coexist -- attorneys choose their workflow.

- **AI-assisted time narratives.** The system drafts time entry descriptions from activity logs. If an attorney spent 45 minutes reviewing medical records and extracting entities in the Martinez case, the system suggests: "Review and analysis of medical records from Dr. Johnson (3 documents, 47 pages); identification and verification of impairment ratings and treatment recommendations." The attorney edits and approves.

- **Auto-time-capture.** Passive tracking of document review (how long was a document open?), case chat conversations (how long was the AI consultation?), and document composition (how long was the demand letter in active editing?). Auto-captured time appears as suggestions, not as committed entries -- the attorney always decides what to bill.

- **Pre-bill generation.** Monthly pre-bills aggregate time entries by case with attorney review and adjustment. Managing partners review, write off unbillable time, adjust rates, and approve before invoices generate.

- **Multiple fee arrangements.** Hourly, flat fee, contingency, hybrid, and retainer billing models. Per-case fee configuration. Contingency cases track the expected fee based on current case valuation. Flat fee cases track against the budgeted amount.

- **Trust/IOLTA accounting.** Client trust account management with three-way reconciliation (bank statement, trust ledger, client ledger). Compliance alerts when trust balances fall below expected thresholds or when transactions violate jurisdictional trust rules. Settlement disbursement tracking from trust accounts.

- **Invoice generation and payment processing.** Branded invoices with configurable templates. Electronic payment processing (credit card, ACH) with trust-compliant payment routing. Accounts receivable aging reports. Payment reminders on configurable schedules.

**Inspired by:** Smokeball (auto-time-capture from document activity), CosmoLex (built-in trust accounting with three-way reconciliation), LawPay (trust-compliant payment processing), TimeSolv (UTBMS/LEDES support and pre-bill workflows).

**Virtual Associate surface:** The AI flags unbilled time ("You spent 2.3 hours on the Thompson case last week that has not been billed"). It suggests billing narratives from activity logs. It monitors trust account compliance ("IOLTA account balance is $3,200 below the expected minimum -- 2 pending disbursements may be affected"). It identifies underperforming fee arrangements ("Flat fee cases in the surgical WC category are averaging 40% more attorney time than budgeted -- consider adjusting the flat fee or switching to hourly for complex surgical cases").

---

### Knowledge & Quality Toolkits -- How the Firm Learns and Improves

---

#### 2.5 Firm Knowledge Base

Every experienced attorney carries institutional knowledge that never makes it into any system: which judges prefer which argument styles, which IME examiners always find MMI, which opposing counsel will negotiate and which will litigate everything. When that attorney retires or leaves, the knowledge walks out the door. The Firm Knowledge Base captures, organizes, and makes searchable the institutional intelligence that lives in people's heads.

**Key features:**

- **Searchable procedure repository.** Firm procedures, playbooks, and standard operating procedures organized by topic. How to file an L&I protest. How to prepare a BIIA hearing binder. How to calculate a demand package for a PI case. Written once, available to everyone, updated as procedures evolve.

- **Precedent bank.** Past work product -- motions, demand letters, briefs, protest letters, settlement agreements -- searchable by topic, outcome, judge, opposing counsel, injury type, and strategy used. When drafting a new demand letter for a rotator cuff surgical case, the attorney searches the precedent bank for the firm's best previous demand letters in similar cases.

- **War stories.** Anonymized case lessons learned, tagged by injury type, strategy, and outcome. "We tried Strategy X in a case like this and it did not work because..." or "Judge Thompson responded well to this approach in a similar case." War stories are the firm's collective experience distilled into actionable intelligence.

- **Judge profiles.** Preferences, tendencies, and past rulings compiled from firm experience. Which judges allow IME testimony by video? Which judges are strict on discovery deadlines? Which judges tend to award higher PPD ratings? Profiles grow richer as the firm handles more cases before each judge.

- **Opposing counsel notes.** Negotiation patterns, litigation style, settlement tendencies, communication preferences. Does this opposing counsel respond to aggressive demands or moderate ones? Do they settle early or litigate to the hearing? These notes save hours of strategy guessing on repeat opponents.

- **Provider assessments.** Medical provider reliability ratings, IME examiner patterns (who always finds MMI? who provides thorough evaluations?), vocational expert quality scores, economist track records. Built from firm experience across all cases.

- **Auto-linking.** New case observations are automatically linked to existing knowledge entries. When a new case involves Judge Thompson, the judge profile surfaces. When an IME report arrives from Dr. Harris, the provider assessment appears.

**Inspired by:** Obsidian (bidirectional linking, knowledge as a graph rather than a hierarchy), Notion (structured wikis with databases and relations), Confluence (team knowledge bases with search), Roam Research (networked thought).

**Virtual Associate surface:** The AI searches the knowledge base during conversations. An attorney asks: "What worked last time we faced Judge Thompson on a PPD dispute?" and the AI retrieves relevant war stories, judge profile notes, and precedent work product. When drafting documents, the AI suggests relevant precedent ("I found 3 demand letters from similar rotator cuff cases -- the one with the highest settlement used this argument structure"). It auto-links new case observations to existing knowledge entries and suggests new knowledge base entries from case outcomes ("This case resulted in an unusually high PPD rating -- would you like me to create a war story entry?").

---

#### 2.6 Quality Assurance & Review

Legal work product quality is managed through informal review processes -- a senior attorney reads a draft, makes corrections, and sends it back. There is no structured workflow, no metrics, no systematic learning from errors. The QA & Review toolkit brings software engineering's code review discipline to legal work product.

**Key features:**

- **Structured review workflow.** A pull-request-inspired model for legal documents: Draft → Submit for Review → Inline Comments → Approve/Request Changes → Finalize. Every piece of outgoing work product goes through a defined review process with a clear paper trail.

- **Inline commenting.** Reviewers comment directly on document sections -- "This citation does not support the argument," "Strengthen this paragraph with the ROM measurements from Dr. Johnson's report," "Good use of the precedent from the Martinez case." Comments are threaded and resolvable.

- **Filing checklists.** Configurable pre-filing verification checklists. Before any document leaves the firm: claim number verified, all citations checked, exhibits attached, service list complete, deadline confirmed, spell-check passed. Checklists vary by document type -- a demand letter has different requirements than a protest filing.

- **Automated quality checks.** Machine-assisted verification that runs before human review: spelling and grammar, citation format verification, template compliance (does the document follow the firm's standard structure?), entity consistency (does the case number match throughout?), completeness checks (are all required sections present?).

- **QA metrics per attorney.** First-pass approval rate (what percentage of documents are approved without revision?), average revision cycles, error categories (citation errors, factual errors, formatting issues, strategic weakness), timeliness (are documents submitted for review on time?). These metrics inform training priorities and performance conversations.

- **Work product scoring.** Paragraph-level strength indicators showing how well each section of a document is supported by evidence. A demand letter section claiming $50,000 in wage loss with three supporting documents scores higher than a section with the same claim and no supporting evidence. Strength scores guide both the drafter and the reviewer.

**Inspired by:** GitHub Pull Requests (structured review with inline comments, approval workflows, and review history), SonarQube (automated code quality checks before human review), Linear (Definition of Done checklists), Google Docs (suggesting mode and comment threads).

**Virtual Associate surface:** The AI runs automated quality checks before the document reaches the human reviewer, catching mechanical errors early ("3 citation format errors detected, 1 missing exhibit reference"). It suggests improvements during drafting ("This section would be stronger with the ROM comparison from Dr. Johnson's October report -- would you like me to add it?"). It tracks quality trends over time and generates coaching insights for managing partners ("Attorney Rodriguez's first-pass approval rate has improved from 62% to 85% over 6 months -- the most common remaining issue is citation completeness"). It flags recurring error patterns firm-wide ("Protest letters are being filed without updated medical summaries in 30% of cases -- consider adding this to the filing checklist").

---

#### 2.7 Training & Onboarding

New attorneys and paralegals at small and mid-size firms learn by doing -- there is no formal training program, no curriculum, no competency tracking. Senior attorneys teach through corrections on live work, which is expensive and inconsistent. The Training & Onboarding toolkit brings structure to professional development without adding bureaucratic overhead.

**Key features:**

- **Role-based onboarding programs.** Structured multi-week curricula for new hires by role. A new paralegal's first week: firm procedures review, document classification tutorial (with live practice on real cases), entity extraction review training, case organization standards. A new associate's first month: case intake procedures, document review standards, demand letter structure, hearing preparation workflow, client communication guidelines.

- **Competency assessment framework.** Skill tracking across core competencies: case intake, document review, motion drafting, hearing preparation, settlement negotiation, client management, entity extraction review. Competency levels (Novice → Competent → Proficient → Expert) are assessed through a combination of QA metrics (from Toolkit 2.6), case outcomes, and supervisor evaluation.

- **CLE tracking.** Continuing Legal Education credits earned and remaining, upcoming CLE opportunities, reporting period deadlines, automatic reminders. CLE transcripts stored alongside the attorney's professional development record.

- **Contextual training links.** Training materials surface where the work happens. When a new paralegal opens the entity extraction review interface, a "How to review medical record extractions" guide is one click away. When a new associate opens the Document Composer to draft their first demand letter, the firm's demand letter structure guide appears in the context panel.

- **Practice exercises.** Safe sandbox environments where trainees can practice entity extraction review, document classification, and demand letter drafting on anonymized historical cases without affecting live data. Exercises are scored against the historical attorney decisions for immediate feedback.

**Inspired by:** Trainual (role-based process documentation and onboarding checklists), Lessonly (practice-based learning with feedback loops), Lattice (competency frameworks and development tracking), Notion (contextual documentation linked to workflows).

**Virtual Associate surface:** The AI provides real-time coaching during document review ("This IME report contains a contradiction with the treating physician's ROM measurements -- would you like me to show you how to flag it and what it means for the case?"). It generates personalized training recommendations based on quality metrics ("Your citation accuracy is strong, but entity verification completeness is below the firm average -- here are 3 practice exercises focused on medical entity verification"). It answers procedural questions in context ("How does the firm typically handle a protest when the L&I order cites insufficient medical evidence?" pulls from both the knowledge base and firm procedures).

---

### Client-Facing Toolkits -- How the Firm Serves Clients

---

#### 2.8 Client Experience Portal

The current platform overview (Document 0) describes a basic client portal: case status, questionnaires, digital signing, document upload. The Client Experience Portal toolkit expands this into a full client experience layer -- proactive communication, milestone notifications, onboarding journeys, and self-service resources that reduce the "What's happening with my case?" phone calls that consume paralegal time.

**Key features:**

- **Case status in plain language.** Not "Phase: Active Treatment / Status: Awaiting IME" but "Your case is in the medical treatment phase. We are waiting for Dr. Smith's office to schedule your independent medical examination. This typically takes 2-3 weeks." Legal jargon is translated into language that clients understand.

- **Automated milestone notifications.** Real-time updates when meaningful events occur: "Your medical records from Dr. Johnson were received and are being reviewed." "Your hearing has been scheduled for March 15, 2026. Your attorney will contact you to prepare." "The opposing counsel has responded to our demand -- your attorney is reviewing their response." Notifications are triggered by platform events (document receipt, phase change, deadline) and delivered via the portal, email, or SMS based on client preference.

- **Client document upload.** Clients upload medical records, correspondence, bills, and other documents directly through the portal. Uploads flow into the document processing pipeline automatically -- OCR, classification, entity extraction -- just like any other document. The client sees confirmation that their upload was received and is being processed.

- **Secure messaging.** Encrypted communication between the client and their legal team. Messages are logged in the case record. The client does not need to call the office for routine questions -- they message through the portal and receive a response within the firm's configured SLA.

- **Questionnaires and forms.** Structured forms for gathering case-relevant information: injury details, employment history, medical provider list, wage information, witness contact details. Auto-save prevents lost work. Guided completion with explanatory text helps clients provide accurate information.

- **Digital signing.** Engagement letters, medical releases, authorization forms, and settlement agreements signed electronically through the portal. Signed documents flow into the case graph as Sources with full audit trail.

- **FAQ by injury type and case phase.** Self-service answers to common questions: "What is maximum medical improvement?", "How long does a workers' comp claim take?", "What happens at a BIIA hearing?" FAQs are contextual -- a client in the treatment phase sees treatment-related FAQs, not hearing preparation FAQs.

- **Onboarding journey.** New client onboarding as a guided sequence: welcome message → team introduction → information collection questionnaire → document checklist (what to gather and upload) → process explanation (what to expect and when) → first check-in scheduling. The journey adapts based on case type and complexity.

**Inspired by:** Intercom (proactive messaging, onboarding sequences, help center), MyCase (legal client portal with messaging and document sharing), Zendesk (self-service knowledge base and customer satisfaction), Patient portals in healthcare (status visibility, secure messaging, document exchange).

**Virtual Associate surface:** The AI generates plain-language status updates from case data -- it translates "extraction_status: complete, phase: active_treatment, next_deadline: IME scheduling" into a sentence a client can understand. It answers common client questions using the FAQ knowledge base and case-specific context. It translates legal terminology into accessible language on demand. It flags overdue client responses ("The Martinez client has not completed the employment history questionnaire after 2 reminders over 14 days -- consider a phone call"). It drafts milestone notification messages from platform events.

---

#### 2.9 Intake & CRM

New case acquisition is where revenue begins, but most firms manage intake with phone calls, yellow pads, and email. The Intake & CRM toolkit brings pipeline management to legal client acquisition -- from first contact through engagement, with conflict checking, lead scoring, and automated follow-up built in.

**Key features:**

- **Lead capture from multiple channels.** Website contact forms, phone call logging, email inquiries, referral submissions, walk-ins. Every potential client enters the same pipeline regardless of how they first reached the firm.

- **Lead pipeline visualization.** Kanban or funnel view: Inquiry → Consultation Scheduled → Consultation Complete → Conflict Check → Engagement Letter → Active Case. Each stage has configurable timeouts and automated follow-up triggers.

- **Automated follow-up sequences.** Leads that stall in the pipeline receive automated outreach. A lead that scheduled a consultation but did not attend receives a "We missed you" email after 24 hours and a phone call reminder after 72 hours. Follow-up sequences are configurable by lead source and case type.

- **Conflict check at intake.** Before any engagement, the system runs automatic conflict screening against the firm's entire case history and client database. Potential conflicts surface with the nature of the conflict and the conflicting matter, giving the attorney the information needed to make an engagement decision.

- **Engagement letter generation.** Intake data (client name, case type, fee arrangement, scope of representation) auto-populates engagement letter templates. The attorney reviews, customizes, and sends through the portal for digital signature.

- **Referral source tracking.** Every lead is tagged with its referral source: which attorney referred them, which website they found the firm on, which advertising campaign brought them in. Referral source ROI analysis shows which acquisition channels produce the most cases, the highest-value cases, and the best conversion rates.

- **Client lifetime value tracking.** For firms with repeat clients or referral networks, track the total value generated by each client relationship across all matters.

**Inspired by:** Clio Grow (legal-specific CRM with intake workflows), Lawmatics (marketing automation for law firms), HubSpot (pipeline management and lead scoring), Salesforce (CRM with referral tracking and ROI analysis).

**Virtual Associate surface:** The AI conducts conversational intake -- a potential client describes their situation in natural language, and the AI extracts case details, identifies the case type, and pre-populates intake fields. It runs conflict checks in real-time during the conversation ("Before we proceed, I need to check for conflicts... no conflicts found"). It scores lead viability based on case details and firm history ("Based on the injury type, employer, and described circumstances, this case has a high likelihood of engagement"). It drafts engagement letters from intake data. It suggests follow-up timing for unconverted leads ("This lead has been in Consultation Scheduled for 5 days -- similar leads that convert do so within 3 days. A phone call may be warranted").

---

#### 2.10 Client Satisfaction & Feedback

Client satisfaction determines referrals, reviews, and retention -- but most firms have no systematic way to measure it. The Client Satisfaction & Feedback toolkit creates a closed-loop system: measure satisfaction at key milestones, identify at-risk relationships early, and turn satisfied clients into advocates.

**Key features:**

- **Post-milestone satisfaction surveys.** Brief, targeted surveys triggered by case milestones: after the first month (onboarding experience), after a major event (hearing, deposition, IME), after a significant communication (demand sent, settlement offer received). Surveys are short (3-5 questions) to maximize response rates.

- **Post-resolution comprehensive survey.** A detailed satisfaction survey after case closure covering the full client experience: intake process, communication quality, outcome satisfaction, team responsiveness, overall experience. Includes Net Promoter Score (NPS) question.

- **Response time tracking.** How quickly does the firm respond to client inquiries across all channels (portal messages, emails, phone calls)? Average response time by attorney, by case type, by communication channel. Response time SLAs with alerts when approaching or exceeding targets.

- **Automated review solicitation.** For satisfied clients (NPS promoters), automated invitation to leave reviews on Google, Avvo, or other legal directories. Review requests are timed appropriately -- after case resolution, after a positive satisfaction survey, never during active disputes.

- **Client communication analytics.** Communication frequency by channel, correlation between communication frequency and satisfaction scores, identification of communication gaps. Which clients have not heard from the firm in 30+ days? Which clients are receiving frequent updates?

- **At-risk client identification.** Composite risk scoring based on communication gaps, missed survey responses, declining satisfaction scores, and overdue deliverables. At-risk clients surface in the firm dashboard before the relationship deteriorates.

**Inspired by:** Intercom (CSAT surveys embedded in communication flow), Zendesk (NPS tracking and customer health scores), Lattice (360-degree feedback and engagement scoring), Gainsight (customer health monitoring and proactive intervention).

**Virtual Associate surface:** The AI analyzes satisfaction trends across the firm ("Client satisfaction dropped 8% this quarter -- the primary driver is response time on portal messages, which increased from 4 hours to 11 hours average"). It flags at-risk clients based on behavioral patterns ("The Thompson client has not responded to 2 messages and missed a scheduled call -- satisfaction risk is elevated"). It suggests proactive outreach when engagement drops ("5 clients have not received a case update in 30+ days -- here are suggested update messages for each"). It drafts satisfaction survey questions tailored to the milestone context.

---

### Strategic Toolkits -- How the Firm Grows

---

#### 2.11 Firm Analytics & Business Intelligence

Every managing partner wants to answer questions like "What's our most profitable case type?" and "Which attorneys have the best outcomes?" Today, answering these questions requires exporting data to spreadsheets and building one-off reports. The Firm Analytics toolkit makes these questions answerable in natural language, with drill-down dashboards that update in real time.

**Key features:**

- **Managing partner dashboard.** Revenue (billed, collected, outstanding), utilization rate (billable hours / available hours), realization rate (collected / billed), collection rate, AR aging buckets, expense tracking. The dashboard is the firm's financial vital signs at a glance.

- **Matter profitability analysis.** Revenue minus all costs (attorney time at cost rate, paralegal time, filing fees, expert fees, overhead allocation) per case. Which cases made money? Which cases lost money? What is the average profitability by case type, injury category, and fee arrangement?

- **Practice area analysis.** Revenue, margins, growth trends, average resolution time, and case volume by practice area. Is the workers' comp practice growing? Is personal injury more profitable per case? Where should the firm invest?

- **Attorney performance scorecards.** Case outcomes (win rate, average settlement), client satisfaction scores (from Toolkit 2.10), billing metrics (utilization, realization), quality scores (from Toolkit 2.6), mentorship activity (cases delegated to junior attorneys, training contributions). Performance is multi-dimensional -- not just revenue.

- **Client concentration risk.** What percentage of revenue comes from the top 5 referral sources? If the firm's largest referral source stops sending cases, what is the revenue impact? Concentration risk alerts when any single source exceeds a configurable threshold.

- **Origination tracking.** Who brought in the client? Referral credit allocation for compensation and performance evaluation. Origination data connects to referral ROI analysis in the Intake CRM (Toolkit 2.9).

- **Custom report builder.** Drag-and-drop report construction from any data dimension. Save, schedule, and distribute reports to partners, practice group leaders, or the full firm.

**Inspired by:** Metabase (question-based BI -- ask questions in plain language, get visualizations), Tableau (drill-down visualization and interactive dashboards), Looker (semantic data layer with consistent metric definitions), Clio Legal Trends (industry benchmarking for legal practices).

**Virtual Associate surface:** The AI answers analytical questions in natural language during conversations. "What's our average settlement for rotator cuff cases?" "Which attorneys have the highest first-pass approval rate?" "How does our WC practice profitability compare to last year?" The AI queries the underlying data, generates visualizations, and provides context. It generates monthly partner reports automatically, with narrative summaries of trends and anomalies. It flags statistical anomalies proactively ("Revenue per case in the PI practice dropped 15% this quarter -- the primary driver appears to be a shift toward lower-value rear-end collision cases").

---

#### 2.12 Revenue Forecasting & Pipeline

Understanding current financial performance (Toolkit 2.11) is necessary but not sufficient. Firms also need to see where revenue is going -- which cases will resolve in the next quarter, what the expected fee is, and whether the intake pipeline is healthy. The Revenue Forecasting toolkit provides financial forward-looking intelligence.

**Key features:**

- **Case pipeline valuation.** Every active case has an expected fee value weighted by probability of resolution. A case in the negotiation phase with a $50,000 expected fee and an 80% probability of settlement is worth $40,000 in the pipeline. Pipeline valuation aggregates across all cases for a firm-wide revenue forecast.

- **Revenue projections.** Monthly and quarterly revenue projections based on current pipeline, historical resolution timing (how long do cases in each phase typically take to resolve?), and intake trends (how many new cases are entering the pipeline?). Projections show best-case, expected, and worst-case scenarios.

- **Seasonal pattern analysis.** Intake spikes by industry and season (construction injuries spike in summer, industrial injuries in winter). Resolution timing patterns (cases settle faster in Q4 as opposing counsel clears dockets). Seasonal patterns inform staffing, marketing, and capacity decisions.

- **Fee arrangement optimization.** Data-driven analysis of which fee structures maximize revenue per case type. Are flat fee WC cases profitable? Should surgical cases use hourly billing? How do contingency fee cases compare to hourly cases in terms of effective hourly rate? The toolkit provides the data to make informed pricing decisions.

- **Cash flow projections.** Expected cash receipts based on AR aging, historical payment patterns, and pipeline resolution timing. When will collected revenue peak and trough? Are there upcoming cash flow gaps that need attention?

**Inspired by:** ChartMogul (SaaS revenue analytics adapted for case-based revenue), Salesforce (pipeline forecasting with weighted probabilities), Productive (financial forecasting with utilization integration), PlanGuru (cash flow projections and scenario modeling).

**Virtual Associate surface:** The AI generates financial forecasts on demand ("What does our Q2 revenue look like based on the current pipeline?"). It flags cases at risk of fee erosion ("The Martinez case has been in negotiation for 90 days with no movement -- historical data suggests cases stalled this long settle for 20% less than initial demand"). It identifies underperforming fee arrangements ("Flat fee WC cases are averaging 35% more attorney hours than budgeted -- consider adjusting pricing or switching to hourly for complex cases"). It suggests pricing for new case types based on historical data ("Based on 24 similar cases, a reasonable flat fee for a conservative treatment carpal tunnel case would be in the range of $X-Y").

---

#### 2.13 Case Outcome Analytics

Winning and losing are not random. Specific preparation activities, attorney behaviors, case characteristics, and strategic choices correlate with outcomes. The Case Outcome Analytics toolkit identifies these patterns so firms can replicate what works and avoid what does not.

**Key features:**

- **Win/loss tracking.** Outcome tracking by injury type, judge, opposing counsel, attorney, and strategy used. Outcomes are richer than win/loss -- they include settlement amount, PPD rating achieved, hearing result, time to resolution, and client satisfaction.

- **Settlement amount analysis.** Average, median, and range of settlement amounts by case type, injury category, and contributing factors. What is the typical settlement range for a rotator cuff surgical case in King County? How does that compare to Pierce County? Contributing factor analysis identifies what drives higher settlements (specific expert witnesses, specific argument strategies, specific evidence types).

- **Time-to-resolution analysis.** Average resolution time by case type, phase, and attorney, with bottleneck identification. Which phase takes the longest? Where do cases stall? Which attorneys resolve cases faster, and what do they do differently?

- **Outcome correlation.** Which case preparation activities correlate with better outcomes? Cases with deposition summaries prepared more than 14 days before hearing have 25% higher success rates. Cases with 3+ supporting expert opinions achieve higher PPD ratings. Correlation analysis identifies the preparation activities that matter most.

- **Comparative benchmarking.** Firm performance compared to industry data where available -- Clio Legal Trends reports, Washington State L&I published statistics, bar association surveys. How does the firm's average WC settlement compare to the state average? How does resolution time compare?

**Inspired by:** Gong (conversation intelligence -- identifying patterns that correlate with successful outcomes), Amplitude (behavioral analytics -- what user actions predict success), industry benchmarking platforms, Premonition (litigation analytics and outcome data).

**Virtual Associate surface:** The AI surfaces relevant outcome data when attorneys are making strategic decisions. "Cases like this with Judge Thompson typically settle in the range of $X-Y." "The last 5 cases against this opposing counsel all settled during the negotiation phase -- none went to hearing." "Cases with this injury type that include a vocational evaluation achieve 30% higher PPD ratings." The AI identifies preparation gaps that correlate with worse outcomes ("This case does not yet have a deposition summary -- cases without summaries prepared before hearing have lower success rates"). It generates outcome reports for practice group meetings with trends, standout performances, and areas for improvement.

---

### Document & Evidence Toolkits -- How the Firm Handles Evidence

---

#### 2.14 Discovery & Document Production

Document production in litigation -- organizing, numbering, redacting, and tracking what has been produced to whom -- is tedious, error-prone, and critical. Missing a responsive document or failing to log a privilege claim can have severe consequences. The Discovery & Document Production toolkit manages the full lifecycle of document production with the same rigor the platform brings to document intelligence.

**Key features:**

- **Document production management.** Organize documents into production sets. Apply Bates numbering (or other sequential numbering schemes). Track which documents are in which production set, their production status, and delivery confirmation.

- **Privilege log management.** Track privileged documents with structured log entries: document description, privilege type (attorney-client, work product, joint defense), basis for privilege, and waiver tracking. The privilege log generates automatically from tagged documents.

- **Redaction management.** Track what was redacted, why (PHI, SSN, privilege, relevance), by whom, and when. Maintain both redacted and unredacted versions with clear version tracking. Redaction audit trail for compliance.

- **Production tracking.** What has been produced to whom, when, through which delivery method, with delivery confirmation. Production history is a complete audit trail of what opposing counsel, the court, or third parties have received.

- **Hearing binder assembly.** Drag-and-drop exhibit organization for hearing preparation. Auto-generated exhibit lists with page references. Cross-reference tables linking exhibits to case issues, witnesses, and argument sections. The hearing binder is a living workspace that updates as new exhibits are added.

- **Expert collaboration rooms.** Controlled document sharing with external experts -- medical experts, vocational counselors, economists, life care planners. Experts see only the documents shared with them, with full audit trail of what was shared, when, and what the expert reviewed.

**Inspired by:** Relativity (enterprise document review and production management), Datasite (virtual data rooms with staged access control), Intralinks (secure document sharing with audit trails), CaseMap (fact chronology and exhibit management).

**Virtual Associate surface:** The AI suggests documents responsive to discovery requests ("Based on this interrogatory asking for all medical records related to the shoulder injury, here are 14 documents that appear responsive -- 3 may require privilege review"). It flags potential privilege issues during production preparation ("This email between attorney and client discusses case strategy -- it should be logged as privileged"). It auto-generates exhibit lists and cross-reference tables from tagged exhibits. It identifies gaps in production ("The opposing party's discovery request asks for wage records from 2022-2025, but we only have records through 2024 -- a supplemental request to the client may be needed").

---

#### 2.15 Deposition & Testimony Tools

Depositions produce some of the most valuable evidence in a case, but deposition transcripts are notoriously difficult to work with -- hundreds of pages of testimony that must be searched, cross-referenced, and synthesized. The Deposition & Testimony Tools toolkit transforms raw transcripts into searchable, linked, and AI-analyzed testimony intelligence.

**Key features:**

- **Transcript ingestion and indexing.** Upload deposition transcripts (PDF, ASCII, or digital transcript formats). The system parses the transcript structure (page/line numbers, speaker identification, question/answer pairs), indexes by topic, witness, and subject matter, and links testimony to case entities.

- **Key testimony extraction.** AI identifies the most significant testimony passages: critical admissions, contradictions with other evidence, supporting testimony for key case arguments, and testimony that undermines the opposing party's position. Key testimony is tagged and organized by relevance to case issues.

- **Contradiction detection.** Cross-reference deposition testimony with medical records, prior statements, other depositions, and any other case evidence. When a deponent testifies that the claimant was lifting 50-pound boxes but the medical records show a 10-pound lifting restriction, the system flags the contradiction with specific citations from both sources.

- **Deposition question generation.** AI drafts targeted questions from detected contradictions, evidence gaps, and case strategy. If the IME examiner's testimony contradicts their written report, the system generates follow-up questions probing the discrepancy. Questions are organized by topic and priority.

- **Testimony timeline.** A chronological view of all witness statements across every deposition in a case. What did each witness say about the incident date? About the claimant's work duties? About the injury mechanism? The testimony timeline reveals consistency and inconsistency across witnesses.

- **Clip library.** Save and organize key testimony excerpts for hearing preparation, demand letters, and motion support. Clips are tagged by topic, witness, and case issue. The Document Composer (core platform) can embed testimony clips directly into work product with automatic citation.

**Inspired by:** Relativity (transcript analysis and coding), CaseMap (fact chronology linking testimony to issues), TrialPad (exhibit and testimony management for courtroom presentation), TextMap (deposition transcript analysis and key passage identification).

**Virtual Associate surface:** The AI searches transcripts by topic across all depositions in a case ("What did every witness say about the claimant's physical abilities?"). It flags contradictions between deposition testimony and medical records ("The employer's HR representative testified the claimant never reported the injury, but the employer's incident report dated 3 days after the injury date contradicts this"). It generates follow-up deposition questions from contradictions and evidence gaps. It assembles testimony summaries for hearing preparation organized by case issue. It identifies testimony that supports or weakens specific arguments in the case strategy.

---

## 3. How Toolkits Compose

### Toolkits Are Additive

A firm loads the toolkits it needs. There is no required set beyond the core platform. A solo practitioner handling 30 WC cases might load:

- **Matter Board** -- visualize the caseload
- **Time & Billing** -- track and bill time
- **Client Experience Portal** -- give clients status visibility

A 50-attorney firm doing WC and PI across multiple offices might load the full catalog. Each toolkit adds value independently, but the real power emerges when they work together.

### Toolkits Enhance Each Other

The toolkits are designed to share data and reinforce each other:

- **QA metrics** (Toolkit 2.6) feed into **attorney performance scorecards** (Toolkit 2.11). A managing partner sees not just revenue per attorney but also quality scores, first-pass approval rates, and error trends.

- **Intake CRM** (Toolkit 2.9) feeds lead and referral data into **revenue forecasting** (Toolkit 2.12). Pipeline health starts at intake, not at case opening.

- **Client satisfaction scores** (Toolkit 2.10) appear in **attorney performance** (Toolkit 2.11) and correlate with **case outcomes** (Toolkit 2.13). Do happier clients get better outcomes, or do better outcomes make happier clients? The data tells the story.

- **Knowledge base precedent** (Toolkit 2.5) appears in the **Document Composer** (core platform) and is surfaced by the **QA workflow** (Toolkit 2.6) during review. A reviewer can see whether the draft follows the pattern that worked in similar cases.

- **Workload data** (Toolkit 2.2) informs **case routing** during **intake** (Toolkit 2.9). New cases are assigned based on real capacity, not guesswork.

- **Time & billing data** (Toolkit 2.4) feeds into **matter profitability** (Toolkit 2.11) and **fee arrangement optimization** (Toolkit 2.12). The firm sees not just revenue but actual profitability per case type.

- **Workflow automations** (Toolkit 2.3) trigger actions across toolkits. A phase change fires a **client notification** (Toolkit 2.8), updates the **matter board** (Toolkit 2.1), and generates tasks visible in the **workload manager** (Toolkit 2.2).

### Toolkits Enhance Practice Areas

Toolkits are practice-area-agnostic, but they are informed by practice area data:

- The **Matter Board's phases** are defined by the practice area module. WC has different phases than PI. The board adapts to whatever practice areas are loaded.

- The **Knowledge Base's war stories** are tagged by practice area. A WC attorney searches WC precedent; a PI attorney searches PI precedent. A firm doing both sees cross-practice patterns.

- **QA checklists** vary by document type, and document types come from the practice area's classification taxonomy. A WC protest letter checklist differs from a PI demand letter checklist.

- **Case outcome analytics** segment by practice area automatically. WC outcomes are benchmarked against WC data; PI outcomes against PI data.

- **Deposition tools** understand practice-area-specific testimony patterns. In WC, the system knows to cross-reference deposition testimony with IME reports and L&I orders. In PI, it cross-references with police reports and insurance correspondence.

### Every Toolkit Has an AI Surface

This is the architectural principle that distinguishes Leglise's toolkits from standalone tools. Every toolkit exposes capabilities to the Virtual Associate. The AI does not just read data from toolkits -- it reasons about it, correlates it with case-specific context, and surfaces insights proactively.

A standalone Kanban tool shows cases on a board. Leglise's Matter Board shows cases on a board AND the Virtual Associate can tell you which cases are stalled, why, and what to do about it -- in the same conversation where you are asking about a specific case's medical evidence.

A standalone BI dashboard shows revenue charts. Leglise's Analytics toolkit shows revenue charts AND the Virtual Associate can answer "Why did our PI practice revenue drop this quarter?" by cross-referencing intake data, case outcomes, fee arrangements, and attorney workload -- and suggest specific actions.

The AI weaves toolkit capabilities into natural conversation and proactive intelligence. This is the compound effect: each toolkit is useful alone, more useful together, and most useful when the AI connects them.

---

## 4. Competitive Positioning

### The Landscape

| Capability            | Clio                | Filevine     | Litify                 | Smokeball     | **Leglise**                                                                              |
| --------------------- | ------------------- | ------------ | ---------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| Kanban/Workflow Board | Basic               | Phase-based  | Salesforce-powered     | Basic         | AI-aware with stalled case detection and proactive recommendations                       |
| Workload Management   | None                | Basic        | Basic                  | None          | Capacity heatmap with skill-based routing and AI-suggested assignment                    |
| Workflow Automation   | Limited (Clio Grow) | Rules engine | Salesforce flows       | Limited       | Visual builder with AI-suggested improvements and bottleneck detection                   |
| Time & Billing        | Strong              | Strong       | Strong                 | Auto-capture  | Auto-capture + AI narratives + trust compliance monitoring                               |
| Knowledge Base        | None                | None         | None                   | None          | Precedent bank, war stories, judge profiles, opposing counsel notes -- all AI-searchable |
| QA/Review Workflow    | None                | None         | None                   | None          | PR-model review with automated checks, inline comments, and quality metrics              |
| Training & Onboarding | None                | None         | None                   | None          | Role-based programs with contextual coaching and competency tracking                     |
| Client Portal         | MyCase integration  | Basic        | Basic                  | Basic         | Plain-language updates, milestone notifications, onboarding journeys, FAQ by phase       |
| Intake/CRM            | Clio Grow           | Limited      | Salesforce CRM         | Limited       | AI conversational intake with conflict check, lead scoring, and referral ROI             |
| Client Satisfaction   | None                | None         | None                   | None          | Milestone surveys, NPS, response time tracking, at-risk identification                   |
| Business Intelligence | Clio Manage reports | Dashboards   | Salesforce reports     | Basic reports | Natural language queries, AI-generated insights, anomaly detection                       |
| Revenue Forecasting   | None                | None         | Salesforce forecasting | None          | Pipeline valuation, seasonal analysis, fee arrangement optimization                      |
| Outcome Analytics     | None                | None         | Limited                | None          | Win/loss by judge/counsel/strategy, outcome correlation, comparative benchmarking        |
| Discovery/Production  | None                | Basic        | None                   | None          | Bates numbering, privilege log, redaction tracking, expert collaboration rooms           |
| Deposition Tools      | None                | None         | None                   | None          | Transcript analysis, contradiction detection, question generation, testimony timeline    |

### The Differentiator: AI That Uses Every Toolkit

Other platforms have dashboards. Other platforms have workflow automation. Some even have decent analytics. But no platform has an AI that can:

1. **Query the BI dashboard** during a case conversation ("What's our track record with this opposing counsel?")
2. **Search the knowledge base** while drafting a document ("What argument worked in similar cases before Judge Thompson?")
3. **Check workload capacity** when a new case arrives ("Who has bandwidth and expertise for this?")
4. **Monitor client satisfaction** proactively ("The Thompson client seems disengaged -- suggest a check-in")
5. **Correlate outcomes with preparation** ("Cases with deposition summaries win more often -- this case does not have one yet")

The Virtual Associate is not a chatbot grafted onto a dashboard. It is a reasoning engine that has access to every operational, analytical, and strategic surface the firm has loaded. Each toolkit makes the AI smarter. The AI makes each toolkit more useful. The compound effect is the moat.

---

## 5. Series Navigation

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
| **11**  | **Firm-Wide Extensions** (this document)             | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                |
| **11A** | [Toolkit Deep Dive](./11a-toolkit-deep-dive.md)      | New toolkit ideas and deeper specifications for existing toolkits                                        |

**Start with [Document 0](./00-platform-overview.md)** for the platform overview. Read [Document 10](./10-the-extension-system.md) for the extension model architecture. Read this document for the complete toolkit catalog.

---

_This document catalogs the 15 firm-wide toolkit extensions that make Leglise an operational intelligence platform, not just a case management system. [Document 10](./10-the-extension-system.md) defines the extension architecture. [Document 0](./00-platform-overview.md) defines the core platform these toolkits extend._
