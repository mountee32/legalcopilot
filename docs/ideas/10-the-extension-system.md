# Document 10: The Extension System

**Series**: Leglise Product Specification
**Date**: February 21, 2026
**Status**: Creative Exploration (No Technical Implementation)
**Purpose**: How the platform extends across practice areas, integrations, and toolkits -- the modular architecture that makes Leglise a legal intelligence platform, not a workers' comp platform
**Companion Documents**: [00 -- Platform Overview](./00-platform-overview.md), [01 -- The Workspace Shell](./01-the-workspace-shell.md), [02 -- Agentic Features Map](./02-agentic-features-map.md)

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
| **10** | **The Extension System**                             | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system | **This document** |
| 11     | [Firm-Wide Extensions](./11-firm-wide-extensions.md) | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                | Complete          |

---

## 1. Thesis

Leglise is not a workers' compensation platform. It is a legal intelligence platform that launches in workers' compensation.

This distinction matters because it determines what is core and what is modular. If Leglise is a workers' comp platform, then L&I claim numbers, PPD calculators, and BIIA hearing procedures are core features. Adding personal injury would mean bolting a second practice area onto an architecture designed for one. Adding family law would mean bolting on a third. Each addition makes the platform more fragile, more complex, and harder to maintain.

If Leglise is a legal intelligence platform, then the core is practice-area-agnostic: document intelligence, entity extraction, the workspace shell, AI infrastructure, the knowledge graph, case management, standing orders, contradiction detection, the document composer, progressive enrichment. These capabilities work the same whether the case involves a rotator cuff tear or a rear-end collision or a custody dispute. The domain-specific knowledge -- entity types, document taxonomies, calculators, jurisdiction rules, AI prompts, form libraries -- loads as modules.

The split is roughly 60-70% core, 30-40% domain. The core handles intelligence, context, and agency. Extensions supply the domain knowledge and external capabilities that make the platform useful for a specific kind of legal work.

### Many Views, One Data Model

Obsidian -- a note-taking tool with 2,692+ community plugins -- demonstrates a powerful architectural insight: **many views, one data model**. Every Obsidian plugin adds new ways to see and interact with the same underlying notes. A graph view, a kanban board, a calendar, a mind map -- all operating on the same markdown files. No plugin creates its own data silo. No plugin requires its own storage format.

Leglise applies the same principle. The core platform maintains one data model: cases, documents, entities, relationships, timelines, notes. Every extension adds new views, new entity types, new intelligence, and new tools -- but they all operate on the same underlying data. A personal injury module does not create a separate database. It teaches the platform what a "demand package" is, how to extract "liability determinations" from police reports, and how to calculate general damages multipliers -- all within the same entity framework that workers' comp already uses.

But extensions go beyond practice areas. External service integrations (Westlaw, court e-filing systems, medical record services) and standalone capability toolkits (advanced analytics, conflict checking, deposition tools) also extend the platform -- each adding new capabilities that work across all loaded practice areas.

---

## 2. What Obsidian Teaches Us

Obsidian's plugin ecosystem offers four lessons relevant to Leglise's extension model.

### Lesson 1: Core Features Are Plugins

In Obsidian, even built-in features like the file explorer, search, and graph view are implemented as core plugins. This is not an accident -- it forces the plugin API to be capable enough to build real features. If your own features cannot use the extension system, the extension system does not work.

Leglise applies this principle: workers' compensation is the first practice area module. It uses the same extension interfaces that personal injury, family law, and every future practice area will use. If the extension system cannot support the full depth of WA workers' comp -- L&I claim tracking, PPD calculation, BIIA hearing preparation, 70+ document subtypes -- then it is not ready for other practice areas either.

### Lesson 2: Progressive Complexity

Simple Obsidian plugins are small -- a few hundred lines that add a single view or command. Complex plugins are rich -- full calendar systems, database engines, publishing pipelines. The plugin architecture supports both without forcing simple plugins to carry the complexity of rich ones.

Leglise's extension categories mirror this. A toolkit that adds conflict checking is simpler than a full practice area module with three integrated pillars. An integration that connects to a calendar system is simpler than an integration that provides full Westlaw research capabilities. The extension system supports the full spectrum without imposing unnecessary complexity on simpler extensions.

### Lesson 3: Many Views, One Data Model

As described above -- plugins add new lenses, not new data silos. This is the most important architectural constraint. It means every extension enriches the same case graph, the same entity framework, the same knowledge base. A firm running WC + PI does not have two separate systems. They have one system that understands two domains.

### Lesson 4: Where We Diverge

Obsidian uses a community marketplace model: thousands of third-party developers building plugins of varying quality, with users assembling their own configurations. This works for a note-taking tool where the stakes are low and experimentation is cheap.

Legal practice management has different requirements. Incorrect entity extraction, missed deadlines, or bad legal calculations have real consequences. Leglise follows the **Epic EHR model** instead: first-party specialty modules developed and maintained by the platform team, with the same quality standards, the same security model, and the same support infrastructure as the core platform.

This does not preclude a partner ecosystem eventually. But the initial extension model is first-party: every practice area module, integration, and toolkit is built, tested, and maintained by Leglise.

---

## 3. Three Categories of Extensions

The extension system supports three distinct types, each serving a different purpose and carrying a different level of complexity.

### Category 1: Practice Areas

A practice area module is the richest kind of extension. It brings deep domain knowledge for a specific area of law, structured around three integrated pillars.

#### Pillar 1: Domain Model -- What Exists in This Area of Law

The domain model defines the entities, documents, procedures, and rules that make this area of law distinct.

**Entity types the AI extracts:**

- Workers' comp: ImpairmentRating, CausationOpinion, LNIOrder, TimelossPeriod, VocationalAssessment, PPDRating, ReturnToWorkStatus
- Personal injury: InsurancePolicy, LienHolder, DemandPackage, LiabilityDetermination, PropertyDamageEstimate, MedicalSpecial, GeneralDamagesMultiplier

**Document classification taxonomy:**

- Workers' comp: Medical / Legal / L&I / Vocational / Employer / Financial, with 70+ subtypes (IME Report, FCE, Activity Prescription Form, L&I Order, Protest Letter, etc.)
- Personal injury: Medical / Legal / Insurance / Liability / Financial, with different subtypes (Police Report, Demand Letter, Insurance Correspondence, Lien Letter, Settlement Agreement, etc.)

**Procedural phases and case lifecycle:**

- Workers' comp: Injury → Filing → L&I Adjudication → Treatment → IME → Protest → BIIA Appeal → Hearing → Resolution
- Personal injury: Incident → Investigation → Treatment → Maximum Medical Improvement → Demand → Negotiation → Litigation → Resolution

**Jurisdiction-specific rules, deadlines, and statutes:**

- Workers' comp (WA): RCW 51, WAC 296, L&I protest timelines, BIIA appeal deadlines, PPD category rating tables
- Personal injury (WA): Comparative fault (RCW 4.22), statute of limitations (RCW 4.16), collateral source rules, lien statutes

#### Pillar 2: Domain Tools -- How Attorneys Work in This Practice Area

Domain tools are the views, calculators, form libraries, and workspace configurations that attorneys use daily.

**Custom views and workspace panes:**

- Workers' comp: PPD Calculator, IME Contradiction Matrix, L&I Timeline, Vocational Assessment Tracker, Time-Loss Calculator
- Personal injury: Settlement Calculator, Medical Specials Tracker, Lien Dashboard, Demand Builder, Liability Analysis Panel

**Calculators -- deterministic domain math:**

- Workers' comp: PPD tables per RCW 51.32.080, time-loss rate calculations, penalty and interest calculations
- Personal injury: General damages multipliers, lien reduction calculators, net-to-client projections, comparative fault adjustments

**Form libraries and document templates with auto-fill:**

- Workers' comp: L&I Application for Benefits, Activity Prescription Form, Doctor Questionnaires, protest letters, BIIA appeal forms
- Personal injury: Demand letters, Letters of Protection (LOPs), complaints, interrogatories, requests for production, settlement agreements

#### Pillar 3: Domain Intelligence -- How the Virtual Associate Understands This Practice Area

Domain intelligence is what makes the AI useful within a specific area of law.

**Extraction schemas -- what to pull from documents and how to structure it:**

- Workers' comp: ROM measurements, impairment ratings, work restrictions, causation opinions, treatment recommendations
- Personal injury: Liability percentages, policy limits, lien amounts, medical specials totals, lost wage calculations

**System prompts and domain knowledge -- what the AI should know:**

- Workers' comp: L&I adjudication process, RCW/WAC citations, IME defense strategies, PPD rating methodology, vocational rehabilitation standards
- Personal injury: Comparative fault analysis, demand strategy, lien negotiation tactics, insurance bad faith indicators, Daubert challenges

**Domain-specific AI skills and tools:**

- Workers' comp: `/rom-compare`, `/calculate-ppd`, `/protest-draft`, `/ime-contradict`, `/treatment-gap-analyze`
- Personal injury: `/build-demand-section`, `/analyze-liability`, `/calculate-settlement`, `/lien-negotiate`, `/damages-summarize`

**Gap detection and standing order rules:**

- Workers' comp: Treatment gaps > 30 days, missing L&I correspondence, IME scheduling delays
- Personal injury: Surveillance gaps, discovery deadline gaps, treatment gaps affecting damages, lien notification deadlines

**Knowledge bases loaded into RAG for domain-specific legal research:**

- Workers' comp: WA workers' comp statutes, BIIA decisions, L&I policy manuals
- Personal injury: WA tort law, relevant case law, insurance regulations, medical terminology for injury types

### Category 2: Integrations

Integrations connect the platform to external services and databases, making them accessible to both attorneys and the Virtual Associate.

**Legal research databases (Westlaw, LexisNexis, Fastcase):**
Search, retrieve, and cite external legal authority. The AI can say "let me check Westlaw for relevant case law on this issue" and return cited results within the conversation. Research results flow into the case's knowledge base.

**Court filing systems (e-filing APIs):**
Submit documents directly to courts, check filing status, receive confirmation. The AI can verify filing requirements, check deadlines against the court's system, and flag when a filing is overdue.

**Medical record services (Ciox, MRO):**
Automated record retrieval. When the AI detects a treatment gap or a missing provider record, it can trigger a record request through the integrated service, track the request status, and notify the attorney when records arrive.

**Calendar and docketing systems:**
Deadline synchronization and court date management. The AI can check upcoming deadlines, flag conflicts, and ensure hearing dates are properly docketed across the firm's calendar system.

**Accounting and billing systems:**
Time tracking and billing integration. The AI can log time entries, check billing status, and ensure trust accounting records are synchronized.

**What every integration brings:**

- Connection configuration and authentication
- Data mapping to platform entities (how external data maps to the case graph)
- AI-callable tools (so the Virtual Associate can use the integration autonomously)
- Relevant views and panels in the workspace

### Category 3: Toolkits

Toolkits are standalone capabilities that enhance the platform regardless of which practice areas are loaded. [Document 11: Firm-Wide Extensions](./11-firm-wide-extensions.md) catalogs the full toolkit library -- 15 capabilities organized across four functional areas: Operational, Knowledge & Quality, Client-Facing, and Strategic.

The five original toolkits illustrate the category:

**Advanced analytics engine:**
Cross-case pattern analysis, outcome prediction, firm performance dashboards. The AI can query analytics to answer questions like "what's our average settlement for rotator cuff cases?" or "which IME examiners have the highest reversal rate at BIIA hearings?"

**Conflict checking:**
Automated conflict of interest detection across the firm's case database. The AI can run conflict checks during intake conversations, flagging potential conflicts before a new case is opened.

**Deposition tools:**
Transcript analysis, key testimony extraction, contradiction detection across deposition transcripts. The AI can search depositions for specific topics, flag contradictions between deposition testimony and medical records, and generate follow-up questions.

The full catalog in [Document 11](./11-firm-wide-extensions.md) expands these into 15 toolkits covering knowledge management, quality assurance, resource planning, client experience, intake CRM, business intelligence, revenue forecasting, outcome analytics, discovery management, and more.

**What every toolkit brings:**

- One or more views and panels in the workspace
- AI-callable tools where the capability benefits from AI orchestration
- Standalone value without requiring a specific practice area

---

## 4. How Extensions Work With the AI Agent System

Extensions and the Virtual Associate are deeply connected, but they are not the same thing. Understanding the distinction is essential.

### The Extension Is the Knowledge; the Agent Is the Reasoning

An extension is structured domain knowledge or capability. The AI agent is a reasoning engine. Extensions teach the agent and give it new tools; the agent uses them to do work.

A PPD calculator always gives the same answer for the same inputs -- it is deterministic. An AI analysis of whether an IME contradicts the treating physician reasons about the evidence, estimates probabilities, and suggests strategy -- it is probabilistic. Both are valuable. Extensions provide both kinds of capability: deterministic tools (calculators, form templates, deadline rules) and the domain knowledge that makes probabilistic reasoning accurate (extraction schemas, AI prompts, knowledge bases).

### Every Extension Category Contributes to the AI

**Practice areas** register:

- Entity types the AI extracts from documents
- Knowledge bases the AI reasons over for domain-specific questions
- Domain-specific AI skills (e.g., `/calculate-ppd`, `/build-demand-section`) the AI can invoke
- Standing order templates the AI executes on schedule
- Gap detection rules the AI monitors continuously

**Integrations** register as AI-callable tools:

- The Virtual Associate can search Westlaw because the Westlaw integration exposed a search tool
- The Virtual Associate can retrieve medical records because the medical records integration exposed a request tool
- The Virtual Associate can check court dockets because the e-filing integration exposed a status tool
- The Virtual Associate can look up billing data because the accounting integration exposed a query tool

**Toolkits** expose analytical capabilities as AI tools:

- The analytics engine lets the AI pull cross-case statistics ("what's the average time-to-resolution for this injury type?")
- The conflict checker lets the AI verify conflicts during intake conversations
- The deposition toolkit lets the AI search transcripts and flag contradictions
- The reporting engine lets the AI generate and populate report templates

### Standing Orders: The Full Collaboration

Standing orders illustrate how extensions and the AI agent collaborate across all three categories.

Consider a standing order: "Every Monday morning, check all active workers' comp cases for treatment gaps exceeding 30 days. For any gap found, search Westlaw for relevant case law on treatment gap defenses, and generate a recommended action memo."

This standing order requires:

- **Practice area knowledge** (workers' comp module): Defines what a "treatment gap" means, what the threshold is, why it matters legally, and how to structure the action memo
- **Integration access** (Westlaw integration): Provides the legal research tool the AI uses to find relevant case law
- **AI reasoning** (the Virtual Associate): Executes the check, identifies gaps, formulates the Westlaw search query, reasons about the results in context, and generates the recommendation

No single component can do this alone. The practice area module defines what to check and what domain knowledge applies. The integration provides access to external legal authority. The AI agent orchestrates the entire workflow, pulling relevant data through integration tools, reasoning about the results using domain intelligence, and generating the final work product.

### The Virtual Associate Gets Smarter as Extensions Are Loaded

A firm with only WC loaded has an AI that understands workers' comp. Add PI, and the AI now understands both practice areas -- it can draw connections between a WC case and a PI case involving the same provider. Add the Westlaw integration, and the AI can cite legal authority across both practice areas. Add the analytics toolkit, and the AI can answer cross-case statistical questions.

The agent's capabilities are the sum of all loaded extensions. This is why the extension model matters for AI: every new extension makes the Virtual Associate more capable, without requiring changes to the core AI infrastructure.

---

## 5. The Extension Hierarchy

Extensions compose in a layered hierarchy. The core platform is always present. Extensions layer on top.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CORE PLATFORM                                │
│  Intelligence engine, workspace shell, entity framework,            │
│  AI infrastructure, document pipeline, knowledge graph              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    TOOLKITS (cross-cutting)                   │   │
│  │  Analytics · Reporting · Conflict Check · Depositions · Comms │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  INTEGRATIONS (cross-cutting)                 │   │
│  │  Westlaw · LexisNexis · E-Filing · Medical Records · Calendar │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              SHARED MODULES (cross-practice-area)             │   │
│  │         Medical Common · Financial Common · Legal Common      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  PRACTICE AREA   │  │  PRACTICE AREA   │  │  PRACTICE AREA   │    │
│  │  Workers' Comp   │  │ Personal Injury  │  │  Family Law      │    │
│  │                  │  │                  │  │                  │    │
│  │  Domain Model    │  │  Domain Model    │  │  Domain Model    │    │
│  │  Domain Tools    │  │  Domain Tools    │  │  Domain Tools    │    │
│  │  Domain Intel    │  │  Domain Intel    │  │  Domain Intel    │    │
│  │                  │  │                  │  │                  │    │
│  │  ┌────────────┐ │  │  ┌────────────┐ │  │  ┌────────────┐ │    │
│  │  │ WA Jurisd. │ │  │  │ WA Jurisd. │ │  │  │ WA Jurisd. │ │    │
│  │  │ OR Jurisd. │ │  │  │ OR Jurisd. │ │  │  │ CA Jurisd. │ │    │
│  │  └────────────┘ │  │  └────────────┘ │  │  └────────────┘ │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Composition Principles

**Domain and jurisdiction are orthogonal.** A firm doing personal injury in Washington and Oregon loads: Personal Injury module + WA Jurisdiction layer + OR Jurisdiction layer. The practice area module defines what PI means. The jurisdiction layers define how WA and OR differ (statutes of limitations, comparative fault rules, filing requirements).

**Toolkits and integrations are practice-area-agnostic.** A Westlaw integration works for workers' comp, personal injury, and family law. An analytics toolkit provides cross-case insights regardless of case type. These extensions operate at the platform level, not the practice area level.

**Shared modules prevent duplication.** Medical Common provides medical entity types (providers, diagnoses, procedures, medications, ROM measurements) used by both workers' comp and personal injury. Financial Common provides billing and cost tracking used across practice areas. When a new practice area needs medical entities, it inherits from Medical Common rather than redefining them.

**A practice area module is one integrated thing.** It is not eight separate plugins for entity types, document classification, calculators, views, AI skills, forms, jurisdiction rules, and knowledge bases. It is one module with three pillars, designed and maintained as a coherent unit. This is the Epic model: integrated specialty modules, not a bag of loosely coupled plugins.

---

## 6. Personal Injury: The Validation Domain

Personal injury is the right second practice area because it maximizes both overlap and divergence with workers' compensation. If the extension system can handle PI as a second module alongside WC, it can handle anything.

### Maximum Overlap

WC and PI share the medical foundation. Both involve:

- Medical records, treatment timelines, provider relationships
- ROM measurements, diagnostic imaging, functional capacity evaluations
- Treatment gap analysis, medical chronologies
- Provider credibility assessment across documents

This shared foundation lives in the **Medical Common** shared module. Both practice area modules inherit medical entity types, medical document classification, and medical intelligence from the same source.

### Clear Differences That Force the System to Work

PI diverges from WC in every way that matters for the extension system:

**Different entity types:** PI introduces InsurancePolicy, LienHolder, DemandPackage, LiabilityDetermination, PropertyDamageEstimate, and GeneralDamagesMultiplier -- none of which exist in WC.

**Different document taxonomy:** PI has Police Reports, Insurance Correspondence, Demand Letters, Lien Letters, Settlement Agreements, and Liability Analyses. WC has L&I Orders, Protest Letters, BIIA Appeal Forms, and Vocational Assessments. The classification system must handle both taxonomies simultaneously for firms that do both.

**Different procedural phases:** WC follows an administrative process (L&I → Protest → BIIA Appeal → Hearing). PI follows a civil litigation process (Investigation → Demand → Negotiation → Litigation → Trial). The case lifecycle model must accommodate both.

**Different calculators:** WC uses PPD category rating tables defined by statute. PI uses general damages multipliers, lien reduction calculations, and comparative fault adjustments. Both are deterministic domain math, but the formulas are completely different.

**Different AI skills:** WC needs `/rom-compare` and `/calculate-ppd`. PI needs `/build-demand-section` and `/analyze-liability`. The AI skill system must support practice-area-specific skills without collision.

**Different jurisdiction rules:** WC is governed by RCW 51 and WAC 296. PI is governed by RCW 4 (civil procedure), RCW 4.22 (comparative fault), and common law tort principles. Both need jurisdiction-specific deadline tracking, but the deadlines are completely different.

### What PI Shares With WC via Medical Common

- Medical entity types (Provider, Diagnosis, Procedure, Medication, ROMmeasurement)
- Medical document classification (Medical Report, IME Report, Imaging Report, Lab Results)
- Medical intelligence (treatment timeline construction, provider history, gap detection)
- Medical AI skills (`/treatment-summary`, `/provider-timeline`)

Everything medical is shared. Everything procedural, jurisdictional, and domain-specific is practice-area-specific.

### Market Rationale

Many WC firms also handle personal injury cases. A platform that supports both practice areas immediately serves these firms' complete caseload. PI is also a large, well-understood market with clear competitive gaps -- no existing platform provides the depth of document intelligence that Leglise brings.

---

## 7. Competitive Landscape

### Filevine

Configuration-driven templates. Firms set up custom fields, phases, and workflows per practice area. Flexible but shallow -- the platform does not understand the domain. AI features are generic across practice areas.

**Leglise difference**: Extensions bring deep domain understanding, not just configurable fields. The AI knows what a PPD rating means, what an IME contradiction implies, how to calculate comparative fault. Filevine's AI does not.

### Clio

Generic core platform with API integrations. Practice area support comes through third-party apps and manual configuration. The platform is practice-area-agnostic by default, but this means it is shallow in every practice area.

**Leglise difference**: Practice-area-agnostic core with deep domain modules. The core is generic; the modules are specific. Clio is generic everywhere. Leglise is generic at the core and deep at the module level.

### SmartAdvocate / CloudLex

PI-specialized platforms. Deep in personal injury, but no extensibility to other practice areas. A firm that does PI and WC needs two systems.

**Leglise difference**: The extension model means one platform, multiple practice areas. A firm doing PI and WC has one system, one knowledge graph, one AI that understands both domains.

### Epic EHR (Best Analogy)

Epic's electronic health record system is the closest analogy. Epic provides a core platform (patient records, scheduling, billing) with first-party specialty modules (cardiology, oncology, orthopedics). Each specialty module brings domain-specific workflows, order sets, documentation templates, and decision support. Modules are developed and maintained by Epic, not by third parties.

**Leglise follows this model.** First-party practice area modules, developed with the same quality standards as the core platform. Deep enough for specialists, integrated enough for generalists.

---

## 8. Beyond Personal Injury

The extension model is designed to scale. Each new extension enriches the platform without requiring changes to the core.

### Future Practice Areas

**Family law:** Custody schedules, asset division, support calculations, parenting plan templates. Different entity types (Child, Asset, IncomeSource), different procedural phases (Petition → Discovery → Mediation → Trial), different jurisdiction rules (community property vs. equitable distribution states).

**Immigration law:** Visa types, petition tracking, deadline management, country condition monitoring. Different entity types (Petition, Visa, BiometricAppointment), different procedural phases (Filing → Biometrics → Interview → Decision), USCIS-specific rules and processing times.

**Employment law:** Discrimination claims, wage disputes, wrongful termination. Different entity types (EmploymentContract, DiscriminationClaim, WageRecord), different procedural phases (Complaint → EEOC Filing → Right to Sue → Litigation).

**Medical malpractice:** Standard of care analysis, expert witness management, damages calculation. Shares Medical Common extensively. Different entity types (StandardOfCare, ExpertOpinion, DamagesModel), different AI skills (`/standard-of-care-analyze`, `/expert-compare`).

### Future Integrations

**Westlaw / LexisNexis:** Legal research as an AI-callable tool. The Virtual Associate searches, retrieves, and cites legal authority within conversations and document composition.

**Court e-filing systems:** Direct filing, status checking, deadline synchronization. State-specific integrations (WA ECF, OR eFiling, federal PACER/CM-ECF).

**Medical record services (Ciox, MRO):** Automated record retrieval triggered by gap detection. The AI identifies missing records and initiates requests.

**Calendar and docketing (Outlook, Google Calendar, docketing software):** Bidirectional deadline synchronization. Court dates, deposition dates, and filing deadlines flow between the platform and the firm's calendar system.

### Future Toolkits

See [Document 11: Firm-Wide Extensions](./11-firm-wide-extensions.md) for the complete toolkit catalog -- 15 firm-wide capabilities covering analytics, knowledge management, quality assurance, resource planning, client experience, intake CRM, revenue forecasting, outcome analytics, discovery management, deposition tools, and more.

---

## 9. Series Navigation

This document is part of the Leglise Product Specification series.

| #      | Document                                             | What It Covers                                                                                           |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **0**  | [Platform Overview](./00-platform-overview.md)       | Launch product: WA workers' comp, phased capabilities, MVP classification                                |
| **0A** | [Long-Term Vision](./00a-long-term-vision.md)        | Full platform story: multi-practice-area expansion, extension model, firm intelligence                   |
| **1**  | [The Workspace Shell](./01-the-workspace-shell.md)   | Five-zone layout, navigation model, Sources/Notes hemispheres, where AI lives, key design decisions      |
| **2**  | [Agentic Features Map](./02-agentic-features-map.md) | Every AI feature mapped to its precise workspace location                                                |
| 3      | The Explorer (planned)                               | Left sidebar: Sources, Notes, Search, Tags, Starred tabs with advanced filtering                         |
| 4      | The Context Panel (planned)                          | Right sidebar: Links, Details, AI Chat, Tasks tabs                                                       |
| 5      | The Workspace Engine (planned)                       | Multi-pane splits, tabs, peek drawer, popout windows, saved workspaces                                   |
| 6      | The Command Surface (planned)                        | Command palette (Cmd+K), skill activation, natural language + slash commands                             |
| 7      | The Graph and Canvas (planned)                       | Case knowledge graph, spatial canvas, cross-case entity networks                                         |
| 8      | The Hover Layer (planned)                            | Hover previews, transclusion, block references, progressive disclosure                                   |
| 9      | The AI Gardener (planned)                            | Emergence detection, progressive enrichment, standing orders, morning briefings                          |
| **10** | **The Extension System** (this document)             | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system |
| **11** | [Firm-Wide Extensions](./11-firm-wide-extensions.md) | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                |

**Start with [Document 0](./00-platform-overview.md)** for the platform overview, then read this document for how the platform extends across practice areas. See [Document 1](./01-the-workspace-shell.md) for where extensions manifest in the workspace.

---

_This document describes how Leglise extends across practice areas, integrations, and toolkits. [Document 0](./00-platform-overview.md) describes what the platform does. [Document 1](./01-the-workspace-shell.md) describes how the workspace is laid out. [Document 2](./02-agentic-features-map.md) describes where every AI feature sits within that layout._
