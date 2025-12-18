# Legal Copilot — Frontend Design Document

## Overview

This document defines the user interface designs for Legal Copilot. The UI follows an AI-first philosophy where the system does the work and humans review/approve.

### Design Principles

1. **AI-First UX**: AI suggestions prominent, human actions are approvals not initiations
2. **Inbox Zero Philosophy**: Clear actionable queues, not endless lists
3. **Context Everywhere**: Case context always visible, no hunting for information
4. **Mobile-Responsive**: Core approval flows work on mobile
5. **Accessibility**: WCAG 2.1 AA compliant

### Technology Stack

| Technology              | Purpose                                |
| ----------------------- | -------------------------------------- |
| Next.js 15 (App Router) | React framework with server components |
| Tailwind CSS            | Utility-first styling                  |
| shadcn/ui               | Component library (Radix UI based)     |
| Lucide React            | Icon library                           |
| React Query             | Server state management                |
| Zustand                 | Client state management                |
| Framer Motion           | Animations                             |

---

## Scope, Phasing & Backend Alignment

This document includes both **MVP** UI (supported by the current backend) and **forward-looking** UI for later epics.

### Terminology

- **Case** (UI term) == **Matter** (backend/API term)
- **AI Inbox** (UI term) == **Emails + Approval Requests** (backend/API terms)

### Delivery Phases (from `docs/ideas.md`)

- **Phase 1 — Core AI case ops**: Epics 1, 2, 4, 5, 6, 10 (+ basic 20)
- **Phase 2 — Revenue & client experience**: Epics 7, 8, 12, 16, 17, 18
- **Phase 3 — Compliance & automation**: Epics 9, 13, 14, 15
- **Phase 4 — Practice area expansion**: Epics 21 (+ practice modules), 23, 24, 25 (+ optional 19, 11)

### UI → API Coverage Map (current backend surface)

Source: `docs/api/openapi.yaml` (plus a small number of implemented routes not yet represented there).

| UI surface (this doc)         | Primary backend endpoints                                                                                                                                                                   | Coverage notes                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                     | `GET /api/approvals`, `GET /api/notifications`, `GET /api/tasks`, `GET /api/calendar/upcoming`, `GET /api/matters`, `GET /api/invoices`                                                     | No dedicated dashboard aggregate endpoint; UI should compose cards from these lists.                                                           |
| Approval Queue                | `GET /api/approvals`, `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/reject`, `POST /api/approvals/bulk/approve`, `POST /api/approvals/bulk/reject`                          | Good alignment with “human approves” principle.                                                                                                |
| AI Inbox (list/detail)        | `GET /api/emails`, `GET /api/emails/{id}`, `POST /api/emails/{id}/ai/process`, approvals endpoints above                                                                                    | “Compose”/“Send” UX must be implemented either via approvals-backed actions or new email draft/send endpoints.                                 |
| Cases (Matter list/detail)    | `GET /api/matters`, `POST /api/matters`, `GET /api/matters/{id}/timeline`, `POST /api/matters/{id}/ai/ask`, `GET /api/matters/{id}/search`                                                  | Missing direct matter detail/update endpoints in OpenAPI (`GET/PATCH /api/matters/{id}`) for the “Overview” tab to be fully data-driven.       |
| Case AI actions               | `POST /api/matters/{id}/ai/generate-tasks`, `POST /api/matters/{id}/ai/suggest-calendar`                                                                                                    | Aligns with “AI prepares, human approves”; approvals may still be required depending on policy.                                                |
| Clients                       | `GET /api/clients`, `POST /api/clients`, `GET /api/clients/{id}`                                                                                                                            | Client update flows likely need `PATCH /api/clients/{id}` if not already implemented.                                                          |
| Documents (matter-scoped)     | `GET /api/documents`, `POST /api/documents`, `POST /api/documents/{id}/extract`, `POST /api/documents/{id}/summarize`, `GET /api/documents/{id}/entities`, `GET /api/documents/{id}/chunks` | File upload exists as `POST /api/storage/upload` (not currently in OpenAPI); downloads/viewing require a clear pattern (e.g., presigned URLs). |
| Tasks                         | `GET /api/tasks`, `POST /api/tasks`, `POST /api/tasks/{id}/complete`, `GET /api/tasks/{id}`                                                                                                 | Good coverage for list + completion; task assignment/reassignment UX depends on schema fields.                                                 |
| Calendar                      | `GET /api/calendar`, `GET /api/calendar/{id}`, `GET /api/calendar/upcoming`                                                                                                                 | “Join call”/meeting links depend on event fields + integrations.                                                                               |
| Time entries                  | `GET /api/time-entries`, `POST /api/time-entries`, `GET /api/time-entries/{id}`, `POST /api/time-entries/{id}/submit`, `POST /api/time-entries/bulk/submit`                                 | Aligns with “AI suggests time” + bulk approve/submit pattern.                                                                                  |
| Invoicing                     | `GET /api/invoices`, `POST /api/invoices/generate`, `GET /api/invoices/{id}`, `POST /api/invoices/{id}/send`, `POST /api/invoices/{id}/void`                                                | Invoice “preview PDF” and “payment link” UX depends on invoice schema + payments integration details.                                          |
| Payments                      | `GET /api/payments`, `GET /api/payments/{id}`                                                                                                                                               | Collections flows (dunning schedules, DD mandates) are later-epic UI and may require new endpoints.                                            |
| Leads & quotes                | `GET /api/leads`, `POST /api/leads`, `GET /api/leads/{id}`, `POST /api/leads/{id}/convert`, `GET /api/quotes`, `POST /api/quotes`, `GET /api/quotes/{id}`                                   | “Generate quote” UX maps well; “website/UTM source” features will need additional endpoints/fields.                                            |
| Conflicts                     | `GET /api/conflicts/search`, `GET /api/conflicts/{matterId}`, `POST /api/conflicts/{id}/clear`, `POST /api/conflicts/{id}/waive`                                                            | Good for conflict-check story; relationship graph UI is future.                                                                                |
| Search (global)               | `GET /api/search/semantic`                                                                                                                                                                  | Consider also supporting keyword search for exact matches (names, refs) if needed.                                                             |
| Notifications                 | `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences`                                               | Good alignment.                                                                                                                                |
| Settings (firm, roles, users) | `GET/PATCH /api/firm/settings`, `GET/POST /api/roles`, `GET /api/roles/{id}`, `POST /api/users/{id}/role`                                                                                   | “Team” management UI needs full user CRUD + availability/leave management for Epic 25.                                                         |
| Settings (integrations)       | `GET /api/integrations/email/accounts`, `GET /api/integrations/calendar/accounts`, `GET /api/integrations/payments/accounts`, `GET /api/integrations/accounting/connections`                | This doc shows “Integrations” but doesn’t yet define the setup/consent UX (required to unlock inbox/calendar/payments).                        |
| Templates                     | `GET /api/templates`, `POST /api/templates`, `GET /api/templates/{id}`, `POST /api/templates/{id}/preview`, `POST /api/templates/{id}/generate`, `POST /api/templates/propose`              | Templates UI is implied but not designed as a first-class surface (library, variables, permissions, versioning).                               |
| E-signatures                  | `GET /api/signature-requests`, `GET /api/signature-requests/{id}`                                                                                                                           | Missing UI for packet creation, signers, reminders, and per-matter signature queue.                                                            |
| Client portal                 | (Not explicitly present in OpenAPI)                                                                                                                                                         | Portal UI is defined, but it needs dedicated auth/session + scoped “client-safe” endpoints and policy enforcement.                             |

### Epic Coverage Matrix (UI vs. `docs/ideas.md`)

This is a **UI surface checklist** (not an implementation guarantee). “Missing UI” items are prioritised assuming Phase 1 → 2 delivery.

| Epic                            | Covered by screens in this doc                              | Missing UI surfaces (priority)                                                                                     |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 0 — Client Intake & CRM         | Leads pipeline, lead detail, conflict check callout         | AML/KYC verification, onboarding form collection/chasing, engagement letter workflow, intake approval summary (P1) |
| 1 — Case Command Centre         | Dashboard, cases list, case overview patterns               | Matter “home” overview with configurable widgets + per-user saved views (P0/P1)                                    |
| 2 — Curated Case Timeline       | Timeline tab + “AI events”                                  | Timeline filtering/export, event detail drill-down with audit trail (P0/P1)                                        |
| 3 — Party Intelligence          | “Manage parties” callout                                    | Dedicated Parties tab (CRUD), relationship graph, opponent solicitor detection UI (P1/P2)                          |
| 4 — Document Intelligence       | Documents tab + AI summary/extract concepts                 | Top-level Documents library, document viewer UX, version comparison UI, missing-docs checklist (P0/P1)             |
| 5 — Communications Copilot      | AI Inbox + draft/approve patterns                           | Threaded conversations, bulk triage, mailbox connection onboarding, safe-send policy UI (P0)                       |
| 6 — Proactive Case Brain        | Briefing + “Ask about this case”                            | Persistent “case chat” transcript, citations UI, escalation to tasks/approvals (P0/P1)                             |
| 7 — Billing                     | Time & Billing + invoices UI                                | Rate cards, fixed-fee stages, WIP/aged debt reports with drilldowns (P1)                                           |
| 8 — Client Portal               | Client portal dashboard + chat                              | Magic-link login journey, “upload docs to case” flow, portal notification preferences (P1)                         |
| 9 — Compliance & Risk           | Urgent items/alerts patterns                                | Compliance dashboard, rules editor, supervision views, retention controls, audit report export (P2)                |
| 10 — Firm Setup                 | Settings (firm + AI config)                                 | Onboarding wizard (brand, roles, integrations, templates), data import/migration flow (P0/P1)                      |
| 11 — Usage & AI Economics       | Reports “AI savings” hint                                   | AI usage dashboard (costs, model mix, ROI), per-case AI log explorer (P2/P3)                                       |
| 12 — Task Orchestration         | Tasks + generate tasks                                      | Orchestration rules/automation builder, task dependency graphs, SLA/escalation UI (P1/P2)                          |
| 13 — Calendar Intelligence      | Calendar + briefing entry points                            | Availability rules, smart scheduling assistant UI, limitation date calculators & warnings (P2)                     |
| 14 — Document Generation        | Template/generate concepts                                  | Precedents library UX, questionnaire-driven generation, generated doc review + redlining (P2)                      |
| 15 — Integration Hub            | Settings tab label only                                     | Integration marketplace/install UX, per-integration scopes & audit, webhook health (P2/P3)                         |
| 16 — Payments & Collections     | Invoice pay CTA implied                                     | Payment method setup, dunning schedules, direct debit mandates, reconciliation UI (P1/P2)                          |
| 17 — E-Signatures               | “Send for signature” button + signature requests API exists | Signature packet builder, signer routing, reminders, “pending signatures” dashboard (P1)                           |
| 18 — Online Booking             | Calendar shows bookings                                     | Booking page/widget builder, appointment types, buffers, intake questions, client self-serve reschedule (P1/P2)    |
| 19 — Website & Landing Pages    | Not covered                                                 | Website/landing builder UI, SEO suggestions, domain management, embed widgets (P3/P4)                              |
| 20 — Lead Source Tracking       | Reports + leads pipeline                                    | Source taxonomy management, UTM capture UI, referrer profiles + ROI drilldowns (P1/P2)                             |
| 21 — Conveyancing Module        | Conveyancing examples in cases/docs                         | Search ordering flows, chain tracking, SDLT workflows, Land Registry submission UI (P3/P4)                         |
| 22 — Reporting & Analytics      | Reports dashboard sketch                                    | Report builder, scheduled delivery, export, cohort comparisons, permissions (P2/P3)                                |
| 23 — Litigation & Court Bundles | “Bundle” CTA only                                           | Bundle builder (order/pagination/index), exhibits, chronologies, court form workflows (P3/P4)                      |
| 24 — Wills & Probate Module     | Probate examples                                            | Probate workflow boards, asset/liability tracking, IHT calculations, estate accounts UX (P3/P4)                    |
| 25 — Team & Resource Mgmt       | “Team” nav item only                                        | User directory, leave requests/approvals, capacity dashboard, workload rebalancing UI (P2/P3)                      |

---

## Navigation & Layout

### Main Application Shell

```
+------------------------------------------------------------------+
|  [Logo] Legal Copilot    [Search: Cmd+K]    [Bell] [?] [Avatar]  |
+----------+-------------------------------------------------------+
|          |                                                       |
| MAIN     |                                                       |
|          |                                                       |
| Dashboard|                    CONTENT AREA                       |
| AI Inbox |                                                       |
| Cases    |              (Varies by selected view)                |
| Clients  |                                                       |
| Documents|                                                       |
| Tasks    |                                                       |
| Calendar |                                                       |
|          |                                                       |
+----------+                                                       |
| WORK     |                                                       |
|          |                                                       |
| Billing  |                                                       |
| Reports  |                                                       |
|          |                                                       |
+----------+                                                       |
| MANAGE   |                                                       |
|          |                                                       |
| Leads    |                                                       |
| Team     |                                                       |
| Settings |                                                       |
|          |                                                       |
+----------+-------------------------------------------------------+
```

### Sidebar Navigation

```
+------------------------+
| [Logo] Legal Copilot   |
+------------------------+
|                        |
| [Home] Dashboard       |
| [Inbox] AI Inbox  (12) |  <- Badge shows pending items
| [Folder] Cases    (3)  |  <- Badge shows cases needing attention
| [Users] Clients        |
| [File] Documents       |
| [Check] Tasks     (8)  |
| [Calendar] Calendar    |
|                        |
| ────────────────────── |
|                        |
| [Clock] Time & Billing |
| [Chart] Reports        |
|                        |
| ────────────────────── |
|                        |
| [Funnel] Leads    (5)  |
| [Users] Team           |
| [Gear] Settings        |
|                        |
+------------------------+
| [?] Help               |
| [Avatar] Jane Smith    |
|   Partner              |
+------------------------+
```

---

## 1. Dashboard (Home)

The dashboard is the AI-powered command centre showing what needs attention.

### Main Dashboard View

```
+------------------------------------------------------------------+
|  Good morning, Jane                              Wed 18 Dec 2024  |
+------------------------------------------------------------------+
|                                                                   |
|  +-----------------------------+  +-----------------------------+ |
|  | AI BRIEFING         [Refresh|  | URGENT ITEMS                | |
|  +-----------------------------+  +-----------------------------+ |
|  |                             |  |                             | |
|  | You have 3 cases needing    |  | [!] Limitation expires      | |
|  | attention today:            |  |     Smith v Jones - 2 days  | |
|  |                             |  |     [View Case]             | |
|  | * CONV-2024-042 exchange    |  |                             | |
|  |   due tomorrow              |  | [!] Client frustrated       | |
|  | * PROB-2024-018 IHT form    |  |     Email from Mrs Davis    | |
|  |   overdue by 3 days         |  |     re: delays on probate   | |
|  | * LIT-2024-031 opponent     |  |     [View Email]            | |
|  |   response received         |  |                             | |
|  |                             |  | [!] Invoice overdue 30d     | |
|  | 12 emails processed, 4 need |  |     ABC Corp - £4,250       | |
|  | your review.                |  |     [Send Reminder]         | |
|  |                             |  |                             | |
|  | [View AI Inbox]             |  +-----------------------------+ |
|  +-----------------------------+                                  |
|                                                                   |
|  +---------------------------------------------------------------+|
|  | APPROVAL QUEUE                                         (7)    ||
|  +---------------------------------------------------------------+|
|  | Type        | Summary                      | Confidence | Act ||
|  |-------------|------------------------------|------------|-----||
|  | [Mail] Email| Reply to John Smith re:      | 94%        | [Ap]||
|  |             | completion date query        |            | [Ed]||
|  |-------------|------------------------------|------------|-----||
|  | [Clock]Time | 2.5 hrs - CONV-2024-042     | 87%        | [Ap]||
|  |             | Draft contract review        |            | [Ed]||
|  |-------------|------------------------------|------------|-----||
|  | [Arrow]Stage| Move LIT-2024-031 to        | 91%        | [Ap]||
|  |             | "Defence Filed"              |            | [Ed]||
|  +---------------------------------------------------------------+|
|  | [Approve All High Confidence (>90%)]        [View All (7)]    ||
|  +---------------------------------------------------------------+|
|                                                                   |
|  +---------------------------+  +-------------------------------+ |
|  | MY TASKS TODAY       (8)  |  | CALENDAR TODAY                | |
|  +---------------------------+  +-------------------------------+ |
|  |                           |  |                               | |
|  | [ ] Review contract -     |  | 09:00 Client call - Smith     | |
|  |     CONV-2024-042  [!]    |  |       [Join] [Briefing]       | |
|  |     Due: Today            |  |                               | |
|  | [ ] Chase land registry   |  | 11:30 Team meeting            | |
|  |     CONV-2024-038         |  |       [Join]                  | |
|  |     Due: Today            |  |                               | |
|  | [x] Send completion stmt  |  | 14:00 Court hearing           | |
|  |     CONV-2024-035         |  |       LIT-2024-025            | |
|  |     Completed             |  |       [Briefing] [Bundle]     | |
|  |                           |  |                               | |
|  | [View All Tasks]          |  | [View Full Calendar]          | |
|  +---------------------------+  +-------------------------------+ |
|                                                                   |
|  +---------------------------------------------------------------+|
|  | FIRM SNAPSHOT                                                 ||
|  +---------------------------------------------------------------+|
|  | Cases: 47 active | WIP: £124,500 | Collected MTD: £45,200    ||
|  | New leads: 8     | Conversion: 62% | Overdue invoices: 4      ||
|  +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### Dashboard Widgets

**AI Briefing Card**

```
+------------------------------------------+
| AI BRIEFING                    [Refresh] |
| Generated 8:15 AM                        |
+------------------------------------------+
|                                          |
| Summary of your day:                     |
|                                          |
| - 3 cases need attention                 |
| - 12 emails processed (4 need review)    |
| - 2 meetings scheduled                   |
| - 1 deadline tomorrow                    |
|                                          |
| Priority focus: CONV-2024-042            |
| Exchange is scheduled for tomorrow.      |
| All searches complete. Awaiting client   |
| signature on TR1.                        |
|                                          |
| [View Full Briefing]                     |
+------------------------------------------+
```

**Approval Queue Row**

```
+------------------------------------------------------------------+
| [Mail]  Reply to John Smith re: completion | 94%    [Approve]   |
|         CONV-2024-042                      |        [Edit]      |
|         "Dear Mr Smith, Thank you for..."  |        [Reject]    |
+------------------------------------------------------------------+
```

---

## 2. AI Inbox

The primary interface for email management. AI processes all emails and presents them for review.

### AI Inbox - List View

```
+------------------------------------------------------------------+
|  AI Inbox                                           [Compose]     |
+------------------------------------------------------------------+
| [All] [Needs Review (12)] [Approved] [Sent] | Search...  [Filter] |
+------------------------------------------------------------------+
|                                                                   |
| TODAY                                                             |
+------------------------------------------------------------------+
| [!] HIGH PRIORITY                                                 |
|                                                                   |
| +--------------------------------------------------------------+ |
| | [Checkbox] From: john.smith@email.com           10:42 AM     | |
| | To: jane@smithlegal.co.uk                       CONV-2024-042| |
| | Subject: RE: Completion date query                           | |
| |                                                              | |
| | Intent: [Request Info]  Urgency: [!!!!]  Sentiment: [Neutral]| |
| |                                                              | |
| | AI Summary: Client asking for confirmed completion date.     | |
| | Mortgage offer expires 15 Jan. Wants assurance.              | |
| |                                                              | |
| | AI Draft: "Dear Mr Smith, I can confirm completion is        | |
| |           scheduled for 20 December 2024..."                 | |
| |                                                              | |
| | [Approve & Send] [Edit Draft] [View Full] [Reassign Case]    | |
| +--------------------------------------------------------------+ |
|                                                                   |
| +--------------------------------------------------------------+ |
| | [Checkbox] From: opponent@lawfirm.co.uk         09:15 AM     | |
| | To: jane@smithlegal.co.uk                       LIT-2024-031 | |
| | Subject: Defence to Claim                                    | |
| |                                                              | |
| | Intent: [Provide Info]  Urgency: [!!]  Sentiment: [Formal]   | |
| |                                                              | |
| | AI Summary: Defence filed. Denies breach of contract.        | |
| | Raises limitation defence. 3 attachments.                    | |
| |                                                              | |
| | AI Suggested Actions:                                        | |
| | - Move case to "Defence Filed" stage                         | |
| | - Create task: Review defence and advise client              | |
| | - Schedule: Client call to discuss                           | |
| |                                                              | |
| | [Accept All Actions] [View Full] [View Attachments (3)]      | |
| +--------------------------------------------------------------+ |
|                                                                   |
| STANDARD                                                          |
+------------------------------------------------------------------+
| +--------------------------------------------------------------+ |
| | [Checkbox] From: searches@infotrack.co.uk       08:30 AM     | |
| | To: jane@smithlegal.co.uk                       CONV-2024-044| |
| | Subject: Search Results Ready                                | |
| |                                                              | |
| | Intent: [Provide Info]  Urgency: [!]  Sentiment: [Neutral]   | |
| |                                                              | |
| | AI Summary: Local authority search complete. No adverse      | |
| | entries. Auto-filed to case documents.                       | |
| |                                                              | |
| | [Mark Reviewed] [View Search Results]                        | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
| Showing 12 of 47 emails                          [Load More]      |
+------------------------------------------------------------------+
```

### AI Inbox - Email Detail with Draft

```
+------------------------------------------------------------------+
|  [<- Back to Inbox]                         CONV-2024-042        |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------+  +---------------------------+  |
|  | ORIGINAL EMAIL              |  | AI DRAFT RESPONSE         |  |
|  +------------------------------+  +---------------------------+  |
|  |                              |  |                           |  |
|  | From: john.smith@email.com   |  | To: john.smith@email.com  |  |
|  | Date: 18 Dec 2024, 10:42 AM  |  | Subject: RE: Completion   |  |
|  | Subject: RE: Completion date |  |          date query       |  |
|  |          query               |  |                           |  |
|  |                              |  | Dear Mr Smith,            |  |
|  | Dear Jane,                   |  |                           |  |
|  |                              |  | Thank you for your email. |  |
|  | I'm getting worried about    |  | I can confirm that        |  |
|  | the completion date. My      |  | completion is currently   |  |
|  | mortgage offer expires on    |  | scheduled for 20 December |  |
|  | 15 January and I need to     |  | 2024.                     |  |
|  | know we'll complete before   |  |                           |  |
|  | then.                        |  | The searches are all      |  |
|  |                              |  | complete and we are       |  |
|  | Can you please confirm the   |  | awaiting the signed TR1   |  |
|  | completion date?             |  | from you. Once received,  |  |
|  |                              |  | we will proceed to        |  |
|  | Thanks,                      |  | exchange contracts.       |  |
|  | John                         |  |                           |  |
|  |                              |  | This timeline is well     |  |
|  |                              |  | within your mortgage      |  |
|  |                              |  | offer validity.           |  |
|  |                              |  |                           |  |
|  |                              |  | Kind regards,             |  |
|  |                              |  | Jane Smith                |  |
|  |                              |  |                           |  |
|  +------------------------------+  +---------------------------+  |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | AI ANALYSIS                                                 |  |
|  +-------------------------------------------------------------+  |
|  | Intent: Request for information                             |  |
|  | Urgency: High (mortgage deadline mentioned)                 |  |
|  | Sentiment: Anxious but polite                               |  |
|  | Confidence: 94%                                             |  |
|  |                                                             |  |
|  | Sources used:                                               |  |
|  | - Case timeline (completion date)                           |  |
|  | - Search status from case documents                         |  |
|  | - Outstanding tasks (TR1 signature)                         |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  [Approve & Send]  [Edit Draft]  [Regenerate]  [Discard]         |
+------------------------------------------------------------------+
```

### Compose Email Modal

```
+------------------------------------------------------------------+
|  Compose Email                                              [X]   |
+------------------------------------------------------------------+
|                                                                   |
|  Case: [CONV-2024-042 - Smith Purchase    v]                     |
|                                                                   |
|  To:    [john.smith@email.com                              ]     |
|  Cc:    [                                                  ]     |
|  Subject: [                                                ]     |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | [B] [I] [U] | [Link] [Attach] | [Template v] | [AI Assist]  | |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |                                                             | |
|  | Type your message or click [AI Assist] to generate...       | |
|  |                                                             | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  [Cancel]                              [Save Draft]  [Send]      |
+------------------------------------------------------------------+
```

---

## 3. Cases

### Cases List View

```
+------------------------------------------------------------------+
|  Cases                                              [+ New Case]  |
+------------------------------------------------------------------+
| [All (47)] [Active (42)] [On Hold (3)] [Completed (2)]           |
| Practice Area: [All v]  Fee Earner: [All v]  Search: [        ]  |
+------------------------------------------------------------------+
|                                                                   |
| +--------------------------------------------------------------+ |
| | Ref          | Client        | Type      | Stage    | Risk   | |
| |--------------+---------------+-----------+----------+--------| |
| | CONV-2024-042| John Smith    | Purchase  | Exchange | [Low]  | |
| | [!]          |               | Freehold  | Pending  |        | |
| |              | AI: Exchange tomorrow, TR1 awaited             | |
| |--------------+---------------+-----------+----------+--------| |
| | LIT-2024-031 | ABC Corp      | Contract  | Defence  | [Med]  | |
| |              |               | Dispute   | Filed    |        | |
| |              | AI: Limitation defence raised - review needed  | |
| |--------------+---------------+-----------+----------+--------| |
| | PROB-2024-018| Estate of     | Probate   | IHT      | [High] | |
| | [!]          | Mrs Williams  |           | Pending  |        | |
| |              | AI: IHT form overdue 3 days                    | |
| |--------------+---------------+-----------+----------+--------| |
| | FAM-2024-022 | Sarah Jones   | Divorce   | Financial| [Low]  | |
| |              |               |           | Hearing  |        | |
| |              | AI: Hearing scheduled 15 Jan                   | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Showing 1-20 of 47 cases                    [< Prev] [Next >]    |
+------------------------------------------------------------------+
```

### Case Detail - Overview Tab

```
+------------------------------------------------------------------+
|  [< Cases]  CONV-2024-042                              [Actions v]|
+------------------------------------------------------------------+
| Smith Residential Purchase                        Status: Active  |
| 123 High Street, London SW1A 1AA                    Risk: [Low]   |
+------------------------------------------------------------------+
| [Overview] [Timeline] [Documents] [Emails] [Tasks] [Billing]     |
+------------------------------------------------------------------+
|                                                                   |
| +---------------------------+  +--------------------------------+ |
| | CASE DETAILS             |  | AI INSIGHTS                    | |
| +---------------------------+  +--------------------------------+ |
| |                           |  |                                | |
| | Client: John Smith        |  | [!] Exchange due tomorrow     | |
| | Practice: Conveyancing    |  |     All prerequisites met     | |
| | Type: Purchase (Freehold) |  |                                | |
| | Stage: Exchange Pending   |  | [i] TR1 awaiting signature    | |
| |                           |  |     Sent to client 3 days ago | |
| | Fee Earner: Jane Smith    |  |     [Send Reminder]           | |
| | Opened: 15 Oct 2024       |  |                                | |
| | Target: 20 Dec 2024       |  | [i] Similar case CONV-2024-038| |
| |                           |  |     completed in 8 weeks      | |
| | Purchase: £450,000        |  |     This case: 9 weeks        | |
| | Mortgage: £350,000        |  |                                | |
| | Lender: Nationwide        |  +--------------------------------+ |
| |                           |                                    |
| | Searches: All Complete    |  +--------------------------------+ |
| | Exchange: Pending         |  | KEY DATES                      | |
| | Completion: 20 Dec 2024   |  +--------------------------------+ |
| |                           |  |                                | |
| | [Edit Details]            |  | 19 Dec - Exchange              | |
| +---------------------------+  | 20 Dec - Completion            | |
|                                | 15 Jan - Mortgage expires      | |
| +---------------------------+  |                                | |
| | PARTIES                   |  | [View Calendar]                | |
| +---------------------------+  +--------------------------------+ |
| |                           |                                    |
| | Client:                   |  +--------------------------------+ |
| | John Smith                |  | QUICK ACTIONS                  | |
| | john.smith@email.com      |  +--------------------------------+ |
| | 07700 900123              |  |                                | |
| |                           |  | [Draft Email to Client]        | |
| | Seller:                   |  | [Generate Status Update]       | |
| | Mary Wilson               |  | [Order Search]                 | |
| | (via: Wilson & Co)        |  | [Create Task]                  | |
| |                           |  | [Record Time]                  | |
| | Lender:                   |  |                                | |
| | Nationwide BS             |  +--------------------------------+ |
| | Ref: NW123456             |  |                                | |
| |                           |                                    |
| | [Manage Parties]          |                                    |
| +---------------------------+                                    |
|                                                                   |
| +---------------------------------------------------------------+|
| | AI CASE SUMMARY                              [Refresh] [Chat] ||
| +---------------------------------------------------------------+|
| | This is a straightforward freehold purchase proceeding to     ||
| | plan. All searches complete with no adverse entries. Client   ||
| | mortgage approved. Awaiting signed TR1 from client to         ||
| | proceed to exchange. Completion scheduled for 20 December.    ||
| |                                                               ||
| | Risk Assessment: LOW                                          ||
| | - No chain complications                                      ||
| | - Standard residential transaction                            ||
| | - Client responsive                                           ||
| +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### Case Detail - Timeline Tab

```
+------------------------------------------------------------------+
|  [< Cases]  CONV-2024-042                              [Actions v]|
+------------------------------------------------------------------+
| Smith Residential Purchase                                        |
+------------------------------------------------------------------+
| [Overview] [Timeline] [Documents] [Emails] [Tasks] [Billing]     |
+------------------------------------------------------------------+
|                                                                   |
| Filter: [All v]  [Show AI Events]  Search: [                   ] |
|                                                                   |
| +---------------------------------------------------------------+|
| |                         TIMELINE                               ||
| +---------------------------------------------------------------+|
| |                                                                ||
| | TODAY - 18 December 2024                                       ||
| | ================================================================||
| |                                                                ||
| | 10:42 [Mail] Email received from client                        ||
| |       "RE: Completion date query"                              ||
| |       AI: Client anxious about mortgage deadline               ||
| |       [View Email] [View AI Draft]                             ||
| |                                                                ||
| | 09:00 [Bot] AI generated daily case briefing                   ||
| |       Exchange due tomorrow. TR1 still outstanding.            ||
| |                                                                ||
| | YESTERDAY - 17 December 2024                                   ||
| | ================================================================||
| |                                                                ||
| | 16:30 [Mail] Email sent to client                              ||
| |       "TR1 for signature"                                      ||
| |       Attached: TR1_draft.pdf                                  ||
| |       [View Email]                                             ||
| |                                                                ||
| | 14:00 [Doc] Document uploaded                                  ||
| |       "Final Local Authority Search Results"                   ||
| |       AI: No adverse entries. Added to search summary.         ||
| |       [View Document]                                          ||
| |                                                                ||
| | 15 December 2024                                               ||
| | ================================================================||
| |                                                                ||
| | 11:00 [Stage] Stage changed: "Searches" -> "Exchange Pending"  ||
| |       Changed by: AI (approved by Jane Smith)                  ||
| |       Reason: All searches complete                            ||
| |                                                                ||
| | 09:30 [Task] Task completed                                    ||
| |       "Review drainage search results"                         ||
| |       Completed by: Jane Smith                                 ||
| |                                                                ||
| +---------------------------------------------------------------+|
| |                     [Load Earlier Events]                      ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------+                                     |
| | ASK ABOUT THIS CASE      |                                     |
| +---------------------------+                                     |
| | [What happened last week?                               ] [->]||
| +---------------------------+                                     |
+------------------------------------------------------------------+
```

### Case Detail - Documents Tab

```
+------------------------------------------------------------------+
|  [< Cases]  CONV-2024-042                              [Actions v]|
+------------------------------------------------------------------+
| Smith Residential Purchase                                        |
+------------------------------------------------------------------+
| [Overview] [Timeline] [Documents] [Emails] [Tasks] [Billing]     |
+------------------------------------------------------------------+
|                                                                   |
| [+ Upload]  [Generate Document v]  |  Search: [               ]  |
|                                                                   |
| Type: [All v]  Show: [All] [Client Visible] [Internal Only]      |
|                                                                   |
| +---------------------------------------------------------------+|
| | CONTRACTS & TRANSFERS                                          ||
| +---------------------------------------------------------------+|
| | [PDF] TR1 Transfer Form (Draft)                    17 Dec     ||
| |       Awaiting client signature                               ||
| |       [View] [Download] [Send for Signature]                  ||
| |                                                               ||
| | [PDF] Contract Pack from Seller                    10 Dec     ||
| |       AI Summary: Standard contract. No unusual clauses.      ||
| |       [View] [Download] [AI Summary]                          ||
| +---------------------------------------------------------------+|
| | SEARCHES                                                       ||
| +---------------------------------------------------------------+|
| | [PDF] Local Authority Search                       17 Dec     ||
| |       AI: No adverse entries                    [Reviewed]    ||
| |       [View] [Download] [AI Analysis]                         ||
| |                                                               ||
| | [PDF] Drainage Search                              15 Dec     ||
| |       AI: Connected to mains                    [Reviewed]    ||
| |       [View] [Download] [AI Analysis]                         ||
| |                                                               ||
| | [PDF] Environmental Search                         15 Dec     ||
| |       AI: Low risk area                         [Reviewed]    ||
| |       [View] [Download] [AI Analysis]                         ||
| +---------------------------------------------------------------+|
| | CORRESPONDENCE                                                 ||
| +---------------------------------------------------------------+|
| | [PDF] Engagement Letter (Signed)                   15 Oct     ||
| |       [View] [Download]                        [Client Vis]   ||
| +---------------------------------------------------------------+|
| | IDENTIFICATION                                                 ||
| +---------------------------------------------------------------+|
| | [IMG] Passport - John Smith                        15 Oct     ||
| |       AML: Verified                             [Internal]    ||
| |       [View]                                                  ||
| +---------------------------------------------------------------+|
|                                                                   |
| Showing 8 documents                                               |
+------------------------------------------------------------------+
```

### New Case Modal

```
+------------------------------------------------------------------+
|  Create New Case                                            [X]   |
+------------------------------------------------------------------+
|                                                                   |
|  CASE TYPE                                                        |
|  +-------------------------------------------------------------+ |
|  | [Conveyancing] [Litigation] [Family] [Probate] [Employment] | |
|  | [Immigration] [Commercial] [Other]                          | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  CLIENT                                                           |
|  [Search or create client...                               ] [+] |
|                                                                   |
|  CASE REFERENCE                                                   |
|  [CONV-2024-045    ] (Auto-generated, can edit)                  |
|                                                                   |
|  MATTER TYPE                                                      |
|  [Purchase (Freehold)                                      v]    |
|                                                                   |
|  PROPERTY ADDRESS (if applicable)                                 |
|  [                                                          ]    |
|                                                                   |
|  ASSIGN TO                                                        |
|  [Jane Smith (You)                                         v]    |
|                                                                   |
|  BILLING MODEL                                                    |
|  ( ) Hourly   ( ) Fixed Fee   ( ) Staged   ( ) Legal Aid        |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | AI SUGGESTION                                               | |
|  | Based on "Purchase (Freehold)", suggested workflow:         | |
|  | Instruction -> Searches -> Contract Review -> Exchange ->   | |
|  | Completion -> Post-Completion                               | |
|  | [Use Suggested Workflow]                                    | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  [Cancel]                                          [Create Case] |
+------------------------------------------------------------------+
```

---

## 4. Clients

### Clients List View

```
+------------------------------------------------------------------+
|  Clients                                           [+ New Client] |
+------------------------------------------------------------------+
| [All (156)] [Individuals (98)] [Companies (58)]                  |
| Search: [                                    ]  [Filter v]       |
+------------------------------------------------------------------+
|                                                                   |
| +--------------------------------------------------------------+ |
| | Name              | Type      | Cases | AML     | Last Active| |
| |-------------------+-----------+-------+---------+------------| |
| | John Smith        | Individual| 2     |[Verified]| Today      | |
| | john.smith@email.com                                          | |
| |-------------------+-----------+-------+---------+------------| |
| | ABC Corporation   | Company   | 3     |[Verified]| 3 days ago | |
| | Ltd               |           |       |         |            | |
| | contact@abc.co.uk | Co: 12345678                              | |
| |-------------------+-----------+-------+---------+------------| |
| | Sarah Jones       | Individual| 1     |[Pending] | 1 week ago | |
| | sarah.j@gmail.com |           |       |[!]      |            | |
| |-------------------+-----------+-------+---------+------------| |
| | Estate of Mary    | Individual| 1     |[N/A]    | 2 days ago | |
| | Williams          | (Deceased)|       |         |            | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Showing 1-20 of 156 clients                 [< Prev] [Next >]    |
+------------------------------------------------------------------+
```

### Client Detail View

```
+------------------------------------------------------------------+
|  [< Clients]  John Smith                               [Actions v]|
+------------------------------------------------------------------+
|                                                                   |
| +---------------------------+  +--------------------------------+ |
| | CONTACT DETAILS          |  | AI PROFILE                     | |
| +---------------------------+  +--------------------------------+ |
| |                           |  |                                | |
| | Type: Individual          |  | Communication: Formal          | |
| |                           |  | Responsiveness: Fast           | |
| | Email:                    |  | Sentiment: Positive            | |
| | john.smith@email.com      |  |                                | |
| |                           |  | AI Notes:                      | |
| | Phone:                    |  | Client prefers email contact.  | |
| | 07700 900123              |  | Quick to respond. Appreciates  | |
| |                           |  | detailed updates. First-time   | |
| | Address:                  |  | buyer, may need extra          | |
| | 45 Oak Avenue             |  | reassurance on process.        | |
| | London                    |  |                                | |
| | SW1A 2BB                  |  +--------------------------------+ |
| |                           |                                    |
| | DOB: 15 Mar 1985          |  +--------------------------------+ |
| |                           |  | AML STATUS                     | |
| | [Edit Details]            |  +--------------------------------+ |
| +---------------------------+  |                                | |
|                                | Status: [Verified]              | |
| +---------------------------+  | Verified: 15 Oct 2024          | |
| | PORTAL ACCESS            |  | Provider: Thirdfort            | |
| +---------------------------+  | Reference: TF-123456           | |
| |                           |  |                                | |
| | Status: Enabled           |  | [View Certificate]             | |
| | Email: john.smith@...     |  | [Re-verify]                    | |
| |                           |  |                                | |
| | [Send Portal Link]        |  +--------------------------------+ |
| | [Disable Portal]          |                                    |
| +---------------------------+                                    |
|                                                                   |
| +---------------------------------------------------------------+|
| | CASES                                                    (2)  ||
| +---------------------------------------------------------------+|
| | CONV-2024-042 | Smith Purchase      | Active | Exchange Pend ||
| | CONV-2024-015 | Previous Sale       | Closed | Completed     ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------------------------------------------+|
| | RECENT ACTIVITY                                               ||
| +---------------------------------------------------------------+|
| | Today    | Email received: "RE: Completion date query"        ||
| | 17 Dec   | Document sent for signature: TR1                   ||
| | 15 Dec   | Email sent: Status update                          ||
| +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

---

## 5. Tasks

### Tasks List View

```
+------------------------------------------------------------------+
|  Tasks                                              [+ New Task]  |
+------------------------------------------------------------------+
| [My Tasks (8)] [All Tasks (24)] [Completed]                      |
| Filter: [All Cases v]  Due: [All v]  Priority: [All v]           |
+------------------------------------------------------------------+
|                                                                   |
| OVERDUE                                                           |
| +--------------------------------------------------------------+ |
| | [!] [ ] Submit IHT form                         Due: 15 Dec  | |
| |     PROB-2024-018 | Estate of Williams | Assigned: Jane      | |
| |     AI: Form prepared, awaiting approval                      | |
| |     [View] [Complete] [Reassign]                              | |
| +--------------------------------------------------------------+ |
|                                                                   |
| TODAY                                                             |
| +--------------------------------------------------------------+ |
| | [ ] Review contract                             Due: Today   | |
| |     CONV-2024-042 | Smith Purchase | Assigned: Jane          | |
| |     [View] [Complete] [Reassign]                              | |
| |                                                               | |
| | [ ] Chase land registry                         Due: Today   | |
| |     CONV-2024-038 | Brown Purchase | Assigned: Jane          | |
| |     AI Generated - Source: Follow-up rule                     | |
| |     [View] [Complete] [Dismiss]                               | |
| +--------------------------------------------------------------+ |
|                                                                   |
| THIS WEEK                                                         |
| +--------------------------------------------------------------+ |
| | [ ] Prepare witness statement                   Due: 20 Dec  | |
| |     LIT-2024-031 | ABC Corp | Assigned: Jane                 | |
| |     [View] [Complete] [Reassign]                              | |
| |                                                               | |
| | [ ] Draft settlement offer                      Due: 21 Dec  | |
| |     FAM-2024-022 | Jones Divorce | Assigned: Jane            | |
| |     [View] [Complete] [Reassign]                              | |
| +--------------------------------------------------------------+ |
|                                                                   |
| COMPLETED TODAY                                                   |
| +--------------------------------------------------------------+ |
| | [x] Send completion statement         Completed: 09:30 Today | |
| |     CONV-2024-035 | Taylor Purchase | Jane Smith             | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Task Detail Modal

```
+------------------------------------------------------------------+
|  Task Details                                               [X]   |
+------------------------------------------------------------------+
|                                                                   |
|  [ ] Review defence and advise client                            |
|                                                                   |
|  Case: LIT-2024-031 - ABC Corp v XYZ Ltd                         |
|  Assigned to: Jane Smith                                          |
|  Priority: [High v]                                              |
|  Due: 20 December 2024                                            |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | DESCRIPTION                                                 | |
|  +-------------------------------------------------------------+ |
|  | Review the defence filed by opponent. Note limitation       | |
|  | defence raised. Prepare advice note for client on           | |
|  | prospects and next steps.                                   | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | AI CONTEXT                                                  | |
|  +-------------------------------------------------------------+ |
|  | Generated from: Email received 18 Dec (Defence to Claim)    | |
|  | Key points from defence:                                    | |
|  | - Denies breach of contract                                 | |
|  | - Claims limitation period expired                          | |
|  | - Disputes quantum                                          | |
|  | Related documents: Defence.pdf, Contract.pdf                | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  CHECKLIST                                                        |
|  [ ] Read defence document                                        |
|  [ ] Check limitation calculation                                 |
|  [ ] Review original contract                                     |
|  [ ] Draft client advice note                                     |
|  [ ] Schedule client call                                         |
|                                                                   |
|  [Delete]                     [Save Changes]  [Mark Complete]    |
+------------------------------------------------------------------+
```

---

## 6. Calendar

### Calendar - Month View

```
+------------------------------------------------------------------+
|  Calendar                                        [+ New Event]    |
+------------------------------------------------------------------+
| [Day] [Week] [Month] [Agenda]         < December 2024 >          |
+------------------------------------------------------------------+
|  Mon    |  Tue    |  Wed    |  Thu    |  Fri    |  Sat  |  Sun   |
+---------+---------+---------+---------+---------+-------+--------+
|         |         |         |         |         |       |        |
|    1    |    2    |    3    |    4    |    5    |   6   |   7    |
|         |         |         |         |         |       |        |
+---------+---------+---------+---------+---------+-------+--------+
|         |         |         |         |         |       |        |
|    8    |    9    |   10    |   11    |   12    |  13   |  14    |
|         |         |         |         |         |       |        |
+---------+---------+---------+---------+---------+-------+--------+
|         |         |         |         |         |       |        |
|   15    |   16    |   17    |   18    |   19    |  20   |  21    |
|         |         |[Today]  |         |[EXCH]   |[COMP] |        |
|         |         |09:00    |         |Smith    |Smith  |        |
|         |         | Call    |         |         |       |        |
|         |         |14:00    |         |         |       |        |
|         |         | Hearing |         |         |       |        |
+---------+---------+---------+---------+---------+-------+--------+
|         |         |         |         |         |       |        |
|   22    |   23    |   24    |   25    |   26    |  27   |  28    |
|         |         |[!]LIMIT |         |         |       |        |
|         |         |Jones    |         |         |       |        |
+---------+---------+---------+---------+---------+-------+--------+
|         |         |         |         |                          |
|   29    |   30    |   31    |         |                          |
|         |         |         |         |                          |
+---------+---------+---------+---------+--------------------------+
|                                                                   |
| Legend: [Meeting] [Deadline] [!] Limitation [Completion]         |
+------------------------------------------------------------------+
```

### Calendar - Agenda View

```
+------------------------------------------------------------------+
|  Calendar                                        [+ New Event]    |
+------------------------------------------------------------------+
| [Day] [Week] [Month] [Agenda]         December 2024              |
+------------------------------------------------------------------+
|                                                                   |
| TODAY - Wednesday 18 December                                     |
| +--------------------------------------------------------------+ |
| | 09:00 - 09:30  Client Call - John Smith                      | |
| |                CONV-2024-042                                  | |
| |                [Join Call] [AI Briefing] [Case]               | |
| |                                                               | |
| | 11:30 - 12:00  Team Meeting                                   | |
| |                Weekly case review                             | |
| |                [Join Call]                                    | |
| |                                                               | |
| | 14:00 - 16:00  Court Hearing                                  | |
| |                LIT-2024-025 - County Court                    | |
| |                [AI Briefing] [Bundle] [Case]                  | |
| +--------------------------------------------------------------+ |
|                                                                   |
| TOMORROW - Thursday 19 December                                   |
| +--------------------------------------------------------------+ |
| | [DEADLINE] Exchange of Contracts                              | |
| |            CONV-2024-042 - Smith Purchase                     | |
| |            [Case]                                             | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Friday 20 December                                                |
| +--------------------------------------------------------------+ |
| | [COMPLETION] Completion Day                                   | |
| |              CONV-2024-042 - Smith Purchase                   | |
| |              [Case] [Completion Checklist]                    | |
| |                                                               | |
| | 10:00 - 10:30  New client meeting                             | |
| |                Lead: Website enquiry                          | |
| |                [Lead Details] [AI Briefing]                   | |
| +--------------------------------------------------------------+ |
|                                                                   |
| Monday 23 December                                                |
| +--------------------------------------------------------------+ |
| | [!] LIMITATION DATE                                           | |
| |     FAM-2024-022 - Jones - Financial Order deadline           | |
| |     [Case]                                                    | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## 7. Time & Billing

### Time Entries List

```
+------------------------------------------------------------------+
|  Time & Billing                                    [+ Record Time]|
+------------------------------------------------------------------+
| [Time Entries] [Invoices] [WIP Report]                           |
+------------------------------------------------------------------+
| Period: [This Week v]  User: [All v]  Case: [All v]              |
+------------------------------------------------------------------+
|                                                                   |
| AI SUGGESTED TIME ENTRIES                                  (5)    |
| +--------------------------------------------------------------+ |
| | [x] 18 Dec | 0.5 hrs | CONV-2024-042 | Email correspondence  | |
| |            |         |               | with client re: dates | |
| |            |         |               | Confidence: 92%       | |
| |--------------------------------------------------------------|  |
| | [ ] 18 Dec | 1.5 hrs | LIT-2024-031  | Review defence docs   | |
| |            |         |               | Confidence: 85%       | |
| |--------------------------------------------------------------|  |
| | [ ] 17 Dec | 2.0 hrs | CONV-2024-042 | Draft TR1, review     | |
| |            |         |               | title, prepare for sig| |
| |            |         |               | Confidence: 88%       | |
| +--------------------------------------------------------------+ |
| | [Approve Selected (2)]   [Edit Selected]   [Dismiss Selected] | |
| +--------------------------------------------------------------+ |
|                                                                   |
| RECORDED TIME ENTRIES                                             |
| +--------------------------------------------------------------+ |
| | Date    | Hours | Case          | Description       | Status | |
| |---------+-------+---------------+-------------------+--------| |
| | 17 Dec  | 3.0   | LIT-2024-031  | Court attendance  | Billed | |
| | 17 Dec  | 1.0   | PROB-2024-018 | IHT form prep     | WIP    | |
| | 16 Dec  | 2.5   | CONV-2024-042 | Contract review   | WIP    | |
| | 16 Dec  | 0.5   | FAM-2024-022  | Client call       | WIP    | |
| +--------------------------------------------------------------+ |
|                                                                   |
| SUMMARY THIS WEEK                                                 |
| +--------------------------------------------------------------+ |
| | Total Hours: 24.5 | Billable: 22.0 | Target: 30.0            | |
| | WIP Value: £5,500 | Billed: £750   | Collected: £0           | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Record Time Modal

```
+------------------------------------------------------------------+
|  Record Time                                                [X]   |
+------------------------------------------------------------------+
|                                                                   |
|  Case: [CONV-2024-042 - Smith Purchase                      v]   |
|                                                                   |
|  Date: [18/12/2024]                                              |
|                                                                   |
|  Duration:  [1] hrs [30] mins    OR    Start: [  :  ] End: [  :  ]|
|                                                                   |
|  Activity Type: [Correspondence                              v]  |
|                                                                   |
|  Description:                                                     |
|  +-------------------------------------------------------------+ |
|  | Reviewed client email regarding completion date. Drafted    | |
|  | response confirming exchange and completion dates.          | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  [x] Billable                                                     |
|                                                                   |
|  Rate: £250.00 /hr                         Amount: £375.00       |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | AI SUGGESTION                                               | |
|  | Based on your activity, this entry could be:                | |
|  | "Email correspondence with client regarding completion      | |
|  | date confirmation and mortgage timeline"                    | |
|  | [Use AI Description]                                        | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  [Cancel]                                          [Save Entry]  |
+------------------------------------------------------------------+
```

### Invoice Detail

```
+------------------------------------------------------------------+
|  Invoice INV-2024-0089                              [Actions v]   |
+------------------------------------------------------------------+
|  Client: ABC Corporation Ltd                      Status: Sent    |
|  Case: LIT-2024-031                               Due: 15 Jan     |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | SMITH & CO SOLICITORS                                       | |
|  | 123 Legal Street, London EC1A 1BB                           | |
|  | VAT: GB 123 456 789                                         | |
|  +-------------------------------------------------------------+ |
|  | INVOICE                                                     | |
|  | Number: INV-2024-0089                                       | |
|  | Date: 18 December 2024                                      | |
|  | Due: 15 January 2025                                        | |
|  +-------------------------------------------------------------+ |
|  | TO:                                                         | |
|  | ABC Corporation Ltd                                         | |
|  | 456 Business Park                                           | |
|  | Manchester M1 2AB                                           | |
|  +-------------------------------------------------------------+ |
|  | RE: Contract Dispute - ABC Corp v XYZ Ltd                   | |
|  |     Our Ref: LIT-2024-031                                   | |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  | Professional Fees                                           | |
|  | ─────────────────────────────────────────────────           | |
|  | 15 Dec - Court attendance (3.0 hrs @ £250)        £750.00   | |
|  | 16 Dec - Document review (2.5 hrs @ £250)         £625.00   | |
|  | 17 Dec - Defence analysis (4.0 hrs @ £250)      £1,000.00   | |
|  |                                                             | |
|  | Subtotal                                         £2,375.00   | |
|  |                                                             | |
|  | Disbursements                                               | |
|  | ─────────────────────────────────────────────────           | |
|  | Court fee                                          £455.00   | |
|  | Counsel's fee                                    £1,500.00   | |
|  |                                                             | |
|  | Net Total                                        £4,330.00   | |
|  | VAT @ 20%                                          £866.00   | |
|  |                                                             | |
|  | TOTAL DUE                                        £5,196.00   | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  [Download PDF]  [Send Reminder]  [Record Payment]  [Void]       |
+------------------------------------------------------------------+
```

---

## 8. Approval Queue

Central hub for all AI-generated actions needing human approval.

### Approval Queue View

```
+------------------------------------------------------------------+
|  Approval Queue                                                   |
+------------------------------------------------------------------+
| [All (15)] [Emails (7)] [Time (4)] [Stage Changes (2)] [Other (2)]|
| Sort by: [Urgency v]  Case: [All v]                              |
+------------------------------------------------------------------+
|                                                                   |
| +--------------------------------------------------------------+ |
| | BULK ACTIONS                                                 | |
| | [x] Select all high confidence (>90%)                        | |
| | [Approve Selected (8)]  [Reject Selected]                    | |
| +--------------------------------------------------------------+ |
|                                                                   |
| EMAIL RESPONSES                                                   |
| +--------------------------------------------------------------+ |
| | [x] Reply to John Smith                          94% | [Ap]  | |
| |     CONV-2024-042                                    | [Ed]  | |
| |     "Dear Mr Smith, I can confirm completion..."     | [Rej] | |
| |     [Preview Draft]                                           | |
| |--------------------------------------------------------------|  |
| | [x] Reply to Opponent Solicitor                  91% | [Ap]  | |
| |     LIT-2024-031                                     | [Ed]  | |
| |     "Thank you for the defence. We will..."          | [Rej] | |
| |     [Preview Draft]                                           | |
| |--------------------------------------------------------------|  |
| | [ ] Reply to Mrs Williams (beneficiary)          78% | [Ap]  | |
| |     PROB-2024-018                                    | [Ed]  | |
| |     "Thank you for your enquiry regarding..."        | [Rej] | |
| |     [Preview Draft]                                           | |
| +--------------------------------------------------------------+ |
|                                                                   |
| TIME ENTRIES                                                      |
| +--------------------------------------------------------------+ |
| | [x] 2.5 hrs - Draft contract review              87% | [Ap]  | |
| |     CONV-2024-042 | 17 Dec                           | [Ed]  | |
| |--------------------------------------------------------------|  |
| | [x] 1.5 hrs - Defence document review            85% | [Ap]  | |
| |     LIT-2024-031 | 18 Dec                            | [Ed]  | |
| +--------------------------------------------------------------+ |
|                                                                   |
| STAGE CHANGES                                                     |
| +--------------------------------------------------------------+ |
| | [x] Move to "Defence Filed"                      91% | [Ap]  | |
| |     LIT-2024-031                                     | [Rej] | |
| |     Reason: Defence received and filed to case                | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Approval Detail Modal

```
+------------------------------------------------------------------+
|  Approval Request                                           [X]   |
+------------------------------------------------------------------+
|                                                                   |
|  TYPE: Email Response                                             |
|  CASE: CONV-2024-042 - Smith Purchase                            |
|  CONFIDENCE: 94%                                                  |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | ORIGINAL EMAIL                                              | |
|  +-------------------------------------------------------------+ |
|  | From: john.smith@email.com                                  | |
|  | Subject: RE: Completion date query                          | |
|  |                                                             | |
|  | Dear Jane,                                                  | |
|  | I'm getting worried about the completion date...            | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | AI DRAFT RESPONSE                                    [Edit] | |
|  +-------------------------------------------------------------+ |
|  | Dear Mr Smith,                                              | |
|  |                                                             | |
|  | Thank you for your email. I can confirm that completion     | |
|  | is currently scheduled for 20 December 2024.                | |
|  |                                                             | |
|  | The searches are all complete and we are awaiting the       | |
|  | signed TR1 from you. Once received, we will proceed to      | |
|  | exchange contracts.                                         | |
|  |                                                             | |
|  | This timeline is well within your mortgage offer validity.  | |
|  |                                                             | |
|  | Kind regards,                                               | |
|  | Jane Smith                                                  | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  +-------------------------------------------------------------+ |
|  | AI REASONING                                                | |
|  +-------------------------------------------------------------+ |
|  | - Client asking for completion date confirmation            | |
|  | - Retrieved completion date from case data: 20 Dec 2024     | |
|  | - Noted mortgage deadline concern (15 Jan)                  | |
|  | - Checked search status: all complete                       | |
|  | - Identified outstanding item: TR1 signature                | |
|  | - Provided reassurance re: timeline vs mortgage             | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  Rejection reason (optional):                                     |
|  [                                                          ]    |
|                                                                   |
|  [Reject]                              [Edit & Approve] [Approve]|
+------------------------------------------------------------------+
```

---

## 9. Leads & CRM

### Leads Pipeline View

```
+------------------------------------------------------------------+
|  Leads                                              [+ New Lead]  |
+------------------------------------------------------------------+
| [Pipeline] [List] | Source: [All v]  Practice: [All v]           |
+------------------------------------------------------------------+
|                                                                   |
| NEW (3)      | CONTACTED (2) | QUOTED (2)   | NEGOTIATING (1)   |
| ─────────────|───────────────|──────────────|─────────────────── |
|              |               |              |                    |
| +----------+ | +----------+  | +----------+ | +----------+       |
| |Sarah Lee | | |Tom Brown |  | |XYZ Ltd   | | |Mike Chen |       |
| |Divorce   | | |Purchase  |  | |Contract  | | |Probate   |       |
| |Hot [!!!] | | |Warm [!!] |  | |£2,500    | | |£3,000    |       |
| |Web form  | | |Referral  |  | |Sent 3d   | | |Counter   |       |
| +----------+ | +----------+  | +----------+ | +----------+       |
|              |               |              |                    |
| +----------+ | +----------+  | +----------+ |                    |
| |ABC Corp  | | |Jane Doe  |  | |Estate of | |                    |
| |Dispute   | | |Will      |  | |Williams  | |                    |
| |Warm [!!] | | |Cold [!]  |  | |£1,200    | |                    |
| |Phone     | | |3 days    |  | |Sent 7d   | |                    |
| +----------+ | +----------+  | +----------+ |                    |
|              |               |              |                    |
| +----------+ |               |              |                    |
| |Cold Lead | |               |              |                    |
| |Unknown   | |               |              |                    |
| |Cold [!]  | |               |              |                    |
| +----------+ |               |              |                    |
|              |               |              |                    |
+------------------------------------------------------------------+
| Pipeline Value: £8,700  |  Conversion Rate: 62%  |  Avg Time: 5d |
+------------------------------------------------------------------+
```

### Lead Detail View

```
+------------------------------------------------------------------+
|  [< Leads]  Sarah Lee                               [Actions v]   |
+------------------------------------------------------------------+
|  New Lead - Divorce Enquiry                     Score: [Hot !!!] |
+------------------------------------------------------------------+
|                                                                   |
| +---------------------------+  +--------------------------------+ |
| | CONTACT DETAILS          |  | AI ANALYSIS                    | |
| +---------------------------+  +--------------------------------+ |
| |                           |  |                                | |
| | Name: Sarah Lee           |  | Score: 85/100 (Hot)            | |
| | Email: sarah.lee@gmail.com|  |                                | |
| | Phone: 07700 900456       |  | Factors:                       | |
| |                           |  | + Detailed enquiry             | |
| | Source: Website Form      |  | + Urgent timeline mentioned    | |
| | Received: Today, 09:15    |  | + Local postcode               | |
| |                           |  | + Practice area match          | |
| | Practice: Family Law      |  |                                | |
| |                           |  | Recommended: Call within 2hrs  | |
| +---------------------------+  +--------------------------------+ |
|                                                                   |
| +---------------------------------------------------------------+|
| | ENQUIRY DETAILS                                               ||
| +---------------------------------------------------------------+|
| | "I need help with a divorce. My husband and I have been       ||
| | separated for 6 months and I want to proceed with the         ||
| | divorce as quickly as possible. We have two children and      ||
| | a jointly owned house. I'm not sure how the finances will     ||
| | work. Can you help?"                                          ||
| |                                                               ||
| | AI Extracted:                                                 ||
| | - Divorce petition required                                   ||
| | - Children involved (arrangements needed)                     ||
| | - Property to divide                                          ||
| | - Financial settlement required                               ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------------------------------------------+|
| | CONFLICT CHECK                                    [Run Check] ||
| +---------------------------------------------------------------+|
| | Status: Not yet run                                           ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------------------------------------------+|
| | ACTIVITY                                                      ||
| +---------------------------------------------------------------+|
| | 09:15 | Lead created from web form                            ||
| | 09:16 | AI scored lead: 85 (Hot)                              ||
| | 09:16 | AI drafted initial response (pending approval)        ||
| +---------------------------------------------------------------+|
|                                                                   |
| [Generate Quote]  [Send Response]  [Convert to Case]  [Archive] |
+------------------------------------------------------------------+
```

---

## 10. Reports & Analytics

### Firm Dashboard

```
+------------------------------------------------------------------+
|  Reports & Analytics                                              |
+------------------------------------------------------------------+
| [Dashboard] [Cases] [Billing] [Productivity] [Referrals]         |
+------------------------------------------------------------------+
|  Period: [This Month v]  Compare: [Last Month v]                 |
+------------------------------------------------------------------+
|                                                                   |
| KEY METRICS                                                       |
| +-------------+  +-------------+  +-------------+  +-------------+|
| | REVENUE     |  | CASES       |  | CONVERSION  |  | AI SAVINGS  ||
| | £45,200     |  | 47 Active   |  | 62%         |  | 24 hrs      ||
| | +12% [^]    |  | +3 [^]      |  | +5% [^]     |  | this week   ||
| +-------------+  +-------------+  +-------------+  +-------------+|
|                                                                   |
| +--------------------------------+  +---------------------------+ |
| | REVENUE BY PRACTICE AREA      |  | CASE STATUS               | |
| +--------------------------------+  +---------------------------+ |
| |                                |  |                           | |
| |  Conveyancing    ████████ 45% |  |  Active      ██████ 42    | |
| |  Litigation      █████    28% |  |  On Hold     █      3     | |
| |  Family          ███      15% |  |  Completed   █      2     | |
| |  Probate         ██       12% |  |                           | |
| |                                |  |                           | |
| +--------------------------------+  +---------------------------+ |
|                                                                   |
| +--------------------------------+  +---------------------------+ |
| | BILLING METRICS               |  | FEE EARNER PRODUCTIVITY   | |
| +--------------------------------+  +---------------------------+ |
| |                                |  |                           | |
| | WIP:        £124,500          |  | Jane S    ████████ 85%    | |
| | Billed:     £52,300           |  | Tom B     ██████   72%    | |
| | Collected:  £45,200           |  | Sarah M   █████    65%    | |
| | Overdue:    £12,400 (4 inv)   |  |                           | |
| |                                |  | Target: 75%               | |
| +--------------------------------+  +---------------------------+ |
|                                                                   |
| +---------------------------------------------------------------+|
| | AI INSIGHTS                                                   ||
| +---------------------------------------------------------------+|
| |                                                               ||
| | [i] Conveyancing revenue up 15% - consider hiring            ||
| | [!] 4 invoices overdue >30 days - recommend chase            ||
| | [i] Tom B below target - 3 cases on hold affecting hours     ||
| | [i] Lead conversion improved after follow-up automation      ||
| |                                                               ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------------------------------------------+|
| | RECENT COLLECTIONS                                            ||
| +---------------------------------------------------------------+|
| | 17 Dec | ABC Corp      | INV-2024-0085 | £3,450 | Card       ||
| | 16 Dec | John Smith    | INV-2024-0082 | £1,200 | BACS       ||
| | 15 Dec | Estate Wilson | INV-2024-0079 | £2,800 | BACS       ||
| +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

---

## 11. Settings

### Firm Settings

```
+------------------------------------------------------------------+
|  Settings                                                         |
+------------------------------------------------------------------+
| [Firm] [Users] [Billing] [AI Config] [Integrations] [Templates]  |
+------------------------------------------------------------------+
|                                                                   |
| FIRM DETAILS                                                      |
| +-------------------------------------------------------------+  |
| | Firm Name:    [Smith & Co Solicitors                     ]  |  |
| | SRA Number:   [123456                                    ]  |  |
| | Email:        [info@smithlegal.co.uk                     ]  |  |
| | Phone:        [020 7123 4567                             ]  |  |
| |                                                             |  |
| | Address:                                                    |  |
| | [123 Legal Street                                        ]  |  |
| | [London                                                  ]  |  |
| | [EC1A 1BB                                                ]  |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| BRANDING                                                          |
| +-------------------------------------------------------------+  |
| | Logo: [Upload]  [Current: logo.png]                         |  |
| | Primary Color: [#1a365d]  [Color Picker]                    |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| PRACTICE AREAS                                                    |
| +-------------------------------------------------------------+  |
| | [x] Conveyancing                                            |  |
| | [x] Civil Litigation                                        |  |
| | [x] Family Law                                              |  |
| | [x] Wills & Probate                                         |  |
| | [ ] Employment Law                                          |  |
| | [ ] Immigration                                             |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| VAT SETTINGS                                                      |
| +-------------------------------------------------------------+  |
| | [x] VAT Registered                                          |  |
| | VAT Number: [GB 123 456 789                              ]  |  |
| | Default Rate: [20%                                       ]  |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| [Save Changes]                                                    |
+------------------------------------------------------------------+
```

### AI Configuration

```
+------------------------------------------------------------------+
|  Settings > AI Configuration                                      |
+------------------------------------------------------------------+
|                                                                   |
| AI AUTONOMY LEVEL                                                 |
| +-------------------------------------------------------------+  |
| | ( ) Suggest Only - AI makes suggestions, no drafts          |  |
| | (x) Draft - AI drafts responses for approval                |  |
| | ( ) Auto with Approval - AI acts, high-risk needs approval  |  |
| | ( ) Full Auto - AI handles routine tasks autonomously       |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| APPROVAL REQUIREMENTS                                             |
| +-------------------------------------------------------------+  |
| | Always require approval for:                                |  |
| | [x] Sending emails to clients                               |  |
| | [x] Sending emails to third parties                         |  |
| | [x] Changing case stage                                     |  |
| | [x] Creating invoices                                       |  |
| | [ ] Recording time entries                                  |  |
| | [ ] Creating tasks                                          |  |
| |                                                             |  |
| | Auto-approve threshold: [90%]                               |  |
| | (Actions above this confidence can be auto-approved)        |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| TONE & STYLE                                                      |
| +-------------------------------------------------------------+  |
| | Communication style: [Formal and Professional           v]  |  |
| |                                                             |  |
| | Sample emails for AI training:                              |  |
| | [Upload Examples]  (5 emails uploaded)                      |  |
| |                                                             |  |
| | Custom instructions:                                        |  |
| | [Always include case reference in subject line.          ]  |  |
| | [Use "Kind regards" for sign-off.                        ]  |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| CLIENT PORTAL AI                                                  |
| +-------------------------------------------------------------+  |
| | [x] Enable AI chat in client portal                         |  |
| |                                                             |  |
| | AI can answer questions about:                              |  |
| | [x] Case status and stage                                   |  |
| | [x] Next steps in the process                               |  |
| | [x] Documents received/needed                               |  |
| | [ ] Fee estimates and billing                               |  |
| | [ ] Timeline predictions                                    |  |
| |                                                             |  |
| | [x] Escalate unanswered questions to fee earner             |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| [Save Changes]                                                    |
+------------------------------------------------------------------+
```

---

## 12. Client Portal

Separate interface for clients to view their cases and interact with the firm.

### Client Portal - Dashboard

```
+------------------------------------------------------------------+
|  [Logo] Smith & Co Solicitors                    [Logout] [Help] |
+------------------------------------------------------------------+
|                                                                   |
|  Welcome back, John                                               |
|                                                                   |
| +---------------------------------------------------------------+|
| | YOUR CASE: Purchase of 123 High Street                        ||
| | Reference: CONV-2024-042                                      ||
| +---------------------------------------------------------------+|
| |                                                               ||
| | Status: [Exchange Pending]                                    ||
| |                                                               ||
| | What's happening:                                             ||
| | We are preparing to exchange contracts. Once we receive       ||
| | your signed TR1 form, we can proceed to exchange.             ||
| | Completion is scheduled for 20 December 2024.                 ||
| |                                                               ||
| | What we need from you:                                        ||
| | [!] Signed TR1 form - Please sign and return                  ||
| |     [Download TR1] [Upload Signed Copy]                       ||
| |                                                               ||
| +---------------------------------------------------------------+|
|                                                                   |
| +--------------------------------+  +---------------------------+ |
| | KEY DATES                      |  | YOUR DOCUMENTS            | |
| +--------------------------------+  +---------------------------+ |
| |                                |  |                           | |
| | Exchange: 19 Dec 2024          |  | TR1 (for signature)       | |
| | Completion: 20 Dec 2024        |  | Contract Pack             | |
| |                                |  | Search Summary            | |
| | Mortgage expires: 15 Jan 2025  |  | Engagement Letter         | |
| |                                |  |                           | |
| +--------------------------------+  | [View All Documents]      | |
|                                     +---------------------------+ |
|                                                                   |
| +---------------------------------------------------------------+|
| | ASK A QUESTION                                                ||
| +---------------------------------------------------------------+|
| | [When will we complete?                                  ] [->]||
| |                                                               ||
| | Recent questions:                                             ||
| | Q: "What searches have been done?"                            ||
| | A: "All standard searches are complete including local        ||
| |    authority, drainage, and environmental. No issues found."  ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------------------------------------------+|
| | INVOICES & PAYMENTS                                           ||
| +---------------------------------------------------------------+|
| | INV-2024-0072 | £1,500 | Paid       | 1 Nov 2024             ||
| | INV-2024-0088 | £2,250 | Due 15 Dec | [Pay Now]              ||
| +---------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### Client Portal - AI Chat

```
+------------------------------------------------------------------+
|  Ask About Your Case                                        [X]   |
+------------------------------------------------------------------+
|                                                                   |
| +---------------------------------------------------------------+|
| |                                                               ||
| | [You] What happens on completion day?                         ||
| |                                                               ||
| | [AI] On completion day (20 December 2024), the following      ||
| |      will happen:                                             ||
| |                                                               ||
| |      1. We will receive the mortgage funds from Nationwide    ||
| |      2. We will transfer the purchase money to the seller's   ||
| |         solicitors                                            ||
| |      3. Once they confirm receipt, the keys will be released  ||
| |         to you                                                ||
| |      4. You can then collect the keys from the estate agent   ||
| |         and the property is yours!                            ||
| |                                                               ||
| |      You should budget to collect keys in the afternoon,      ||
| |      typically between 1-4pm.                                 ||
| |                                                               ||
| | [You] Do I need to do anything?                               ||
| |                                                               ||
| | [AI] Yes, please ensure:                                      ||
| |      - Your signed TR1 is returned to us (outstanding)        ||
| |      - Building insurance is in place from completion         ||
| |      - You've arranged to collect keys from the agent         ||
| |      - You've set up utilities for the new property           ||
| |                                                               ||
| +---------------------------------------------------------------+|
|                                                                   |
| +---------------------------------------------------------------+|
| | [Ask another question...                                  ] [->]||
| +---------------------------------------------------------------+|
|                                                                   |
| Can't find what you need? [Contact your solicitor]               |
+------------------------------------------------------------------+
```

---

## 13. Global Search (Cmd+K)

```
+------------------------------------------------------------------+
|  Search Legal Copilot                                       [X]   |
+------------------------------------------------------------------+
|  [Search cases, clients, documents...                          ] |
+------------------------------------------------------------------+
|                                                                   |
|  RECENT                                                           |
|  +-------------------------------------------------------------+ |
|  | [Folder] CONV-2024-042 - Smith Purchase                     | |
|  | [User]   John Smith - Client                                | |
|  | [File]   TR1 Transfer Form                                  | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  QUICK ACTIONS                                                    |
|  +-------------------------------------------------------------+ |
|  | [+] New Case                                      Cmd+N     | |
|  | [+] New Client                                    Cmd+Shift+N| |
|  | [Clock] Record Time                               Cmd+T     | |
|  | [Mail] Compose Email                              Cmd+E     | |
|  +-------------------------------------------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
```

### Search Results

```
+------------------------------------------------------------------+
|  Search Legal Copilot                                       [X]   |
+------------------------------------------------------------------+
|  [smith                                                        ] |
+------------------------------------------------------------------+
|                                                                   |
|  CASES (3)                                                        |
|  +-------------------------------------------------------------+ |
|  | [Folder] CONV-2024-042 - Smith Purchase                     | |
|  |          John Smith | Exchange Pending | Jane Smith         | |
|  | [Folder] CONV-2024-015 - Smith Sale (Previous)              | |
|  |          John Smith | Completed | Jane Smith                | |
|  | [Folder] LIT-2024-028 - Smith v Jones                       | |
|  |          ABC Corp | Active | Tom Brown                      | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  CLIENTS (2)                                                      |
|  +-------------------------------------------------------------+ |
|  | [User] John Smith                                           | |
|  |        john.smith@email.com | 2 cases                       | |
|  | [User] Sarah Smith                                          | |
|  |        s.smith@company.co.uk | 1 case                       | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  DOCUMENTS (4)                                                    |
|  +-------------------------------------------------------------+ |
|  | [File] TR1 - Smith Purchase                    CONV-2024-042| |
|  | [File] Contract - Smith Sale                   CONV-2024-015| |
|  | [File] Witness Statement - Smith               LIT-2024-028 | |
|  | [File] ID - John Smith Passport                CONV-2024-042| |
|  +-------------------------------------------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 14. Notifications Panel

```
+------------------------------------------------------------------+
|  Notifications                              [Mark All Read]  [X]  |
+------------------------------------------------------------------+
|                                                                   |
|  TODAY                                                            |
|  +-------------------------------------------------------------+ |
|  | [!] Deadline tomorrow                              10:30 AM | |
|  |     Exchange - CONV-2024-042                                | |
|  |     [View Case]                                             | |
|  |                                                             | |
|  | [Mail] New email from client                       10:15 AM | |
|  |        John Smith - "RE: Completion date query"             | |
|  |        AI draft ready for review                            | |
|  |        [View in AI Inbox]                                   | |
|  |                                                             | |
|  | [Check] Task completed                              09:30 AM | |
|  |         "Send completion statement" - CONV-2024-035         | |
|  |                                                             | |
|  | [Bot] AI Insight                                   09:00 AM | |
|  |       PROB-2024-018 - IHT form 3 days overdue               | |
|  |       [View Case]                                           | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  YESTERDAY                                                        |
|  +-------------------------------------------------------------+ |
|  | [Mail] Email sent (approved)                       16:30 PM | |
|  |        To: John Smith - "TR1 for signature"                 | |
|  |                                                             | |
|  | [Doc] Document uploaded                            14:00 PM | |
|  |       Local Authority Search - CONV-2024-042                | |
|  |       AI: No adverse entries                                | |
|  +-------------------------------------------------------------+ |
|                                                                   |
|  [View All Notifications]                                         |
+------------------------------------------------------------------+
```

---

## Responsive Design

### Mobile Navigation (< 768px)

```
+------------------------+
| [=] Legal Copilot [Bell]|
+------------------------+
|                        |
|    CONTENT AREA        |
|                        |
|    (Full width)        |
|                        |
+------------------------+
| [Home][Inbox][Cases][+]|
+------------------------+
```

### Mobile - AI Inbox Item

```
+------------------------+
| From: john.smith@...   |
| CONV-2024-042          |
| RE: Completion query   |
+------------------------+
| AI: Client asking for  |
| completion date conf...|
+------------------------+
| [!!!] High Priority    |
| Intent: Request Info   |
+------------------------+
| [Approve] [Edit] [View]|
+------------------------+
```

### Mobile - Dashboard

```
+------------------------+
| Good morning, Jane     |
| Wed 18 Dec 2024        |
+------------------------+
| URGENT (2)         [>] |
+------------------------+
| [!] Limitation 2d      |
|     Smith v Jones      |
+------------------------+
| [!] Client frustrated  |
|     Mrs Davis probate  |
+------------------------+
| APPROVALS (7)      [>] |
+------------------------+
| [Mail] Reply Smith 94% |
| [Clock] 2.5h Conv  87% |
| [Arrow] Stage Lit  91% |
+------------------------+
| [Approve High (3)]     |
+------------------------+
| TASKS TODAY (8)    [>] |
+------------------------+
| [ ] Review contract    |
| [ ] Chase registry     |
+------------------------+
```

---

## Component Library Reference

### Buttons

```
Primary:    [Create Case]     - Blue background, white text
Secondary:  [Cancel]          - Gray background, dark text
Danger:     [Delete]          - Red background, white text
Ghost:      [View All]        - No background, blue text
Icon:       [+]               - Icon only, circular
```

### Status Badges

```
[Active]     - Green
[Pending]    - Yellow
[On Hold]    - Orange
[Completed]  - Gray
[Overdue]    - Red
[Verified]   - Green with checkmark
```

### Priority Indicators

```
[!]    - Low (gray)
[!!]   - Medium (yellow)
[!!!]  - High (orange)
[!!!!] - Urgent (red)
```

### Confidence Indicators

```
90-100%  - Green, auto-approve eligible
70-89%   - Yellow, review recommended
<70%     - Red, manual review required
```

### Cards

```
+------------------------------------------+
| CARD TITLE                    [Actions v]|
+------------------------------------------+
|                                          |
| Card content goes here                   |
|                                          |
+------------------------------------------+
| [Primary Action]  [Secondary Action]     |
+------------------------------------------+
```

### Tables

```
+------------------------------------------------------------------+
| Column 1     | Column 2      | Column 3    | Actions             |
|--------------+---------------+-------------+---------------------|
| Row data     | Row data      | Row data    | [Edit] [Delete]     |
+------------------------------------------------------------------+
```

### Form Elements

```
Label:
[Input field                                                    ]

Label:
[Dropdown selection                                            v]

[ ] Checkbox option
(x) Radio option selected
( ) Radio option unselected

+------------------------------------------------------------------+
| Textarea for longer input                                        |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Accessibility Guidelines

1. **Keyboard Navigation**: All interactive elements accessible via Tab
2. **Focus Indicators**: Visible focus ring on all focusable elements
3. **Screen Readers**: Proper ARIA labels on all UI elements
4. **Color Contrast**: Minimum 4.5:1 ratio for text
5. **Motion**: Respect `prefers-reduced-motion`
6. **Error States**: Clear error messages with suggestions

---

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0.0   | 2024-12-18 | Initial frontend design document |
