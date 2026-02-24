# Cayzen Legal Platform — Feature Backlog

> **Purpose**: This backlog defines every feature, epic, and user story for the Cayzen Legal Platform — an AI-native legal practice management system designed to compete with Litify. It is structured so that a coding agent (Claude Code) can pick up any story and implement it against the existing codebase.
>
> **Codebase**: Next.js 15 + React 19, Drizzle ORM, PostgreSQL, Redis, BullMQ, MinIO, OpenRouter AI, TypeScript throughout.
>
> **Existing schemas**: See `lib/db/schema/` — documents, matters, timeline, workflows, clients, firms, users, tasks, billing, intake, etc.

---

## Priority Legend

| Priority | Meaning                                     |
| -------- | ------------------------------------------- |
| **P0**   | Must have for MVP launch                    |
| **P1**   | Required for competitive parity with Litify |
| **P2**   | Differentiator / post-launch                |
| **P3**   | Nice-to-have / future                       |

---

## Epic 1: Taxonomy Pack System (P0)

The configurable taxonomy system is the architectural foundation. Every AI feature depends on it.

### Feature 1.1: Taxonomy Pack Data Model

**As a** platform architect,
**I want** a data model for Taxonomy Packs that stores extraction categories, fields, document type classifiers, reconciliation rules, and action triggers,
**So that** the AI pipeline can be configured for any practice area without code changes.

#### Stories

- **1.1.1**: Create `taxonomy_packs` table with columns: `id`, `firm_id` (nullable — null = system pack), `key` (e.g. "workers-comp"), `version` (semver), `name`, `description`, `practice_area` (FK to practice_area enum), `is_system` (boolean), `is_active`, `parent_pack_id` (for forks), `created_at`, `updated_at`.
  - Acceptance: Drizzle schema in `lib/db/schema/taxonomy.ts`. Migration runs cleanly. Type exports.

- **1.1.2**: Create `taxonomy_categories` table with columns: `id`, `pack_id` (FK), `key` (e.g. "medical_intelligence"), `label`, `description`, `icon` (emoji string), `color` (hex), `sort_order`, `created_at`.
  - Acceptance: FK cascade on pack delete. Unique constraint on `pack_id + key`.

- **1.1.3**: Create `taxonomy_fields` table with columns: `id`, `category_id` (FK), `key` (e.g. "impairment_ratings"), `label`, `description`, `data_type` (enum: text, number, date, boolean, currency, percentage, json), `examples` (jsonb — array of example values), `confidence_threshold` (decimal 0-1, default 0.8), `requires_human_review` (boolean, default false), `sort_order`, `created_at`.
  - Acceptance: FK cascade on category delete. Unique constraint on `category_id + key`.

- **1.1.4**: Create `taxonomy_document_types` table with columns: `id`, `pack_id` (FK), `key` (e.g. "ime_report"), `label`, `description`, `activated_categories` (jsonb — array of category keys that this doc type activates), `classification_hints` (text — keywords/patterns that help classify), `sort_order`, `created_at`.
  - Acceptance: Unique constraint on `pack_id + key`.

- **1.1.5**: Create `taxonomy_action_triggers` table with columns: `id`, `pack_id` (FK), `trigger_type` (enum: deadline, recommendation, alert, status_change), `name`, `description`, `trigger_condition` (jsonb — field key + condition), `action_template` (jsonb — what action to generate), `jurisdiction_specific` (boolean), `jurisdiction_rules` (jsonb — state/jurisdiction overrides), `is_deterministic` (boolean — rule-based vs AI-generated), `created_at`.
  - Acceptance: Supports both deterministic rules and AI prompt-based triggers.

- **1.1.6**: Create `taxonomy_reconciliation_rules` table with columns: `id`, `pack_id` (FK), `field_key`, `case_field_mapping` (text — which matter/case field this maps to), `conflict_detection_mode` (enum: exact, fuzzy_text, fuzzy_number, date_range, semantic), `auto_apply_threshold` (decimal 0-1), `requires_human_review` (boolean), `created_at`.
  - Acceptance: Allows per-field configuration of how findings map to case data.

- **1.1.7**: Create `taxonomy_prompt_templates` table with columns: `id`, `pack_id` (FK), `template_type` (enum: extraction, classification, action_generation, summarization), `system_prompt` (text), `user_prompt_template` (text — with `{{field}}` placeholders), `model_preference` (text — e.g. "claude-sonnet-4-5"), `temperature` (decimal), `max_tokens` (integer), `created_at`.
  - Acceptance: Prompts are version-controlled with the pack.

### Feature 1.2: System Pack Seeding

**As a** developer,
**I want** seed scripts that populate the four launch Taxonomy Packs (Workers' Comp, Personal Injury, Immigration, Insurance Defense),
**So that** the platform has ready-to-use intelligence from day one.

#### Stories

- **1.2.1**: Create Workers' Comp pack seed with 5 categories (Medical Intelligence, Legal Signals, Employment Context, Financial Impact, Procedural Events), 42 fields, 25+ document types, action triggers for MMI deadlines / reserve adjustments / IME scheduling, and extraction prompt templates.
  - Acceptance: `npm run db:seed:taxonomy` populates all tables. Fields match the v2.0 spec exactly.

- **1.2.2**: Create Personal Injury pack seed with 5 categories (Liability Analysis, Damages Assessment, Medical Causation, Insurance Coverage, Litigation Status), 39 fields, 20+ document types, action triggers for statute of limitations / demand letter generation / settlement authority.
  - Acceptance: Pack activates correctly when matter has `practice_area = "personal_injury"`.

- **1.2.3**: Create Immigration pack seed with 6 categories (Petition Status, Document Compliance, Country Conditions, Employment Authorization, Family Relationships, Procedural Deadlines), 39 fields, 30+ document types, action triggers for RFE deadlines / visa bulletin monitoring / EAD renewals.
  - Acceptance: Pack activates correctly when matter has `practice_area = "immigration"`.

- **1.2.4**: Create Insurance Defense pack seed with 5 categories (Coverage Analysis, Liability Assessment, Damages Evaluation, Billing Compliance, Carrier Reporting), 36 fields, 20+ document types, action triggers for billing guideline compliance / status report generation / reserve recommendations.
  - Acceptance: Pack activates correctly when matter has `practice_area = "litigation"` with `sub_type = "insurance_defense"`.

### Feature 1.3: Pack Management API

**As a** firm administrator,
**I want** API endpoints to list, activate, and manage Taxonomy Packs for my firm,
**So that** I can configure which practice areas my firm supports.

#### Stories

- **1.3.1**: `GET /api/taxonomy/packs` — List all available packs (system + firm custom). Filter by practice area, active status. Include category count and field count.
  - Acceptance: Returns paginated list. Firm-scoped via tenant middleware.

- **1.3.2**: `GET /api/taxonomy/packs/[packId]` — Get full pack detail including all categories, fields, document types, action triggers.
  - Acceptance: Returns complete pack structure in a single response.

- **1.3.3**: `POST /api/taxonomy/packs/[packId]/fork` — Fork a system pack to create a firm-specific customized version. Copies all categories, fields, document types, triggers.
  - Acceptance: New pack created with `is_system = false`, `parent_pack_id` set. All child entities deep-copied.

- **1.3.4**: `PUT /api/taxonomy/packs/[packId]/fields/[fieldId]` — Update a field in a firm-owned pack (label, description, confidence threshold, requires_human_review).
  - Acceptance: Validates firm ownership. Cannot edit system packs (must fork first).

- **1.3.5**: `POST /api/taxonomy/packs/[packId]/fields` — Add a custom field to a firm-owned pack category.
  - Acceptance: Validates category belongs to pack. Auto-generates extraction prompt additions.

---

## Epic 2: Intelligent Document Pipeline (P0)

The 6-stage AI processing pipeline that ingests, classifies, extracts, reconciles, and acts on case documents.

### Feature 2.1: Pipeline Orchestration

**As a** system,
**I want** a BullMQ-based pipeline that orchestrates 6 sequential processing stages for each incoming document,
**So that** documents flow through intake → OCR → classification → extraction → reconciliation → action generation reliably.

#### Stories

- **2.1.1**: Create pipeline queue configuration in `lib/queue/pipeline.ts`. Define 6 named queues: `doc-intake`, `doc-ocr`, `doc-classify`, `doc-extract`, `doc-reconcile`, `doc-actions`. Each queue has its own worker with concurrency settings and retry policies.
  - Acceptance: Queues registered in BullMQ. Workers start with the app. Failed jobs go to dead-letter queue.

- **2.1.2**: Create `pipeline_runs` table: `id`, `firm_id`, `matter_id`, `document_id`, `status` (enum: queued, intake, ocr, classifying, extracting, reconciling, generating_actions, completed, failed), `current_stage` (integer 1-6), `started_at`, `completed_at`, `error_message`, `stage_timings` (jsonb — ms per stage), `metadata` (jsonb).
  - Acceptance: Pipeline run created when document enters pipeline. Status updated at each stage transition.

- **2.1.3**: Create `pipeline_findings` table: `id`, `pipeline_run_id` (FK), `document_id` (FK), `matter_id` (FK), `firm_id` (FK), `taxonomy_field_id` (FK), `category_key`, `field_key`, `extracted_value` (text), `structured_value` (jsonb — typed value), `page_numbers` (jsonb — array of ints), `source_quote` (text), `confidence` (decimal 0-1), `impact` (enum: critical, high, medium, low), `reconciliation_status` (enum: new, confirmed, conflict, applied, dismissed), `conflict_details` (jsonb — existing value + source if conflict), `requires_human_review` (boolean), `reviewed_by` (FK users), `reviewed_at`, `created_at`.
  - Acceptance: Indexes on `matter_id`, `pipeline_run_id`, `reconciliation_status`.

- **2.1.4**: Create `pipeline_actions` table: `id`, `pipeline_run_id` (FK), `finding_id` (FK, nullable), `matter_id` (FK), `firm_id` (FK), `action_type` (enum: deadline, task, reserve_change, status_update, alert, recommendation), `title`, `description`, `due_date` (nullable), `priority` (enum: critical, high, medium, low), `confidence` (decimal 0-1), `is_deterministic` (boolean), `source_trigger_id` (FK taxonomy_action_triggers, nullable), `status` (enum: pending, accepted, dismissed, completed), `accepted_by` (FK users), `accepted_at`, `created_at`.
  - Acceptance: Actions link back to findings and triggers for full traceability.

- **2.1.5**: Implement pipeline trigger: when a document is uploaded to a matter (via existing upload flow), automatically create a `pipeline_run` and enqueue to `doc-intake`.
  - Acceptance: Existing document upload API triggers pipeline. Pipeline run visible in UI.

### Feature 2.2: Stage 1 — Document Intake

**As a** system,
**I want** to validate incoming documents, extract metadata, deduplicate, and match to case context,
**So that** only valid, non-duplicate documents enter the processing pipeline.

#### Stories

- **2.2.1**: Implement intake worker that reads document from MinIO, validates MIME type (PDF, DOCX, DOC, TIFF, JPEG, PNG), calculates file hash (SHA-256), and checks for duplicates against existing documents on the same matter.
  - Acceptance: Duplicate documents are flagged and skipped. Non-supported types rejected with clear error.

- **2.2.2**: Implement sender matching: if document arrived via email integration, match sender email/domain against matter contacts (clients, opposing counsel, medical providers, etc.).
  - Acceptance: Matched sender stored in pipeline_run metadata. Unknown senders flagged for manual review.

- **2.2.3**: On successful intake, update `pipeline_runs.status` to "ocr" and enqueue to `doc-ocr` queue.
  - Acceptance: Stage timing recorded. Timeline event created: "document_uploaded".

### Feature 2.3: Stage 2 — OCR & Text Extraction

**As a** system,
**I want** to extract text from any document format with high accuracy, including scanned pages,
**So that** downstream AI stages have clean text to work with.

#### Stories

- **2.3.1**: Extend existing `lib/documents/extraction.ts` to support TIFF and image files (JPEG/PNG) via OCR. Add a `needsOcr` detection function that checks if a PDF has a text layer or is scanned.
  - Acceptance: `extractTextFromBuffer` handles all supported types. Returns text + per-page confidence scores.

- **2.3.2**: Integrate Azure AI Document Intelligence (or alternative OCR provider) for scanned documents. Configure via environment variable `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` and `AZURE_DOCUMENT_INTELLIGENCE_KEY`.
  - Acceptance: Scanned PDFs return extracted text with layout analysis. Tables extracted as structured data.

- **2.3.3**: Implement page segmentation: split extracted text into logical pages with page numbers. Store in `documents.extractedText` and create/update `document_chunks` with `pageStart`/`pageEnd` references.
  - Acceptance: Every finding later in the pipeline can reference specific page numbers.

- **2.3.4**: On completion, update pipeline status and enqueue to `doc-classify`. Record OCR confidence scores in pipeline_run metadata.
  - Acceptance: Low-confidence pages (<85%) flagged in pipeline_run metadata for optional manual review.

### Feature 2.4: Stage 3 — Two-Tier Document Classification

**As a** system,
**I want** to classify each document into a practice-area-specific document type using the active Taxonomy Pack,
**So that** the correct extraction taxonomy categories are activated for the next stage.

#### Stories

- **2.4.1**: Implement Tier 1 classification: determine practice area context from the matter's `practice_area` field. Load the active Taxonomy Pack(s) for that practice area.
  - Acceptance: Correct pack loaded. Multi-practice matters load multiple packs.

- **2.4.2**: Implement Tier 2 classification: using the pack's `taxonomy_document_types` and their `classification_hints`, send the first 2000 tokens of extracted text to the LLM with a classification prompt. Return document type key + confidence score.
  - Acceptance: Classification prompt constructed from pack's prompt_templates. Confidence > 80% required for auto-classification.

- **2.4.3**: Implement low-confidence fallback: if classification confidence < 80%, create a manual classification task assigned to the matter's fee earner. Pipeline pauses at this stage until classified.
  - Acceptance: Task created in `tasks` table linked to pipeline_run. Pipeline resumes when task completed.

- **2.4.4**: Look up activated categories from the `taxonomy_document_types.activated_categories` mapping. Store activated category keys in pipeline_run metadata.
  - Acceptance: Correct categories activated based on document type. E.g., IME Report activates Medical Intelligence + Legal Signals.

- **2.4.5**: Update `documents.type` with the classified document type. Create timeline event "document_analyzed" with classification result.
  - Acceptance: Document type visible in UI. Timeline shows classification with confidence score.

### Feature 2.5: Stage 4 — Taxonomy-Guided Extraction

**As a** system,
**I want** to extract structured findings from the document using the activated taxonomy categories and fields,
**So that** specific, actionable data points are captured with page references and confidence scores.

#### Stories

- **2.5.1**: Implement multi-pass chunked extraction: split document text into overlapping chunks (4000 tokens with 500 token overlap). For each chunk, construct an extraction prompt from the pack's prompt template + activated fields.
  - Acceptance: All activated fields included in prompt. LLM returns structured JSON per chunk.

- **2.5.2**: Implement extraction prompt construction: given activated categories and their fields, build a system prompt that instructs the LLM to find specific field values with page references, confidence scores, and source quotes.
  - Acceptance: Prompt includes field descriptions, data types, and examples from taxonomy_fields.

- **2.5.3**: Implement finding deduplication: same finding mentioned across multiple chunks is consolidated into a single `pipeline_findings` record with all page references merged.
  - Acceptance: No duplicate findings for the same field. Page reference arrays contain all source pages.

- **2.5.4**: Implement confidence scoring: each finding gets a confidence score based on LLM confidence, source language certainty ("likely" vs "definitively"), and whether the finding is corroborated across multiple document sections.
  - Acceptance: Confidence stored as decimal 0-1 on each finding. Scores calibrated (>0.9 = high confidence).

- **2.5.5**: Implement impact classification: tag each finding as critical/high/medium/low based on field configuration and extracted value. E.g., MMI date finding is always critical; medication change is medium.
  - Acceptance: Impact level assigned to every finding. Critical findings trigger priority notifications.

- **2.5.6**: Store all findings in `pipeline_findings` table. Create timeline events for each finding.
  - Acceptance: Findings queryable by matter, category, field, impact, and reconciliation status.

### Feature 2.6: Stage 5 — Case Reconciliation

**As a** system,
**I want** to compare each extracted finding against existing case data and detect new information, confirmations, and conflicts,
**So that** users see exactly what changed and where contradictions exist.

#### Stories

- **2.6.1**: Implement reconciliation engine: for each finding, look up the `taxonomy_reconciliation_rules` for that field. Determine the `case_field_mapping` to identify which case data to compare against.
  - Acceptance: Each finding gets a reconciliation_status: new, confirmed, or conflict.

- **2.6.2**: Implement NEW detection: if no prior value exists for the mapped case field (or in prior findings), mark as "new". If `auto_apply_threshold` is met and `requires_human_review` is false, auto-apply to case data.
  - Acceptance: Auto-applied findings update the relevant matter/case fields. Audit trail created.

- **2.6.3**: Implement CONFIRMATION detection: if the finding matches existing case data (using the configured `conflict_detection_mode`), mark as "confirmed". Boost confidence score on existing data.
  - Acceptance: Confirmed findings logged but require no user action. Source added as corroboration.

- **2.6.4**: Implement CONFLICT detection: if the finding contradicts existing case data, mark as "conflict". Store both values (existing + new) with sources in `conflict_details`. Flag `requires_human_review = true`.
  - Acceptance: Conflicts displayed with both values side by side. Resolution required before auto-apply.

- **2.6.5**: Implement fuzzy matching modes: `exact` (string equality), `fuzzy_text` (Levenshtein distance), `fuzzy_number` (within configurable tolerance), `date_range` (within N days), `semantic` (embedding similarity).
  - Acceptance: Each mode configurable per field via reconciliation rules.

### Feature 2.7: Stage 6 — Action Generation

**As a** system,
**I want** to generate recommended actions (deadlines, tasks, alerts, reserve changes) based on extracted findings and taxonomy action triggers,
**So that** users receive actionable next steps without manual analysis.

#### Stories

- **2.7.1**: Implement deterministic action generation: for each finding, check `taxonomy_action_triggers` where `is_deterministic = true`. Evaluate `trigger_condition` against finding. If matched, generate action from `action_template`.
  - Acceptance: Deadline actions include calculated due dates. Jurisdiction overlays applied when relevant.

- **2.7.2**: Implement AI-generated recommendations: for findings without deterministic triggers, use the pack's action_generation prompt template to ask the LLM for contextual recommendations. Include case context (all prior findings, case status, parties).
  - Acceptance: AI recommendations have confidence scores. Clearly labeled as AI-generated vs rule-based.

- **2.7.3**: Implement risk score recalculation: aggregate all findings from this pipeline run and recalculate the matter's `risk_score`. Weight by finding impact, conflict count, and practice-area-specific risk factors.
  - Acceptance: `matters.risk_score` updated. `matters.risk_factors` updated with new assessment. Timeline event "matter_updated" created.

- **2.7.4**: Store all actions in `pipeline_actions` table. Create tasks in `tasks` table for deadline-type actions. Create notifications for critical/high-impact actions.
  - Acceptance: Actions appear in pipeline UI and in the matter's task list. Notifications sent to assigned fee earner.

- **2.7.5**: On pipeline completion, update `pipeline_runs.status` to "completed". Record total timing. Create summary timeline event with finding count, conflict count, and action count.
  - Acceptance: Pipeline run shows total processing time. Summary visible in matter timeline.

---

## Epic 3: Pipeline User Interface (P0)

The React frontend for the document pipeline, based on the mockup artifact.

### Feature 3.1: Pipeline Dashboard View

**As an** adjuster/paralegal/attorney,
**I want** a pipeline view for each matter that shows document processing status, extracted findings, and case timeline,
**So that** I can see AI-extracted intelligence without reading the full document.

#### Stories

- **3.1.1**: Create `app/(app)/matters/[matterId]/pipeline/page.tsx` — Pipeline dashboard with three-column layout: pipeline status (top), findings panel (left), case timeline (right).
  - Acceptance: Responsive layout. Dark theme matching mockup design language. Accessible.

- **3.1.2**: Implement Document Drop Zone component: drag-and-drop area for uploading documents that triggers the pipeline. Shows idle/processing/complete states.
  - Acceptance: Drag-and-drop uploads to MinIO. Pipeline triggered on upload. Visual state transitions.

- **3.1.3**: Implement Pipeline Stage Visualization: 6-column grid showing each processing stage with pending/active/complete states. Active stage shows pulse animation. Real-time updates via WebSocket or polling.
  - Acceptance: Stages update in real-time as pipeline progresses. Processing time displayed per stage.

- **3.1.4**: Implement real-time notification toasts: as each pipeline stage completes, show a toast notification with stage summary (e.g., "Classified as: IME Report (94.2% confidence)").
  - Acceptance: Toasts auto-dismiss after 4 seconds. Color-coded by type (info/success/warning).

### Feature 3.2: Findings Panel

**As an** adjuster/paralegal/attorney,
**I want** to see all extracted findings in a structured panel with expandable detail cards,
**So that** I can quickly review what the AI found and take action on critical items.

#### Stories

- **3.2.1**: Create FindingsPanel component displaying all pipeline_findings for the current document. Each finding card shows: category icon/color, field name, extracted value, impact badge, page reference, confidence bar.
  - Acceptance: Findings sorted by impact (critical first). Category colors match taxonomy configuration.

- **3.2.2**: Implement finding expansion: clicking a finding card expands to show detailed analysis text, source quote, conflict alert (if applicable), and recommended actions as clickable items.
  - Acceptance: Smooth expand/collapse animation. Conflict findings show both values with sources.

- **3.2.3**: Implement impact filter chips: allow filtering findings by impact level (critical/high/medium/low). Show count per level.
  - Acceptance: Filter is instant (client-side). Active filters visually indicated.

- **3.2.4**: Implement conflict resolution UI: for findings with `reconciliation_status = "conflict"`, show a resolution interface with "Accept New Value", "Keep Existing", and "Flag for Review" buttons.
  - Acceptance: Resolution updates `pipeline_findings.reconciliation_status`. Audit trail created. Timeline event.

- **3.2.5**: Implement action acceptance: for pipeline_actions, show "Accept" and "Dismiss" buttons. Accepting a deadline action creates a task with the calculated due date.
  - Acceptance: Accepted actions create tasks/calendar events. Dismissed actions logged with reason.

### Feature 3.3: Case Timeline Integration

**As an** adjuster/paralegal/attorney,
**I want** the case timeline to automatically update with AI-generated events when documents are processed,
**So that** I can see the full case history including AI insights in chronological order.

#### Stories

- **3.3.1**: Create TimelinePanel component rendering all timeline_events for the matter in reverse chronological order. Each event shows timestamp, type indicator (color dot), and description.
  - Acceptance: Events grouped by date. AI-generated events visually distinct (glow effect).

- **3.3.2**: Implement real-time timeline updates: when pipeline completes, new events animate into the timeline without page refresh.
  - Acceptance: New events slide in with fadeUp animation. Existing events don't jump.

- **3.3.3**: Create pipeline summary timeline events: on pipeline completion, insert events for each significant finding (MMI date, conflicts, deadline actions) and a summary event.
  - Acceptance: Summary event shows: "📄 IME Report imported — 8 findings, 2 conflicts, 3 actions generated".

### Feature 3.4: Extraction Taxonomy Viewer

**As a** user,
**I want** to view the full extraction taxonomy for my active packs,
**So that** I understand what the AI is looking for in each document type.

#### Stories

- **3.4.1**: Create Taxonomy Viewer page at `app/(app)/settings/taxonomy/page.tsx`. Display all active packs with their categories and fields in a card grid layout.
  - Acceptance: Each category card shows icon, color, field count, and expandable field list.

- **3.4.2**: Create pack detail view showing document types → activated categories mapping, so users understand which doc types trigger which extractions.
  - Acceptance: Visual mapping between document types and categories.

---

## Epic 4: Email Ingestion (P1)

Automated document intake from email, matching the mockup's "Email received" flow.

### Feature 4.1: Email Monitoring

**As a** firm,
**I want** the system to monitor a case-specific email inbox and automatically import attachments into the correct matter,
**So that** documents are processed without manual upload.

#### Stories

- **4.1.1**: Create `email_accounts` table: `id`, `firm_id`, `email_address`, `provider` (enum: microsoft, google, imap), `credentials` (encrypted jsonb), `is_active`, `last_synced_at`, `created_at`.
  - Acceptance: Supports Microsoft Graph API and generic IMAP. Credentials encrypted at rest.

- **4.1.2**: Implement Microsoft Graph API email poller: BullMQ recurring job that checks for new emails at configurable intervals (default: 60 seconds). Extracts attachments and matches to matters.
  - Acceptance: New emails with attachments trigger document pipeline. Already-processed emails skipped.

- **4.1.3**: Implement email-to-matter matching: match incoming emails to matters based on email subject line reference numbers, sender/recipient matching against matter contacts, or dedicated per-matter email aliases.
  - Acceptance: Matched emails auto-assign to matter. Unmatched emails queued for manual assignment.

- **4.1.4**: Create `email_imports` table linking imported emails to pipeline_runs for audit trail.
  - Acceptance: Full traceability from email → attachment → pipeline_run → findings.

---

## Epic 5: Taxonomy Editor (P1)

Admin interface for customizing Taxonomy Packs.

### Feature 5.1: Pack Customization UI

**As a** firm administrator,
**I want** a visual editor to customize my firm's taxonomy packs — adding fields, adjusting thresholds, and configuring actions,
**So that** the AI extracts exactly what my firm needs.

#### Stories

- **5.1.1**: Create Taxonomy Editor at `app/(app)/settings/taxonomy/editor/page.tsx`. List firm's active packs with edit buttons. System packs show "Fork to Customize" instead of edit.
  - Acceptance: Fork creates a firm-owned copy. Edit opens the editor.

- **5.1.2**: Implement field editor: for each category, display fields in a sortable list. Each field shows label, data type, confidence threshold slider, and requires_human_review toggle.
  - Acceptance: Changes save immediately via API. Optimistic UI updates.

- **5.1.3**: Implement "Add Custom Field" form: name, description, data type, example values, confidence threshold. System auto-generates extraction prompt additions.
  - Acceptance: New field appears in the taxonomy. Next pipeline run includes the new field in extraction.

- **5.1.4**: Implement action trigger editor: list existing triggers with condition and action template previews. Allow adding new deterministic triggers with condition builder (field + operator + value → action type + template).
  - Acceptance: New triggers fire on next pipeline run. Trigger conditions validated.

- **5.1.5**: Implement "Test Extraction" tool: upload a sample document and run a single-field extraction to verify the AI extracts correctly. Shows raw AI reasoning for debugging.
  - Acceptance: Test results show extracted value, confidence, and page reference. No side effects on case data.

---

## Epic 6: Matter Management Enhancements (P1)

Extend the existing matter system to support the pipeline and taxonomy features.

### Feature 6.1: Practice Area Configuration

**As a** firm administrator,
**I want** to configure which practice areas my firm handles and which Taxonomy Packs are active for each,
**So that** matters are automatically configured with the right AI intelligence.

#### Stories

- **6.1.1**: Create `firm_practice_areas` table: `id`, `firm_id`, `practice_area`, `active_pack_id` (FK taxonomy_packs), `is_active`, `created_at`.
  - Acceptance: Firm can activate/deactivate practice areas. Default system pack auto-assigned.

- **6.1.2**: Create Practice Area Settings page at `app/(app)/settings/practice-areas/page.tsx`. Show all practice areas with toggle activation and pack selection dropdown.
  - Acceptance: Activating a practice area makes it available in matter creation.

- **6.1.3**: When a matter is created, auto-assign the firm's active Taxonomy Pack based on `practice_area`. Store pack reference on the matter (or in `practice_data` jsonb).
  - Acceptance: Pipeline uses the correct pack when processing documents for this matter.

### Feature 6.2: AI Risk Scoring

**As an** adjuster/attorney,
**I want** each matter to show a dynamic risk score that updates as documents are processed,
**So that** I can prioritize my caseload based on AI-assessed risk.

#### Stories

- **6.2.1**: Implement risk score calculation function: takes all pipeline_findings for a matter, applies practice-area-specific weights, and returns a 0-100 score with factor breakdown.
  - Acceptance: Score stored in `matters.risk_score`. Factors in `matters.risk_factors` as jsonb.

- **6.2.2**: Create RiskGauge component displaying the risk score as a visual gauge (green/amber/red) with expandable factor list.
  - Acceptance: Matches mockup design. Visible on matter detail page and case list.

- **6.2.3**: After each pipeline run, automatically recalculate and update the matter's risk score.
  - Acceptance: Risk score changes reflected immediately in UI. Timeline event if score changes significantly.

### Feature 6.3: Matter Findings Dashboard

**As an** adjuster/attorney,
**I want** a consolidated view of all AI findings across all documents for a single matter,
**So that** I can see the complete AI-extracted intelligence picture for my case.

#### Stories

- **6.3.1**: Create `app/(app)/matters/[matterId]/findings/page.tsx` — aggregated findings view grouped by taxonomy category. Show latest value per field across all pipeline runs.
  - Acceptance: If multiple documents provide the same field, show most recent with history. Conflicts highlighted.

- **6.3.2**: Implement findings export: export all findings for a matter as a structured report (PDF or DOCX) for use in demand letters, settlement packages, or carrier reports.
  - Acceptance: Export includes finding values, sources, page references, and confidence levels.

---

## Epic 7: Intake & Lead Management (P1)

### Feature 7.1: AI-Powered Intake

**As a** firm,
**I want** an intelligent intake system that captures lead information, scores potential cases, and routes to the appropriate team member,
**So that** high-value leads are processed quickly.

#### Stories

- **7.1.1**: Create public intake form builder at `app/(app)/settings/intake/page.tsx`. Admins define fields per practice area. Forms embed on firm website.
  - Acceptance: Forms submit to `POST /api/intake`. Lead created with matter in "lead" status.

- **7.1.2**: Implement AI lead scoring: when intake form submitted, AI evaluates case type, jurisdiction, injury severity (PI), claim value, and statute of limitations to produce a 0-100 lead score.
  - Acceptance: Score visible on lead card. High-score leads flagged for immediate follow-up.

- **7.1.3**: Implement auto-routing: based on practice area and lead score, assign to appropriate team member. Configurable routing rules per firm.
  - Acceptance: Lead assigned and notification sent within 30 seconds of submission.

---

## Epic 8: Document Generation & Templates (P1)

### Feature 8.1: AI-Assisted Document Drafting

**As an** attorney/paralegal,
**I want** to generate first drafts of common legal documents using case data and AI findings,
**So that** I spend less time on routine document creation.

#### Stories

- **8.1.1**: Create template system: firm-configurable document templates with merge fields that pull from matter data, client data, and pipeline findings.
  - Acceptance: Templates stored in `templates` table. Support DOCX output format.

- **8.1.2**: Implement AI draft generation: given a template and a matter, AI fills merge fields from case data + findings, generates narrative sections, and produces a draft DOCX.
  - Acceptance: Draft document created in MinIO. Linked to matter as a new document.

- **8.1.3**: Create demand letter generator (PI-specific): pulls liability findings, damages totals, medical chronology from pipeline findings to draft a demand letter.
  - Acceptance: Demand letter includes all relevant findings with source references.

---

## Epic 9: Time, Billing & Payments (P1)

### Feature 9.1: AI-Suggested Time Entries

**As an** attorney,
**I want** the system to suggest time entries based on my activities (documents reviewed, emails sent, tasks completed),
**So that** I capture all billable time without manual tracking.

#### Stories

- **9.1.1**: Implement activity tracking: log when users open documents, complete tasks, resolve findings, and draft documents. Calculate time spent per activity.
  - Acceptance: Activities logged in `billing` schema tables. Time calculated accurately.

- **9.1.2**: Implement AI time entry suggestions: at end of day (or on demand), AI reviews activities and suggests time entries with descriptions. User reviews and approves.
  - Acceptance: Suggestions show activity, time, and draft narrative. One-click approve or edit.

- **9.1.3**: Implement billing compliance checking: for insurance defense matters, AI reviews time entries against carrier billing guidelines before submission.
  - Acceptance: Non-compliant entries flagged with specific guideline violation. Suggestions for correction.

---

## Epic 10: Analytics & Reporting (P2)

### Feature 10.1: Firm Dashboard

**As a** managing partner,
**I want** a firm-wide dashboard showing caseload, pipeline activity, risk distribution, and performance metrics,
**So that** I can manage the firm's operations with data-driven insights.

#### Stories

- **10.1.1**: Create firm dashboard at `app/(app)/dashboard/page.tsx`. Show: active matter count by practice area, pipeline processing volume (docs/day), average pipeline time, finding accuracy rates, open conflict count.
  - Acceptance: Real-time data. Charts using Recharts. Filterable by date range and practice area.

- **10.1.2**: Create pipeline accuracy dashboard: extraction accuracy per taxonomy pack, per category, and per field. Calculated from user acceptance/rejection of findings.
  - Acceptance: Accuracy metrics improve visibility. Low-accuracy fields flagged for prompt tuning.

### Feature 10.2: Case Analytics

**As an** adjuster/attorney,
**I want** AI-driven case analytics showing predicted outcomes, settlement ranges, and comparable case data,
**So that** I can make data-driven decisions on case strategy.

#### Stories

- **10.2.1**: Implement case outcome prediction: based on findings (liability %, injury severity, jurisdiction, representation status), predict likely outcome (settlement range, litigation probability).
  - Acceptance: Prediction shown on matter dashboard with confidence interval. Factors explained.

- **10.2.2**: Implement comparable case search: find historically similar cases based on practice area, injury type, jurisdiction, and key findings. Show outcomes for comparison.
  - Acceptance: Top 5 comparable cases shown with key metrics. Semantic search across firm's case history.

---

## Epic 11: Taxonomy Marketplace (P2)

### Feature 11.1: Marketplace Platform

**As a** domain expert,
**I want** to publish custom Taxonomy Packs to a marketplace where other firms can discover and install them,
**So that** my specialized knowledge reaches a wider audience.

#### Stories

- **11.1.1**: Create marketplace listing page at `app/(app)/marketplace/page.tsx`. Browse packs by practice area, jurisdiction, rating. Search by keyword.
  - Acceptance: Packs from verified publishers. Install counts and accuracy ratings shown.

- **11.1.2**: Implement pack publishing: domain experts can publish their firm's custom packs to the marketplace. Review/approval workflow before listing.
  - Acceptance: Published packs tested for quality. Version management supported.

- **11.1.3**: Implement one-click pack installation: firm admin can install a marketplace pack, which copies it to their firm as a new pack. Automatic activation for relevant practice area.
  - Acceptance: Installed pack immediately available for pipeline processing. Updates available from publisher.

---

## Epic 12: Client Portal (P2)

### Feature 12.1: Client-Facing Case Status

**As a** client,
**I want** a portal where I can see my case status, upload documents, and communicate with my legal team,
**So that** I'm informed about my case without constant phone calls.

#### Stories

- **12.1.1**: Create client portal at `app/(portal)/`. Authenticated view showing matter status, recent timeline events (client-visible only), uploaded documents, and messages.
  - Acceptance: Only client-visible events shown. No internal AI findings or risk scores exposed.

- **12.1.2**: Implement document upload from portal: clients can upload documents (medical records, correspondence) that auto-enter the document pipeline.
  - Acceptance: Uploaded docs trigger pipeline. Client sees "Processing" status.

- **12.1.3**: Implement secure messaging between client and legal team.
  - Acceptance: Messages stored encrypted. Notifications sent to both parties.

---

## Epic 13: Integrations (P2)

### Feature 13.1: Calendar & Email Sync

**As a** user,
**I want** my calendar and email synchronized with the platform,
**So that** deadlines, hearings, and correspondence are tracked automatically.

#### Stories

- **13.1.1**: Implement Microsoft Outlook calendar sync: pipeline-generated deadline actions create calendar events in the user's Outlook calendar.
  - Acceptance: Bidirectional sync. Changes in Outlook reflected in platform.

- **13.1.2**: Implement email logging: emails sent/received about a matter are automatically logged in the matter timeline.
  - Acceptance: Email content searchable. Attachments enter document pipeline.

### Feature 13.2: Accounting Integration

**As a** firm,
**I want** billing data to sync with QuickBooks/Xero,
**So that** invoices and payments flow seamlessly between systems.

#### Stories

- **13.2.1**: Implement QuickBooks Online integration: sync invoices, payments, and client accounts.
  - Acceptance: Invoices created in platform appear in QBO. Payments recorded in QBO reflected in platform.

---

## Epic 14: Mobile Experience (P2)

### Feature 14.1: Responsive Mobile UI

**As a** field adjuster/attorney,
**I want** full platform functionality on my mobile device,
**So that** I can review findings, approve actions, and manage cases on the go.

#### Stories

- **14.1.1**: Ensure all pipeline views are fully responsive. Findings panel stacks below pipeline visualization on mobile.
  - Acceptance: All features accessible on 375px+ screens. Touch-optimized interactions.

- **14.1.2**: Implement push notifications for critical pipeline events (conflicts detected, deadline actions generated).
  - Acceptance: Browser push notifications on mobile. Optional SMS for critical alerts.

---

## Story Dependency Map

```
Epic 1 (Taxonomy) ──→ Epic 2 (Pipeline) ──→ Epic 3 (Pipeline UI)
                  ──→ Epic 5 (Tax Editor)
                  ──→ Epic 6 (Matter Enhancements)
Epic 2 (Pipeline) ──→ Epic 4 (Email Ingestion)
                  ──→ Epic 7 (Intake)
                  ──→ Epic 8 (Doc Generation)
                  ──→ Epic 10 (Analytics)
Epic 3 (Pipeline UI) ──→ Epic 14 (Mobile)
Epic 5 (Tax Editor) ──→ Epic 11 (Marketplace)
Epic 6 (Matter) ──→ Epic 9 (Billing)
                ──→ Epic 12 (Client Portal)
                ──→ Epic 13 (Integrations)
```

**Build order**: Epic 1 → Epic 2 → Epic 3 → Epics 4-6 (parallel) → Epics 7-9 (parallel) → Epics 10-14 (parallel)
