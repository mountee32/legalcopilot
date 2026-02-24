# Document 1: The Workspace Shell

**Series**: Leglise Product Specification
**Date**: February 21, 2026
**Status**: Creative Exploration (No Technical Implementation)
**Purpose**: Define the foundational layout, navigation model, and information architecture for the Leglise workspace -- and where AI lives within it
**Companion Documents**: [00 -- Platform Overview](./00-platform-overview.md), [02 -- Agentic Features Map](./02-agentic-features-map.md), [10 -- The Extension System](./10-the-extension-system.md)

---

## Series Overview

| #     | Title                   | Scope                                                                                               | Status            |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------- |
| **1** | **The Workspace Shell** | Core layout, navigation, info architecture, vocabulary, where AI lives                              | **This document** |
| 2     | The Explorer            | Left sidebar: tabbed modes (Sources, Notes, Search, Tags, Starred), advanced filtering, tag manager | Planned           |
| 3     | The Context Panel       | Right sidebar: tabbed modes (Links, Details, AI Chat, Tasks), per-tab context memory                | Planned           |
| 4     | The Workspace Engine    | Multi-pane splits, saved layouts, tabs, peek drawer, ephemeral workspaces, adaptive composition     | Planned           |
| 5     | The Command Surface     | Command palette (Cmd+K), skill activation, search-first, quick switcher                             | Planned           |
| 6     | The Graph and Canvas    | Knowledge graph (local + global), case canvas, spatial strategy                                     | Planned           |
| 7     | The Hover Layer         | Hover previews, transclusion, block references, progressive disclosure                              | Planned           |
| 8     | The AI Gardener         | Emergence, progressive enrichment, standing orders, briefings, dynamic UI                           | Planned           |

---

## 1. Vision Statement

### Leglise Is Not a Filing Cabinet

Every legal case management platform today is, at its core, a filing cabinet with a search bar. Documents go in. Metadata gets attached. Attorneys dig through folders when they need something. Some platforms add AI as a chatbot in the corner -- a feature bolted onto an architecture designed for storage.

Leglise is something different. **Leglise is a Virtual Associate.**

A Virtual Associate does not wait to be asked. It reads every document that enters the case. It tracks every entity, every date, every contradiction. It monitors deadlines, detects treatment gaps, surfaces connections the attorney has not noticed, and prepares the morning briefing before the attorney pours their coffee. It learns from every correction, every preference, every strategic decision -- and it remembers, across cases, across years.

The workspace shell described in this document is the physical form of that Virtual Associate. Every zone, every panel, every interaction surface is designed to make the associate's intelligence visible, navigable, and actionable.

### The Three Rails

The Virtual Associate operates on three rails that run through every feature in the platform:

**Intelligence** -- the ability to understand. Entity extraction, contradiction detection, emergence analysis, cross-case pattern recognition, progressive enrichment. The associate reads, comprehends, and connects.

**Context** -- the ability to remember. Per-case strategy, per-user preferences, per-firm institutional knowledge. The Two-Level Architecture (Case Agnostic and Case Specific) ensures that every piece of knowledge has a clear scope and that nothing is lost between sessions, between cases, or between team members.

**Agency** -- the ability to act. Standing orders, workflow automation, document composition, proactive gap detection, morning briefings. The associate does not just analyze -- it executes, on a schedule, with transparency and user approval.

### The Skill Decomposition Framework

Not every task requires the same level of AI sophistication. The Virtual Associate's capabilities decompose into three categories that determine how they are built, how much autonomy they receive, and how they appear in the UI:

**Category 1 -- Deterministic Skills**: Rule-based, predictable, fully automatable. Deadline calculation, form validation, document classification by known patterns, statute lookup. These run silently in the background and surface results in the top bar or context panel. They never need approval because they never guess.

**Category 2 -- Augmented Skills**: AI-assisted but human-directed. Entity extraction with confidence scoring, contradiction detection with evidence citation, demand letter section drafting with supporting sources. These appear as suggestions in the AI Assistant, the context panel, and the command palette. They propose; the attorney disposes.

**Category 3 -- Autonomous Skills**: Complex reasoning across multiple documents and cases. Cross-case pattern recognition, case outcome prediction, strategic gap analysis, morning briefing synthesis. These require the full depth of the Virtual Associate's intelligence and are surfaced with explicit confidence levels and supporting evidence. The attorney reviews and decides.

The full skill decomposition framework, including the Agent Hierarchy (Agents, Skills, and Learned Rules) and the Two-Level Architecture, is detailed in the [Agentic AI Creative Exploration](../agentic-ai-creative-exploration.md) companion document.

### Who Uses This Workspace

The shell must serve every role in a WA workers' compensation firm. Each user story grounds a design decision:

**Maria, paralegal**: Opens 40 documents a day across 8 cases. She needs fast switching between cases, bulk entity review, and the ability to see which documents are processed and which need attention -- without clicking into each one.

**James, senior attorney**: Prepares for a BIIA hearing next week. He needs the case canvas to lay out his argument spatially, the AI Assistant to draft deposition questions, and the knowledge graph to find contradictions the opposing side has missed.

**Sandra, associate attorney**: Preparing her first hearing. She needs the case map to understand a case she inherited, the Virtual Associate's cross-case intelligence to see how similar cases resolved, and the morning briefing to prioritize her day.

**Carlos, injured worker**: Logs into the client portal to check his case status and upload a new medical record. His experience is separate from the firm workspace but his data flows into the case graph.

**Linda, office manager**: Monitors case health across the firm, reviews billing, and manages standing orders. She needs the firm-level dashboard, the morning briefing, and the standing orders dashboard.

**Derek, new paralegal**: Started last week. The Virtual Associate's institutional knowledge -- firm-wide learned rules, case archetypes, default strategies -- means he is productive on day one, not day ninety.

---

## 2. Sources and Notes: The Two Hemispheres

This is the foundational insight that shapes everything else.

### The Distinction

Every piece of content in a case is exactly one of two things:

**Sources** -- immutable documents in the case record:

- Medical records, IME reports, L&I orders, employer correspondence
- Deposition transcripts, police reports, witness statements
- Imaging studies, lab results, functional capacity evaluations
- Bills, payment records, wage documentation
- **Sent correspondence** -- demand letters, appeals, motions, and any document the firm sends to an external party (opposing counsel, L&I, providers, the client). Once sent, it becomes part of the permanent case record.

Sources come from two directions: documents received from the outside world, and documents sent out by the firm. The common thread is immutability -- once a document enters the case record (by receipt or by transmission), it is frozen. You do not edit a sent demand letter; you create a new version. You do not modify a received medical record; you annotate it.

You upload Sources, extract from them, annotate them, cite them. They are the evidentiary foundation of the case.

**Notes** -- living work product that has not yet been sent:

- Case strategy briefs, demand letter _drafts_, settlement analyses
- Deposition prep outlines, hearing summaries, case chronologies
- Case maps, journal entries, research memos
- Doctor questionnaire drafts, client interview notes

You create Notes, edit them, iterate on them, finalize them. They are your thinking. They are where evidence becomes argument. When a Note is finalized and sent to an external party, it graduates to a Source -- frozen in the case record as the version that was actually transmitted.

### How They Relate

Notes cite Sources. A demand letter draft cites specific passages from medical records. A strategy brief references the IME report's contradictions. A case map annotates which documents support which arguments.

Notes also cite other Notes. A demand letter draft might reference the settlement analysis. A deposition prep outline might reference the case chronology.

Sources never cite anything -- they are what they are. But Sources _relate to_ other Sources through extracted entities: the same provider appears in multiple records, the same diagnosis is confirmed or contradicted across documents, the same date is referenced in several filings.

```
                  +-------------------------------------------+
                  |            THE CASE GRAPH                  |
                  |                                            |
    SOURCES       |     +-------+       +-------+             |    NOTES
  (evidence)      |     | Src A +--entity--+ Src B |          |  (work product)
                  |     +--+----+       +---+---+             |
  +----------+    |        |                |                 |   +----------+
  | Medical  |    |     extracted         extracted            |   | Strategy |
  | Records  +----+        |                |                 +---+ Brief    |
  | IME Rpts |    |     +--+----+       +--+----+            |   | Demand   |
  | L&I Docs |    |     |Entity +--rel--+Entity |            |   | Letter   |
  | Employer |    |     |(Dr.X) |       |(Dx Y) |            |   | Case Map |
  | Filings  |    |     +--+----+       +--+----+            |   | Journal  |
  +----------+    |        |                |                 |   +----------+
                  |     cited by          cited by             |
                  |        |                |                 |
                  |     +--+----------------+--+              |
                  |     |      Note X          |              |
                  |     |  (cites entities     |              |
                  |     |   from sources)       |              |
                  |     +----------------------+              |
                  +-------------------------------------------+
```

### Visual Differentiation

Sources and Notes must be visually distinct at a glance. Not subtly different -- immediately, obviously, always distinguishable.

```
SOURCE (immutable evidence)          NOTE (living work product)
+-------------------------+          +-------------------------+
| [doc] Dr. Smith ROM Report |       | [pen] Strategy Brief v3    |
| --- --- --- --- --- --  |          | --- --- --- --- --- --  |
| Medical  |  Feb 28, 2024|          | Strategy |  Draft       |
| Layer 3  |  Read-only   |          | Edited 2h ago | Editable|
+-------------------------+          +-------------------------+
  ^ Document icon                      ^ Pen/edit icon
  ^ Evidence color (warm amber)        ^ Work product color (cool blue)
  ^ Read-only badge                    ^ Status badge (draft/final)
  ^ Enrichment layer indicator         ^ Last edited timestamp
  ^ Domain label (Medical)             ^ Category label (Strategy)
```

The color system:

- **Sources**: Warm amber/gold tones -- the color of evidence, of documents, of the physical world
- **Notes**: Cool blue/slate tones -- the color of thought, of composition, of the attorney's mind
- **Entities**: Distinct per domain (Medical green, Legal indigo, L&I teal, Vocational purple, Employer orange, Financial amber)
- **AI elements**: Subtle violet -- present but never dominant

### AI Behavior: The Virtual Associate Reads the Room

The Virtual Associate does not need a mode switch. It reads context:

**When the attorney is viewing a Source**, the associate is analytical:

- "This document contains 3 entities that contradict the IME report."
- "The ROM measurement on page 3 differs from the one on page 7 of this same record."
- "This treatment note mentions 'overhead activity' -- this connects to the job analysis."
- Tools offered: Extract, Summarize, Cross-reference, Find contradictions, Timeline placement

**When the attorney is editing a Note**, the associate is creative and strategic:

- "Your demand letter cites Dr. Smith's ROM findings but doesn't address the IME's counter-measurement. Consider adding a rebuttal paragraph."
- "This strategy brief mentions a treatment gap. Based on case law, WAC 296-20-01002 is relevant."
- "The settlement range in this analysis seems low compared to 7 similar cases in the firm."
- Tools offered: Draft, Strengthen argument, Fact-check against sources, Suggest citations, Compare to precedent

No toggle. No "switch to analytical mode." The associate reads what you are looking at and what you are doing, and adjusts its posture accordingly. This is the Context rail in action -- the associate maintains awareness of the current hemisphere and adapts without being told.

---

## 3. The Fundamental Layout -- Five Zones

The shell is five zones. It persists across every view, every state, every context. The zones resize, collapse, and adapt -- but they never rearrange. Spatial consistency is sacred.

```
+---------------------------------------------------------------------------------------------+
| TOP BAR: Martinez v. WA L&I | WA-2024-XXXXX | 56 src | 18 notes | 142 entities | Cmd+K     |
| Case > Medical > Dr. Smith ROM Report                    [Processing 3 docs...] [Agent idle] |
+--+----------------------+----------------------------------------------+--------------------+
|  |  EXPLORER             |          CONTENT AREA                        |   CONTEXT PANEL    |
|R |  [src][note][srch]    |                                              |   [link][dtl]      |
|I |  [tag][star]          |  +- Doc A -+- Doc B -+- Note C ---+         |   [chat][task]     |
|B |  ------------------- |  |         |         |            |         |   ----------------  |
|B |  Sort v | Filter v    |  |  +------+---------+----------+ |         |                    |
|O |  -------------------  |  |  |                            | |         |  BACKLINKS         |
|N |                       |  |  |                            | |         |  <- From Sources:  |
|  |  [doc] Medical (23)   |  |  |     Active content         | |         |    DOC-047 (p.3)   |
|  |    [doc] Dr. Smith ROM|  |  |     (document, note,       | |         |    DOC-089 (p.7)   |
|  |    [doc] Dr. Chen Eval|  |  |      entity, graph,        | |         |  <- From Notes:    |
|  |  [doc] Legal (8)      |  |  |      canvas, chat...)      | |         |    Strategy Brief  |
|  |  [doc] L&I (15)       |  |  |                            | |  PEEK   |    Demand Letter   |
|  |  [doc] Employer (6)   |  |  |                            | | DRAWER  |                    |
|  |  [doc] Vocational (4) |  |  |                            | | (40%    |  PROPERTIES        |
|  |                       |  |  |  [Popout ->] [Split |]     | | width,  |  Type: Medical     |
|  |                       |  |  +----------------------------+ | slides  |  Date: Feb 28 '24  |
|  |                       |  +---------------------------------+ | from   |  Author: Dr. Smith |
|  |                       |                                      | right) |                    |
|  |  56 sources, 18 notes |                                      |        |  AI INSIGHTS       |
|  |                       |                                      |        |  ! 1 contradiction  |
+--+-----------------------+--------------------------------------+--------+--------------------+
```

### Zone 1: Top Bar (persistent header, ~48px)

The top bar replaces the traditional bottom status bar. It provides persistent context and quick access to the most important information at all times, positioned where the eye naturally starts -- the top of the screen.

**Left section -- Case Context**:

- Active case name and WA L&I claim number
- Breadcrumb trail: Firm > Case > Domain > Document

**Center section -- Counts and Status**:

- Source count, note count, entity count (clickable to filter)
- Processing status indicator (when documents are being ingested/extracted)
- Agent activity indicator: "Idle", "Processing 3 docs...", "Running morning briefing...", "Standing order: deadline sweep"

**Right section -- Actions**:

- `Cmd+K` hint (always visible, always available)
- Notifications bell (extraction reviews, deadline alerts, emergence signals)
- Quick case switcher (dropdown of recent cases)

```
TOP BAR STATES
==============================================================

  Case active, no processing:
  +-----------------------------------------------------------------------+
  | Martinez v. WA L&I | WA-2024-XXXXX | 56 src | 18 notes | 142 ent    |
  | Case > Medical > Dr. Smith ROM Report                    Cmd+K  [!3]  |
  +-----------------------------------------------------------------------+

  Case active, documents processing:
  +-----------------------------------------------------------------------+
  | Martinez v. WA L&I | WA-2024-XXXXX | 56 src | 18 notes | 142 ent    |
  | Case > Medical                      [Processing 3 docs...] Cmd+K [!3]|
  +-----------------------------------------------------------------------+

  Case active, agent working:
  +-----------------------------------------------------------------------+
  | Martinez v. WA L&I | WA-2024-XXXXX | 56 src | 18 notes | 142 ent    |
  | Case > Medical         [Agent: Running contradiction scan] Cmd+K [!3] |
  +-----------------------------------------------------------------------+

  No case selected (firm view):
  +-----------------------------------------------------------------------+
  | Emerald Legal | 24 active cases | 1,847 sources | 8,429 entities     |
  |                                                          Cmd+K  [!5]  |
  +-----------------------------------------------------------------------+
```

**Why top bar, not bottom status bar**: The bottom of the screen is low-visibility real estate, especially on large displays. Attorneys need case context and agent status at a glance, without looking down. The top bar follows the pattern of modern IDEs (VS Code, JetBrains) where the most important contextual information lives at the top, while the bottom is reserved for transient notifications.

### Zone 2: Ribbon (leftmost icon strip, ~40px wide)

The ribbon is the thinnest, most persistent element. It is always visible, never collapses. It provides firm-level navigation and quick access to global functions.

```
+--+
|fm|  Firm switcher (switch firms -- rare but necessary for multi-firm users)
|--|
|db|  Dashboard (case overview)
|dc|  Documents (sources & notes)
|ca|  Calendar (deadlines & events)
|cm|  Communications (correspondence)
|ai|  AI (management & configuration)
|--|
|sg|  Settings
|--|
|up|  User / profile
+--+
```

The ribbon creates the feeling of "this is a serious tool" -- a professional workspace, not a web app. Every icon opens its content in the content area, not in a popup or modal.

### Zone 3: Explorer (left sidebar, ~240px default, collapsible)

A multi-mode panel with top-level tabs that swap the entire panel content. Each tab has its own toolbar for mode-specific controls (sort, filter, group by).

| Tab         | Icon   | Purpose                                                                                                                                                                                                           |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sources** | doc    | Source document tree organized by domain (Medical, Legal, L&I, Employer, Vocational). Filters: date range, enrichment level, domain, processing status. Sort: date, name, relevance, recently viewed.             |
| **Notes**   | pen    | Notes tree organized by category (Strategy, Drafts, Journal, Case Maps, Research). Filters: status (draft/final), author, last edited. Sort: date, name, recently edited.                                         |
| **Search**  | search | Full-text and semantic search across both sources and notes. Results grouped by type with match previews. Saved searches.                                                                                         |
| **Tags**    | tag    | Full tag manager. Browse all tags hierarchically, create/rename/delete/merge tags, assign custom colors and icons, view usage counts, bulk tag/untag operations. Tags are fully customizable first-class objects. |
| **Starred** | star   | Pinned items from both sources and notes. Drag anything here for quick access. Manual ordering.                                                                                                                   |

```
+- EXPLORER ----------------------------+
|  [src] [note] [srch] [tag] [star]     |  <- tabs
|  -----------------------------------  |
|  Sort: Date v  |  Filter: All v       |  <- per-tab toolbar
|  Group: Domain v                       |
|  -----------------------------------  |
|  [doc] Medical (23)                    |
|    [doc] Dr. Smith ROM Report          |
|    [doc] Dr. Smith Surgical Rpt        |
|    [doc] Dr. Chen Initial Eval         |
|  [doc] Legal (8)                       |
|  [doc] L&I (15)                        |
|  [doc] Employer (6)                    |
|  [doc] Vocational (4)                  |
|                                        |
|  56 sources                            |
+----------------------------------------+
```

#### Advanced Filtering for Large Collections

Cases with 100+ documents are common. Cases with 1000+ documents exist. The explorer must handle large collections without collapsing under their own weight.

**Persistent filter bar**: Always visible at the top of the Sources and Notes tabs. Does not hide behind a menu. Multi-faceted filters stack:

```
+- EXPLORER (Sources) ------------------+
|  [src] [note] [srch] [tag] [star]     |
|  -----------------------------------  |
|  Filter: Medical + Unreviewed + 2024  |  <- active filters shown
|  [x Medical] [x Unreviewed] [x 2024] |  <- click to remove
|  [+ Add filter]                        |
|  -----------------------------------  |
|  Showing 12 of 56 sources             |  <- result count
|  -----------------------------------  |
|  [doc] Dr. Smith ROM Report     L3    |
|  [doc] Dr. Chen Initial Eval   L1    |
|  [doc] Progress Note 03/15     L2    |
|  [doc] PT Referral Letter      L1    |
|  ... (8 more, virtual scroll)         |
+----------------------------------------+
```

**Available filter dimensions**:

- Domain: Medical, Legal, L&I, Employer, Vocational, Financial
- Date range: Custom range, Last 30/60/90 days, By year
- Enrichment level: Layer 0-5 (raw through citation)
- Processing status: Processed, Pending review, Extraction failed
- Tags: Any tag or tag combination
- Provider: Filter by mentioned provider
- Review status: Reviewed, Unreviewed, Needs correction

**Saved filter presets**: Attorneys create named presets for filters they use repeatedly:

- "All unreviewed medical" (Domain: Medical + Status: Unreviewed)
- "Key evidence" (Tag: #key-evidence)
- "Recent 30 days" (Date: Last 30 days)
- "IME documents" (Tag: #adversarial + Domain: Medical)

**Performance features**:

- Virtual scrolling for lists exceeding 100 items
- Collapsible domain groups with item counts
- Keyboard navigation: type to filter within the visible tree
- Lazy loading of document metadata on scroll

The tag manager tab deserves special emphasis -- tags in Leglise are not afterthoughts. They are the cross-cutting organizational layer that works across both Sources and Notes:

```
+- EXPLORER (Tags) ---------------------+
|  [src] [note] [srch] [tag] [star]     |
|  -----------------------------------  |
|  [+ New Tag]  |  Search tags...       |
|  -----------------------------------  |
|  [red]  #adversarial (7)       [gear] |
|  [grn]  #medical (48)          [gear] |
|     #medical/provider (12)            |
|     #medical/diagnosis (8)            |
|     #medical/procedure (15)           |
|  [yel]  #urgent (3)            [gear] |
|  [blu]  #gap (2)               [gear] |
|  [pur]  #key-evidence (5)      [gear] |
|  [wht]  #needs-review (8)      [gear] |
|                                        |
|  [gear] = edit color, icon, rename,   |
|      merge, delete                     |
+----------------------------------------+
```

The explorer is detailed in Document 2.

### Zone 4: Content Area (center, flexible, the main stage)

This is where all actual work happens. Four capabilities layered together: tabs, panes, popout, and peek.

**Tabs**: Every pane supports browser-style tabs. Open multiple documents, notes, entities, views -- each as a tab within a pane. Drag tabs to reorder. Middle-click to close. Right-click for "Close others", "Close to the right", "Move to new pane", "Open in new window". Back/forward navigation per tab (like browser history).

**Panes**: The content area can split into up to 4 panes (2x2 grid, or vertical/horizontal stacks). Each pane has its own independent tab bar. Drag a tab from one pane to another to move it. Drag a tab to an edge of the content area to create a new split. Double-click a pane's header to maximize it (hiding other panes temporarily).

**Popout**: Any tab can be popped into its own OS-level browser window. Right-click tab > "Open in new window", or drag a tab outside the app frame. The popout window is lightweight -- content area only, no sidebars -- but can optionally show a minimal context panel. Ideal for multi-monitor setups: PDF on one screen, strategy brief on the other, AI Chat on a third.

**Peek Drawer**: Clicking an entity or node reference from the context panel, explorer, or any inline link opens a slide-over peek drawer from the right side (~40% width). The peek drawer shows key information about the entity -- properties, backlinks, connected entities, AI insights -- without creating a new tab. An "Open as tab" button at the top promotes the peek into a full content tab. This prevents the tab proliferation that plagues exploratory work: quick lookups stay ephemeral, deep dives become tabs.

```
CONTENT AREA: MULTI-TAB, MULTI-PANE, POPOUT, PEEK
================================================================

  Single pane with tabs:
  +- DOC-047 -+- DOC-089 -+- Strategy Brief -+- + ----------+
  | v active  |           |                   |              |
  |  [content]                                               |
  +----------------------------------------------------------+

  Two-pane vertical split:
  +- DOC-047 -+- DOC-089 --++- Strategy Brief -+- Case Map -+
  | v active  |            || v active          |            |
  |  [source content]      ||  [note content]                |
  |                        ||                                |
  +------------------------++--------------------------------+

  Content pane with peek drawer open:
  +- DOC-047 -+- DOC-089 --------+--- PEEK: Dr. Sarah Smith ---+
  | v active  |                   |                              |
  |  [PDF content displayed       | Treating orthopedic surgeon  |
  |   here with annotations       | 12 documents | 4 notes      |
  |   and highlights]             | ROM: 95 deg flexion         |
  |                               | ! Contradicts IME by 25 deg |
  |                               |                              |
  |                               | [Open as tab ->]             |
  +-------------------------------+------------------------------+

  Popout window (separate OS window, e.g., second monitor):
  +=============================================+
  |  DOC-047: Dr. Smith ROM Report      [-][x]  |
  |  ------------------------------------------ |
  |                                              |
  |  [Full PDF content, no sidebars]             |
  |                                              |
  |  Optional: [Show context panel]              |
  +=============================================+
```

**Any view type**: A pane/tab can hold a document viewer, a note editor, an entity page, the graph, the canvas, the timeline, the AI Chat, a filtered document list, the case dashboard, the trust accounting view, or any other view.

The content area is detailed in Document 4 (The Workspace Engine).

### Zone 5: Context Panel (right sidebar, ~280px default, collapsible)

A multi-mode panel with top-level tabs, mirroring the explorer's architecture. Each tab serves a fundamentally different purpose. Each has its own toolbar. Four tabs now, expanding the original three with a dedicated Details tab.

| Tab         | Icon  | Purpose                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Links**   | link  | Structural context: backlinks (from Sources and Notes, separated), outgoing links, unlinked mentions. This is the "what is connected to this?" view.                                                                                                                                                                                                                          |
| **Details** | info  | Content metadata: document summary, extracted entities list, relationships, enrichment level with progressive enrichment timeline, properties panel, processing history. This is the "what does the Virtual Associate know about this?" view.                                                                                                                                 |
| **AI Chat** | chat  | Conversational AI Assistant -- the AI's default home. Context-aware to the active content tab. AI Chat can also be opened as a content pane in Zone 4 (drag from Zone 5 or Cmd+K: `/chat`). Multiple concurrent instances supported, each with its own conversation context. Zone 5 is collapsible. Supports conversation management (save, switch between multiple threads). |
| **Tasks**   | check | Case task management: todos, deadlines, action items, assignments. Filtered to the current case. Create tasks from any context ("Add to tasks" from a contradiction, an AI suggestion, or a journal entry).                                                                                                                                                                   |

```
+- CONTEXT PANEL -----------------------+
|  [link] [info] [chat] [check] <- tabs  |
|  -----------------------------------  |
|  Filter: All backlinks v               |  <- per-tab toolbar
|  -----------------------------------  |
|                                        |
|  BACKLINKS (7)                         |
|  -- From Sources:                      |
|    DOC-089 p.7 (IME contradicts)       |
|    DOC-031 p.2 (PT referral)           |
|    DOC-023 p.4 (follow-up)             |
|  -- From Notes:                        |
|    Strategy Brief "key evidence"       |
|    Demand Letter Sec II, p4            |
|                                        |
|  OUTGOING LINKS (5)                    |
|  -> Dr. Sarah Smith                    |
|  -> Right rotator cuff tear            |
|  -> ROM: 95 deg flexion               |
|  -> Physical therapy referral          |
|  -> Feb 28, 2024                       |
|                                        |
|  AI INSIGHTS                           |
|  ! ROM contradicts IME by 25 deg       |
|  ! 2 unlinked references detected      |
+----------------------------------------+
```

**The Details tab** separates content-level metadata from structural connections:

```
+- CONTEXT PANEL (Details tab) ---------+
|  [link] [info] [chat] [check]          |
|  -----------------------------------  |
|                                        |
|  PROPERTIES                            |
|  Type: ROM Report                      |
|  Domain: Medical                       |
|  Author: Dr. Sarah Smith               |
|  Date: Feb 28, 2024                    |
|  Pages: 4                              |
|  Claim: WA-2024-XXXXX                  |
|                                        |
|  ENRICHMENT                            |
|  Level: 3/5 (Cross-reference)          |
|  [===|===|===|---|---]                 |
|  L0: Uploaded Jan 15                   |
|  L1: 8 entities extracted Jan 15       |
|  L2: Attorney reviewed Jan 16          |
|  L3: 1 contradiction found Jan 20     |
|  L4: -- pending strategy integration   |
|  L5: -- not yet cited                  |
|                                        |
|  EXTRACTED ENTITIES (8)                |
|  [person] Dr. Sarah Smith              |
|  [dx] Right rotator cuff tear          |
|  [measure] ROM: 95 deg flexion        |
|  [date] Feb 28, 2024                   |
|  ... 4 more                            |
|                                        |
|  SUMMARY (AI-generated)                |
|  Post-surgical ROM assessment showing  |
|  limited recovery at 6 months. Flexion |
|  95 deg, abduction 85 deg. Key        |
|  evidence for impairment rating.       |
+----------------------------------------+
```

**Per-tab context memory**: Each content tab in the main content area remembers which context panel mode was active and its scroll position. Switch from Doc A (viewing backlinks on the Links tab) to Doc B (mid-conversation on the AI Chat tab) and back to Doc A -- the context panel restores to the Links tab exactly where you left it. This prevents the jarring experience of losing your place every time you switch documents.

The context panel is detailed in Document 3.

---

## 4. Navigation Model

The navigation philosophy: **you navigate through links, not through menus.** You do not go to the "providers page" and find Dr. Smith. You encounter Dr. Smith's name in a document, click it, and arrive at her entity page (or more commonly, her peek drawer). From there, you see every document that mentions her, every contradiction involving her, every timeline event she is part of.

This is link-first navigation. Menus exist as fallbacks, not as primary paths.

### Four Layers: Firm, Case, Content, Peek

**Layer 1: Firm Level** -- moving between cases and global views

```
FIRM-LEVEL NAVIGATION
===========================================

  Cmd+O  ->  Quick switcher: type case name, jump instantly
             "mart..." -> Martinez v. WA L&I
             "bow..."  -> Bowman v. Employer Inc.

  Ribbon firm -> Firm switcher: case list, firm dashboard, global graph

  Ribbon search -> Global search: search across ALL cases
              (results grouped by case, with case context)

  Top bar case dropdown -> Recent cases list
```

Key principle: switching cases is as fast as switching files in an IDE. No page loads, no navigation trees. Type and jump.

**Layer 2: Case Level** -- navigating within a case

```
CASE-LEVEL NAVIGATION
===========================================

  Explorer [src]  ->  Sources tab: browse by domain, filter, sort
  Explorer [note] ->  Notes tab: browse by category, filter by status
  Explorer [srch] ->  Search tab: full-text + semantic across everything
  Explorer [tag]  ->  Tags tab: browse, filter, manage tags
  Explorer [star] ->  Starred tab: pinned items for fast access

  Cmd+O     ->  Quick switcher also works within a case:
               "dr smith" -> Dr. Smith entity page
               "rom" -> ROM Assessment document
               "strategy" -> Strategy Brief note
```

**Layer 3: Content Level** -- navigating within and between open items

```
CONTENT-LEVEL NAVIGATION
===========================================

  Links     ->  Click any entity reference to open its page
               Dr. Smith -> entity page for Dr. Smith
               DOC-047 -> document viewer for that record
               Feb 28, 2024 -> timeline view centered on that date

  Tabs      ->  Multiple items open in a single pane
               Back/forward per pane (like browser history)

  Breadcrumbs -> Case > Medical > Dr. Smith ROM Report
                Click any segment to navigate up

  Hover     ->  Hold Cmd + hover over any link for preview
               See key details without leaving current context
               (Detailed in Document 7)

  Backlinks ->  Context panel shows what references this item
               Click any backlink to navigate to the source
```

**Layer 4: Peek Level** -- lightweight entity inspection without navigation

```
PEEK-LEVEL NAVIGATION
===========================================

  Click entity in context panel  ->  Peek drawer slides in from right
  Click entity in inline text    ->  Peek drawer slides in from right
  Click entity in explorer       ->  Peek drawer slides in from right

  Peek drawer shows:
    Entity summary, properties, backlinks, AI insights
    Connected entities (clickable -- opens nested peek or tab)
    "Open as tab" button -> promotes to full content tab

  Dismiss peek:
    Click outside, press Escape, or click another entity
    (new peek replaces current one -- no stacking)
```

The peek level sits between hover preview (momentary, Cmd+hover) and full tab navigation (persistent, committed). It is the natural resting point for exploratory work: "let me check something" without losing your place.

### The Navigation Principle

Every navigation target is reachable in at most 2 steps:

1. **Cmd+O** (quick switch to anything by name)
2. **Click a link** (navigate from any node to any connected node)

Menus, explorer trees, and tabs are convenience layers. The fundamental navigation is: **search or follow a link.** If you can name it, you can reach it. If something references it, you can follow the reference.

---

## 5. The Three States of the Shell

The layout adapts based on what level of focus the user has. The zones do not rearrange -- they resize and fill differently.

### State 1: Firm View (no case selected)

When the user has not opened a case, they see the firm-level view. This is the Virtual Associate's morning greeting -- a synthesized picture of what matters across the firm right now.

```
+---------------------------------------------------------------------------------------------+
| TOP BAR: Emerald Legal | 24 active cases | 1,847 sources | 8,429 entities | Cmd+K    [!5]   |
+--+--------------------------------------------------------------------------------------+---+
|  |                                                                                       |   |
|R |                            FIRM DASHBOARD                                             |   |
|I |                                                                                       |   |
|B |  +--- MORNING BRIEFING (Today, Feb 21) ------------------------------------+          |   |
|B |  |                                                                          |          |   |
|O |  |  !! URGENT: Martinez -- statute of limitations in 47 days.              |          |   |
|N |  |     IME rebuttal not filed.                                              |          |   |
|  |  |  ** 3 cases have new documents. 2 need entity review.                   |          |   |
|  |  |  OK Johnson settlement conference next Tuesday. Draft ready.            |          |   |
|  |  |                                                                          |          |   |
|  |  |  [Open briefing ->]  [Dismiss until tomorrow]                           |          |   |
|  |  +--------------------------------------------------------------------------+          |   |
|  |                                                                                       |   |
|  |  +--- CASES NEEDING ATTENTION -------+  +--- RECENT CASES -------------------+       |   |
|  |  |                                    |  |                                     |       |   |
|  |  |  Garcia v. WA L&I      Health: 42% |  | Martinez v. WA L&I     2h ago  [78%]|      |   |
|  |  |  12 unreviewed docs, 27 pending    |  | Bowman v. Employer     1d ago  [95%]|      |   |
|  |  |  entities. Strategy stale 5 weeks. |  | Chen v. ABC Corp       3d ago  [60%]|      |   |
|  |  |  [Open case ->]                     |  |                                     |       |   |
|  |  |                                    |  | [View all 24 cases ->]               |       |   |
|  |  |  Thompson v. WA L&I    Health: 55% |  +-------------------------------------+       |   |
|  |  |  Deadline in 30 days. No response  |                                                |   |
|  |  |  to discovery request.             |  +--- CROSS-CASE INTELLIGENCE ----------+      |   |
|  |  |  [Open case ->]                     |  |                                       |      |   |
|  |  +------------------------------------+  |  Dr. Thompson IME pattern detected:   |      |   |
|  |                                           |  7 of 7 cases -> MMI conclusion.      |      |   |
|  |  +--- FIRM STATS ---------+               |  ROM 20%+ higher than treating in 4.  |      |   |
|  |  | Active cases: 24       |               |  [View analysis ->]                   |      |   |
|  |  | Total sources: 1,847   |               |                                       |      |   |
|  |  | Total entities: 8,429  |               |  ABC Warehouse appeared in 3 cases.   |      |   |
|  |  | Processed today: 12    |               |  RTW offers within 10 days of every   |      |   |
|  |  +------------------------+               |  restriction letter.                   |      |   |
|  |                                           |  [View pattern ->]                     |      |   |
|  |  +--- GLOBAL GRAPH (miniature) -----------------------------------+                |   |
|  |  |  o Martinez -- o Dr.Smith -- o Bowman (same provider!)          |                |   |
|  |  |  o Chen -- o Dr.Thompson -- o Martinez (same IME examiner!)    |                |   |
|  |  +----------------------------------------------------------------+                |   |
+--+------------------------------------------------------------------------------------+---+
```

Key elements of the firm view:

- **Morning Briefing**: The Virtual Associate's daily report, synthesized from standing orders, overnight processing, deadline tracking, and case health scores. Priority-ranked: urgent items first, then attention items, then routine updates.
- **Cases Needing Attention**: Cases ranked by health score, with specific reasons for low scores. Not a generic list -- each entry explains what needs to happen.
- **Cross-Case Pattern Recognition**: The Intelligence rail at work -- patterns that span multiple cases, surfaced automatically by the Virtual Associate's Case Agnostic analysis.
- No explorer (no case selected to browse)
- No context panel (nothing focused)
- Content area fills the space with the firm dashboard

### State 2: Case View (case open, nothing focused)

When the user opens a case, they see the case-level overview. This is the launchpad into deeper work.

```
+---------------------------------------------------------------------------------------------+
| TOP BAR: Martinez v. WA L&I | WA-2024-XXXXX | 56 src | 18 notes | 142 ent | Cmd+K    [!2]  |
+--+----------------------+----------------------------------------------+--------------------+
|  |  EXPLORER             |       CASE DASHBOARD                         |  CONTEXT PANEL     |
|R |  [src][note][srch]    |                                              |  [link][info]      |
|I |  [tag][star]          |  +- CASE MAP (summary) ----------------+    |  [chat][check]     |
|B |  ------------------- |  | Core dispute: Work-relatedness of    |    |  ----------------  |
|B |  Sort v | Filter v    |  | rotator cuff tear. Employer claims    |    |                    |
|O |  -------------------  |  | pre-existing.                         |    |  CASE STATUS       |
|N |  [doc] Medical (23)   |  | Strongest: Dr. Smith ROM findings    |    |  Sources: 56       |
|  |  [doc] Legal (8)      |  | Weakest: Treatment gap (45 days)     |    |  Reviewed: 48/56   |
|  |  [doc] L&I (15)       |  | Missing: FCE, perm letter            |    |  Entities: 142     |
|  |  [doc] Employer (6)   |  +----------------------------------------+    |  Verified: 128/142 |
|  |  [doc] Vocational (4) |                                              |  Notes: 18         |
|  |                       |                                              |  Notes: 18         |
|  |                       |                                              |  Last tended: 2d   |
|  |                       |                                              |                    |
|  |                       |                                              |  OPEN ACTION ITEMS |
|  |                       |                                              |  [ ] Review 3      |
|  |                       |                                              |    flagged entities |
|  |                       |                                              |  [ ] Update Case   |
|  |                       |  +- CONTRADICTIONS (active) ------+           |    Strategy Brief  |
|  |                       |  | ! ROM: Smith 95 vs IME 120    |           |  [ ] Request FCE   |
|  |                       |  | ! RTW: Smith 6wk vs IME now   |           |                    |
|  |                       |  +--------------------------------+           |                    |
|  |                       |                                              |                    |
|  |                       |  +- LOCAL GRAPH (miniature) ------+           |                    |
|  |                       |  |  o--o--o--o (key entities)     |           |                    |
|  |  56 sources, 18 notes |  +--------------------------------+           |                    |
+--+-----------------------+----------------------------------------------+--------------------+
```

- Explorer shows Sources tab (default on case open) with domain tree
- Content area shows the case dashboard: Case Map summary, contradictions, local graph
- Context panel shows case health and open action items
- **Open Action Items**: Tasks generated from Virtual Associate analysis -- entity reviews, strategy updates, record requests

### State 3: Focus View (node focused)

When the user opens a specific Source or Note, the layout optimizes for deep work.

```
FOCUS VIEW -- SOURCE (reading a medical record)
+---------------------------------------------------------------------------------------------+
| TOP BAR: Martinez v. WA L&I | Case > Medical > Dr. Smith ROM Report          Cmd+K    [!2]  |
+--+----------------------+----------------------------------------------+--------------------+
|  |  EXPLORER             |       CONTENT AREA                           |   CONTEXT PANEL    |
|R |  [src][note][srch]    |                                              |   [link][info]     |
|I |  [tag][star]          |  +- DOC-047 -+- DOC-089 -+- Note --------+  |   [chat][check]    |
|B |  ------------------- |  | v active  |           |               |  |   ----------------  |
|B |  Sort v | Filter v    |  |+----------+|                           |  |                    |
|O |  -------------------  |  ||  [doc]   ||                           |  |  BACKLINKS (7)     |
|N |  [doc] Medical (23)   |  || Dr.Smith ||                           |  |  -- From Sources:  |
|  |   > Dr. Smith ROM     |  || ROM Rpt  ||                           |  |  DOC-089 p.7 (IME  |
|  |    [doc] Surgical     |  ||          ||                           |  |    contradicts ROM)|
|  |    [doc] Post-op      |  || Feb 28   ||                           |  |  DOC-031 p.2       |
|  |  [doc] Legal (8)      |  || 2024     ||                           |  |    (PT referral)   |
|  |  [doc] L&I (15)       |  ||          ||                           |  |  -- From Notes:    |
|  |  ...                   |  || [PDF     ||                           |  |  Strategy Brief    |
|  |                       |  ||  content ||                           |  |    "key evidence"  |
|  |                       |  ||  here]   ||                           |  |  Demand Letter v3  |
|  |                       |  ||          ||                           |  |    Sec II, p4      |
|  |                       |  || [Pop ->] ||                           |  |                    |
|  |                       |  |+----------+|                           |  |  AI INSIGHTS       |
|  |                       |  +------------+---------------------------+  |  ! ROM contradicts  |
|  |                       |                                              |    IME by 25 deg    |
|  |                       |                                              |  ! 2 unlinked refs  |
|  |                       |                                              |    in DOC-072       |
+--+-----------------------+----------------------------------------------+--------------------+
```

Key refinements visible in the focus view:

- **Explorer** highlights the currently viewed document in the tree
- **Content Area** has multiple document tabs (DOC-047, DOC-089, a Note) with popout support
- **Context Panel** shows the Links tab with backlinks for the focused DOC-047 tab
- When the user clicks the DOC-089 tab, the context panel will restore DOC-089's remembered state (maybe it was on the AI Chat tab mid-conversation)

**Peek drawer in focus view**: From the focus view, clicking "Dr. Sarah Smith" in the backlinks or in the document content opens the peek drawer from the right, overlaying part of the content area. The attorney sees Dr. Smith's entity summary, connected documents, and contradictions -- without opening a new tab.

Note how the context panel adapts to the focused node:

**For a Source**: backlinks show which other Sources share entities AND which Notes cite this Source. Details tab shows document metadata, enrichment level, and extracted entities. AI insights are analytical (contradictions, unlinked references, enrichment status).

**For a Note**: backlinks show which Sources and Notes reference this Note. Details tab shows author, status (draft/final), last edited, and AI-generated outline. AI insights are strategic (argument strength, missing citations, fact-check warnings).

**For an Entity**: backlinks show every Source and Note mentioning this entity. Details tab shows entity attributes, timeline events, and cross-case appearances. AI insights show contradiction analysis, temporal patterns, and connected entity clusters.

---

## 6. Everything is a Node

This is the core philosophical principle: **every meaningful element in the case is a navigable node with its own identity, properties, backlinks, and connections.**

### Node Types

```
NODE TYPE          ICON    COLOR      NAVIGABLE?  HAS BACKLINKS?  HAS PROPERTIES?
----------------------------------------------------------------------------------
Source (document)   doc     Amber       yes          yes              yes
Note (work prod.)   pen     Blue        yes          yes              yes
Entity (provider)   person  By domain   yes          yes              yes
Entity (diagnosis)  dx      By domain   yes          yes              yes
Entity (procedure)  proc    By domain   yes          yes              yes
Entity (date)       date    Neutral     yes          yes              yes
Entity (measure.)   measure By domain   yes          yes              yes
Entity (location)   place   By domain   yes          yes              yes
Event (timeline)    event   By domain   yes          yes              yes
Tag                 tag     Purple      yes (filter) yes              --
```

### The Universal Node Page

Every node, regardless of type, has the same structural template when viewed. Nodes open in the peek drawer first for quick inspection, then promote to a full content tab on demand.

```
+---------------------------------------------------------------+
|  [person] DR. SARAH SMITH                             Medical  |
|  Treating orthopedic surgeon                                   |
|  [Open as tab ->]                         (if in peek drawer)  |
|---------------------------------------------------------------+
|                                                                |
|  PROPERTIES                                                    |
|  Role: Treating physician                                      |
|  First seen: Jan 10, 2024 (DOC-012)                           |
|  Last seen: Aug 15, 2025 (DOC-098)                            |
|  Documents: 12  |  Notes referencing: 4  |  Events: 5         |
|                                                                |
|  ============================================================= |
|                                                                |
|  WHAT THE VIRTUAL ASSOCIATE KNOWS                              |
|  Dr. Smith is the primary treating physician and your          |
|  strongest witness. Her ROM findings (95 deg flexion) are      |
|  the key evidence for impairment severity. Her records         |
|  contradict the IME examiner on both ROM and return-to-work    |
|  timeline. She has appeared in 3 other firm cases as a         |
|  treating physician, with consistently detailed documentation. |
|                                                                |
|  ============================================================= |
|                                                                |
|  SOURCES MENTIONING DR. SMITH (12)                             |
|  DOC-012  Initial evaluation              Jan 10, 2024    doc |
|  DOC-023  Post-surgical follow-up         Mar 1, 2024     doc |
|  DOC-031  Physical therapy referral       Mar 5, 2024     doc |
|  DOC-047  ROM assessment                  Feb 28, 2024    doc |
|  ...8 more                                                     |
|                                                                |
|  NOTES REFERENCING DR. SMITH (4)                               |
|  Strategy Brief v3     "Our strongest witness"            pen  |
|  Demand Letter v3      Cited in Section II, p4            pen  |
|  Deposition Prep       "Focus on ROM methodology"         pen  |
|  Case Journal Feb 21   "Reviewed Dr. Smith post-op"       pen  |
|                                                                |
|  ============================================================= |
|                                                                |
|  CONNECTED ENTITIES                                            |
|  [dx] Right rotator cuff tear (diagnosed)                      |
|  [place] ABC Warehouse Inc. (employer in her reports)          |
|  [person] Dr. James Thompson (IME, contradicts her findings)   |
|  [proc] Physical therapy (referred)                            |
|  [measure] ROM: 95 deg flexion (measured Feb 28, 2024)        |
|                                                                |
|  ============================================================= |
|                                                                |
|  CONTRADICTIONS                                                |
|  !  ROM: Smith says 95 deg flexion, Thompson IME says 120 deg  |
|  !  RTW: Smith says 6 weeks, Thompson says ready now           |
|                                                                |
|  UNLINKED MENTIONS                                             |
|  ~ "treating surgeon" in DOC-072 (employer letter)             |
|     Likely refers to Dr. Smith.  [Link it?]                    |
|  ~ "Dr. S. Smith" in DOC-061 (L&I correspondence)             |
|     Variant name detected.  [Link it?]                         |
|                                                                |
|  ============================================================= |
|                                                                |
|  TIMELINE                                                      |
|  Jan 10 --- Feb 15 --- Feb 28 --- Mar 5 ---- Jul 1            |
|  Eval       Surgery     ROM        PT ref     PT resume        |
|                                                                |
+----------------------------------------------------------------+
```

The **"What the Virtual Associate Knows"** section is new. It provides an AI-generated strategic summary of this entity's significance to the case. This is not raw data -- it is the Intelligence rail synthesizing across all documents, contradictions, cross-case appearances, and the case strategy to produce a human-readable assessment. It updates as the case evolves.

Every link in this page is clickable. Every entity, every document reference, every date. Click "ROM: 95 deg flexion" and you navigate to the measurement entity page, which shows every document that recorded a ROM measurement and how they compare. Click "DOC-089" and you open the IME report. Click "Feb 28, 2024" and you see the timeline centered on that date.

**This is the power of "everything is a node"**: the case becomes a web of navigable knowledge, not a tree of files in folders. You move through the case by following connections, not by remembering where things are filed.

---

## 7. Where AI Lives in the Shell

The key differentiator. The workspace shell is not just an information architecture -- it is the Virtual Associate's physical form. AI is not bolted into a chat window. It is woven into every zone, visible in every state, active in every interaction.

### AI in the Explorer

AI enhancements appear within each explorer tab, contextual to that tab's content:

```
EXPLORER -- SOURCES TAB WITH AI
===========================================

  [src] [note] [srch] [tag] [star]
  Sort: Date v | Filter: All v
  -----------------------------------

  [doc] Medical (23)
  [doc] Legal (8)
  [doc] L&I (15)
  [doc] Employer (6)
  [doc] Vocational (4)

  ! AI SUGGESTED
  "3 unclassified documents may be
   employer records based on content"
   [Review ->]

  "You have 12 medical records from
   Dr. Smith but no IME rebuttal.
   Consider drafting one."
   [Create Note ->]  (switches to note tab)
```

The explorer does not just list files -- it suggests organization, identifies gaps, and recommends actions. These suggestions are unobtrusive (collapsed by default, expand on hover) and dismissible. Suggestions are tab-aware: the Sources tab suggests classification fixes; the Notes tab suggests missing work product; the Tags tab suggests tag consolidation.

### AI in the Context Panel

The context panel carries AI intelligence in two of its four tabs:

**Links tab -- Structural Intelligence**:

```
CONTEXT PANEL -- LINKS TAB AI SECTION
===========================================

  AI INSIGHTS (for currently focused node)
  -----------------------------------

  ! CONTRADICTION DETECTED
  ROM measurement in this document (95 deg)
  contradicts IME DOC-089 (120 deg).
  Difference: 25 deg -- exceeds normal
  inter-examiner variation.
  [View side-by-side ->] [Add to brief ->]

  ! UNLINKED MENTIONS (2)
  "Dr. S. Smith" in DOC-061 appears to
  reference this entity but is not linked.
  [Link ->] [Dismiss]

  ! EMERGENCE SIGNAL
  The 45-day treatment gap coincides with
  the employer's RTW notice. This pattern
  appeared in 4 prior firm cases. In each,
  the gap was attributed to employer
  pressure (WAC 296-20-01002).
  [Add to strategy ->] [View prior cases ->]
```

**Details tab -- Enrichment Intelligence**:

```
CONTEXT PANEL -- DETAILS TAB AI SECTION
===========================================

  ENRICHMENT STATUS
  Level 3/5 -- Cross-reference complete
  Next: Strategy integration (L4)
  "This document's ROM findings are flagged
   in the case strategy as key evidence.
   Consider adding to demand letter Sec II."
  [Open demand letter ->]

  ENTITY CONFIDENCE
  8 entities extracted, avg confidence 94%
  [person] Dr. Sarah Smith        0.99
  [dx] Rotator cuff tear          0.97
  [measure] ROM: 95 deg flexion  0.92
  [date] Feb 28, 2024             0.98
  ... 4 more (all > 0.85)

  All entities auto-approved (>0.80 threshold)
```

### AI Chat: Zone 5 Default, Fully Flexible

The AI Assistant's default home is the Context Panel's AI Chat tab (Zone 5). But AI Chat is also a **first-class content pane** -- the user can open AI Chat instances in Zone 4, drag them between panes, split them alongside documents, or pop them into separate windows. AI Chat follows the same spatial rules as every other view type: tabs, panes, splits, popout.

**Zone 5 as default home:**

- Zone 5 is collapsible -- dismiss it for full-width content work, expand it when you need the AI
- Every new case opens with an AI Chat tab in Zone 5, ready to go
- One click to open, Esc or collapse button to dismiss

**AI Chat as a content pane:**

- The user can open an AI Chat instance in Zone 4 by dragging the AI Chat tab from Zone 5 into a content pane, or by opening a new AI Chat from the command palette (Cmd+K: `/chat`)
- AI Chat in Zone 4 follows all content pane rules: it can be split alongside a document, tabbed with other views, resized, and popped out
- This is always user-initiated -- the platform never forces AI Chat into Zone 4

**Multiple concurrent conversations:**

The user can have multiple AI Chat instances open simultaneously, each with its own conversation context. One instance might be analyzing a medical record while another helps draft a demand letter. Each instance is context-aware to its adjacent content -- an AI Chat split next to a PDF adapts to that document; an AI Chat in Zone 5 adapts to whatever is active in Zone 4.

**Conversation management:**

Every AI Chat instance supports full conversation management: save conversations, switch between threads, resume previous conversations. Conversation history persists per case.

**Context-awareness:**

Each AI Chat instance adapts to its context. When the attorney switches from viewing a medical record to editing a demand letter, the AI shifts posture: analytical for Sources, creative/strategic for Notes, cross-referential for entity pages, pattern-oriented for the graph. No mode switch needed -- the AI reads the context.

**Composer Mode:**

When the Document Composer is active alongside an AI Chat instance (whether in Zone 5 or split in Zone 4), the AI Chat enters Composer Mode -- cursor-aware, section-aware, with document-level strength meter and next paragraph suggestions.

### AI in the Command Palette

```
COMMAND PALETTE (Cmd+K)
===========================================

  > _                                    |
                                         |
  SUGGESTED (based on current context)   |
  ! Compare ROM findings across sources  |
  ! Draft IME rebuttal from DOC-047     |
  ! Find all treatment gaps > 30 days   |
                                         |
  RECENT COMMANDS                        |
  /rom-compare                           |
  /timeline-gap-analysis                 |
  /draft-section "demand letter"         |
                                         |
  ALL SKILLS                             |
  /extract - Extract entities from doc   |
  /summarize - Summarize a source        |
  /draft - Draft a new note              |
  /compare - Compare two sources         |
  /contradict - Find contradictions      |
  /cite - Insert citation from source    |
  /strengthen - Strengthen an argument   |
  ...                                    |
```

The command palette is detailed in Document 5. The key point for the shell: it is always available via Cmd+K, it is context-aware (suggestions change based on what is focused), and it bridges natural language with structured skills.

### AI in the Top Bar

```
TOP BAR -- AI ACTIVITY
===========================================

  Martinez v. WA L&I | 56 src | 18 notes | 142 ent | [Processing 3 docs...] | Cmd+K
                                                       ^
                                        Subtle indicator: AI is working
                                        in the background. Click to see
                                        what it is doing. Never blocks UI.
```

AI background activity (document processing, entity extraction, contradiction detection, emergence analysis, standing order execution) is indicated in the top bar. Never a modal, never a blocker, never a loading spinner that freezes the interface. The system works while you work.

Clicking the activity indicator expands a dropdown showing current agent tasks:

```
AGENT ACTIVITY (click to expand)
===========================================
  Processing DOC-102: OCR complete, extracting...     [45%]
  Processing DOC-103: Classifying...                  [20%]
  Processing DOC-104: Queued                          [--]
  Standing order: Daily treatment monitoring          [Done]
  Standing order: Deadline sweep                      [Scheduled 8 AM]
```

### The Morning Briefing

The Virtual Associate's daily report, synthesized before the attorney starts their day. It draws on standing orders, overnight processing, deadline tracking, case health scores, and cross-case intelligence to produce a prioritized work queue.

The morning briefing appears as a card in the firm view dashboard and as a notification. It can be consumed visually (the card format shown in the firm view) or through voice (the associate narrates priorities while the attorney commutes).

The morning briefing does not just list what happened. It ranks by urgency, explains why each item matters, and offers one-click actions. A full specification of the morning briefing experience is in the [Agentic AI Creative Exploration](../agentic-ai-creative-exploration.md) companion document.

### Standing Orders in the Shell

Standing orders are persistent instructions that tell the Virtual Associate to wake up at defined intervals, check defined conditions, and perform defined work. They are the Agency rail in its purest form: proactive work on a schedule, with transparency and user control.

Standing orders are accessible from the AI mode in the ribbon and from the command palette (`/standing-orders`). They appear in the AI mode's Standing Orders section showing all active, paused, and completed orders with their execution history.

The top bar shows standing order activity when orders are executing: "Standing order: Deadline sweep [Running]". Results flow into the morning briefing and into case-specific notifications.

Full standing order specification: [Agentic AI Creative Exploration](../agentic-ai-creative-exploration.md), Part 5.

### The Document Composer

The Document Composer is the Virtual Associate's writing surface. It is an AI-native legal document editor that opens as a content pane -- subject to the same tab, split, and popout rules as any other view. When the Composer is active alongside an AI Chat instance (whether the AI Chat in Zone 5 or split in Zone 4), the AI Chat enters Composer Mode with cursor-aware, section-aware assistance.

Key capabilities:

- **@ mentions**: Reference any entity, document, or note inline. The associate resolves the reference and pulls supporting evidence.
- **Live blocks**: Embed dynamic data (ROM comparison tables, timeline segments, wage calculations) that update when underlying data changes.
- **Real-time fact-checking**: As the attorney writes, the associate verifies claims against extracted entities. A statement about "95 degrees flexion" is checked against the source document. Discrepancies are highlighted.
- **Strength indicators**: Each paragraph shows evidence strength -- how many sources support the claim and whether any contradict it.

The Document Composer is a content pane type, not a separate application. It sits alongside source documents, AI Chat instances, and entity pages in the same workspace.

Full specification: [Agentic AI Creative Exploration](../agentic-ai-creative-exploration.md), Part 9.

### Multi-Specialist Advisor Panel

When the attorney is viewing a complex entity (a disputed diagnosis, a contradicted measurement) or preparing for a hearing, the AI Assistant can surface a Multi-Specialist Advisor Panel -- multiple perspectives from different domain specialists presented side by side. **(Phase 2+ feature** -- requires deep domain knowledge and proven AI quality.)

```
MULTI-SPECIALIST ADVISOR
===========================================

  MEDICAL PERSPECTIVE:
  "The 25-degree ROM discrepancy between
   treating physician and IME examiner
   exceeds normal inter-examiner variation
   (typically 10-15 degrees). Suggests
   methodological inconsistency."

  LEGAL PERSPECTIVE:
  "BIIA has overturned IME findings in
   3 similar cases where discrepancy
   exceeded 20 degrees. Strong basis
   for methodology challenge."

  VOCATIONAL PERSPECTIVE:
  "At 95 degrees flexion, overhead work
   is significantly impaired. Standard
   warehouse duties require 120+ degrees.
   Vocational impact is substantial."
```

The advisor panel appears within the AI Chat instance (Zone 5 or Zone 4) when the context warrants it. The attorney can dismiss it, pin it, or request deeper analysis from any specialist.

Full specification: [Agentic AI Creative Exploration](../agentic-ai-creative-exploration.md), Part 15.

---

## 8. Full Platform Coverage

The five-zone shell accommodates every feature the platform will offer. No new zones are needed -- every capability fits within the existing architecture as a content pane type, a context panel tab, a command palette skill, or a combination.

**Trust Accounting**: Settlement disbursement tracking. Opens as a content pane, with the Details context tab showing financial entity relationships.

**Injured Worker Portal**: Client-facing status updates, questionnaires, document uploads. A separate application, but data uploaded by the injured worker flows into the case graph as Sources. The attorney sees client-uploaded documents appear in the explorer with a "Client upload" badge.

**Intake Agent**: New case creation with AI-assisted intake interview. The intake flow is a guided content pane experience. The Virtual Associate asks questions, pre-populates fields from conversation, and creates the case with the Default Case Strategy already applied.

**Opposing Party Intelligence**: Insurer, adjuster, and IME examiner profiles. These are entity pages -- the same Universal Node Page template used for providers and diagnoses, but populated with cross-case data (how many times this examiner has appeared, their pattern of findings, defense counsel associations).

**Jurisdiction-Aware Forms**: Pre-filled WA workers' compensation forms (Application for Benefits, Activity Prescription Form, Doctor Questionnaires). These open in the Document Composer with entity data pre-populated from the case graph.

**Hearing/Deposition Prep Agent**: A 7-day automated hearing preparation workflow that assembles exhibit packets, generates deposition questions from contradictions, and creates a hearing-day workspace (ephemeral workspace with exhibits, key entities, and the case map arranged for courtroom reference). Triggered by standing order or command palette.

**Case Narrative Engine**: A living, auto-updating narrative of the case that serves as an orientation document. Opens as a Note in the content area. The Virtual Associate generates the initial draft from entity data; the attorney curates it into the case's canonical story.

Each of these fits within the five-zone model. The shell does not need to change shape to accommodate new features -- it provides the container, and new capabilities fill it.

---

## 9. Key Design Decisions

These decisions shape everything that follows in Documents 2-8.

### Decision 1: Sources and Notes Are Visually Distinct but Live in the Same Graph

They are not separate systems. They share the same graph database, the same backlink infrastructure, the same entity model. But they are visually and conceptually separated in the explorer, in search results, in the context panel, and in the graph view (different node colors/shapes). The user always knows whether they are looking at evidence or work product.

### Decision 2: AI Chat Is a Regular View Type

The AI Chat is not special. It is a regular view type -- like a document viewer or a note editor -- that happens to default to Zone 5. This is the most consequential UI decision:

- **Zone 5 is the default home** -- every case opens with an AI Chat tab in Zone 5. The attorney always knows where to find the AI. Zone 5 is collapsible: dismiss it for full-width content, expand when you need it
- **But AI Chat is also a content pane** -- the user can drag AI Chat into Zone 4, open new instances there, split it alongside documents. Fully flexible, always user-initiated
- **Multiple instances with different contexts** -- the attorney can have several AI Chat instances open simultaneously, each with its own conversation and context. One analyzing a medical record, another drafting a demand letter
- **Same spatial rules as everything else** -- AI Chat can be tabbed, split, resized, popped out to a separate window. No special treatment
- **Clean separation of intelligence types** -- the Context Panel's Links/Details tabs provide _structural_ intelligence (contradictions, unlinked mentions, emergence). AI Chat provides _conversational_ intelligence (questions, drafts, analysis). When AI Chat lives in Zone 5, they coexist as sibling tabs. When AI Chat is in Zone 4, the structural intelligence remains in Zone 5

### Decision 3: Context-Aware AI Without Mode Switching

One AI Assistant. One associate identity. Context determines behavior. When viewing a Source, the associate is analytical. When editing a Note, the associate is creative/strategic. When viewing an Entity, the associate is cross-referential. When viewing the Graph, the associate is pattern-oriented.

The user never needs to say "switch to analytical mode." The associate reads context from:

- What type of node is focused (Source vs Note vs Entity)
- What the user is doing (reading vs editing vs searching)
- What is in the adjacent panes (if a Source and a Note are side-by-side, the associate understands cross-referencing intent)

### Decision 4: Navigation Through Links, Not Menus

The explorer and search are entry points. Once inside the case, you navigate by clicking links -- entity names, document references, dates, backlinks. Every piece of text that represents a node is a clickable link. This creates the "web of knowledge" feeling that makes connected knowledge systems so compelling.

Menus exist for actions (create, export, share). Navigation exists through links.

### Decision 5: Workspaces Extend the Existing Case State Store

The current `case-state-store.ts` already persists per-case view preferences. "Workspaces" extend this: named layout configurations (which panes are open, what is in each pane, sidebar states) that can be saved and switched. Examples:

- **Review**: Explorer + Document Viewer + Context Panel
- **Draft**: Explorer collapsed + Note Editor + AI Chat + Source Reference
- **Strategy**: Case Map + Graph + AI Chat
- **Deposition Prep**: Witness Entity + Timeline + Source Stack + AI Chat

### Decision 6: Sidebars Are Tabbed Tool Panels, Not Static Displays

Both the explorer and context panel are multi-mode panels with top-level tabs and per-tab toolbars. This transforms them from passive displays into active workspaces:

**Explorer tabs**: Sources, Notes, Search, Tags, Starred -- each a fundamentally different view with its own controls. The Sources tab is not just a file list; it has sort, filter, and group-by controls with saved presets. The Tags tab is not just a label list; it is a full management surface with custom colors, icons, hierarchies, and merge operations.

**Context panel tabs**: Links, Details, AI Chat, Tasks -- each serving a different need. The attorney can check backlinks, inspect enrichment status, ask the AI Assistant a quick question, or manage case tasks without leaving the sidebar.

This design means the sidebars earn their screen real estate. They are not "nice to have" -- they are power tools.

### Decision 7: Per-Tab Context Memory

Each content tab remembers its own context panel state. When you switch between content tabs, the context panel restores the mode, scroll position, and state that was active for that tab. This prevents the constant context-switching penalty of the right panel resetting every time you change documents.

The workspace system (Decision 5) captures all of this: which content tabs are open, which explorer tab is active, which context panel tab each content tab was using. Named workspaces restore the complete cognitive state.

### Decision 8: OS-Level Popout Windows

Any content tab can be popped into its own OS-level browser window. This is not a modal or an overlay -- it is a true separate window that can be moved to another monitor. Popout windows are lightweight (content only, no ribbon or explorer), but can optionally show a minimal context panel.

This enables multi-monitor workflows that legal professionals already use physically (spreading documents across a desk). The digital equivalent should be just as natural: IME report on the left monitor, treating physician's record on the right, demand letter draft in the main window.

### Decision 9: Tags Are First-Class Customizable Objects

Tags are not hardcoded categories. They are fully user-customizable with:

- Custom colors and icons per tag
- Hierarchical nesting (`#medical/provider`, `#medical/diagnosis`)
- Merge and rename operations (system-wide)
- Usage analytics (how many sources/notes use each tag)
- Firm-level tags (shared) vs case-level tags (local)

Tags are the cross-cutting organizational layer that works across the Sources/Notes divide. A tag like `#key-evidence` or `#adversarial` can be applied to both a source document and a strategy note. The tag manager in the explorer gives attorneys full control over their organizational taxonomy.

### Decision 10: Peek-First Entity Navigation

Clicking a node from the context panel, explorer, or inline text opens the peek drawer first -- not a full tab. This is a deliberate choice to prevent tab proliferation during exploratory work.

The workflow:

1. Attorney reads a document, sees "Dr. Sarah Smith" mentioned
2. Clicks the name -- peek drawer slides in (~40% width from right)
3. Sees entity summary, backlinks, contradictions, AI insights
4. Either dismisses (Escape/click away) or promotes to full tab ("Open as tab")

This means that checking an entity during document review is a lightweight, non-disruptive action. The attorney's workspace is not cluttered with tabs they opened for a five-second glance. Deep dives are intentional -- the attorney explicitly chooses to commit screen space to an entity.

### Decision 11: Top Bar Replaces Bottom Status Bar

Status bar content moves to the top of the screen for better visibility. The top bar provides:

- Case context (name, claim number, counts)
- Breadcrumb navigation
- Agent activity indicator
- Processing status
- Command palette access (Cmd+K)
- Notifications

This follows the pattern of professional desktop applications where the most important contextual information is at eye level, not at the bottom of a large display where it is easily overlooked.

### Decision 12: Details Tab in Context Panel

Document metadata, AI-generated summaries, extracted entities, enrichment level, and progressive enrichment timeline live in a dedicated Details tab -- separating structural information (Links tab: what connects to this?) from content information (Details tab: what does this contain?).

The separation matters because the two serve different workflows:

- **Links tab**: "What else in the case relates to this document?" (navigation workflow)
- **Details tab**: "What does the Virtual Associate know about this document?" (inspection workflow)

An attorney preparing a demand letter needs the Links tab (finding backlinks and citations). An attorney reviewing an extraction needs the Details tab (checking entity confidence and enrichment status). Different tasks, different tabs, no scrolling past irrelevant sections.

### Decision 13: The Virtual Associate as Design Principle

Every UI decision is guided by a single question: **"Would a junior associate need this?"**

The system is not a filing cabinet with AI features. It is an AI associate that happens to have a filing interface. This distinction drives everything:

- The morning briefing exists because a junior associate would prepare one
- Standing orders exist because a junior associate would follow up without being reminded
- The case map exists because a junior associate would maintain a case summary
- Cross-case intelligence exists because a junior associate would learn from past cases
- The correction flywheel exists because a junior associate would learn from corrections

When in doubt about whether a feature belongs in the shell, the test is: "Would an experienced attorney expect a competent junior associate to do this?" If yes, the Virtual Associate should do it. If no, it is a user action, not an agent action.

### Decision 14: Professional Desktop Application Feel

The shell should feel like a professional desktop application, not a web app. This means:

- Dark mode as the default (light mode available)
- Thin borders, subtle separators, low-contrast zone boundaries
- The ribbon creates a "tool" feeling -- icons, not text labels
- Content area is spacious -- sidebars are supporting cast, not co-stars
- Typography is clean and readable, not decorative
- The overall feeling: **calm power** -- the interface gets out of the way and lets the content breathe

---

## 10. Series Roadmap

Each subsequent document drills into one zone or concept introduced in this shell document.

**Document 2: The Explorer** -- The left sidebar as a tabbed power tool. Five tabs in depth: Sources tab (domain trees, advanced filtering, saved presets, virtual scrolling, enrichment indicators), Notes tab (category trees, status filtering, drafts vs finals), Search tab (full-text + semantic, saved searches, result grouping), Tags tab (full tag manager -- CRUD, custom colors/icons, hierarchies, merge/rename, usage analytics, firm vs case scope), Starred tab (pinned items, manual ordering). Per-tab toolbars. AI suggestions within the explorer. Drag-and-drop between tabs and content area.

**Document 3: The Context Panel** -- The right sidebar as a tabbed intelligence surface. Four tabs in depth: Links tab (backlinks separated by Sources/Notes, outgoing links, unlinked mentions, AI structural insights), Details tab (document metadata, enrichment timeline, extracted entities, AI summaries, confidence scores), AI Chat tab (conversational AI Assistant in the sidebar -- when you want a quick question without rearranging panes), Tasks tab (case task management, deadlines, assignments, creating tasks from AI suggestions or contradictions). Per-tab context memory mechanics. How the panel adapts to different node types.

**Document 4: The Workspace Engine** -- Multi-pane, multi-tab, multi-window, peek drawer architecture. Tab management (open, close, reorder, drag between panes). Pane splits (1-4 panes, vertical/horizontal/grid). Peek drawer (slide-over entity inspection, promote-to-tab flow). OS-level popout windows (lightweight, multi-monitor). Per-tab context memory. Saved workspace presets (Review, Draft, Strategy, Deposition Prep). Adaptive composition (the system suggests layouts based on what you are doing). How all of this connects to the case state store.

**Document 5: The Command Surface** -- Cmd+K in full detail. Natural language command parsing, contextual skill suggestions, quick switcher (Cmd+O), skill activation and chaining, the relationship between the command palette and the AI Assistant, and how skills are discovered and taught.

**Document 6: The Graph and Canvas** -- Two spatial views. The knowledge graph (local per-entity, case-wide, and firm-global) with filtering, animation, and pattern detection. The canvas (spatial war room) with live-linked cards, freeform connections, and AI-suggested arrangements.

**Document 7: The Hover Layer** -- Progressive disclosure through hover previews. What information surfaces on hover for each node type, transclusion (embedding a passage from a Source into a Note), block references (citing specific paragraphs), and the "peek without navigating" workflow -- how hover previews, the peek drawer, and full tabs form a three-tier disclosure hierarchy.

**Document 8: The AI Gardener** -- The system's intelligence as a continuous process, not a feature. Emergence detection, progressive enrichment (documents that get smarter over time), standing orders, morning briefings, the gardening session ritual, case health indicators, the Virtual Associate's proactive work cycle, and how the AI communicates discoveries without interrupting flow.

---

## 11. Appendix: The Shell at a Glance

```
THE LEGLISE WORKSPACE SHELL
===============================================================================

                    THE FUNDAMENTAL LAYOUT
                    ----------------------

    +-----------------------------------------------------------------------+
    | TOP BAR: Case name | Claim # | Counts | Processing | Agent | Cmd+K   |
    | Breadcrumbs                                              Notifications|
    +--+--------------+------------------------------+----------+-----------+
    |  |  EXPLORER     |        CONTENT AREA          | PEEK     | CONTEXT  |
    | R|  [src][note]  |                              | DRAWER   | PANEL    |
    | I|  [srch][tag]  |   Tabs per pane              | (entity  |[link]    |
    | B|  [star]       |   Multi-pane splits (1-4)    |  detail, |[info]    |
    | B|  ----------   |   OS-level popout windows    |  ~40%    |[chat]    |
    | O|  Per-tab      |                              |  width,  |[check]   |
    | N|  toolbar:     |   Any view: document, note,  |  slides  |          |
    |  |  sort, filter |   entity, graph, canvas,     |  from    | Links:   |
    |  |  saved presets|   timeline, AI Assistant,     |  right)  |  Backlink|
    |  |               |   composer, trust acct       |          |  Propert.|
    |  |  Sources tab  |                              | Promote  |  AI ins. |
    |  |  Notes tab    |   Saved workspaces           | to tab:  | Details: |
    |  |  Search tab   |   Per-tab context memory     | [Open -> |  Metadata|
    |  |  Tags tab(mgr)|                              |  as tab] |  Enrich. |
    |  |  Starred tab  |                              |          |  Entities|
    |  |               |                              |          | AI Chat: |
    |  |  Advanced     |                              |          |  AI Asst.|
    |  |  filtering    |                              |          | Tasks:   |
    |  |  for 1000+    |                              |          |  Todos   |
    |  |  doc cases    |                              |          |  Deadline|
    +--+--------------+------------------------------+----------+----------+

                    THE TWO HEMISPHERES
                    -------------------

         SOURCES (doc, amber)              NOTES (pen, blue)
         Immutable evidence                Living work product
         Receive, extract, cite            Create, edit, iterate
         AI: analytical                    AI: creative/strategic

                    THE FOUR STATES
                    ---------------

    Firm View  -> no case selected -> firm dashboard, morning briefing,
                                      cross-case patterns, global graph
    Case View  -> case open        -> case dashboard, case map, case health,
                                      contradictions, action items
    Focus View -> node focused     -> content + contextual panels,
                                      peek drawer for quick lookups
    Peek View  -> entity inspected -> lightweight slide-over, promote to tab

                    NAVIGATION PHILOSOPHY
                    ---------------------

    Links, not menus.
    Cmd+O to jump anywhere by name.
    Click any entity/document/date to follow the connection.
    Peek drawer for lightweight inspection.
    Every node is reachable in 2 steps: search or follow a link.

                    WHERE AI LIVES
                    --------------

    Top Bar:        Background processing, agent activity, standing orders
    Explorer:       AI suggests, organizes, identifies gaps
    Context [link]: AI detects contradictions, unlinked refs, emergence
    Context [info]: AI shows enrichment, confidence, summaries
    Context [chat]: AI Assistant (default home, also opens as content pane)
    Content Pane:   AI Chat instances (split alongside documents, fully flexible)
    Command (Cmd+K): Natural language skills, contextual suggestions
    Peek Drawer:    "What the Virtual Associate Knows" entity summaries
    Everywhere:     Context-aware -- no mode switching needed

                    THE VIRTUAL ASSOCIATE MODEL
                    ---------------------------

    Three Rails:
      Intelligence -- understand, extract, connect, detect
      Context      -- remember per-case, per-user, per-firm
      Agency       -- act proactively on schedule with transparency

    Skill Categories:
      Category 1 -- Deterministic: rules, calculations, lookups (silent)
      Category 2 -- Augmented: AI-assisted, human-approved (suggestions)
      Category 3 -- Autonomous: complex reasoning, cross-case (reviewed)

    Two-Level Architecture:
      Case Agnostic -- firm-wide rules, patterns, institutional knowledge
      Case Specific -- per-case strategy, overrides, learned rules

    Agent Hierarchy:
      Agents contain Skills
      Skills and Agents accumulate Learned Rules
      Rules live at either level (Case Agnostic or Case Specific)
      Case Specific overrides Case Agnostic defaults

===============================================================================
```

---

_This document defines the shell. Documents 2-8 fill each zone with detail, interaction patterns, and deeper exploration of the concepts introduced here._
