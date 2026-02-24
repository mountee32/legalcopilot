# Leglise MVP Definition

**Series**: Leglise Product Specification
**Date**: February 23, 2026
**Status**: Approved Scope
**Purpose**: Define the precise scope of the Leglise beta release -- what ships, what doesn't, and why
**Timeline**: 5.5 weeks to beta
**Audience**: Real Washington State workers' compensation firm, live cases
**Companion Documents**: [00 -- Platform Overview](./00-platform-overview.md), [01 -- The Workspace Shell](./01-the-workspace-shell.md)

---

## Guiding Principle

**Depth over breadth. Reliability over features.**

A real firm using real cases will forgive a missing feature. They will not forgive an unreliable one. The MVP ships fewer capabilities at higher quality. Every feature that ships must work well enough for daily professional use.

The MVP is not a prototype. It is the foundation of the product -- the workspace shell, the document intelligence pipeline, and the AI assistant. Everything that ships at MVP must be architecturally sound enough to build on for years.

---

## 1. The Workspace Shell

The shell IS the product identity. It ships from day one as a professional, desktop-class workspace.

### 5-Zone Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ TOP BAR: Case name · Claim # · Processing status · Cmd+K hint  │
├────┬────────────┬──────────────────────────┬────────────────────┤
│    │            │                          │                    │
│ R  │  EXPLORER  │     CONTENT AREA         │  CONTEXT PANEL     │
│ I  │            │                          │                    │
│ B  │  Sources   │  [Case Dashboard]        │  Details           │
│ B  │  Search    │  [Document Viewer]       │  AI Chat           │
│ O  │  Starred   │  [Entity Review]         │                    │
│ N  │            │                          │                    │
│    │  ~240px    │  Flexible                │  ~320px            │
│    │ collapsible│                          │  collapsible       │
├────┴────────────┴──────────────────────────┴────────────────────┘
```

**Top Bar**: Case context (name, claim number), document processing status indicator (shows pipeline progress), keyboard shortcut hint. Minimal, informative, always present.

**Ribbon** (3 modes at MVP):

- **Dashboard** -- personal dashboard and case list
- **Documents** -- the primary work surface for document management and review
- **AI** -- AI chat as a full content pane, AI configuration and history

Calendar and Communications modes are deferred to a fast follow after MVP.

**Explorer** (left sidebar, ~240px, collapsible):

- **Sources tab** -- document tree, filterable by domain, document type, and processing status
- **Search tab** -- full-text search across all documents in the case
- **Starred tab** -- pinned/bookmarked items for quick access

Notes tab and Tags tab ship when the Notes hemisphere is added post-MVP.

**Content Area** (center, flexible width): The main stage for all primary work. Opens case dashboards, document viewers, entity review, and AI chat as content panes. Supports tabbed panes, multi-pane splits (up to 4), popout windows, and a peek drawer. See Workspace Engine below.

**Context Panel** (right sidebar, ~320px, collapsible):

- **Links tab** -- backlinks (which documents reference this entity), outgoing links, entity relationships. The connective tissue of the knowledge graph, visible alongside whatever is in the Content Area
- **Details tab** -- document metadata, extracted entities with confidence scores, processing status
- **AI Chat tab** -- the AI Assistant's default home, always available alongside whatever is in the Content Area

Tasks tab ships post-MVP.

### Workspace Engine

The Content Area is not a single fixed view -- it is a flexible workspace that supports multiple arrangements for different work styles:

**Tabs**: Multiple content panes open as tabs within the Content Area. Switch between a case dashboard, a document viewer, an entity review, and an AI chat conversation without losing state.

**Multi-pane splits**: Split the Content Area into up to 4 panes for side-by-side work. Common arrangements:

- PDF viewer (left) + entity review (right) -- the primary document review workflow
- Two documents compared side by side
- Document viewer (left) + AI chat (right) -- for focused AI-assisted analysis

**Popout windows**: Detach any content pane into a separate OS-level window. Essential for multi-monitor setups -- an attorney can have the document viewer on one screen and AI chat on another, or compare documents across monitors.

**Peek drawer**: A ~40% width slide-over panel triggered by clicking entity or document references anywhere in the platform. Quick lookups without losing the current view. The user can promote a peek to a full tab with one click, or dismiss it to return to what they were doing.

### Design Philosophy

- **Light and dark mode** -- both ship at MVP. Light mode is the default. Dark mode available via user preference toggle. Both themes are polished, professional, and content-forward
- **Thin borders, spacious content** -- the interface gets out of the way and lets the content breathe
- **Progressive disclosure** -- starts simple, complexity available on demand
- **13" laptop minimum** -- everything must work on a 13" screen and scale gracefully to 27" and dual-monitor setups
- **Simplicity first, complexity on demand** -- a paralegal on day one sees a clean, approachable interface; a senior attorney deep in case work can expand into full power

---

## 2. Administration & User Management

### System Administration (Super Admin Portal)

The platform operations layer for managing Leglise itself:

- **Firm management**: Create, edit, and monitor firms on the platform
- **User oversight**: View and manage users across all firms
- **System health**: Processing queue status, service health, error monitoring
- **Usage visibility**: Document processing volume, active users, system load

### Firm Administration

What a firm administrator uses to manage their own team:

- **User management**: Create users, assign roles (Attorney, Paralegal), deactivate users, reset passwords
- **Firm settings**: Firm name, address, contact information
- **Case oversight**: View all cases across the firm, manage assignments
- **Invitation flow**: Invite new users by email with role pre-assigned

### Personal User Dashboard

What each user sees when they log in -- their personal launchpad:

- **My cases**: Cases assigned to me, sorted by recent activity
- **My pending reviews**: Entity extractions waiting for my review (count and case breakdown)
- **My recent activity**: Documents I've opened, entities I've reviewed, conversations I've had
- **Quick actions**: Jump to a case, start a new case, open recent documents

---

## 3. Permissions

Four roles, simple hierarchy:

| Role            | Case Access    | Documents   | Entity Review | AI Chat | User Management | System Admin |
| --------------- | -------------- | ----------- | ------------- | ------- | --------------- | ------------ |
| **Super Admin** | All firms      | All         | Yes           | Yes     | All firms       | Yes          |
| **Firm Admin**  | All firm cases | All in case | Yes           | Yes     | Own firm users  | No           |
| **Attorney**    | Assigned cases | All in case | Yes           | Yes     | No              | No           |
| **Paralegal**   | Assigned cases | All in case | Yes           | Yes     | No              | No           |

- **Case assignment controls visibility**: If you're not assigned to a case, you don't see it. Firm Admins see all cases.
- **Attorney and Paralegal have identical permissions within a case at MVP**. Role-based permission differences (e.g., who can modify case strategy) come post-MVP as we observe real workflow needs.
- **Firm isolation is absolute**: No user can ever see data from another firm. This is a security guarantee, not a feature toggle.

---

## 4. Case Management

### Case Lifecycle

**Case creation**: Name, L&I claim number (validated against WA format), injury type, case type, assigned attorney(s), assigned paralegal(s). Minimal required fields -- get the case created fast, add metadata later.

**Case assignment**: Assign one or more attorneys and one or more paralegals to a case. Users see assigned cases on their personal dashboard. Assignments can be changed at any time by Firm Admins.

**Case status transitions**:

- **Open** -- newly created, no documents yet
- **Active** -- documents uploaded, work in progress
- **On Hold** -- paused (e.g., waiting for records, client unresponsive)
- **Closed** -- resolved (with reason: settled, denied, withdrawn, etc.)

Status changes are tracked in the case activity log. Closed cases move out of the active case list but remain fully accessible via a status filter.

### Case Dashboard (per-case)

When a user opens a case, the Content Area shows the case dashboard -- the home screen for that case:

- **Key statistics**: Total documents, documents processed, entities extracted, entities pending review
- **Recent activity**: Last 10-15 actions (documents uploaded, entities approved, chat messages, status changes)
- **Quick actions**: Upload documents, open AI chat, review pending entities, view documents
- **Case metadata**: Claim number, injury type, assigned team, case status, dates

### Case List (firm-level)

All active cases for the firm, displayed as a clean data table:

- Sortable by: case name, claim number, date created, last activity, document count, status
- Filterable by: status, assigned attorney, assigned paralegal
- Case health at a glance: document count, pending review count, last activity date
- Create new case button

---

## 5. Document Management & Intelligence Pipeline

This is the core differentiator. Every document that enters the system gets read, understood, and made searchable -- automatically.

### Document Upload

- **Drag-and-drop or file picker**: Supports PDF files (scanned and searchable)
- **Bulk upload**: Drop 50+ documents at once
- **Upload progress**: Visible in the Top Bar processing status indicator
- **Immediate visibility**: Documents appear in the Explorer Sources tab immediately with a "processing" status indicator

### The Intelligence Pipeline (automatic, background)

Every uploaded document passes through a multi-stage processing pipeline without user intervention:

1. **OCR** -- scanned PDFs are converted to searchable text
2. **Searchable PDF generation** -- every document gets a searchable version regardless of input quality
3. **Content fingerprinting** -- each document receives a unique fingerprint for future deduplication
4. **Classification** -- AI classifies each document by domain (Medical, Legal, L&I, Vocational, Employer) and subtype (IME Report, Activity Prescription Form, L&I Order, etc.). Over 70 document subtypes are recognized for WA workers' comp.
5. **Entity extraction** -- AI extracts providers, diagnoses, dates, procedures, measurements, and other entities with confidence scores for each extraction

The user sees documents transition through processing states in the Explorer: **Uploading -> Processing -> Ready for Review -> Reviewed**.

### Document Viewer

- **PDF viewer**: View the actual document with scroll, zoom, and page navigation
- **Page thumbnails**: Quick navigation to specific pages
- **View-only at MVP**: Annotations, highlights, and bookmarks come post-MVP
- **Opens in the Content Area** as a content pane

### Document Explorer (Sources Tab)

- **Filter by**: domain (Medical, Legal, L&I, Vocational, Employer), document type, processing status, date range
- **Sort by**: date uploaded, document date, name, type
- **Search**: Filter the document list by name or content
- **Click to open**: Selecting a document opens it in the Content Area viewer
- **Context integration**: Selecting a document populates the Context Panel Details tab with metadata, classification, and extracted entities

### Entity Review Workflow

After extraction, entities appear in the Context Panel Details tab alongside the document:

- **Confidence scoring**: Each extracted entity carries a confidence score (0.0 - 1.0)
- **Auto-approval threshold**: Entities above 0.80 confidence are auto-approved but remain reviewable
- **Flagged for review**: Entities below 0.80 are explicitly flagged for human review
- **Review actions**: Approve (confirm the extraction), Correct (edit the value), Reject (remove the extraction)
- **Two-level corrections**: When correcting an entity, the reviewer chooses scope:
  - _"This case only"_ -- the correction applies to this case's context
  - _"All cases"_ -- the correction becomes a firm-wide learned rule that improves future extractions
- **Batch review view**: A dedicated Entity Review view in the Content Area shows all pending entities across the case, allowing efficient batch review

### What Doesn't Ship at MVP

- Document annotations, highlights, bookmarks
- Deduplication user interface (fingerprinting runs but no user-facing dedup workflow)
- Document splitting (multi-document PDFs)
- Contradiction detection
- Treatment gap detection
- IME analysis

---

## 6. AI Case Assistant

The AI assistant is where Leglise separates from every other case management tool. It doesn't just search -- it **reasons** across the case record.

### Where It Lives

- **Default home**: Context Panel > AI Chat tab (right sidebar). Always available alongside whatever the user is working on.
- **Full-width mode**: Also openable as a Content Area pane via the AI ribbon mode, for focused conversations
- **Conversation persistence**: Multiple conversations per case, switchable. Conversation history persists across sessions.

### Core Capabilities

**Multi-document reasoning**: The attorney asks "What did Dr. Martinez say about ROM compared to the IME examiner?" The AI retrieves the relevant documents, reads the specific sections, compares the measurements, and produces a structured answer with page-level citations to every source. This is not keyword search -- it is cross-document analysis.

**Citation transparency**: Every factual claim the AI makes includes a citation to the source document and page. The user can click any citation to navigate directly to the referenced passage. An assertion without a citation is flagged as ungrounded. This is a structural requirement, not optional formatting.

**Conversational memory**: The AI remembers prior conversations within the case. If the attorney analyzed the IME report's weaknesses last Tuesday, the AI builds on that analysis rather than starting from scratch. Memory is case-scoped -- what the AI learns about the Martinez case stays in the Martinez case.

**Context-aware behavior**: When the user is viewing a specific document, the AI adapts -- it knows what document is open and can answer questions about it directly. "Summarize this document" works without specifying which one.

**Large context handling**: For complex questions that span many documents, the AI executes multi-step reasoning chains -- retrieve relevant documents, analyze each one, synthesize across them, and present structured findings. The AI can handle questions that require reading and comparing 10+ documents.

### What the AI Can Do at MVP

- Answer questions about case documents with page-level citations
- Compare information across multiple documents
- Summarize individual documents or groups of documents
- Identify key entities, dates, and providers from document analysis
- Remember prior analyses and build on them across sessions
- Adapt to what the user is currently viewing
- Reason over the case knowledge graph for fast, comprehensive multi-entity queries

### What the AI Cannot Do at MVP

- Draft full documents (demand letters, protest letters, motions)
- Execute structured skills via slash commands (/rom-compare, /ime-analyze)
- Run standing orders or scheduled analyses
- Provide paragraph-level feedback on attorney drafts

### Interface

- Chat input at the bottom of the AI Chat tab
- Messages with rich formatting, citations as clickable links to source documents
- "Thinking" indicator when the AI is processing multi-step reasoning
- Thumbs up/down feedback on each response
- Conversation switcher at the top of the chat tab
- Clear conversation / new conversation actions

---

## 7. Search

**Full-text search** across all documents in a case, powered by the searchable text generated during pipeline processing.

- Accessible from the Explorer's Search tab
- Search results show: document name, matching text snippet, relevance ranking
- Click a result to open the document in the Content Area viewer
- Search covers document text content, not just filenames or metadata

Semantic search (meaning-based rather than keyword-based) and cross-case search are post-MVP.

---

## 8. Knowledge Graph & Entity Linking

The knowledge graph transforms isolated per-document extractions into a connected web of case intelligence. It is both a navigation tool and the foundation for the AI assistant's reasoning.

### Entity Linking

When the pipeline extracts entities from documents, those entities are linked across the case record. Dr. Martinez mentioned in a treatment note, an IME report, and an L&I order is recognized as the same provider -- not three unrelated text strings. Entity linking runs automatically after extraction and improves as more documents are processed.

- **Automatic resolution**: The system identifies when entities across documents refer to the same person, provider, diagnosis, or other concept
- **Confidence-based linking**: Links carry confidence scores. High-confidence links are auto-accepted; ambiguous links are flagged for review (e.g., "Dr. Smith" in two documents -- same provider or different?)
- **Manual linking and unlinking**: The user can confirm, reject, or create entity links during review

### Entity Pages

Every linked entity -- every provider, diagnosis, procedure, medication, date, measurement -- is a navigable node with its own page:

- **All mentioning documents**: Every document that references this entity, with page-level citations
- **Connected entities**: Other entities related to this one (e.g., a provider's diagnoses, a diagnosis's treating providers, a procedure's dates)
- **Timeline events**: Chronological view of when this entity appears across the case record
- **Entity summary**: AI-generated summary of what the case record says about this entity

Entity pages open as content panes (via click or peek drawer) and follow the same workspace rules as all other pane types -- tabs, splits, popout.

### Case Knowledge Graph View

An interactive visual network of all case entities and their relationships, openable as a Content Area pane:

- **Nodes**: Entities (providers, diagnoses, procedures, dates, documents) displayed as interactive nodes
- **Edges**: Typed relationships between entities (treats, diagnoses, contradicts, supports, references)
- **Filtering**: Filter the graph by entity type, domain, time period, or relationship type
- **Navigation**: Click any node to open its entity page (via peek drawer or new tab)
- **Zoom and pan**: Navigate large graphs with smooth zoom and pan controls

The graph is a case-level view at MVP. Firm-level cross-case graphs come post-MVP.

### Graph-Powered AI

The AI Case Assistant reasons over the knowledge graph directly. Instead of searching through raw document text for every question, the AI can traverse entity relationships to answer questions like "Which providers have examined the claimant's left shoulder, what did each one find, and where do they disagree?" This makes complex multi-provider, multi-document questions faster and more comprehensive.

**Agent tooling**: The knowledge graph -- entity links, document references, entity relationships, and document-to-entity mappings -- is exposed as structured tools available to the AI agent. The agent can programmatically:

- Look up all documents linked to a specific entity (provider, diagnosis, procedure)
- Traverse entity relationships (which providers are connected to which diagnoses)
- Retrieve all entities extracted from a specific document
- Find all entities of a given type across the case (all providers, all diagnoses, all dates)
- Follow cross-document entity links to find where the same entity appears in different documents

These tools are the foundation for the AI's multi-document reasoning. The graph is not just a UI visualization -- it is the AI's primary navigation structure for understanding case evidence.

---

## 9. Security & Compliance

These are non-negotiable for a product handling real legal case data.

### Data Protection

- All data encrypted in transit and at rest
- Firm isolation is absolute -- no data leakage between firms under any circumstances
- Role-based access control enforced at the data layer, not just the UI layer

### Audit & Accountability

- Immutable audit log tracking: who accessed what document, when, from where
- Entity review actions logged: who approved, corrected, or rejected each extraction
- Case activity log: all status changes, assignments, and significant actions tracked

### SOC 2 Readiness

- **Access controls**: Role-based access, unique user accounts, no shared credentials
- **Audit trails**: Immutable, comprehensive, queryable
- **Data retention**: Defined retention policies with ability to purge on request
- **Encryption**: At rest and in transit with proper key management
- **Change management**: Version-controlled infrastructure and code
- **Vendor management**: Documentation of third-party services and their compliance posture
- **Incident response**: Monitoring and alerting for anomalous access patterns

SOC 2 readiness means the architecture and practices support future certification. It does not mean we pass an audit at MVP launch.

### HIPAA Considerations

- Legal case data includes protected health information (medical records, diagnoses, treatments)
- Audit logging meets HIPAA minimum necessary access standards
- No PHI in application logs, error messages, or monitoring systems
- BAA (Business Associate Agreement) compliance with all data processors

---

## 10. Processing Feedback & Real-Time Updates

A real firm uploading dozens of documents needs to know what's happening.

### Top Bar Processing Indicator

When documents are being processed, a subtle animated indicator shows progress in the Top Bar. Click to expand: "Processing 23 of 47 documents. 18 classified. 12 entities extracted. 2 errors."

### Real-Time Updates

As documents complete processing stages, the Explorer updates live. No page refresh needed. Documents transition visually: Uploading -> Processing -> Ready for Review -> Reviewed.

### Error Handling

When a document fails processing, it shows a clear error state in the Explorer with:

- What went wrong (in plain language)
- A retry option
- The ability to skip and continue with other documents

### Empty States & Loading States

Every screen has a designed experience for: loading, empty (no data yet), error, and success states. No blank screens, no cryptic error messages, no spinning wheels without context.

---

## 11. The Complete MVP Scope

### What Ships

| Area                      | Capabilities                                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workspace Shell**       | 5-zone layout, 3 ribbon modes (Dashboard, Documents, AI), collapsible Explorer and Context Panel, light/dark mode (light default), responsive 13"-27", multi-pane splits (up to 4), popout windows, peek drawer, tabs |
| **System Admin**          | Firm management, user oversight, system health monitoring                                                                                                                                                             |
| **Firm Admin**            | User management (create, edit, deactivate, assign roles), firm settings, invitation flow                                                                                                                              |
| **User Dashboard**        | My cases, pending reviews, recent activity, quick actions                                                                                                                                                             |
| **Case Management**       | Case CRUD, WA claim number validation, status lifecycle (Open/Active/On Hold/Closed), multi-user assignment, per-case dashboard                                                                                       |
| **Permissions**           | 4 roles (Super Admin, Firm Admin, Attorney, Paralegal), case-based visibility, firm isolation                                                                                                                         |
| **Document Upload**       | Drag-and-drop, bulk upload (50+), progress tracking                                                                                                                                                                   |
| **Intelligence Pipeline** | OCR, searchable PDF generation, classification (70+ subtypes), entity extraction with confidence scoring                                                                                                              |
| **Document Viewer**       | PDF viewing with page navigation and zoom (view-only)                                                                                                                                                                 |
| **Document Explorer**     | Filter by domain/type/status/date, sort, search within list                                                                                                                                                           |
| **Entity Review**         | Confidence-based routing, approve/correct/reject, two-level corrections (case/firm)                                                                                                                                   |
| **Knowledge Graph**       | Entity linking across documents, entity pages, interactive case graph visualization, graph-powered AI reasoning                                                                                                       |
| **AI Case Assistant**     | Multi-document reasoning, page-level citations, conversational memory, context-awareness, graph reasoning, feedback                                                                                                   |
| **Search**                | Full-text search across case documents                                                                                                                                                                                |
| **Security**              | Encryption, firm isolation, role-based access, audit logging, SOC 2 readiness, HIPAA considerations                                                                                                                   |
| **UX**                    | Real-time processing feedback, error handling, empty/loading states, keyboard shortcuts (basic)                                                                                                                       |

### What Doesn't Ship (Deferred)

| Area                                        | Deferred To             |
| ------------------------------------------- | ----------------------- |
| Calendar mode, Communications mode          | Fast follow (Phase 1.1) |
| Notes hemisphere (Sources/Notes model)      | Phase 1.1               |
| Document annotations, highlights, bookmarks | Phase 1.1               |
| Cmd+K command palette (rich)                | Phase 1.2               |
| Deduplication UI                            | Phase 1.1               |
| Document splitting                          | Phase 1.2               |
| Contradiction detection                     | Phase 2                 |
| Treatment gap detection                     | Phase 2                 |
| IME analysis                                | Phase 2                 |
| Case timeline / visual timeline             | Phase 1.1               |
| Document drafting / composition             | Phase 2                 |
| Skills and slash commands                   | Phase 2                 |
| Standing orders                             | Phase 2                 |
| Billing and subscription management         | Phase 1.1               |
| Client portal                               | Phase 3                 |
| Email integration                           | Phase 1.2               |
| WA forms pre-filling, PPD calculator        | Phase 1.2               |

---

## 12. Success Criteria

The MVP beta is successful if:

1. **The firm can upload their case documents** and the pipeline processes them reliably (OCR, classification, extraction) without manual intervention
2. **Entity extraction is accurate enough** that the review workflow adds value rather than creating work (target: 80%+ accuracy on common entity types)
3. **The AI assistant provides genuinely useful answers** about case documents with accurate citations that attorneys trust enough to use daily
4. **The workspace feels professional** -- not a prototype, not a demo, but a tool an attorney would keep open all day
5. **No data integrity or security issues** -- firm isolation is absolute, audit trails are complete, no PHI leakage
6. **The firm wants to keep using it** after the beta period

---

## 13. What This Document Is Not

This document defines **what** the MVP is -- the product scope, capabilities, and user experience. It does not specify:

- **Technical architecture** -- how the pipeline is implemented, what services run where, what databases are used
- **UI design specifications** -- exact layouts, component designs, color values, typography
- **Implementation plan** -- what gets built first, how work is divided, sprint planning
- **Testing strategy** -- how features are validated before release

These are covered in separate documents.

---

_This document is the MVP scope definition for the Leglise beta release. It is a subset of [Document 0: Platform Overview](./00-platform-overview.md), focused on what ships in the first 5.5 weeks. The full product vision remains as described in the Platform Overview and [Document 0A: Long-Term Vision](./00a-long-term-vision.md)._
