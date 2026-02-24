# Document 0: Platform Overview

**Series**: Leglise Product Specification
**Date**: February 21, 2026
**Status**: Creative Exploration (No Technical Implementation)
**Purpose**: What Leglise builds for Washington State workers' compensation attorneys, phased from MVP through progressive expansion
**Companion Documents**: [00A -- Long-Term Vision](./00a-long-term-vision.md), [01 -- The Workspace Shell](./01-the-workspace-shell.md), [02 -- Agentic Features Map](./02-agentic-features-map.md), [10 -- The Extension System](./10-the-extension-system.md)

---

## Series Overview

| #     | Title                                                 | Scope                                                                                                                                                   | Status                     |
| ----- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **0** | **Platform Overview**                                 | Launch product: WA workers' comp, phased capabilities, MVP classification                                                                               | **This document**          |
| 0A    | [Long-Term Vision](./00a-long-term-vision.md)         | Full platform story: multi-practice-area expansion, extension model, firm intelligence                                                                  | Complete                   |
| 1     | [The Workspace Shell](./01-the-workspace-shell.md)    | Core layout, navigation, info architecture, where AI lives                                                                                              | Complete                   |
| 1A    | [The Mode System](./01a-the-mode-system.md)           | Ribbon mode switcher, 5 core modes (Dashboard, Documents, Calendar, Communications, AI), extension modes, cross-mode navigation, per-mode zone behavior | Complete                   |
| 2     | [Agentic Features Map](./02-agentic-features-map.md)  | Maps every AI feature to its workspace location                                                                                                         | Complete                   |
| 3     | [The Explorer & Document Table](./03-the-explorer.md) | Explorer sidebar, document table, progressive navigation, responsive layout                                                                             | Complete (Sources + Table) |
| 4     | The Context Panel                                     | Right sidebar: links, details, AI chat, tasks                                                                                                           | Planned                    |
| 5     | The Workspace Engine                                  | Multi-pane splits, saved layouts, tabs, peek drawer                                                                                                     | Planned                    |
| 6     | The Command Surface                                   | Command palette (Cmd+K), skill activation, quick switcher                                                                                               | Planned                    |
| 7     | The Graph and Canvas                                  | Knowledge graph, case canvas, spatial strategy                                                                                                          | Planned                    |
| 8     | The Hover Layer                                       | Hover previews, transclusion, block references                                                                                                          | Planned                    |
| 9     | The AI Gardener                                       | Emergence, progressive enrichment, standing orders, briefings                                                                                           | Planned                    |
| 10    | [The Extension System](./10-the-extension-system.md)  | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system                                                | Complete                   |
| 11    | [Firm-Wide Extensions](./11-firm-wide-extensions.md)  | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                                                               | Complete                   |
| 11A   | [Toolkit Deep Dive](./11a-toolkit-deep-dive.md)       | New toolkit ideas and deeper specifications for existing toolkits                                                                                       | Complete                   |

---

## 1. What Leglise Is

Leglise is **case management software built for Washington State workers' compensation attorneys** -- with an AI-powered document intelligence engine at its core.

WA workers' comp cases are document-intensive. A single case can accumulate hundreds of medical records, L&I orders, IME reports, vocational assessments, and employer documents over months or years. Attorneys and paralegals spend hours manually reviewing these documents, building medical chronologies, tracking deadlines, identifying contradictions between providers, and preparing for BIIA hearings. The work is critical, tedious, and error-prone.

Leglise automates the tedious parts. Upload documents and the system reads them -- classifying each one, extracting providers, diagnoses, procedures, dates, and measurements, and flagging contradictions between what different providers say. The attorney reviews and approves the AI's work rather than doing it from scratch. The case timeline builds itself. Treatment gaps surface automatically. IME reports are analyzed against treating physician records and peer-reviewed medical evidence. Deadlines are tracked and escalated.

This is not a filing cabinet with AI bolted on. It is an AI assistant with a case management interface.

### Who It Serves

- **WC Attorneys** -- case strategy, hearing preparation, IME rebuttal, demand letter drafting, settlement evaluation
- **Paralegals** -- document intake, entity review, medical chronology building, correspondence tracking, L&I form preparation
- **Office Managers** -- case health monitoring, deadline oversight, workload visibility
- **Injured Workers** -- case status visibility, questionnaire completion, document upload (via a separate client portal)

### What Makes It Different

Traditional case management platforms are organized around **storage**: documents go into folders, metadata gets attached, and the attorney searches when they need something. AI, when present, is a chatbot bolted onto a filing system.

Leglise is organized around **intelligence**: every document is read and understood the moment it arrives. The AI analyzes documents for contradictions, gaps, and connections -- then flags what matters for attorney review. The attorney does not manually build medical chronologies -- the system builds them from extracted entities and refines as new documents arrive. The attorney does not manually track deadlines -- the system tracks them and alerts with increasing urgency as dates approach.

The filing interface exists because attorneys need to find and organize documents. But the filing interface serves the intelligence layer, not the other way around.

### Expansion Roadmap

Leglise launches in Washington State workers' compensation, but the core platform -- document intelligence, entity extraction, the workspace shell, AI infrastructure, case management -- is practice-area-agnostic. The architecture uses clean separation between core capabilities and domain-specific knowledge (entity types, document taxonomies, calculators, jurisdiction rules, AI prompts, form libraries).

Workers' comp is the first domain module. The roadmap:

1. **WA Workers' Compensation** -- launch domain, the deepest and most document-intensive niche we can find
2. **Adjacent WC states** (OR, CA, OH, PA) -- expand the WC module to other high-volume workers' comp jurisdictions
3. **Personal Injury** -- the natural second practice area, sharing the medical record foundation but adding insurance, liability, and demand package capabilities
4. **Additional practice areas** -- family law, employment law, immigration, medical malpractice -- each as a domain module loaded into the same core platform

This expansion model is described in detail in [Document 0A: Long-Term Vision](./00a-long-term-vision.md) and [Document 10: The Extension System](./10-the-extension-system.md).

---

## 2. Product Phasing

Not everything ships at once. Capabilities are organized into three phases, each building on the last. The principle: **ship fundamental value first, then layer intelligence on top.**

### Phase 1: MVP Core

The minimum product that a WA workers' comp attorney would switch to. These are the table-stakes capabilities that must work well before anything else matters.

| Capability                           | What It Does                                                                                                                                                                         | Why It's MVP                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Case Management                      | Create, organize, and track WC cases with L&I claim numbers                                                                                                                          | Can't function without it                                                                                                                      |
| Document Management                  | Upload, organize, search, and retrieve case documents                                                                                                                                | Attorneys need to find documents daily                                                                                                         |
| Document Intelligence Pipeline       | OCR, classification, entity extraction with confidence scoring                                                                                                                       | The core differentiator -- this is what Leglise does that others don't                                                                         |
| IME Analysis                         | AI-powered analysis of IME quality, contradictions, gaps, and deviations                                                                                                             | High-value, high-frequency pain point for WC attorneys                                                                                         |
| Contradiction Detection              | AI flags discrepancies between providers for attorney review                                                                                                                         | Directly affects case outcomes                                                                                                                 |
| Treatment Gap Detection              | Automatic detection of gaps in treatment timelines                                                                                                                                   | L&I uses gaps to deny/close claims -- catching them is critical                                                                                |
| Case Timeline                        | Visual chronological view of case events by domain                                                                                                                                   | Replaces hours of manual chronology building                                                                                                   |
| Calendar & Deadline Management       | Deadline tracking, hearing dates, filing deadlines, L&I protest timelines                                                                                                            | Missing a deadline is malpractice risk                                                                                                         |
| Email Integration                    | Email capture, case-linked email threads, correspondence tracking                                                                                                                    | Attorneys live in email                                                                                                                        |
| Case Notes & Activity Log            | Phone call logs, meeting notes, case journal, activity tracking                                                                                                                      | WC attorneys spend hours on the phone -- this is where case knowledge lives                                                                    |
| Sources & Notes Hemispheres          | Immutable evidence (Sources) vs. living work product (Notes)                                                                                                                         | Clean separation of evidence and attorney thinking                                                                                             |
| Deduplication                        | Page-level duplicate detection across the case record                                                                                                                                | WC cases receive the same records from multiple sources constantly                                                                             |
| Classification Correction & Feedback | Correct document classifications and entity extractions; corrections saved firm-wide                                                                                                 | The AI improves from day one -- every correction makes the system smarter for the whole firm                                                   |
| AI Case Assistant (Case Chat)        | Deep agentic research across sources, notes, memory, and knowledge graphs; document drafting and feedback; trainable by the attorney through corrections, instructions, and feedback | The research and composition engine that transforms document intelligence into attorney work product -- and gets better with every interaction |
| WA Workers' Comp Module              | L&I integration, WA forms, PPD calculator, jurisdiction deadlines                                                                                                                    | The domain-specific depth that makes Leglise the best WC tool                                                                                  |

### Phase 2: Intelligence Layer

With the foundation in place, layer on AI-powered intelligence and proactive capabilities. Note: the AI Case Assistant ships in Phase 1. Phase 2 extends it with the Document Composer (a dedicated writing surface) and autonomous capabilities like Standing Orders.

| Capability                                  | What It Does                                                                                  | Why It's Phase 2                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document Composer                           | AI-native writing surface with @ mentions, live blocks, on-demand fact-checking               | A dedicated composition environment that builds on the AI Case Assistant's drafting capabilities with structured editing, live blocks, and collaborative features |
| Standing Orders                             | Persistent instructions the AI executes on schedule (e.g., "check for treatment gaps weekly") | Requires reliable document intelligence running in the background                                                                                                 |
| Hearing Preparation                         | Exhibit assembly, contradiction summaries, deposition question generation                     | Requires mature entity extraction and contradiction detection                                                                                                     |
| Custom Document Types & Extraction Training | Define firm-specific document subtypes and teach the AI what to extract from them             | Requires a training interface and enough classification correction data to build on                                                                               |
| Client Portal                               | Case status, questionnaires, digital signing, document upload for injured workers             | A separate application that integrates with the core                                                                                                              |

### Phase 3: Firm Intelligence

Capabilities that require significant case data and mature AI infrastructure.

| Capability                     | What It Does                                                                                                         | Why It's Phase 3                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Morning Briefing               | Daily synthesis of overnight activity, deadline alerts, case health changes                                          | Requires all Phase 1 and 2 systems running reliably                                                                                                               |
| Multi-Specialist Advisor       | Medical, Legal, and Vocational perspectives on complex decisions                                                     | Requires deep domain knowledge and proven AI quality                                                                                                              |
| Firm Knowledge Flywheel        | Institutional memory: provider assessments, case archetypes, learned strategies                                      | Requires case data volume across the firm to be meaningful                                                                                                        |
| Advanced Correction Learning   | AI behavior improves across extraction, contradiction detection, and analysis from accumulated firm-wide corrections | Builds on Phase 1 classification corrections and Phase 2 custom training with enough data to detect systemic patterns                                             |
| Cross-Case Pattern Recognition | Provider patterns, employer patterns, outcome correlations across cases                                              | Requires enough case volume and extraction accuracy to detect meaningful patterns (likely a Toolkit extension -- see [Document 11](./11-firm-wide-extensions.md)) |

---

## 3. Phase 1 Capabilities (MVP Core)

### Case Management

**Case creation and tracking**: Cases are organized around Washington State L&I claim numbers. Create a case, enter the claim number (validated against WA format), assign an attorney and paralegal, set the case type and injury category.

**Case dashboard**: Every case has a centralized dashboard showing its current state -- key documents, open action items, upcoming deadlines, recent activity, and any AI-flagged issues (contradictions, treatment gaps, approaching deadlines). The dashboard is the launchpad into deeper work on any case.

**Multi-case management**: Attorneys work across up to 10 concurrent cases with instant switching. Each case preserves its own view state -- which documents were open, which sidebar tabs were active, where the scroll position was. Switching cases restores the full cognitive context.

**Case state persistence**: Per-case view preferences, document viewer state, sidebar configurations, and workspace layouts are all preserved. The attorney picks up exactly where they left off.

### Document Management

The foundation that everything else builds on. Before AI intelligence matters, attorneys need to find, organize, and work with documents efficiently.

**Folder and tag organization**: Documents can be organized by domain (Medical, Legal, L&I, Vocational, Employer, Financial), by provider, by date range, or by custom tags. The system auto-classifies documents into domains, but attorneys can override and organize further.

**Full-text search**: Search across all documents in a case by content, not just by filename or metadata. Find every mention of "Dr. Johnson" or "impairment rating" across hundreds of documents instantly.

**Document viewer**: View PDFs with annotations, highlights, and bookmarks. Side-by-side comparison of two documents (e.g., treating physician report next to IME report). Page-level navigation with thumbnails.

**Bulk upload and batch processing**: Drag-and-drop upload of dozens or hundreds of documents at once. The processing pipeline handles OCR, classification, and entity extraction automatically in the background. The attorney sees progress and can review results as they arrive.

**Document metadata**: Every document tracks its source (who sent it, when it arrived), classification (domain and subtype), processing status (OCR complete, entities extracted, reviewed), and relationships to other documents and entities.

### Document Intelligence Pipeline

This is the core differentiator -- the 8-stage pipeline that transforms raw documents into structured, searchable, entity-linked intelligence.

**Upload and OCR**: Documents arrive as scanned PDFs, searchable PDFs, or mixed-format files. The platform runs OCR, generates searchable versions, and queues them for processing.

**Automatic classification**: Every document is classified by domain -- Medical, Legal, L&I, Vocational, Employer, Financial -- and by subtype (IME Report, Activity Prescription Form, L&I Order, etc.) without human intervention. Over 70 document subtypes are recognized for WA workers' comp. When classification confidence is low, the system flags the document for review rather than guessing.

**Entity extraction with confidence scoring**: The AI extracts providers, diagnoses, procedures, dates, measurements, locations, and other entities from every document. Each extraction carries a confidence score. High-confidence entities (above 0.80) are auto-approved; lower-confidence entities are routed for human review. The attorney always has the final say.

**Progressive enrichment**: Documents get smarter over time through six layers of intelligence:

| Layer | Name            | What Happens                                                    |
| ----- | --------------- | --------------------------------------------------------------- |
| 0     | Raw             | Document uploaded, OCR complete                                 |
| 1     | Extraction      | Entities extracted, confidence scored                           |
| 2     | Review          | Attorney verifies, corrects, approves                           |
| 3     | Cross-reference | Contradictions detected, entities linked across documents       |
| 4     | Strategy        | Document integrated into case strategy, cited in work product   |
| 5     | Citation        | Document cited in sent correspondence (demand letters, appeals) |

A document at Layer 5 is not just a file -- it is a fully integrated piece of the case's evidentiary foundation, with every entity verified, every contradiction surfaced, and every citation tracked.

**Deduplication**: Page-level duplicate detection using multiple methods (content hashing, perceptual hashing, text comparison, semantic similarity) catches exact duplicates and near-duplicates across the case record. WC cases routinely receive the same records from multiple sources -- medical records sent by the provider, by L&I, and by the client.

### Classification Correction & Feedback

The AI learns from every correction the firm makes. This is not a Phase 3 "someday" capability -- it is built into the review workflow from day one.

**Classification correction**: When the AI misclassifies a document -- labels an Activity Prescription Form as a generic Medical Report, or confuses an L&I Order with a Provider Letter -- the reviewer corrects it. That correction is saved at the firm level. The next time a similar document arrives, the AI is more likely to classify it correctly. Over time, the AI learns the firm's specific document patterns, including documents from providers, employers, and L&I offices the firm regularly encounters.

**Entity extraction correction**: When the AI extracts an entity incorrectly -- wrong provider name, wrong date, wrong measurement -- the reviewer corrects it during entity review. Corrections are scoped: "Apply to this case only" (the extraction was wrong because of case-specific context) or "Apply firm-wide" (the AI is making a systematic error that affects all cases). Firm-wide corrections accumulate into learned rules that improve extraction accuracy across every case.

**Feedback loop visibility**: The firm can see how corrections are improving the AI over time. Classification accuracy trending from 85% to 94% over three months. Entity extraction confidence scores rising as the system learns the firm's document patterns. This visibility builds trust -- the attorney can see the AI getting smarter from their corrections.

**Two-Level Architecture**: Every correction exists at one of two levels -- **Case Agnostic** (firm-wide, applies to all cases) or **Case Specific** (applies only to the current case). Case Specific always overrides Case Agnostic when they conflict. This ensures firm-wide learning does not override case-specific context.

### IME Analysis

Independent Medical Examinations are a critical battleground in workers' comp cases. IME examiners are hired by L&I or the employer's insurer, and their reports often serve as the basis for claim denial, benefit reduction, or case closure. Attorneys need to identify weaknesses in IME reports quickly and systematically. The AI performs deep analysis of every IME report against the full case record.

**Adversarial flagging**: IME reports are automatically flagged as adversarial. The system treats them differently from treating physician records -- they are evidence to be scrutinized, not trusted.

**Measurement contradiction detection**: When the IME examiner records different range-of-motion measurements, impairment ratings, or functional capacity findings than the treating physician, the system identifies the specific discrepancies with page references from both documents and the magnitude of the difference. If the treating physician records 95 degrees of shoulder flexion and the IME examiner records 140 degrees, that 45-degree discrepancy is flagged with citations to both sources.

**Incomplete evidence review detection**: IME examiners are required to review the relevant medical evidence before forming opinions. The AI checks whether the IME report references the key medical records in the case file. If the examiner's report does not mention Dr. Johnson's surgical notes or the most recent MRI findings, the system flags these as potential gaps in the examiner's evidence review. An opinion formed without reviewing all relevant evidence is vulnerable to challenge.

**Inconsistency with examination findings**: Sometimes the IME examiner's own examination findings contradict their conclusions. An examiner might document limited range of motion during the physical examination but then conclude the claimant has no impairment. The AI cross-references the examiner's documented findings against their stated opinions and flags internal inconsistencies.

**Deviation from peer-reviewed medical literature**: The AI evaluates whether the IME examiner's opinions align with established medical standards and peer-reviewed literature. If an examiner opines that a rotator cuff tear should resolve within 6 weeks when peer-reviewed studies indicate 12-16 weeks for the injury severity documented, the system flags the deviation. If an examiner dismisses a well-documented diagnosis that is supported by diagnostic imaging, the system notes the departure from accepted diagnostic criteria.

**Rebuttal material generation**: From the contradictions, gaps, and deviations identified, the AI generates structured rebuttal material the attorney can use: specific questions for the treating physician to address in a follow-up report, points for cross-examination at a deposition or hearing, and citations to the medical evidence that undermines the IME conclusions.

### Contradiction Detection

The AI analyzes documents and flags potential contradictions for attorney review. This is not a passive system where contradictions "surface themselves" -- it is active AI analysis that runs when documents are processed and can be triggered on demand.

**How it works**: When new documents enter the pipeline and reach Layer 1 (entities extracted), the AI compares extracted entities against previously extracted entities in the case. When it detects discrepancies -- different ROM measurements from different providers, conflicting work restriction recommendations, inconsistent diagnoses -- it creates a contradiction record with:

- The specific discrepancy (what conflicts with what)
- Page references to both source documents
- The magnitude or nature of the difference
- Which provider or document is on each side

**On-demand analysis**: Attorneys can request a contradiction scan at any time -- on a specific document, on a set of documents, or across the full case. This is useful when a new IME report arrives or when preparing for a hearing.

**Attorney review workflow**: Contradictions are flagged for attorney review, not auto-resolved. The attorney sees the contradiction, reviews the source documents, and decides whether it is a genuine conflict that matters strategically, a documentation difference that is not meaningful, or a data extraction error that needs correction. Every attorney decision feeds back into the system's learning.

### Treatment Gap Detection

L&I routinely uses treatment gaps as grounds to deny claims, reduce benefits, or close cases. A gap of 30+ days between medical appointments can be characterized as evidence that the claimant's condition has resolved. Catching these gaps early gives the attorney time to address them.

**Automatic monitoring**: The system monitors treatment timelines and flags gaps that exceed configurable thresholds (firm default: 30 days, overridable per case).

**Gap context**: Gap alerts include the specific dates, the providers involved, and the duration. The system also notes what was happening in the case timeline during the gap -- was there a pending L&I order? Was the claimant waiting for authorization? Context helps the attorney determine whether the gap is problematic or explainable.

### Case Timeline

**Visual timeline with swimlanes**: Chronological visualization of case events organized by domain -- Medical, Legal, Vocational, Financial, Employer, L&I. Each event is entity-linked and navigable. The timeline builds automatically from extracted entities and refines as new documents arrive and are reviewed.

**Gap detection and warnings**: Treatment gaps, communication gaps, and filing gaps are visually highlighted on the timeline with explanatory context.

**Entity-linked events**: Every event on the timeline links back to the source document and the extracted entities that generated it. Click any event to navigate to the underlying evidence.

**Medical chronology generation**: The timeline doubles as an AI-generated medical chronology -- the document that WC attorneys spend hours building manually. Upload records from multiple providers, and the system produces a chronological view of treatments, diagnoses, procedures, and provider encounters, organized by provider and by date.

### Calendar & Deadline Management

Missing a deadline in workers' comp can be catastrophic -- a missed protest deadline means the L&I order becomes final, a missed appeal deadline means the case is over. Calendar and deadline management is not a nice-to-have; it is a core safety system.

**Jurisdiction-aware deadlines**: Statutes of limitations, L&I protest filing deadlines (60 days from order date), BIIA appeal deadlines, discovery deadlines, and hearing dates follow Washington State rules. The system does not require manual configuration of jurisdictional deadlines -- it knows them.

**Escalating alerts**: Deadlines surface with increasing urgency as dates approach. 30-day warning, 14-day warning, 7-day warning, 3-day urgent alert. The escalation schedule is configurable per deadline type.

**Calendar integration**: Bidirectional sync with Outlook and Google Calendar. Hearing dates, deposition dates, filing deadlines, and client appointments flow between Leglise and the firm's calendar system. Changes in either system are reflected in both.

**Deadline chains**: When a hearing date is set, related preparation deadlines are auto-generated: discovery cutoff, deposition deadline, motion filing deadline, exhibit exchange deadline, hearing binder preparation deadline. Each deadline is tracked independently with its own escalation alerts.

### Email Integration

Attorneys and paralegals live in email. Client correspondence, L&I communications, opposing counsel letters, medical provider responses -- a significant portion of case-relevant communication happens in email. Ignoring email integration means ignoring the primary communication channel.

**Email capture**: Forward emails to a case-specific email address, or use a sidebar integration (Outlook/Gmail) to attach emails to a case with one click. Captured emails become part of the case record.

**Case-linked email threads**: Email threads are associated with their case and accessible from the case explorer alongside other documents. Emails are searchable by sender, recipient, subject, and content.

**Correspondence tracking**: Track outbound and inbound correspondence across email, portal messages, and physical mail. See a complete communication history for each case with dates, recipients, and content.

**Attachment handling**: Email attachments are automatically extracted and routed through the document intelligence pipeline. A medical record attached to an email from a provider gets the same OCR, classification, and entity extraction treatment as a directly uploaded document.

### Case Notes & Activity Log

WA workers' comp attorneys do not bill by the hour -- their fees come as a percentage of their client's benefit payments. But case activity still needs to be tracked for strategy, continuity, and case management purposes. The case notes and activity log is the running record of everything that happens in a case.

**Phone call logging**: Log calls with clients, adjusters, L&I representatives, medical providers, opposing counsel. Capture the date, duration, participants, and a summary. Call logs are part of the case timeline and searchable across all cases.

**Meeting notes**: Log in-person meetings, video calls, and client appointments with structured notes. Meeting notes can be tagged with topics, action items, and follow-up dates.

**Case journal**: A freeform journal for attorney observations, strategy notes, and case thinking. Journal entries are Notes (living work product) in the Sources/Notes framework -- they can be edited, tagged, and linked to documents and entities.

**Activity log**: An automatic log of all system activity on a case -- documents uploaded, entities extracted, deadlines set, status changes, notes created. The activity log is the complete audit trail of case work.

**Dictation support**: Voice-to-text for phone call summaries and case notes. The attorney talks through what happened on the call; the system transcribes and saves it as a case note.

### Sources and Notes -- Two Hemispheres

Every piece of content in a case is either a **Source** or a **Note**.

**Sources** are immutable evidence: medical records, L&I orders, depositions, sent correspondence, signed documents. Sources are the evidentiary foundation. Once a document is a Source, it cannot be edited -- it is the record of what was actually received or sent.

**Notes** are living work product: strategy briefs, demand letter drafts, case journal entries, meeting notes, hearing preparation outlines. Notes are the attorney's thinking. Notes can cite Sources, pulling supporting evidence inline.

**Graduation**: When a Note is finalized and sent to an external party -- a demand letter sent to L&I, a protest letter filed with the Board -- it graduates to a Source. Frozen in the case record as the version actually transmitted. The same content transitions from work product to evidence.

This separation creates clear rules: Sources are trustworthy (you can cite them), Notes are editable (you can revise your thinking). The system enforces this distinction.

### AI Case Assistant (Case Chat)

The AI Case Assistant is the research and composition engine at the heart of Leglise. This is not a chatbot answering questions about a case -- it is a deep agentic reasoning system that can cross-reference dozens of source documents, synthesize attorney notes, draw on the case's memory layer and knowledge graph, and produce original written work product. It ships in MVP because document intelligence without a way to reason across it and compose from it is only half the value.

#### Deep Agentic Research

The assistant's core capability is **multi-document reasoning** -- the ability to read, compare, and synthesize information from many sources simultaneously, then produce structured analysis grounded in specific evidence.

**Cross-file reasoning**: The attorney asks "What did Dr. Martinez say about ROM compared to the IME examiner, and how does that compare to what the client reported in their questionnaire?" The assistant does not search for keywords. It retrieves the relevant source documents (Dr. Martinez's treatment notes, the IME report, the client questionnaire), reads the relevant sections, identifies the specific measurements and statements in each, compares them, and produces a structured analysis with page-level citations to every source. This is not a lookup -- it is reasoning across three or more documents at once.

**Source and Note synthesis**: The assistant reasons across both hemispheres. It can pull from immutable Sources (medical records, L&I orders, depositions) and from living Notes (strategy briefs, case journal entries, meeting notes, phone call summaries). When the attorney asks "Given Dr. Chen's latest report and my notes from last week's call with the adjuster, what's our strongest argument against the wage calculation?", the assistant reads both the medical evidence and the attorney's working notes to produce an answer grounded in both evidentiary fact and strategic context.

**Memory layer reasoning**: Every case accumulates a memory layer -- a persistent record of what the attorney has discussed with the assistant, what conclusions were reached, what strategic decisions were made, and what the assistant has learned about this specific case over time. The assistant reasons with this memory. It does not start from zero every session. If the attorney spent 30 minutes last Tuesday analyzing the IME report's weaknesses, the assistant remembers that analysis, the conclusions reached, and the specific contradictions identified. When the attorney returns a week later to draft the rebuttal, the assistant builds on that prior work rather than re-analyzing from scratch.

**Knowledge graph reasoning**: The document intelligence pipeline builds a knowledge graph for each case -- entities (providers, diagnoses, procedures, dates, measurements), relationships (which provider made which diagnosis, which document contains which measurement), and cross-references (contradictions, confirmations, temporal sequences). The assistant reasons over this graph directly. It can answer questions like "Which providers have examined the claimant's left shoulder, what did each one find, and where do they disagree?" by traversing the entity graph rather than re-reading every document. This makes complex multi-provider, multi-document questions fast and comprehensive -- the assistant knows the shape of the case's evidence before it starts reading specific passages.

**Iterative research chains**: Complex questions often require multiple steps of reasoning. The assistant can plan and execute multi-step research chains autonomously. "Evaluate whether we have enough evidence to challenge the IME examiner's credibility" might require: (1) identify all IME reports in the case, (2) for each, check whether the examiner reviewed all relevant medical records, (3) compare the examiner's findings against treating physician findings, (4) check for internal inconsistencies in the examiner's own report, (5) synthesize findings into a credibility assessment. The assistant executes this chain, reports what it found at each step, and cites every source.

#### Document Composition and Feedback

The assistant is not just a research tool -- it is a writing partner that can draft, revise, and critique legal work product.

**Document drafting**: The attorney can instruct the assistant to draft sections or complete documents based on the case evidence. "Draft the medical history section of the demand letter using Dr. Martinez's treatment notes, the surgical records, and the most recent FCE" produces a structured narrative with citations to specific documents and page numbers. The assistant does not hallucinate facts -- every claim in the draft is grounded in an extracted entity or a specific passage from a source document. Unsupported claims are flagged as needing evidence.

**Paragraph-level feedback**: The attorney pastes or references a paragraph from a draft and asks the assistant to evaluate it. The assistant checks: Is this claim supported by the case evidence? Is the citation accurate? Is there stronger evidence available? Does this contradict anything else in the case record? Could opposing counsel challenge this assertion? The feedback is specific -- "The ROM measurement you cited is from the 3/15 visit, but the 4/22 visit shows worse ROM that would strengthen this argument" -- not generic writing advice.

**Sentence-level refinement**: For precise legal writing, the attorney can ask the assistant to tighten, strengthen, or reword specific sentences. "Make this sentence more assertive and cite the specific L&I regulation" or "This paragraph is too long -- split it and lead with the strongest evidence." The assistant understands legal writing conventions and can adapt tone, structure, and emphasis while maintaining factual accuracy.

**Evidence gap identification**: When reviewing a draft, the assistant identifies claims that lack supporting evidence in the case record. "Paragraph 3 asserts the claimant cannot return to heavy labor, but I can only find light-duty restrictions in the medical records. You may need an FCE or a treating physician statement specifically addressing heavy labor capacity." This catches evidentiary gaps before the document is finalized.

**Template-aware drafting**: The assistant knows the structure and conventions of common WA workers' comp documents -- demand letters, protest letters, doctor questionnaires, hearing briefs. When drafting, it follows the expected structure, includes required sections, and uses appropriate legal terminology. The attorney gets a structurally correct first draft, not a generic essay that needs to be reorganized.

#### Interface

**AI Assistant interface**: The AI Assistant's default home is the Context Panel (Zone 5, AI Chat tab). Zone 5 is collapsible: dismiss it for full-width document work, expand it when you need the AI. AI Chat is also a first-class content pane -- the user can open AI Chat instances alongside documents in Zone 4, split them, tab them, or pop them into separate windows. Multiple concurrent conversations are supported, each with its own context. The AI automatically adapts to what the attorney is doing: analytical when viewing medical records, strategic when working on demand letters, navigational when reviewing the timeline.

**Context-aware behavior**: The assistant adapts to what the attorney is doing. When viewing a medical record, it is analytical (surfacing contradictions, suggesting cross-references). When working on a demand letter, it is strategic (suggesting arguments, recommending evidence). When reviewing the timeline, it is navigational (helping find specific events, summarizing periods).

**Skills and commands**: A command palette (Cmd+K) provides access to structured AI skills -- `/rom-compare`, `/draft-section`, `/contradict`, `/cite`, `/ime-analyze`, `/summarize-provider`, `/draft-rebuttal` -- alongside natural language input. Skills are contextual: different skills surface when viewing a medical record vs. working in the Document Composer.

**Citation transparency**: Every factual claim the assistant makes includes a citation to the source document and page. The attorney can click any citation to navigate directly to the referenced passage. This is not optional formatting -- it is a structural requirement. An assertion without a citation is flagged as ungrounded.

#### Training and Adaptation

The assistant is not a fixed tool. It is a learning system that adapts to the attorney's working style, analytical preferences, writing voice, and case strategy over time. Every interaction is an opportunity for the assistant to get better -- explicit instructions, corrections to its output, feedback on what worked, and patterns in how the attorney uses its work all shape how it behaves in the future. The goal is an assistant that feels increasingly like _your_ assistant, not a generic one.

**Three layers of adaptation.** The assistant learns in three distinct ways, each serving a different purpose:

**Memory** stores facts. The assistant remembers case-specific information across sessions -- prior analyses, conclusions reached, strategic decisions, and contextual details the attorney has shared. "Remember that Dr. Chen is the attending physician." "We decided the IME examiner's credibility is our strongest angle." "The client missed appointments in July because of transportation issues, not because the condition improved." Memory is automatic -- the assistant extracts and retains important facts from conversation -- but the attorney can also tell it to remember something explicitly. Memory is case-scoped by default: what the assistant learns about the Martinez case does not bleed into the Johnson case. Cross-case memory (provider patterns, firm knowledge) operates at a separate level.

**Instructions** shape behavior. These are persistent rules the assistant follows every time it responds. "Always cite RCW statutes by full number." "When summarizing IME reports, lead with the weaknesses before the findings." "Keep summaries under three paragraphs unless I ask for detail." "Never use the phrase 'it is important to note.'" Instructions are explicit, editable, and fully transparent. The attorney can see every active instruction, change any of them, and delete the ones that are no longer useful. Instructions do not decay or drift silently -- they persist until the attorney changes them.

**Examples** teach style. When the attorney corrects the assistant's output -- rewrites a paragraph, adds citations the assistant missed, restructures an analysis, tightens the language -- the assistant saves both the original and the correction as a paired example. Over time, these examples form a library of "what good looks like" for this attorney. When the assistant drafts a demand letter section, it draws on this library to match the attorney's preferred voice, structure, and level of detail. The attorney never has to articulate their style preferences abstractly -- they just correct the output, and the assistant learns from the corrections.

**Three-tier preference hierarchy.** Not all instructions come from the same place, and not all instructions carry the same weight. The assistant operates under a three-tier hierarchy:

_Platform defaults_ are set by Leglise and cannot be overridden. Legal domain guardrails, HIPAA compliance boundaries, citation requirements, and the core WA workers' comp knowledge base. These ensure the assistant never produces output that violates legal ethics, discloses protected information, or strays outside its competence. No attorney or firm administrator can turn these off.

_Firm-level preferences_ are set by the firm administrator and apply to every attorney's assistant at the firm. The firm's writing style guide. Preferred citation conventions. Default analytical posture (e.g., "Always analyze IME reports skeptically"). Document template standards. Terminology preferences specific to the firm's practice. Firm preferences ensure consistency -- a demand letter drafted by a first-year associate's assistant reads like it came from the same firm as one drafted by the senior partner's assistant. When a new attorney joins the firm, their assistant inherits the firm's full set of accumulated preferences from day one. No cold start.

_User-level preferences_ are set by the individual attorney and override firm preferences for non-safety items. Personal style, summary length, areas of analytical focus, formatting preferences, per-case behavioral overrides. If the firm default is "formal tone" but a particular attorney prefers a more conversational style in internal notes, the attorney's preference wins.

Conflicts resolve predictably: platform guardrails always win. For safety and compliance items, platform overrides everything. For style and analytical preferences, user overrides firm, and firm overrides platform defaults. The attorney always knows which tier a rule comes from.

**How the attorney trains the assistant.** Training happens naturally during work, not in a separate "training mode."

_Conversational instruction._ The attorney says "From now on, always include the specific RCW citation when discussing benefits" in the middle of a conversation. The assistant confirms the instruction, saves it, and follows it in every future interaction -- not just this conversation, but all future conversations on all cases. The instruction is immediately visible in the attorney's preference settings, where it can be edited or deleted later.

_Correction capture._ When the assistant drafts a paragraph and the attorney rewrites it -- adding statutory references the assistant missed, restructuring the argument to lead with the strongest evidence, tightening three sentences into one -- the assistant captures the diff. Both the original output and the attorney's revision are saved as a paired training example. The assistant does not just note that the attorney changed something -- it analyzes _what_ changed and _why_, and applies that learning to future drafts. Over time, the corrections compound: the assistant's first drafts increasingly match what the attorney would have written.

_Feedback with reasons._ Beyond a simple thumbs up or thumbs down, the attorney can tag feedback with specific reasons: "too long," "wrong tone," "missing citations," "not skeptical enough of the IME," "buried the strongest evidence," "good analysis but poor structure." These tags accumulate. When the assistant sees a pattern -- three consecutive "too long" tags -- it infers a preference and proposes it: "I've noticed you prefer shorter responses. Should I default to concise summaries?" If the attorney confirms, it becomes an active instruction. If the attorney declines, the pattern is discarded. Inferred preferences are never silently activated.

_Explicit preference management._ A dedicated settings surface shows every active instruction, grouped by source (platform, firm, user) and category (writing style, citation format, analytical focus, terminology, output format). The attorney can see exactly what rules the assistant is following, where each rule came from, when it was created, and whether it was explicitly set or inferred from feedback. Any user-level or firm-level instruction can be edited, reordered, or deleted. The attorney is never in the dark about why the assistant behaves a certain way.

**Firm-level learning.** The firm's collective intelligence accumulates at the firm tier, not just the individual tier.

When an individual attorney discovers a useful instruction -- "Always cross-reference the IME examiner's recorded measurements against the treating physician's most recent visit" -- they can _promote_ it to firm level. The promotion goes to the firm administrator for approval. If approved, the instruction applies to every attorney's assistant at the firm. The firm's AI training becomes a shared asset, not siloed in individual accounts.

Firm-level correction patterns emerge automatically. If three different attorneys all correct the same type of error -- the assistant consistently misidentifies Activity Prescription Forms as generic medical reports, or it always misses the "restrictions" section in a particular provider's reports -- the system detects the pattern and suggests a firm-wide correction rule. The firm administrator reviews and approves. One correction, applied everywhere.

Provider intelligence accumulates at the firm level. Every time the assistant analyzes an IME report from Dr. Richardson, the firm learns more about Dr. Richardson's patterns -- which diagnoses they favor, how their ROM measurements compare to treating physicians, how frequently their opinions deviate from peer-reviewed literature. This intelligence is shared across cases. When a new case arrives with a Dr. Richardson IME, the assistant already knows this examiner's historical patterns and can surface relevant comparisons from prior cases.

**Transparency and control.** The assistant never silently changes its behavior. Every adaptation is traceable.

_"Why did you do that?"_ The attorney can ask why the assistant made a specific analytical choice, used a particular tone, or structured a response a certain way. The assistant cites the relevant instruction, preference, or example that influenced its behavior. "I led with the IME weaknesses because of your firm-level instruction: 'When summarizing IME reports, lead with the weaknesses before the findings.' This instruction was set by the firm administrator on January 15."

_Preference provenance._ Every behavioral rule in the settings surface shows its full history: when it was created, who created it, whether it was explicitly set or inferred from feedback, and how many times it has been applied. If a preference was inferred, the specific feedback events that triggered it are linked. Nothing is opaque.

_Learning summaries._ The assistant periodically surfaces what it has learned, rather than assuming the attorney is tracking every change. "Based on your recent feedback, I now prioritize statutory citations, use a more formal tone in demand letter drafts, and keep analytical summaries under 300 words. Does this match your expectations?" The attorney confirms, adjusts, or resets.

_Reset options._ At any time, the attorney can reset preferences by category ("Reset my writing style preferences to firm defaults"), reset entirely ("Start fresh with firm defaults only"), or reset a specific instruction. Resetting is non-destructive -- the old preferences are archived, not deleted, in case the attorney wants to restore them.

---

## 4. Phase 2 Capabilities (Intelligence Layer)

### Document Composer

The AI Case Assistant (Phase 1) can draft documents and provide feedback through the chat interface. The Document Composer is the dedicated writing surface that elevates that capability into a full composition environment -- a structured editor purpose-built for legal documents.

Key capabilities:

- **@ mentions** reference any entity, document, or note inline, pulling supporting evidence automatically
- **Live blocks** embed dynamic data (ROM comparison tables, timeline segments, benefit calculations) that update when underlying data changes
- **On-demand fact-checking** -- when the attorney requests verification, the AI checks claims against extracted entities and flags unsupported or contradicted assertions. This is triggered by the attorney, not running continuously in the background
- **Paragraph strength indicators** show how well each section is supported by evidence, available on demand
- **AI co-editing** -- the AI Case Assistant operates alongside the attorney in the Composer, offering inline suggestions, rewriting selected passages, and filling in sections on request. The Composer is the AI's native writing environment, not just a text editor with AI bolted on

**Template library**: Pre-built Washington State workers' compensation templates (demand letters, protest letters, doctor questionnaires, Application for Benefits, Activity Prescription Form) that auto-populate with case entities when opened.

**Note-to-Source graduation**: A demand letter draft is a Note (living work product, editable). When finalized and sent to opposing counsel, it graduates to a Source (frozen in the case record as the version actually transmitted).

### Standing Orders

Persistent instructions that tell the AI to check conditions on a schedule and perform defined work.

Examples:

- "Check for treatment gaps longer than 21 days in the Martinez case every week"
- "Run a contradiction scan on newly uploaded documents"
- "Flag when an L&I order arrives that requires a protest decision"

Standing orders operate transparently -- the attorney sees when they fire, what they found, and what they recommend. They never take external action without attorney approval.

### Hearing Preparation

**Hearing packet assembly**: Assemble key exhibits, contradiction summaries, and witness materials into an organized hearing preparation workspace. AI assists by suggesting relevant exhibits based on the issues in the case.

**Deposition question generation**: The AI generates targeted deposition questions from detected contradictions. If the IME examiner recorded higher ROM than the treating physician, the system drafts questions probing the examiner's methodology, whether they reviewed all relevant records, and whether their conclusions are consistent with their own examination findings.

### Custom Document Types & Extraction Training

Phase 1 handles corrections to the AI's existing classification and extraction. Phase 2 goes further: the firm can teach the AI to recognize entirely new document types and define what should be extracted from them. This is saved at the firm level and applies to every case going forward.

**Custom document subtype definition**: A firm regularly receives "Employer Return-to-Work Plans" that do not match any of the 70+ pre-built WC document subtypes. Instead of classifying them as generic "Employer Documents," the firm defines a new subtype: name it, describe it, and tag several examples. The AI learns to recognize documents matching this pattern and classifies them correctly going forward. Custom subtypes are first-class citizens -- they appear in filters, the explorer, and the timeline alongside built-in subtypes.

**Custom extraction schemas**: Once a custom document subtype exists, the firm defines what the AI should extract from it. For the Employer Return-to-Work Plan: extract the proposed return date, work restrictions, job title, supervisor name, and accommodation details. The firm specifies the fields, provides examples from tagged documents, and the AI learns to extract those fields from future documents of the same type.

**Training interface**: A guided workflow where the firm administrator or lead paralegal:

1. Selects 3-5 example documents of the new type
2. Names and describes the document subtype
3. Highlights the key fields the AI should extract from each example
4. Reviews the AI's extraction attempts on held-out examples
5. Approves the new subtype and extraction schema

The trained model is saved at the firm level (Case Agnostic). Every future document matching the pattern is classified and extracted automatically, across all cases.

**Iteration and refinement**: As more documents of the custom type are processed, the firm can review extraction accuracy and refine the schema. Corrections during routine review (Phase 1's classification correction workflow) continue to improve the custom type's accuracy over time.

### Client Portal

A **separate application** for injured workers. Its data flows into the case graph, but the injured worker never sees the firm's work product, strategy, or internal notes.

**Case status visibility**: Injured workers see the current status of their case in plain language -- not "Phase: Active Treatment" but "Your case is in the medical treatment phase. We are waiting for Dr. Smith to reach maximum medical improvement."

**Questionnaire completion**: Structured forms for gathering case-relevant information from the client.

**Digital signing**: Representation agreements and release of information forms signed electronically. Signed documents flow into the case graph as Sources.

**Document upload**: Clients upload medical records, correspondence, and other documents directly. Uploads flow into the document intelligence pipeline.

---

## 5. Phase 3 Capabilities (Firm Intelligence)

These capabilities require significant case data volume and mature AI infrastructure. They are the long-term vision, not the launch product.

**Morning Briefing**: Before the attorney starts their day, the AI synthesizes overnight activity, deadline alerts, case health changes, and recommended actions into a prioritized work queue. Requires all Phase 1 and 2 systems running reliably.

**Multi-Specialist Advisor**: For complex decisions (disputed diagnoses, hearing preparation, settlement evaluation), the AI Assistant surfaces Medical, Legal, and Vocational perspectives side by side, each with supporting evidence and counterarguments.

**Firm Knowledge Flywheel**: Every correction, case outcome, provider assessment, strategic decision, and AI Case Assistant training event enriches the firm's institutional knowledge. Provider profiles (which IME examiners always find MMI), case archetypes (rotator cuff / surgical / PPD), learned strategies, and accumulated attorney preferences and correction examples all compound over time. A paralegal who starts next week benefits from every case the firm has handled and every correction every attorney has made. The Phase 1 training and adaptation system (three-tier preferences, correction capture, firm-level promotion) provides the foundation -- Phase 3 is when the volume of accumulated learning becomes large enough to detect systemic patterns autonomously.

**Advanced Correction Learning**: Phase 1 builds classification correction, entity feedback, and the AI Case Assistant's three-layer training system (memory, instructions, examples). Phase 2 adds custom document types and extraction training. Phase 3 closes the loop: the system analyzes accumulated corrections and training data across the firm to detect systemic patterns and proactively improve. If the AI consistently misclassifies a certain provider's reports, or consistently misses a specific entity type in L&I orders, or if every attorney's corrections show the same stylistic preference, the system identifies the pattern and suggests a fix -- either a model adjustment, a new learned rule, or a firm-wide preference promotion. The firm administrator reviews and approves systemic changes. This is the flywheel at full speed: individual corrections and training in Phase 1 → custom document training in Phase 2 → autonomous pattern detection and self-improvement in Phase 3.

**Cross-Case Pattern Recognition**: Provider patterns, employer patterns, and outcome correlations detected across the firm's case portfolio. This is likely a Toolkit extension (see [Document 11: Firm-Wide Extensions](./11-firm-wide-extensions.md)) rather than a core capability, given the data volume requirements.

---

## 6. Washington State Workers' Compensation Module

The WA WC module is the first domain module loaded into the extension system. It brings deep knowledge of Washington's monopolistic state-fund workers' compensation system.

**L&I claim integration**: Cases are organized around WA Department of Labor & Industries claim numbers. Claim number validation, L&I order tracking, and activity log monitoring are native capabilities.

**WA-specific form pre-filling**: Application for Benefits, Activity Prescription Forms, Doctor Questionnaires, and other WA-specific forms auto-populate from case entities. The attorney reviews and submits -- the AI handles the data entry.

**PPD calculation**: Permanent Partial Disability ratings follow Washington's Category Rating System per RCW 51.32.080. The system tracks impairment measurements across documents and calculates expected PPD ratings based on extracted medical evidence.

**BIIA hearing support**: Board of Industrial Insurance Appeals hearing preparation, including exhibit packet assembly, witness summaries, and deposition question generation tailored to BIIA procedures.

**IME analysis**: Full adversarial analysis of IME reports -- contradiction detection, incomplete evidence review detection, internal inconsistency analysis, deviation from peer-reviewed literature, and rebuttal material generation. See Section 3 (IME Analysis) for the complete specification.

**Jurisdiction-aware deadlines**: Statutes of limitations, protest filing deadlines (60 days from L&I order), BIIA appeal deadlines, and hearing preparation timelines follow Washington State rules. No manual configuration required.

**WC-specific entity types**: ImpairmentRating, CausationOpinion, LNIOrder, TimelossPeriod, VocationalAssessment, PPDRating, ReturnToWorkStatus, ActivityPrescription, and 60+ other entity types specific to Washington workers' compensation.

**70+ document subtypes**: IME Report, FCE, Activity Prescription Form, L&I Order, Protest Letter, Vocational Assessment, Employer Statement, and 60+ other document subtypes classified automatically.

---

## 7. The Virtual Associate Model

### Three Rails

The Virtual Associate operates on three rails:

**Intelligence** -- the ability to understand. Entity extraction, contradiction detection, IME analysis, treatment gap detection, progressive enrichment, and deep multi-document research. The associate reads every document and connects extracted information to everything else in the case. In MVP, this intelligence is directly accessible through the AI Case Assistant -- the attorney converses with the intelligence layer rather than navigating it manually.

**Context** -- the ability to remember and adapt. Per-case strategy, per-user preferences, per-firm institutional knowledge, and a persistent memory layer that accumulates across every conversation and analysis session. A Three-Tier Architecture ensures every piece of knowledge has a clear scope: **Platform** guardrails (immutable), **Firm-level** preferences and learned patterns (shared across attorneys), and **User-level** preferences and corrections (individual). User overrides Firm for style; Platform overrides everything for safety. The AI Case Assistant reasons with this full context -- it does not start from zero, and it gets better with every correction, instruction, and feedback event.

**Agency** -- the ability to act. Document composition, evidence synthesis, rebuttal drafting, and paragraph-level feedback in MVP. Standing orders, workflow automation, and proactive gap detection in Phase 2. The associate does not just analyze -- it produces work product, with transparency and attorney approval.

### Skill Categories

Not every task requires the same level of AI sophistication:

| Category                   | Autonomy                         | Examples                                                                                 | UI Appearance                                                                      |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Cat 1 -- Deterministic** | Fully automatic, rule-based      | Deadline calculation, form validation, statute lookup, L&I claim number validation       | Results appear silently in dashboards and alerts                                   |
| **Cat 2 -- Augmented**     | AI-assisted, human-directed      | Entity extraction, contradiction detection, IME analysis, demand letter section drafting | Flagged for attorney review with supporting evidence; attorney approves or rejects |
| **Cat 3 -- Autonomous**    | Complex cross-document reasoning | Case health synthesis, hearing preparation assembly, morning briefing synthesis          | Surfaced with confidence levels and supporting evidence; attorney reviews          |

### Agent Hierarchy

- **Agents** contain domain-specific capabilities (Medical Record Reviewer, IME Analyzer, L&I Form Checker)
- **Skills** are specific actions an agent can perform (`/rom-compare`, `/provider-history`, `/treatment-timeline`, `/ime-analyze`)
- **Learned Rules** accumulate from corrections and explicit training, at both the firm-wide and case-specific levels

---

## 8. The Extension Architecture

The platform is built from scratch with clean separation between core capabilities and domain-specific knowledge. This is not premature optimization -- it is sound engineering when you are building a new codebase. The cost of clean interfaces is minimal at the start; the cost of untangling a monolith later is enormous.

### Why Build It Now

The extension architecture is not a plugin marketplace or a framework SDK. It is clean separation of concerns:

- **Core platform**: Document intelligence pipeline, entity extraction framework, workspace shell, AI infrastructure, case management, calendar, email, notes
- **Domain modules**: Entity type definitions, document classification taxonomies, extraction schemas/prompts, calculators, form libraries, jurisdiction rules, AI skill definitions

The WA WC module is the first consumer of these interfaces. If the interfaces cannot support the full depth of WA workers' comp -- 70+ document subtypes, 60+ entity types, L&I-specific workflows -- then they are not ready. Building the WC module tests and proves the extension interfaces from day one.

### What Is NOT Built Now

- Extension marketplace or store
- Hot-loading or dynamic plugin system
- Extension configuration UI
- Third-party extension SDK
- Multiple practice areas (only WC ships at launch)

These come later, when there is revenue, customers, and validated demand for multi-practice-area support.

### Three Extension Categories

**Practice Areas** -- Deep domain knowledge for a specific area of law (WC, PI, family law). See [Document 10](./10-the-extension-system.md).

**Integrations** -- Connections to external services (Westlaw, e-filing, medical records, calendar systems). See [Document 10](./10-the-extension-system.md).

**Toolkits** -- Firm-wide capabilities that work across practice areas (analytics, knowledge management, QA, billing). See [Document 11](./11-firm-wide-extensions.md).

---

## 9. Pricing

### Base Platform

**$50 per active claim per month.** Active claims are cases with an open status -- not archived, not closed. A firm managing 30 active WC claims pays $1,500/month. A firm managing 100 active claims pays $5,000/month.

| Active Claims | Monthly Cost | Annual Cost |
| ------------- | ------------ | ----------- |
| 10            | $500         | $6,000      |
| 30            | $1,500       | $18,000     |
| 50            | $2,500       | $30,000     |
| 100           | $5,000       | $60,000     |
| 200           | $10,000      | $120,000    |

### AI Usage Pricing

AI-powered features (entity extraction, contradiction detection, IME analysis, case chat, document composer) consume compute resources that scale with usage. AI usage is metered and billed separately from the base platform:

- **Document processing** (OCR + classification + entity extraction): per-document fee based on page count
- **AI analysis** (contradiction detection, IME analysis, on-demand scans): per-analysis fee
- **Case chat** (conversational AI): per-message or per-session fee
- **Document composition** (AI-assisted drafting, fact-checking): per-document fee

AI usage pricing ensures firms that process thousands of documents per month pay proportionally more than firms with lighter usage, while keeping the base platform accessible. Specific rates will be set based on infrastructure costs and competitive positioning.

### Volume Considerations

Volume pricing for larger firms is available on a per-agreement basis. Firms with 100+ active claims or high AI usage volume may negotiate custom pricing that balances predictability with usage-based economics.

---

## 10. User Roles

| Role                   | Primary Activities                                                                                                   | Key Features                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **WC Attorney**        | Case strategy, hearing preparation, IME rebuttal, demand letter drafting, settlement evaluation                      | IME Analysis, Contradiction Detection, Document Composer, Case Timeline, AI Assistant  |
| **Paralegal**          | Document intake, entity review, case organization, correspondence tracking, L&I form preparation, medical chronology | Document Management, Entity Extraction Review, Case Notes, Email Integration, Calendar |
| **Office Manager**     | Case health monitoring, deadline oversight, workload visibility                                                      | Case Dashboard, Calendar & Deadlines, Activity Log                                     |
| **Injured Worker**     | Case status checks, questionnaire completion, digital signing, document uploads                                      | Client Portal (separate application)                                                   |
| **Firm Administrator** | User management, billing configuration, standing order management                                                    | Admin Portal, Standing Orders Dashboard, Billing Dashboard                             |

---

## 11. Platform Architecture (Non-Technical Summary)

**Simplicity first, complexity on demand**: The guiding design principle is to never overwhelm the user. Every screen defaults to its simplest useful state -- the essential information and the most common actions, clearly presented. Advanced functionality is always available but stays hidden until the user reaches for it. Progressive disclosure governs everything: filters expand, panels open, detail views unfold, and power features surface only when the user's intent signals they need more. A paralegal on day one sees a clean, approachable interface. A senior attorney deep in hearing prep can expand into the full power of the workspace. The same screen serves both -- the difference is how much the user has chosen to reveal. The platform should feel simple when you need simple and powerful when you need power, and the transition between the two should be effortless.

**Desktop-class web application**: Leglise is a professional workspace designed for sustained, focused work -- not a lightweight web app. Dark mode default, thin borders, spacious content areas. The interface conveys calm power: it gets out of the way and lets the content breathe.

**5-zone workspace shell**: Every screen is composed from five persistent zones -- a top bar for context and status, a ribbon for global navigation, an explorer for browsing and filtering, a content area for all primary work, and a context panel for intelligence and related information. The zones resize and collapse but never rearrange. See [Document 1](./01-the-workspace-shell.md).

**Everything is a node**: Every meaningful element in the case -- every document, every note, every provider, every diagnosis, every date, every measurement -- is a navigable node with its own identity, properties, backlinks, and connections. The case is a web of knowledge, not a tree of files in folders.

**Peek-first navigation**: Clicking an entity or reference opens a lightweight slide-over preview first, not a new tab. Quick lookups stay ephemeral. Deep dives become tabs by explicit choice.

**Per-case state persistence**: Every case remembers its own view state. Switching between cases restores the full cognitive context.

---

## 12. Series Navigation

This document is the entry point to the Leglise Product Specification series. Each subsequent document drills into a specific aspect of the platform's design.

| #       | Document                                              | What It Covers                                                                                                                       |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **0**   | **Platform Overview** (this document)                 | Launch product: WA workers' comp, phased capabilities, MVP classification                                                            |
| **0A**  | [Long-Term Vision](./00a-long-term-vision.md)         | Full platform story: multi-practice-area expansion, extension model, firm intelligence                                               |
| **1**   | [The Workspace Shell](./01-the-workspace-shell.md)    | Five-zone layout, navigation model, Sources/Notes hemispheres, where AI lives, key design decisions                                  |
| **1A**  | [The Mode System](./01a-the-mode-system.md)           | Ribbon mode switcher, 5 core modes (Dashboard, Documents, Calendar, Communications, AI), extension modes, cross-mode peek navigation |
| **2**   | [Agentic Features Map](./02-agentic-features-map.md)  | Every AI feature mapped to its precise workspace location                                                                            |
| **3**   | [The Explorer & Document Table](./03-the-explorer.md) | Explorer sidebar, document table, progressive navigation (dashboard -> table -> viewer), responsive layout                           |
| 4       | The Context Panel (planned)                           | Right sidebar: Links, Details, AI Chat, Tasks tabs                                                                                   |
| 5       | The Workspace Engine (planned)                        | Multi-pane splits, tabs, peek drawer, popout windows, saved workspaces                                                               |
| 6       | The Command Surface (planned)                         | Command palette (Cmd+K), skill activation, natural language + slash commands                                                         |
| 7       | The Graph and Canvas (planned)                        | Case knowledge graph, spatial canvas, cross-case entity networks                                                                     |
| 8       | The Hover Layer (planned)                             | Hover previews, transclusion, block references, progressive disclosure                                                               |
| 9       | The AI Gardener (planned)                             | Emergence detection, progressive enrichment, standing orders, morning briefings                                                      |
| **10**  | [The Extension System](./10-the-extension-system.md)  | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system                             |
| **11**  | [Firm-Wide Extensions](./11-firm-wide-extensions.md)  | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                                            |
| **11A** | [Toolkit Deep Dive](./11a-toolkit-deep-dive.md)       | New toolkit ideas and deeper specifications for existing toolkits                                                                    |

**Start here** for the launch product, then read [Document 0A](./00a-long-term-vision.md) for the full platform vision.

---

_This document describes what Leglise ships first: case management for WA workers' comp attorneys with AI-powered document intelligence. [Document 0A](./00a-long-term-vision.md) describes the long-term platform vision. [Document 1](./01-the-workspace-shell.md) describes how the workspace is laid out. [Document 10](./10-the-extension-system.md) describes how the platform extends across practice areas._
