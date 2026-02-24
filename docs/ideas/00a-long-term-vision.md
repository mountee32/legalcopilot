# Document 0A: Long-Term Vision

**Series**: Leglise Product Specification
**Date**: February 21, 2026
**Status**: Creative Exploration (No Technical Implementation)
**Purpose**: The full platform vision -- what Leglise becomes as it expands beyond WA workers' compensation into a multi-practice-area legal intelligence platform
**Companion Documents**: [00 -- Platform Overview](./00-platform-overview.md) (launch product), [10 -- The Extension System](./10-the-extension-system.md), [11 -- Firm-Wide Extensions](./11-firm-wide-extensions.md)

---

> **This document is the north star, not the roadmap.** [Document 0](./00-platform-overview.md) describes what ships first -- the WA workers' comp launch product with phased capabilities and MVP classification. This document describes what the platform becomes over years of expansion. Everything here is contingent on validating the launch product with paying customers.

---

## 1. The Platform Thesis

Leglise is a **legal intelligence platform** -- a Virtual Associate that reads every document that enters a case, tracks every entity, every date, every contradiction. It monitors deadlines, detects treatment gaps, surfaces connections the attorney has not noticed, and prepares the morning briefing before the attorney pours their coffee. It learns from every correction, every preference, every strategic decision -- and it remembers, across cases, across years.

The platform launches in Washington State workers' compensation -- the deepest, most regulated, most document-intensive niche we can find. But the core platform is practice-area-agnostic. Workers' comp is the first domain module. Personal injury, family law, immigration, and other practice areas follow as extensions, each bringing their own entity types, document taxonomies, calculators, AI skills, and domain knowledge.

The core platform handles intelligence, context, and agency. Extensions supply the domain knowledge and external capabilities that make the platform useful for a specific kind of legal work. This split is roughly 50-60% core, 40-50% domain -- a ratio that will be measured and refined as more practice areas are built.

This is not a filing cabinet with AI bolted on. It is an AI associate with a filing interface.

### Many Views, One Data Model

The core platform maintains one data model: cases, documents, entities, relationships, timelines, notes. Every extension adds new views, new entity types, new intelligence, and new tools -- but they all operate on the same underlying data. A personal injury module does not create a separate database. It teaches the platform what a "demand package" is, how to extract "liability determinations" from police reports, and how to calculate general damages multipliers -- all within the same entity framework that workers' comp already uses.

A firm running WC + PI does not have two separate systems. They have one system that understands two domains.

### Who the Full Platform Serves

- **Attorneys** (senior and associate) -- case strategy, hearing preparation, demand letter drafting, deposition planning, cross-case pattern recognition
- **Paralegals** -- document intake, entity review, case organization, correspondence tracking, bulk document processing
- **Office managers** -- firm-level case health monitoring, workload distribution, standing order oversight
- **Injured workers / clients** -- case status visibility, questionnaire completion, document upload (via a separate client portal)
- **Firm administrators** -- user management, billing configuration, agent ecosystem management, institutional knowledge curation

---

## 2. Expansion Roadmap

### Stage 1: WA Workers' Compensation (Launch)

The launch product is fully specified in [Document 0](./00-platform-overview.md). It includes:

- Case management with L&I claim integration
- Document intelligence pipeline (OCR, classification, entity extraction)
- IME analysis (adversarial flagging, contradiction detection, peer-reviewed literature comparison)
- Treatment gap detection
- Calendar and deadline management with WA-specific jurisdiction awareness
- Email integration and case notes
- Medical chronology generation

### Stage 2: Adjacent WC States

Expand the workers' comp module to other high-volume states. Each state requires a jurisdiction layer with state-specific statutes, deadlines, forms, and regulatory knowledge.

**Priority states** (by WC volume and attorney market size):

- **Oregon** -- shares Pacific Northwest legal community with WA, many firms handle both
- **California** -- largest WC market in the country
- **Ohio** -- monopolistic state fund (like WA), making the regulatory model transferable
- **Pennsylvania** -- large WC volume with complex procedures

The core WC module (entity types, medical intelligence, IME analysis) transfers directly. What varies: jurisdiction-specific deadlines, forms, statutes, hearing procedures, and benefit calculation rules.

### Stage 3: Personal Injury

PI is the natural second practice area because it maximizes both overlap and divergence with workers' compensation.

**Shared with WC** (via Medical Common shared module):

- Medical records, treatment timelines, provider relationships
- ROM measurements, diagnostic imaging, functional capacity evaluations
- Treatment gap analysis, medical chronologies
- Provider credibility assessment across documents

**Unique to PI**:

- New entity types: InsurancePolicy, LienHolder, DemandPackage, LiabilityDetermination, PropertyDamageEstimate, GeneralDamagesMultiplier
- New document taxonomy: Police Reports, Insurance Correspondence, Demand Letters, Lien Letters, Settlement Agreements
- Different procedural phases: Incident → Investigation → Treatment → MMI → Demand → Negotiation → Litigation → Resolution
- Different calculators: general damages multipliers, lien reduction, comparative fault adjustments
- Different AI skills: `/build-demand-section`, `/analyze-liability`, `/calculate-settlement`

PI is a much larger market than WC. EvenUp's $2B valuation processing 10,000 PI cases per week demonstrates the market size. WC depth is the credential; PI is the growth engine.

### Stage 4: Additional Practice Areas

Each as a domain module with three integrated pillars: Domain Model, Domain Tools, Domain Intelligence.

**Family law**: Custody schedules, asset division, support calculations, parenting plan templates. Different entity types (Child, Asset, IncomeSource), different procedural phases (Petition → Discovery → Mediation → Trial), different jurisdiction rules.

**Employment law**: Discrimination claims, wage disputes, wrongful termination. Different entity types (EmploymentContract, DiscriminationClaim, WageRecord), different procedural phases (Complaint → EEOC Filing → Right to Sue → Litigation).

**Immigration law**: Visa types, petition tracking, deadline management, country condition monitoring. Different entity types (Petition, Visa, BiometricAppointment), different USCIS-specific rules and processing times.

**Medical malpractice**: Standard of care analysis, expert witness management, damages calculation. Shares Medical Common extensively. Different entity types (StandardOfCare, ExpertOpinion, DamagesModel).

---

## 3. The Full Capability Vision

These capabilities represent the complete platform -- what Leglise looks like when multiple practice areas are loaded, the firm has significant case data, and the AI infrastructure is mature. They are described fully in the companion documents; summaries are included here for context.

### Proactive Intelligence

**Morning Briefing**: Before the attorney starts their day, the Virtual Associate synthesizes overnight activity, deadline alerts, case health changes, and recommended actions into a prioritized work queue. Available as a visual dashboard card or voice narration.

**Standing Orders**: Persistent instructions that tell the Virtual Associate to wake up at defined intervals, check defined conditions, and perform defined work. Standing orders combine practice area knowledge, integration access, and AI reasoning.

### Knowledge Graph

**Bidirectional entity linking**: Every entity is a navigable node with full awareness of what references it. The case is a web of navigable knowledge, not a tree of files in folders.

**Entity pages**: Every person, provider, diagnosis, procedure, and measurement has a page showing all documents mentioning it, all connected entities, all timeline events, and an AI-generated strategic summary.

**Cross-case pattern recognition**: Provider patterns, employer patterns, and case outcome patterns detected and surfaced across the firm's case portfolio.

### Firm Intelligence

**Firm Knowledge Flywheel**: Institutional memory that grows with every case -- provider assessments, case archetypes, learned strategies, outcome patterns. A paralegal who starts next week benefits from every case the firm has ever handled.

**Case archetypes and default strategies**: The firm recognizes recurring case patterns (rotator cuff / surgical pathway / PPD outcome) and applies learned strategies as defaults for new cases matching those archetypes.

**Agent ecosystem management**: A visual view showing all agents, their skills, and their learned rules. Firm administrators manage the agent ecosystem from a single surface.

### Multi-Specialist Advisor

For complex decisions, the co-pilot surfaces multiple specialist perspectives side by side -- Medical, Legal, and Vocational viewpoints, each with supporting evidence and counterarguments.

---

## 4. Integration Ecosystem (Long-Term)

**Legal research databases (Westlaw, LexisNexis, Fastcase)**: Search, retrieve, and cite external legal authority. The AI can search for relevant case law within conversations and document composition.

**Court filing systems (e-filing APIs)**: Submit documents directly to courts, check filing status, receive confirmation. State-specific integrations (WA ECF, OR eFiling, federal PACER/CM-ECF).

**Medical record services (Ciox, MRO)**: Automated record retrieval triggered by gap detection. The AI identifies missing records and initiates requests.

**Calendar and docketing systems**: Bidirectional deadline synchronization (partially included in MVP as calendar integration -- this expands to full docketing software integration).

**Accounting and billing systems**: Time tracking and billing integration for firms that need external billing (QuickBooks, Xero).

---

## 5. Toolkit Ecosystem (Long-Term)

Toolkits are firm-wide capabilities that work across all loaded practice areas. The complete catalog of 15 toolkits is specified in [Document 11: Firm-Wide Extensions](./11-firm-wide-extensions.md), organized by function:

- **Operational**: Matter Board, Workload & Capacity Manager, Workflow Automations, Time & Billing
- **Knowledge & Quality**: Firm Knowledge Base, Quality Assurance & Review, Training & Onboarding
- **Client-Facing**: Client Experience Portal, Intake & CRM, Client Satisfaction & Feedback
- **Strategic**: Firm Analytics & BI, Revenue Forecasting & Pipeline, Case Outcome Analytics
- **Document & Evidence**: Discovery & Document Production, Deposition & Testimony Tools

Toolkits are additive -- a firm loads what it needs. A solo practitioner might use only Matter Board and Client Portal. A 50-attorney firm loads the full catalog.

---

## 6. Competitive Positioning (Long-Term)

### Current Landscape

**Clio** ($900M+ raised, 150K+ users): Dominant in small/solo firms. Broad but shallow AI. The moat is distribution, not depth.

**Filevine** ($400M raised, $3B valuation): MedChron medical chronologies, "Chat with Your Case," DraftAI. The most direct AI threat -- moving fast with enormous resources.

**EvenUp** ($385M raised, $2B valuation): AI demand letters for PI. 10,000 cases/week. Proves the practice-area-specific AI model works. Could expand to WC.

**Supio** ($91M raised, Thomson Reuters partnership): Explicitly planning WC expansion. Direct competitive threat to Leglise's beachhead.

### Leglise's Long-Term Differentiators

1. **Depth-first, then breadth**: Every practice area module is built with the same depth as WC -- not a configurable template, but genuine domain understanding. The Epic EHR model applied to legal: integrated specialty modules, not a bag of plugins.

2. **One AI, many domains**: A firm doing WC + PI has one Virtual Associate that understands both practice areas and draws connections between them. No competitor offers this today.

3. **The extension architecture**: Clean separation between core intelligence and domain knowledge means each new practice area enriches the platform without architectural rework. New practice areas are additive, not bolted on.

4. **The data flywheel**: Every document processed, every entity extracted, every correction applied, every case outcome recorded makes the AI more capable. Firms that use Leglise across more cases and more practice areas get a continuously improving system.

---

## 7. Desktop Application (Cloud-First + Native Shell)

### Strategy: Web-First, Desktop as Premium Layer

Leglise is a cloud-first web application. The desktop version is not a separate product -- it is the same Next.js application running inside a native shell (Electron or Tauri), gaining OS-level capabilities that browsers cannot provide.

**Ship order**: Web validates the product with paying customers. Desktop ships later as a premium differentiator for power users and larger firms.

### Why Desktop Matters for Legal Work

Attorneys and paralegals working complex cases routinely have 20+ documents open alongside timelines, entity views, and chat. Browser tabs hit their limits. A native desktop shell unlocks:

- **Multi-window document review** -- pop out documents into independent OS windows for side-by-side comparison across monitors
- **Folder-watch auto-import** -- designate a local folder; any document dropped in is automatically uploaded, classified, and extracted
- **Offline document access** -- cache case documents locally for courtroom, deposition, or travel use without internet
- **System-level notifications** -- OS-native alerts for deadline warnings, extraction completions, and case updates
- **Deep keyboard shortcuts** -- OS-level hotkeys (global shortcuts, window management) beyond what browsers allow
- **Local file system integration** -- drag-and-drop from desktop, save annotations directly, integrate with local scanning software

### Competitive Context

| Product               | Approach                    | Limitation                                         |
| --------------------- | --------------------------- | -------------------------------------------------- |
| **Clio**              | Pure cloud/web              | No desktop app; 150K+ users proves web-first works |
| **Smokeball**         | Desktop-first + cloud sync  | Windows-only, no Mac; did it backwards             |
| **LEAP**              | PC-native + cloud companion | Desktop-first with cloud bolted on                 |
| **PCLaw / AbacusLaw** | Legacy desktop              | Aging, losing market share                         |

The industry trend is decisive: 73% of firms use cloud-based tools (ABA 2024), 97% of small firms planning replacements choose cloud, and vendors like Relativity are ending on-premises support entirely by 2028. Leglise's cloud-first approach is aligned with the market. The desktop shell adds differentiation without the architectural debt of desktop-first competitors.

### Technical Approach

```
┌─────────────────────────────────────────┐
│           Next.js Application           │  ← Single codebase
│  ┌───────────────────────────────────┐  │
│  │   Shared React Components         │  │
│  │   TanStack Query / Zustand        │  │
│  │   API Client Layer                │  │
│  └───────────────────────────────────┘  │
├────────────────────┬────────────────────┤
│   Browser (default)│   Desktop Shell    │
│   ─────────────────│   ─────────────────│
│   Zero install     │   Electron (likely)│
│   Auto-updates     │   + Native APIs    │
│   Works everywhere │   + Offline cache  │
│                    │   + Multi-window   │
└────────────────────┴────────────────────┘
```

**Electron vs Tauri**: Electron is the pragmatic choice for Leglise. The entire stack is TypeScript/JavaScript, the app relies on SSR and server components (which Tauri cannot run -- it requires static export), and Electron's ecosystem is battle-tested for enterprise use (VS Code, Slack, Teams). Tauri offers 10x smaller binaries and lower RAM (~28MB vs ~250MB), but the SSR limitation is a hard constraint for Leglise's architecture. Revisit if Tauri adds SSR support.

### Scope and Boundaries

The desktop shell is **not** a separate application. It is a thin native wrapper around the same web application. The rule: any feature that works in the desktop shell must degrade gracefully in the browser (e.g., folder-watch becomes manual upload, multi-window becomes multi-tab, offline becomes "requires connection").

Desktop-only features are limited to OS integration that browsers physically cannot do. No feature logic lives exclusively in the desktop layer.

---

## 8. Series Navigation

| #      | Document                                             | What It Covers                                                                                           |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **0**  | [Platform Overview](./00-platform-overview.md)       | Launch product: WA workers' comp, phased capabilities, MVP classification                                |
| **0A** | **Long-Term Vision** (this document)                 | Full platform story: multi-practice-area expansion, extension model, firm intelligence                   |
| **1**  | [The Workspace Shell](./01-the-workspace-shell.md)   | Five-zone layout, navigation model, Sources/Notes hemispheres, where AI lives, key design decisions      |
| **2**  | [Agentic Features Map](./02-agentic-features-map.md) | Every AI feature mapped to its precise workspace location                                                |
| 3      | The Explorer (planned)                               | Left sidebar: Sources, Notes, Search, Tags, Starred tabs with advanced filtering                         |
| 4      | The Context Panel (planned)                          | Right sidebar: Links, Details, AI Chat, Tasks tabs                                                       |
| 5      | The Workspace Engine (planned)                       | Multi-pane splits, tabs, peek drawer, popout windows, saved workspaces                                   |
| 6      | The Command Surface (planned)                        | Command palette (Cmd+K), skill activation, natural language + slash commands                             |
| 7      | The Graph and Canvas (planned)                       | Case knowledge graph, spatial canvas, cross-case entity networks                                         |
| 8      | The Hover Layer (planned)                            | Hover previews, transclusion, block references, progressive disclosure                                   |
| 9      | The AI Gardener (planned)                            | Emergence detection, progressive enrichment, standing orders, morning briefings                          |
| **10** | [The Extension System](./10-the-extension-system.md) | Extension model: Practice Areas, Integrations, Toolkits; how extensions compose with the AI agent system |
| **11** | [Firm-Wide Extensions](./11-firm-wide-extensions.md) | The full Toolkit catalog: 15 firm-wide capabilities organized by function                                |

---

_This document describes the long-term platform vision. [Document 0](./00-platform-overview.md) describes what ships first. [Document 10](./10-the-extension-system.md) specifies the extension architecture. [Document 11](./11-firm-wide-extensions.md) catalogs the toolkit extensions._
