# Legal Copilot — Epics & User Stories

---

## 📋 Product Vision

Legal Copilot is an AI-first practice management platform for UK law firms. The AI handles 80% of administrative work autonomously — fee earners review and approve, not draft and chase.

---

## 🤖 AI-First Philosophy

Legal Copilot inverts the traditional software model:

| Traditional PMS | Legal Copilot |
|-----------------|---------------|
| Human does work, software records it | AI does work, human approves it |
| Search for information | AI surfaces what matters |
| Manual data entry | AI extracts and populates |
| Remember to follow up | AI proactively manages |
| Draft from scratch | AI drafts, human refines |

**Core Principle:** Every action the AI takes is logged, explainable, and reversible. Humans retain full control.

---

## 🎯 Target Market

- Primary: UK law firms with 1-20 fee earners
- Secondary: In-house legal teams, legal aid providers
- Pain points: Email overload, manual case tracking, client communication delays, compliance burden

---

## 📂 Supported Practice Areas

| Practice Area | AI Automation Potential | Priority |
|---------------|------------------------|----------|
| Conveyancing | Very High (process-driven, forms, searches) | Phase 1 |
| Civil Litigation | High (deadlines, documents, correspondence) | Phase 1 |
| Family Law | High (standard processes, court forms) | Phase 1 |
| Wills & Probate | High (forms, asset tracking, tax calcs) | Phase 1 |
| Employment Law | High (tribunal deadlines, standard letters) | Phase 1 |
| Immigration Law | Very High (forms-heavy, status tracking) | Phase 2 |
| Personal Injury Law | High (medical records, quantum, deadlines) | Phase 2 |
| Commercial & Corporate | Medium (bespoke work, due diligence) | Phase 2 |
| Criminal Law | Medium (legal aid, court dates, disclosure) | Phase 2 |
| Intellectual Property | Medium (deadlines, renewals, searches) | Phase 3 |
| Insolvency Law | Medium (creditor comms, asset tracking) | Phase 3 |
| Legal Aid | High (billing rules, compliance, reporting) | Phase 2 |
| General Practice | High (multi-area support) | Phase 1 |
| In-House Legal | Medium (matter tracking, contracts) | Phase 3 |

### Practice Area Features

- Custom workflows per practice area
- Practice-specific document templates
- Relevant integration connectors (e.g., Land Registry for conveyancing, HMCTS for litigation)
- AI trained on practice-specific terminology and processes
- Limitation date calculators per case type
- Court/tribunal form libraries

---

## 💰 Pricing Model (Draft)

- Starter: £49/user/month — Up to 50 active cases, core AI features
- Professional: £99/user/month — Unlimited cases, full AI autonomy, client portal
- Enterprise: Custom — Multi-office, API access, dedicated AI training

---

## 🎭 Actors

- Firm Admin – Practice Manager / Office Manager
- Fee Earner – Solicitor, Paralegal, Caseworker
- Support Staff – Admin / Secretary
- Client – Individual or corporate client
- Legal Copilot – AI agent (autonomous system actor)

---

## 🧠 AI Capabilities Overview

| Capability | Description |
|------------|-------------|
| Entity Extraction | Automatically extract names, dates, amounts, addresses from any document or email |
| Case Matching | Match incoming emails/documents to cases using semantic understanding |
| Smart Drafting | Generate responses, letters, and documents in firm's tone and style |
| Sentiment Analysis | Detect urgency, frustration, or escalation in communications |
| Risk Scoring | Continuously assess case risk based on timeline, communications, and patterns |
| Predictive Analytics | Estimate case duration, costs, and outcomes based on historical data |
| Anomaly Detection | Flag unusual patterns (inactivity, missed deadlines, billing irregularities) |
| Knowledge Retrieval | Answer questions using case documents plus legal knowledge base |
| Task Generation | Automatically create tasks from emails, documents, and case stage |
| Document Comparison | Compare document versions, identify changes, flag concerns |

---

## EPIC 0️⃣ — AI-Powered Client Intake & CRM

**Goal:** AI qualifies leads, checks conflicts, generates quotes, and onboards clients with minimal human input.

### User Stories

- As Legal Copilot, I capture enquiries from web forms, emails, and phone transcripts
- As Legal Copilot, I extract client details and matter type automatically
- As Legal Copilot, I score lead quality and urgency (hot/warm/cold)
- As Legal Copilot, I perform instant conflict checks using fuzzy name matching and relationship graphs
- As Legal Copilot, I draft personalised engagement letters based on matter type
- As Legal Copilot, I send onboarding forms and chase incomplete submissions
- As Legal Copilot, I verify identity documents using AI-powered AML/KYC checks
- As Legal Copilot, I create the case automatically once intake is approved
- As a fee earner, I review AI-prepared intake summary and approve with one click

### Quote Calculator

- As a prospect, I can get an instant quote via the firm's website
- As Legal Copilot, I calculate quotes based on matter type, complexity, and firm rates
- As Legal Copilot, I include disbursements, VAT, and SDLT (conveyancing) in quotes
- As Legal Copilot, I convert accepted quotes to cases without re-entering data
- As a firm admin, I can configure quote templates and pricing rules per practice area

### CRM Pipeline

- As a fee earner, I can see all leads in a pipeline view (new, contacted, quoted, converted, lost)
- As Legal Copilot, I track lead sources and conversion rates
- As Legal Copilot, I auto-chase leads who haven't responded
- As Legal Copilot, I identify leads going cold and prompt action

---

## EPIC 1️⃣ — Intelligent Case Command Centre

**Goal:** AI manages the case lifecycle; humans make decisions.

### User Stories

- As Legal Copilot, I auto-populate case details from intake data
- As Legal Copilot, I suggest the optimal case workflow based on matter type
- As Legal Copilot, I predict case duration and key milestones
- As Legal Copilot, I calculate risk score and update it continuously
- As Legal Copilot, I recommend similar past cases for reference
- As Legal Copilot, I detect when a case should move to the next stage
- As Legal Copilot, I alert fee earners to cases needing attention (stale, at-risk, approaching deadline)
- As a fee earner, I see an AI-generated case dashboard with status, risk, next actions, and blockers
- As a fee earner, I can override any AI suggestion or status change

---

## EPIC 2️⃣ — AI-Curated Case Timeline

**Goal:** AI builds and maintains the timeline automatically; humans add context.

### User Stories

- As Legal Copilot, I auto-generate timeline events from all emails, documents, calls, and system actions
- As Legal Copilot, I summarise each event in plain English
- As Legal Copilot, I detect and highlight key events (offers, deadlines, decisions, escalations)
- As Legal Copilot, I identify gaps in the timeline and prompt for missing information
- As Legal Copilot, I predict upcoming events based on case type and stage
- As Legal Copilot, I colour-code events by urgency and importance
- As a fee earner, I can ask "what happened last week on this case?" and get an AI summary
- As a fee earner, I can add manual notes which AI incorporates into the case understanding

---

## EPIC 3️⃣ — AI Party Intelligence

**Goal:** AI manages parties, relationships, and contact intelligence.

### User Stories

- As Legal Copilot, I extract party details from documents and emails automatically
- As Legal Copilot, I detect and suggest new parties mentioned in correspondence
- As Legal Copilot, I identify relationships between parties across all firm cases
- As Legal Copilot, I enrich party data from public sources (Companies House, LinkedIn, court records)
- As Legal Copilot, I detect opponent solicitors and lookup their firm details
- As Legal Copilot, I track communication patterns and sentiment per party
- As Legal Copilot, I warn when communicating with unrepresented parties
- As a fee earner, I approve or correct AI-suggested party additions

---

## EPIC 4️⃣ — Deep Document Intelligence

**Goal:** AI reads, understands, and manages all documents.

### User Stories

- As Legal Copilot, I auto-file documents to the correct case using content analysis
- As Legal Copilot, I classify documents by type (contract, pleading, correspondence, ID, etc.)
- As Legal Copilot, I extract key data: dates, amounts, parties, obligations, deadlines
- As Legal Copilot, I generate summaries at multiple lengths (1-line, paragraph, full)
- As Legal Copilot, I identify missing standard documents for the case type
- As Legal Copilot, I compare document versions and highlight changes
- As Legal Copilot, I flag concerning clauses or unusual terms
- As Legal Copilot, I OCR and process scanned documents and images
- As Legal Copilot, I make all documents searchable via natural language queries
- As a fee earner, I can ask "find the clause about termination" across all case documents
- As a fee earner, I can ask "what did we agree on price?" and get the answer with source citation

---

## EPIC 5️⃣ — Autonomous Communications Copilot

**Goal:** AI handles 80% of routine correspondence end-to-end.

### User Stories

- As Legal Copilot, I monitor all connected mailboxes in real-time
- As Legal Copilot, I instantly match emails to cases (or flag as new matter)
- As Legal Copilot, I analyse email intent: request, update, complaint, deadline, etc.
- As Legal Copilot, I score urgency (1-5) based on content, sender, and case context
- As Legal Copilot, I detect sentiment and flag frustrated or escalating clients
- As Legal Copilot, I draft responses in the firm's tone, using case context
- As Legal Copilot, I suggest attachments to include based on the request
- As Legal Copilot, I handle routine queries autonomously (status updates, document requests) with human approval
- As Legal Copilot, I batch similar emails for efficient review ("3 clients asking for updates")
- As Legal Copilot, I learn from edits to improve future drafts
- As Legal Copilot, I proactively draft client updates when milestones are reached
- As Legal Copilot, I chase outstanding items automatically (with approval)
- As a fee earner, I review AI inbox showing: priority score, draft response, suggested action
- As a fee earner, I approve/edit/regenerate with one click, never starting from blank

---

## EPIC 6️⃣ — Proactive AI Case Brain

**Goal:** AI thinks about cases continuously, not just when asked.

### User Stories

- As Legal Copilot, I maintain a living case summary updated with every new event
- As Legal Copilot, I generate daily/weekly case briefings for fee earners
- As Legal Copilot, I predict what will happen next and prepare accordingly
- As Legal Copilot, I identify risks before they materialise (missed deadlines, opponent tactics, cost overruns)
- As Legal Copilot, I compare this case to historical outcomes and flag concerns
- As Legal Copilot, I suggest strategic options based on case trajectory
- As Legal Copilot, I detect contradictions in evidence or statements
- As Legal Copilot, I prepare for meetings by generating briefing notes
- As Legal Copilot, I answer any question about the case with citations to source documents
- As a fee earner, I chat with my cases: "What's our weakest argument?" / "Summarise opponent's position"
- As a fee earner, I receive morning briefings: "3 cases need attention, 2 emails are urgent, 1 deadline tomorrow"

---

## EPIC 7️⃣ — AI-Assisted Billing

**Goal:** AI captures time, generates invoices, and optimises revenue.

### User Stories

- As Legal Copilot, I automatically capture time from emails, documents, and system activity
- As Legal Copilot, I suggest time entries for fee earner approval (not silent recording)
- As Legal Copilot, I draft billing narratives in appropriate legal style
- As Legal Copilot, I flag unbilled work and WIP exposure
- As Legal Copilot, I generate invoices with AI-written cover letters
- As Legal Copilot, I predict final costs vs. estimate and warn of overruns
- As Legal Copilot, I optimise billing timing based on client payment patterns
- As Legal Copilot, I draft payment chaser emails at appropriate intervals
- As Legal Copilot, I detect billing anomalies (unusually high/low for case type)
- As a fee earner, I review AI-suggested time entries and approve in bulk
- As a firm admin, I see AI-powered financial dashboard with predictions and alerts

### Billing Models Supported

- Hourly billing with multiple rates per fee earner
- Fixed fee (single or staged payments)
- Contingency / CFA (Conditional Fee Arrangement)
- Legal Aid billing (LAA rates and codes)
- Multi-currency billing (GBP, EUR, USD)
- Disbursement tracking and markup
- VAT handling (standard, exempt, reverse charge)

### Case Profitability

- As Legal Copilot, I calculate real-time profitability per case
- As Legal Copilot, I compare actual vs. budgeted hours and costs
- As Legal Copilot, I identify unprofitable case patterns
- As a firm admin, I see profitability dashboards by practice area, fee earner, client

---

## EPIC 8️⃣ — AI Client Portal

**Goal:** Clients get instant answers; fee earners only handle exceptions.

### User Stories

- As a client, I access my portal via magic link (passwordless)
- As a client, I see an AI-generated plain-English case summary (no legal jargon)
- As a client, I can ask questions and get instant AI answers about my case
- As Legal Copilot, I answer client questions using case data, within firm-set boundaries
- As Legal Copilot, I escalate questions I cannot answer to the fee earner
- As Legal Copilot, I proactively notify clients of updates (with fee earner approval settings)
- As Legal Copilot, I collect information from clients via conversational forms
- As Legal Copilot, I remind clients of outstanding actions (documents needed, forms to complete)
- As a client, I can upload documents which AI immediately processes
- As a firm admin, I configure what AI can and cannot tell clients

---

## EPIC 9️⃣ — AI Compliance & Risk Engine

**Goal:** AI ensures nothing falls through the cracks.

### User Stories

- As Legal Copilot, I continuously audit all cases against compliance rules
- As Legal Copilot, I flag SRA compliance risks (client money, conflicts, supervision)
- As Legal Copilot, I detect cases with no activity and escalate appropriately
- As Legal Copilot, I ensure all client communications are logged (audit trail)
- As Legal Copilot, I monitor supervision ratios and workload distribution
- As Legal Copilot, I generate compliance reports automatically
- As Legal Copilot, I detect unusual patterns that may indicate issues
- As Legal Copilot, I ensure data retention policies are enforced
- As a firm admin, I receive weekly AI compliance summary with action items

---

## EPIC 🔟 — AI-Powered Firm Setup

**Goal:** AI configures itself from examples and firm context.

### User Stories

- As Legal Copilot, I learn the firm's tone and style from example documents/emails
- As Legal Copilot, I suggest workflow stages based on practice area
- As Legal Copilot, I import and structure data from existing systems
- As Legal Copilot, I configure myself based on natural language instructions
- As a firm admin, I describe what I want in plain English and AI configures it
- As a firm admin, I can provide feedback on AI behaviour and it improves
- As a firm admin, I can define user roles and permissions (Admin, Fee Earner, Support, Read-only)
- As a firm admin, I can restrict access to specific cases or practice areas
- As a firm admin, I can set billing rate cards per user and matter type
- As a firm admin, I can configure approval workflows (e.g., partner sign-off on invoices)

### Multi-Office & Enterprise

- As a firm admin, I can manage multiple office locations
- As a firm admin, I can set office-specific settings (rates, workflows, branding)
- As a firm admin, I can view consolidated reporting across all offices
- As Legal Copilot, I handle multi-jurisdictional matters (England, Wales, Scotland, NI)
- As a firm admin, I can restrict users to specific offices or allow cross-office access

### Data Migration

- As Legal Copilot, I import data from existing systems (Clio, LEAP, Hoowla, Proclaim, etc.)
- As Legal Copilot, I map and transform data during migration
- As Legal Copilot, I validate imported data and flag issues for review

---

## EPIC 1️⃣1️⃣ — Usage & AI Economics

**Goal:** Transparent AI usage with predictable costs.

### User Stories

- As Legal Copilot, I track AI operations per case and per user
- As Legal Copilot, I optimise AI usage (use smaller models for simple tasks)
- As Legal Copilot, I provide ROI metrics (time saved, emails handled, documents processed)
- As a firm admin, I see AI usage dashboard with cost breakdown
- As a firm admin, I can set AI autonomy levels per user or case type

---

## EPIC 1️⃣2️⃣ — AI Task Orchestration

**Goal:** AI manages tasks; humans execute high-value work.

### User Stories

- As Legal Copilot, I generate tasks automatically from emails, documents, and deadlines
- As Legal Copilot, I prioritise tasks based on urgency, importance, and dependencies
- As Legal Copilot, I predict task duration based on historical data
- As Legal Copilot, I assign tasks to optimal team members based on workload and expertise
- As Legal Copilot, I chase overdue tasks via gentle reminders
- As Legal Copilot, I complete simple tasks autonomously (send standard document, update status)
- As Legal Copilot, I prepare everything needed for complex tasks (research, documents, context)
- As a fee earner, I see AI-prioritised task list: what matters most right now
- As a fee earner, I mark tasks complete and AI learns from completion patterns

---

## EPIC 1️⃣3️⃣ — AI Calendar Intelligence

**Goal:** AI manages time; humans show up prepared.

### User Stories

- As Legal Copilot, I extract dates from documents and emails automatically
- As Legal Copilot, I calculate limitation periods and statutory deadlines
- As Legal Copilot, I schedule tasks and reminders working backwards from deadlines
- As Legal Copilot, I prepare briefing packs before meetings automatically
- As Legal Copilot, I suggest optimal meeting times based on case urgency and calendars
- As Legal Copilot, I draft meeting agendas based on case status and pending items
- As Legal Copilot, I send meeting reminders to all parties with relevant documents
- As Legal Copilot, I process meeting notes/recordings and extract action items
- As a fee earner, I arrive at meetings with AI-prepared brief on screen

---

## EPIC 1️⃣4️⃣ — AI Document Generation

**Goal:** AI drafts; humans refine and approve.

### User Stories

- As Legal Copilot, I generate first drafts of standard documents from case data
- As Legal Copilot, I adapt templates to specific case circumstances automatically
- As Legal Copilot, I draft bespoke documents based on natural language instructions
- As Legal Copilot, I suggest clauses from a firm clause library based on context
- As Legal Copilot, I check drafts against firm standards and flag deviations
- As Legal Copilot, I generate multiple versions for comparison (aggressive/neutral/conservative)
- As Legal Copilot, I learn from fee earner edits to improve future drafts
- As a fee earner, I describe what I need and AI produces a ready-to-edit draft
- As a fee earner, I can ask AI to "make this more formal" or "add a termination clause"

---

## EPIC 1️⃣5️⃣ — AI Integration Hub

**Goal:** AI connects and synchronises across all systems.

### User Stories

- As Legal Copilot, I maintain bidirectional sync with Microsoft 365 / Google Workspace
- As Legal Copilot, I enrich data from Companies House, Land Registry, court systems
- As Legal Copilot, I sync financial data with Xero/QuickBooks automatically
- As Legal Copilot, I process incoming post (scanned) and route to cases
- As Legal Copilot, I integrate with court filing systems where available
- As Legal Copilot, I sync with conveyancing portals (when practice area applies)
- As Legal Copilot, I provide API access for custom integrations
- As a firm admin, I connect systems via guided AI setup (not technical configuration)

App Ecosystem (Phase 2+)
- Zoom / Teams integration for video calls with auto-meeting notes
- Outlook add-in for case linking directly from inbox
- Mobile app (iOS/Android) for approvals and case updates on the go
- Desktop app (Windows/macOS) for offline access (optional)
- Slack / Teams notifications for real-time alerts
- Chrome extension for quick case capture from any webpage

### Legal Forms & Precedents Library

- As a fee earner, I can access a library of UK legal forms and precedents
- As Legal Copilot, I suggest relevant forms based on case type and stage
- As Legal Copilot, I auto-fill forms from case data
- As a firm admin, I can add custom precedents to the firm library
- As Legal Copilot, I keep forms updated with latest versions
- Forms include: Land Registry, HMCTS, Immigration, Family Court, Employment Tribunal

---

## EPIC 1️⃣6️⃣ — Online Payments & Collections

**Goal:** Get paid faster with integrated payment options.

### User Stories

- As a client, I can pay invoices online via credit/debit card (Stripe)
- As a client, I can set up Direct Debit for recurring payments (GoCardless)
- As Legal Copilot, I include payment links in all invoice emails automatically
- As Legal Copilot, I reconcile payments against invoices automatically
- As Legal Copilot, I send payment reminders at optimal times based on client behaviour
- As Legal Copilot, I flag overdue accounts and suggest collection actions
- As a firm admin, I can see real-time payment status and cash flow projections
- As a fee earner, I can request payment on account before work begins
- As Legal Copilot, I handle client money compliance (separate tracking for SRA rules)

---

## EPIC 1️⃣7️⃣ — E-Signatures

**Goal:** Get documents signed without leaving the platform.

### User Stories

- As a fee earner, I can send documents for signature directly from case view
- As Legal Copilot, I prepare signature packets with correct signing order
- As Legal Copilot, I track signature status and send automated reminders
- As a client, I can sign documents on any device (mobile-friendly)
- As Legal Copilot, I file signed documents automatically to the case
- As Legal Copilot, I add signature events to the case timeline
- As a fee earner, I can see all pending signatures across my cases
- As Legal Copilot, I support witness signatures and multi-party signing
- As a firm admin, I can configure signature templates and branding

Technical: Integrate DocuSign, Adobe Sign, or build native (cost consideration).

---

## EPIC 1️⃣8️⃣ — Online Booking & Scheduling

**Goal:** Prospects and clients book time directly; no phone tag.

### User Stories

- As a prospect, I can book a consultation via the firm's website
- As a client, I can book follow-up appointments from my portal
- As Legal Copilot, I show availability based on fee earner calendars
- As Legal Copilot, I send confirmation and reminder emails automatically
- As Legal Copilot, I create the appointment in the case timeline
- As Legal Copilot, I prepare a briefing pack before the meeting
- As a fee earner, I can set my availability windows and buffer times
- As a firm admin, I can configure appointment types (initial consult, follow-up, etc.)
- As Legal Copilot, I integrate with Zoom/Teams to auto-create meeting links

---

## EPIC 1️⃣9️⃣ — Firm Website & Landing Pages

**Goal:** Simple web presence for firms without a website.

### User Stories

- As a firm admin, I can create a basic firm website with AI assistance
- As Legal Copilot, I generate website copy based on firm details and practice areas
- As a firm admin, I can create landing pages for specific practice areas
- As Legal Copilot, I embed enquiry forms that feed directly into intake
- As Legal Copilot, I embed booking widgets for consultations
- As a firm admin, I can customise branding (logo, colours, fonts)
- As Legal Copilot, I provide SEO suggestions to improve discoverability
- As a firm admin, I can connect a custom domain

**Note:** Keep simple — not competing with Squarespace. Focus on lead capture.

---

## EPIC 2️⃣0️⃣ — Lead Source & Referral Tracking

**Goal:** Know where clients come from to optimise marketing spend.

### User Stories

- As a fee earner, I can tag the referral source when creating a case
- As Legal Copilot, I auto-detect source from UTM parameters on web enquiries
- As Legal Copilot, I track conversion rates by source (enquiry → case → revenue)
- As a firm admin, I can see ROI by referral source (marketing spend vs. revenue)
- As Legal Copilot, I identify top referrers and suggest thank-you actions
- As a firm admin, I can create custom referral source categories
- As Legal Copilot, I generate referral reports for partnership reviews

---

## EPIC 2️⃣1️⃣ — Conveyancing Module

**Goal:** Deep support for residential and commercial conveyancing.

### User Stories

- As a fee earner, I can order searches directly from within a case (InfoTrack, Searchflow, etc.)
- As Legal Copilot, I auto-populate search orders from case and property data
- As Legal Copilot, I track search status and notify when results arrive
- As Legal Copilot, I summarise search results and flag concerns
- As a fee earner, I can access standard conveyancing forms (TA6, TA7, TA10, TR1, etc.)
- As Legal Copilot, I auto-fill forms from case data (TA6, TA10, TR1)
- As Legal Copilot, I integrate with conveyancing portals (e.g., Veya, LMS, TM Connect)
- As Legal Copilot, I track exchange and completion milestones
- As Legal Copilot, I manage chain tracking for linked transactions
- As Legal Copilot, I generate completion packs automatically
- As Legal Copilot, I generate completion statements automatically
- As Legal Copilot, I calculate SDLT and submit to HMRC electronically
- As Legal Copilot, I attach SDLT5 certificates to case automatically
- As a fee earner, I can submit Land Registry applications (AP1, etc.) via EDRS
- As Legal Copilot, I integrate with lender portals for mortgage cases
- As Legal Copilot, I manage property enquiries and track responses
- As Legal Copilot, I auto-chase clients for outstanding documents
- As Legal Copilot, I perform AML/fraud checks on bank details and solicitors

**Practice Area Note:** Conveyancing is high-volume, process-driven — ideal for AI automation.

---

## EPIC 2️⃣2️⃣ — Reporting & Analytics Dashboard

**Goal:** AI-powered insights for firm performance and decision-making.

### User Stories

- As a firm admin, I can view real-time firm dashboard (cases, revenue, workload)
- As Legal Copilot, I generate daily/weekly/monthly performance summaries
- As a firm admin, I can see revenue by practice area, fee earner, client, referral source
- As a firm admin, I can track billable utilisation rates per fee earner
- As a firm admin, I can see aged WIP and debt reports
- As a firm admin, I can view case pipeline and conversion rates
- As Legal Copilot, I identify trends and anomalies automatically
- As Legal Copilot, I predict future revenue based on pipeline and historical data
- As a fee earner, I can see my personal dashboard (my cases, my tasks, my billing)
- As a firm admin, I can create custom reports and schedule automated delivery
- As Legal Copilot, I benchmark firm performance against anonymised industry data (future)

### Standard Reports

- Matter status report
- Fee earner productivity report
- Billing and collections summary
- Aged debtors / aged WIP
- Case profitability analysis
- Referral source ROI
- Compliance audit report
- Client satisfaction trends (from portal interactions)

---

## EPIC 2️⃣3️⃣ — Litigation & Court Bundle Module

**Goal:** Prepare court-ready bundles and manage litigation cases efficiently.

### User Stories

- As a fee earner, I can create court bundles with automatic pagination and indexing
- As Legal Copilot, I compile documents in correct court bundle order
- As Legal Copilot, I generate bundle indexes with hyperlinks
- As Legal Copilot, I format bundles to court requirements (font, margins, etc.)
- As a fee earner, I can manage witness statements and evidence
- As Legal Copilot, I track exhibit references and cross-references
- As Legal Copilot, I calculate and track limitation dates
- As Legal Copilot, I generate chronologies from case timeline
- As Legal Copilot, I prepare court forms (N1, N244, etc.) with auto-fill
- As a fee earner, I can track court deadlines and hearing dates
- As Legal Copilot, I send reminders for filing deadlines
- As Legal Copilot, I generate skeleton arguments from case notes (AI draft)

### Supported Courts

- County Court / High Court
- Employment Tribunal
- Family Court
- First-tier Tribunal (Immigration)

---

## EPIC 2️⃣4️⃣ — Wills, Probate & Estate Administration Module

**Goal:** Streamline probate applications and estate administration.

### User Stories

- As a fee earner, I can create will drafts using guided questionnaires
- As Legal Copilot, I generate will documents from client answers
- As Legal Copilot, I flag potential issues (capacity, undue influence indicators)
- As a fee earner, I can manage probate applications through the process
- As Legal Copilot, I auto-fill probate forms (PA1P, PA1A, IHT205, IHT400)
- As Legal Copilot, I calculate inheritance tax estimates
- As Legal Copilot, I generate estate accounts and distribution schedules
- As Legal Copilot, I track asset collection and liability payments
- As Legal Copilot, I manage beneficiary communications
- As Legal Copilot, I calculate executor/administrator fees
- As a fee earner, I can track estate administration milestones

---

## EPIC 2️⃣5️⃣ — Team & Resource Management

**Goal:** Manage team capacity, holidays, and workload distribution.

### User Stories

- As a firm admin, I can manage team member profiles and roles
- As a fee earner, I can request holidays and view my allowance
- As a firm admin, I can approve/reject holiday requests
- As Legal Copilot, I show team availability calendar with holidays
- As Legal Copilot, I warn when approving leave that would leave cases uncovered
- As Legal Copilot, I suggest workload redistribution during absences
- As a firm admin, I can see team utilisation and capacity dashboard
- As Legal Copilot, I identify overloaded and underutilised team members
- As a firm admin, I can set target billable hours per fee earner
- As Legal Copilot, I track actual vs target and alert on variances

---

## 🏢 Operational Commitments

### Service Level

- 99.9% uptime SLA
- UK-based data centres (AWS eu-west-2 / Azure UK South)
- Daily automated backups with 30-day retention
- Disaster recovery with <4 hour RTO

### Compliance & Certifications

- GDPR compliant (data processing agreement included)
- SRA Accounts Rules compatible
- Cyber Essentials certified (target)
- SOC 2 Type II (target for enterprise tier)
- Law Society approval (target)
- ICO registered

### Support

- In-app chat and email support (UK business hours)
- Knowledge base and video tutorials
- Onboarding assistance for new firms
- Data migration support from existing systems
- Dedicated account manager (Enterprise tier)

---

## 🚀 MVP Scope (Phase 1)

**Focus:** Prove the AI-first model with email handling.

### Included in MVP

- Epic 0: AI intake (lead capture, conflict check, basic onboarding)
- Epic 1: Case Command Centre (AI dashboard, risk scoring)
- Epic 2: AI Timeline (auto-generated from emails)
- Epic 3: Parties (AI extraction, basic)
- Epic 4: Document Intelligence (upload, classify, summarise)
- Epic 5: Communications Copilot (CORE FEATURE - full AI email handling)
- Epic 6: AI Case Brain (summary, Q&A)
- Epic 10: Firm setup (mailbox connection, basic config)
- Epic 20: Lead Source Tracking (basic tagging)

### Phase 2 — Revenue & Client Experience

- Epic 7: Billing
- Epic 8: Client Portal
- Epic 16: Online Payments (Stripe, GoCardless)
- Epic 17: E-Signatures
- Epic 18: Online Booking
- Epic 12: Task Orchestration

### Phase 3 — Compliance & Automation

- Epic 9: Compliance Engine
- Epic 13: Calendar Intelligence
- Epic 14: Document Generation
- Epic 15: Integration Hub + App Ecosystem

### Phase 4 — Practice Area Expansion

- Epic 21: Conveyancing Module
- Epic 19: Website Builder (optional add-on)
- Epic 11: Advanced analytics & AI economics
- Additional practice area modules (Immigration, Family, etc.)

---

## 🏆 Competitive Landscape

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| Clio | Market leader, comprehensive, payments, e-sign | AI bolted on, US-centric, expensive (£59-139/user) |
| LEAP | UK-focused, good workflow, Matter AI, legal publishing | Dated UX, complex pricing, slow to innovate |
| Hoowla | Strong conveyancing, good UK integrations, per-case pricing | Limited AI, smaller feature set |
| Smokeball | AutoTime capture, daily digest, good automation | Complex, expensive, AI limited |
| Insight Legal | Strong accounting, multi-office, compliance focus | Minimal AI, dated interface |
| SOS Legal | Enterprise features, customisable, API-first | Complex implementation, enterprise pricing |
| PracticePanther | Modern UI, affordable | US-focused, limited UK integrations |
| Harvey AI | Strong legal AI, enterprise backing | Enterprise only, not practice management |

### Feature Parity Matrix (vs Clio)

| Feature | Clio | Legal Copilot |
|---------|------|---------------|
| Case Management | ✅ | ✅ + AI-powered |
| Email Integration | ✅ | ✅ + AI handles 80% |
| Document Management | ✅ | ✅ + AI understands content |
| Document Automation | ✅ (templates) | ✅ + AI generates bespoke |
| Time Tracking | ✅ | ✅ + AI auto-capture |
| Billing (hourly/fixed/contingency) | ✅ | ✅ + AI drafts narratives |
| Multi-currency Billing | ✅ | ✅ |
| Case Profitability Analytics | ✅ | ✅ + AI predictions |
| Client Portal | ✅ | ✅ + AI answers questions |
| Online Payments | ✅ (Clio Payments) | ✅ (Stripe + GoCardless) |
| E-Signatures | ✅ | ✅ |
| Online Booking | ✅ | ✅ + AI briefing prep |
| Client Intake Forms | ✅ | ✅ + AI extraction |
| Website Builder | ✅ (Clio Grow) | ✅ (AI-generated content) |
| Referral Tracking | ✅ | ✅ + AI ROI analysis |
| Conveyancing Tools | ❌ Limited | ✅ Deep UK integrations |
| Task Management | ✅ | ✅ + AI generates tasks |
| Calendar/Deadlines | ✅ | ✅ + AI limitation calc |
| Workflow Automation | ✅ | ✅ + AI-driven |
| Reporting Dashboard | ✅ | ✅ + AI insights |
| User Permissions/Roles | ✅ | ✅ |
| 100+ Integrations | ✅ | ✅ Core first, expand |
| Mobile App | ✅ | ✅ (Phase 2) |
| GDPR/SRA Compliance | ✅ | ✅ |
| Law Society Approved | ✅ | 🎯 Target |

Clio Pricing (UK): £59-139/user/month across 4 tiers
Legal Copilot Target: £49-99/user/month — simpler, more inclusive

### Legal Copilot Differentiation

- AI does the work, human approves (inverted model)
- UK-first design (SRA, terminology, integrations)
- Email as primary interface (where lawyers actually work)
- Transparent AI with full audit trail
- Learns and improves from firm's own data
- Deep conveyancing support (Clio's weak spot in UK)
- Simpler pricing, no nickel-and-diming for features

---

## ⚠️ Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucination | High | Citations required, human approval, confidence scores |
| Over-automation anxiety | High | Gradual autonomy levels, full transparency, easy override |
| Data security breach | Critical | SOC2, UK hosting, encryption, access controls |
| SRA compliance | High | Audit trail, AI disclosure policies, supervision tools |
| AI costs at scale | Medium | Model tiering, caching, efficient prompting |
| Client trust in AI | Medium | Clear AI labelling, quality output, opt-out available |

---

## 📐 Technical Architecture (AI-Focused)

- AI Orchestration: Multi-agent system with specialised agents per task type
- Model Strategy:
  - GPT-4/Claude for complex reasoning (drafting, analysis)
  - GPT-3.5/Haiku for classification and extraction
  - Local models for sensitive operations (future)
- Vector Database: pgvector for document search and case Q&A
- Prompt Management: Versioned prompts with A/B testing capability
- Human-in-the-Loop: Approval queues with confidence thresholds
- Learning Loop: Feedback capture, fine-tuning pipeline (future)
- Audit Trail: Every AI decision logged with reasoning
- UK Data Residency: AWS eu-west-2 or Azure UK South
- Real-time: WebSockets for live email notifications and AI updates
