# Legal Copilot — Backend Design Document

## Overview

This document defines the data models and API specifications for Legal Copilot's backend. The system is designed as a multi-tenant SaaS platform with AI-first architecture.

### Source Of Truth

- Database schema: `lib/db/schema/*.ts` (re-exported from `lib/db/schema/index.ts`)
- API validation + OpenAPI: `lib/api/schemas/*.ts` and `scripts/generate-openapi.ts` (outputs `docs/api/openapi.yaml` via `npm run docs:api`)
- Tenancy enforcement helper: `lib/db/tenant.ts` and `lib/tenancy.ts`

This file is intended to capture **invariants and intent**. Prefer updating code and generated OpenAPI over adding/maintaining redundant Markdown tables and interface definitions.

### Design Principles

1. **Multi-tenancy**: Strict data isolation per firm
2. **AI-Native**: Every entity supports AI metadata and audit trails
3. **Event-Audited**: All changes recorded as an immutable audit log for compliance and AI learning (can evolve into full event sourcing)
4. **PostgreSQL-First**: Use PostgreSQL from day one (JSONB for flexibility), with pgvector for embeddings
5. **Minimal Schemas**: Start small; keep optional/experimental fields in JSONB and migrate when stable
6. **No Premature Optimisation**: Prioritise correctness, isolation, and auditability; measure before adding caches/replicas/partitioning
7. **RESTful APIs**: Standard REST with real-time WebSocket support

### Storage Strategy

**MVP (Day 1)**: PostgreSQL + object storage (S3/MinIO)

- PostgreSQL as the system of record for all entities, approvals, and audit logs
- pgvector for semantic search and retrieval
- JSONB for flexible metadata/practice-specific data while schemas stabilise
- MinIO/S3 for file blobs; PostgreSQL stores metadata + `storageKey`

---

## Core Data Models

### 1. Firm (Tenant)

```typescript
interface Firm {
  id: string; // UUID
  name: string;
  sraNumber?: string; // SRA registration number
  status: "trial" | "active" | "suspended" | "cancelled";
  plan: "starter" | "professional" | "enterprise";

  // Contact
  email: string;
  phone?: string;
  website?: string;

  // Address
  address: Address;

  // Multi-office
  offices: Office[];

  // Settings
  settings: FirmSettings;

  // AI Configuration
  aiConfig: AIConfig;

  // Billing
  stripeCustomerId?: string;
  subscriptionId?: string;

  // Metadata
  createdAt: string; // ISO 8601
  updatedAt: string;
}

interface Office {
  id: string;
  name: string;
  address: Address;
  phone?: string;
  email?: string;
  isHeadOffice: boolean;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string; // ISO 3166-1 alpha-2
}

interface FirmSettings {
  // Branding
  logoUrl?: string;
  primaryColor?: string;

  // Practice Areas
  practiceAreas: PracticeArea[];

  // Billing
  defaultBillingModel: "hourly" | "fixed" | "contingency";
  defaultCurrency: string; // ISO 4217
  vatRegistered: boolean;
  vatNumber?: string;

  // Client Portal
  portalEnabled: boolean;
  portalBranding?: PortalBranding;

  // Compliance
  retentionPeriodYears: number;
  conflictCheckRequired: boolean;

  // Workflows
  caseStages: Record<PracticeArea, CaseStage[]>;
}

interface PortalBranding {
  portalName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  customDomain?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

interface AIConfig {
  enabled: boolean;
  autonomyLevel: "suggest" | "draft" | "auto-with-approval" | "full-auto";
  toneProfile?: string; // AI-learned tone
  customPrompts?: Record<string, string>;
  approvalPolicy?: AIApprovalPolicy; // backend-enforced via ApprovalRequest
}

interface AIApprovalPolicy {
  // High-risk actions that must always require explicit human approval
  requireApprovalFor?: string[]; // e.g. ["email.send", "case.stage_change", "invoice.send"]

  // Allow auto-approval (system-decided) only above this confidence threshold
  autoApproveMinConfidence?: number; // 0-1
}

type PracticeArea =
  | "conveyancing"
  | "civil_litigation"
  | "family"
  | "wills_probate"
  | "employment"
  | "immigration"
  | "personal_injury"
  | "commercial"
  | "criminal"
  | "intellectual_property"
  | "insolvency"
  | "general";

interface CaseStage {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
  autoTransitionRules?: AutoTransitionRule[];
}

interface AutoTransitionRule {
  id: string;
  toStageId: string;
  trigger:
    | "task.completed"
    | "document.uploaded"
    | "deadline.reached"
    | "email.received"
    | "ai.recommendation";
  conditions?: Record<string, any>;
  requiresApproval?: boolean;
  enabled?: boolean;
}
```

### 2. User

```typescript
interface User {
  id: string;
  firmId: string;

  // Identity
  email: string;
  firstName: string;
  lastName: string;
  title?: string; // Mr, Mrs, Ms, Dr, etc.

  // Role
  role: UserRole;
  permissions: Permission[];

  // Professional
  jobTitle?: string;
  sraId?: string; // Solicitor SRA ID
  hourlyRate?: Money;
  targetBillableHours?: number; // Per month

  // Office
  officeId?: string;

  // Settings
  settings: UserSettings;

  // Status
  status: "active" | "inactive" | "pending";
  lastLoginAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

type UserRole = "admin" | "partner" | "fee_earner" | "paralegal" | "support" | "readonly";

type Permission =
  | "cases:read"
  | "cases:write"
  | "cases:delete"
  | "billing:read"
  | "billing:write"
  | "billing:approve"
  | "clients:read"
  | "clients:write"
  | "documents:read"
  | "documents:write"
  | "reports:read"
  | "reports:export"
  | "settings:read"
  | "settings:write"
  | "users:read"
  | "users:write"
  | "ai:configure";

interface UserSettings {
  timezone: string;
  dateFormat: string;
  notifications: NotificationSettings;
  calendarSync?: CalendarSyncConfig;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  digest: "realtime" | "hourly" | "daily" | "weekly";
}

interface CalendarSyncConfig {
  enabled: boolean;
  provider: "google" | "microsoft";
  calendarId?: string;
  syncDirection: "push" | "pull" | "two_way";
  lastSyncedAt?: string;
}
```

### 3. Client (Contact)

```typescript
interface Client {
  id: string;
  firmId: string;

  // Type
  type: "individual" | "company";

  // Individual fields
  title?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;

  // Company fields
  companyName?: string;
  companyNumber?: string; // Companies House number
  vatNumber?: string;

  // Contact
  email?: string;
  phone?: string;
  mobile?: string;

  // Address
  address?: Address;

  // Portal Access
  portalEnabled: boolean;
  portalEmail?: string;

  // AML/KYC
  amlStatus: "pending" | "verified" | "failed" | "expired";
  amlVerifiedAt?: string;
  amlProvider?: string;
  amlReference?: string;

  // Source tracking
  source?: LeadSource;
  referralSourceId?: string;

  // AI metadata
  aiProfile?: ClientAIProfile;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface ClientAIProfile {
  communicationPreference?: "formal" | "casual";
  responsiveness?: "fast" | "average" | "slow";
  sentiment?: "positive" | "neutral" | "negative";
  riskLevel?: "low" | "medium" | "high";
  notes?: string; // AI-generated observations
}

interface LeadSource {
  type: "website" | "referral" | "phone" | "email" | "walk_in" | "marketing" | "other";
  campaign?: string;
  referrerId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
```

### 4. Case (Matter)

```typescript
interface Case {
  id: string;
  firmId: string;

  // Reference
  reference: string; // Firm's case reference (e.g., "CONV-2024-001")

  // Type
  practiceArea: PracticeArea;
  matterType?: string; // Sub-type within practice area

  // Parties
  clientId: string; // Primary client
  parties: CaseParty[];

  // Assignment
  responsibleUserId: string; // Lead fee earner
  teamUserIds: string[]; // Other team members
  officeId?: string;

  // Status
  status: CaseStatus;
  stage: string; // Current stage ID
  stageHistory: StageChange[];

  // Dates
  openedAt: string;
  closedAt?: string;
  targetCompletionDate?: string;

  // Billing
  billingModel: BillingModel;
  budget?: Money;

  // Risk
  riskScore?: number; // 0-100, AI-calculated
  riskFactors?: string[];

  // AI
  aiSummary?: string; // AI-generated summary
  aiSummaryUpdatedAt?: string;
  aiInsights?: AIInsight[];
  embedding?: number[]; // Vector embedding for similarity search

  // Practice-specific data (polymorphic)
  conveyancingData?: ConveyancingData;
  litigationData?: LitigationData;
  probateData?: ProbateData;
  familyData?: FamilyData;
  immigrationData?: ImmigrationData;

  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface StageChange {
  fromStageId: string;
  toStageId: string;
  changedAt: string;
  changedByType: "user" | "system";
  changedById?: string;
  source?: "manual" | "ai_suggestion" | "workflow_rule";
  reason?: string;
  approvalRequestId?: string;
  aiConfidence?: number; // 0-1
}

type CaseStatus = "intake" | "active" | "on_hold" | "completed" | "closed" | "archived";

interface CaseParty {
  id: string;
  clientId?: string; // Link to Client if exists

  // Role
  role: PartyRole;

  // Details (if not linked to Client)
  type: "individual" | "company";
  name: string;
  email?: string;
  phone?: string;
  address?: Address;

  // Representative
  representativeId?: string; // Their solicitor (another Party)

  // AI
  sentiment?: "cooperative" | "neutral" | "adversarial";
}

type PartyRole =
  | "client"
  | "opponent"
  | "respondent"
  | "third_party"
  | "witness"
  | "expert"
  | "solicitor"
  | "counsel"
  | "court"
  | "other";

interface BillingModel {
  type: "hourly" | "fixed" | "staged" | "contingency" | "legal_aid";

  // Hourly
  hourlyRates?: Record<string, Money>; // userId -> rate

  // Fixed
  fixedFee?: Money;

  // Staged
  stages?: BillingStage[];

  // Contingency
  contingencyPercentage?: number;

  // Legal Aid
  legalAidCertificate?: string;
  legalAidRates?: string;
}

interface BillingStage {
  id: string;
  name: string;
  amount: Money;
  dueAt?: string;
  status: "pending" | "invoiced" | "paid";
}

interface Money {
  amount: number; // In smallest unit (pence)
  currency: string; // ISO 4217
}

interface AIInsight {
  id: string;
  type: "risk" | "action" | "milestone" | "anomaly" | "suggestion";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "acknowledged" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
}
```

### 5. Practice Area Specific Data

```typescript
// Conveyancing
interface ConveyancingData {
  transactionType: "sale" | "purchase" | "remortgage" | "transfer";
  propertyAddress: Address;
  propertyType: "freehold" | "leasehold" | "commonhold";
  titleNumber?: string;

  // Pricing
  purchasePrice?: Money;
  salePrice?: Money;
  mortgageAmount?: Money;

  // Lender
  lenderId?: string;
  lenderReference?: string;

  // Chain
  chainPosition?: number;
  linkedCaseIds?: string[];

  // Milestones
  exchangeDate?: string;
  completionDate?: string;

  // Searches
  searches: ConveyancingSearch[];

  // SDLT
  sdltAmount?: Money;
  sdltSubmittedAt?: string;
  sdltReference?: string;

  // Land Registry
  landRegistrySubmittedAt?: string;
  landRegistryReference?: string;
}

interface ConveyancingSearch {
  id: string;
  type: string; // e.g., "local", "drainage", "environmental"
  provider: string;
  status: "ordered" | "received" | "reviewed";
  orderedAt: string;
  receivedAt?: string;
  documentId?: string;
  aiSummary?: string;
  aiConcerns?: string[];
}

// Litigation
interface LitigationData {
  caseType: "civil" | "employment" | "family" | "immigration" | "criminal";
  court?: string;
  courtReference?: string;

  // Limitation
  limitationDate?: string;
  limitationCalculation?: string;

  // Claim
  claimValue?: Money;

  // Key dates
  hearingDates: HearingDate[];
  filingDeadlines: Deadline[];

  // Bundle
  bundleDocumentIds?: string[];
}

interface HearingDate {
  id: string;
  type: string;
  date: string;
  time?: string;
  location?: string;
  judge?: string;
  outcome?: string;
}

interface Deadline {
  id: string;
  description: string;
  dueDate: string;
  filedAt?: string;
  documentId?: string;
}

// Probate
interface ProbateData {
  deceasedName: string;
  dateOfDeath: string;

  // Grant
  grantType: "probate" | "letters_of_administration";
  grantIssuedAt?: string;
  grantReference?: string;

  // Estate
  estateGrossValue?: Money;
  estateNetValue?: Money;
  ihtPayable?: Money;

  // Beneficiaries
  beneficiaries: Beneficiary[];

  // Assets & Liabilities
  assets: EstateAsset[];
  liabilities: EstateLiability[];

  // Distribution
  distributions: Distribution[];
}

interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  share: number; // Percentage
  contactId?: string;
}

interface EstateAsset {
  id: string;
  type: string;
  description: string;
  value: Money;
  collectedAt?: string;
}

interface EstateLiability {
  id: string;
  type: string;
  description: string;
  amount: Money;
  paidAt?: string;
}

interface Distribution {
  id: string;
  beneficiaryId: string;
  amount: Money;
  distributedAt?: string;
}

// Family Law
interface FamilyData {
  matterType: "divorce" | "children" | "financial" | "domestic_abuse" | "other";

  // Divorce
  marriageDate?: string;
  separationDate?: string;
  petitionFiledAt?: string;
  decreeNisiAt?: string;
  decreeAbsoluteAt?: string;

  // Children
  childrenNames?: string[];
  childArrangements?: string;

  // Financial
  financialOrderType?: string;
}

// Immigration
interface ImmigrationData {
  applicationType: string;
  visaCategory?: string;

  // Applicant
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;

  // Application
  homeOfficeReference?: string;
  submittedAt?: string;
  biometricsDate?: string;
  decisionDate?: string;
  decision?: "approved" | "refused" | "pending";

  // Deadlines
  currentVisaExpiry?: string;
  appealDeadline?: string;
}
```

### 6. Document

```typescript
interface Document {
  id: string;
  firmId: string;
  caseId?: string;

  // File
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number; // Bytes
  storageKey: string; // S3/MinIO key

  // Classification
  type: DocumentType;
  category?: string;

  // Visibility
  visibility: "internal" | "client_visible" | "shared";

  // Version control
  version: number;
  previousVersionId?: string;

  // AI Processing
  aiProcessed: boolean;
  aiProcessedAt?: string;
  aiSummary?: string;
  aiExtractedData?: Record<string, any>;
  aiClassification?: string;
  aiConfidence?: number;
  embedding?: number[];

  // Chunking (for citations & retrieval)
  chunkedAt?: string;
  chunkCount?: number;

  // OCR
  ocrProcessed?: boolean;
  ocrText?: string;

  // Signatures
  signatureStatus?: "none" | "pending" | "partial" | "completed";
  signatureRequestId?: string;

  // Metadata
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

type DocumentType =
  | "correspondence"
  | "contract"
  | "pleading"
  | "evidence"
  | "form"
  | "id_document"
  | "financial"
  | "advice"
  | "attendance_note"
  | "bundle"
  | "other";

// Stored text spans used for retrieval and source citations
interface DocumentChunk {
  id: string;
  firmId: string;
  documentId: string;
  caseId?: string;

  chunkIndex: number; // 0..n ordering within a document version
  text: string;

  // Location hints for citations (best-effort depending on parser/OCR)
  pageStart?: number;
  pageEnd?: number;
  charStart?: number;
  charEnd?: number;

  // AI
  embedding: number[];

  createdAt: string;
}
```

### 7. Email / Communication

```typescript
interface Email {
  id: string;
  firmId: string;
  caseId?: string;

  // Email details
  messageId: string; // Email Message-ID header
  threadId?: string;

  // Direction
  direction: "inbound" | "outbound";

  // Addresses
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];

  // Content
  subject: string;
  bodyText?: string;
  bodyHtml?: string;

  // Attachments
  attachmentIds: string[]; // Document IDs

  // Status
  status: "pending" | "sent" | "delivered" | "failed" | "bounced";
  readAt?: string;

  // AI Processing
  aiProcessed: boolean;
  aiCaseMatch?: {
    caseId: string;
    confidence: number;
  };
  aiIntent?: EmailIntent;
  aiUrgency?: number; // 1-5
  aiSentiment?: "positive" | "neutral" | "negative" | "frustrated";
  aiSummary?: string;
  aiSuggestedResponse?: string;
  aiSuggestedTasks?: string[];

  // Draft response
  draftResponse?: DraftResponse;

  // Metadata
  receivedAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface EmailAddress {
  email: string;
  name?: string;
  partyId?: string;
}

type EmailIntent =
  | "request_information"
  | "provide_information"
  | "request_action"
  | "status_update"
  | "complaint"
  | "deadline"
  | "confirmation"
  | "general";

interface DraftResponse {
  content: string;
  generatedAt: string;
  generatedBy: "ai" | "user";
  status: "draft" | "approved" | "sent" | "discarded";
  approvedBy?: string;
  approvedAt?: string;
  approvalRequestId?: string; // links to central approval queue
}
```

### 8. Timeline Event

```typescript
interface TimelineEvent {
  id: string;
  firmId: string;
  caseId: string;

  // Event type
  type: TimelineEventType;

  // Content
  title: string;
  description?: string;

  // Related entities
  emailId?: string;
  documentId?: string;
  taskId?: string;
  invoiceId?: string;

  // Actor
  actorType: "user" | "client" | "system" | "ai";
  actorId?: string;

  // AI
  aiGenerated: boolean;
  aiSummary?: string;
  aiImportance?: "low" | "medium" | "high" | "critical";

  // Visibility
  visibility: "internal" | "client_visible";

  // Metadata
  occurredAt: string;
  createdAt: string;
}

type TimelineEventType =
  | "case_created"
  | "case_status_changed"
  | "case_stage_changed"
  | "email_received"
  | "email_sent"
  | "document_uploaded"
  | "document_signed"
  | "task_created"
  | "task_completed"
  | "note_added"
  | "call_logged"
  | "meeting_held"
  | "deadline_approaching"
  | "deadline_passed"
  | "invoice_sent"
  | "payment_received"
  | "milestone_reached"
  | "ai_insight"
  | "custom";
```

### 9. Task

```typescript
interface Task {
  id: string;
  firmId: string;
  caseId?: string;

  // Content
  title: string;
  description?: string;

  // Assignment
  assignedTo: string; // User ID
  assignedBy?: string;

  // Priority & Status
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";

  // Dates
  dueAt?: string;
  completedAt?: string;

  // AI
  aiGenerated: boolean;
  aiSource?: string; // e.g., "email:{emailId}"
  aiConfidence?: number;

  // Checklist
  checklist?: ChecklistItem[];

  // Dependencies
  dependsOnTaskIds?: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}
```

### 10. Calendar Event / Key Date

```typescript
interface CalendarEvent {
  id: string;
  firmId: string;
  caseId?: string;

  // Event details
  title: string;
  description?: string;
  type: CalendarEventType;

  // Timing
  startAt: string;
  endAt?: string;
  allDay: boolean;
  timezone: string;

  // Recurrence
  recurrence?: RecurrenceRule;

  // Location
  location?: string;
  videoLink?: string;

  // Attendees
  attendees: Attendee[];

  // Reminders
  reminders: Reminder[];

  // External sync
  externalCalendarId?: string;
  externalEventId?: string;

  // AI
  aiGenerated: boolean;
  aiSource?: string;
  aiBriefingPrepared?: boolean;
  aiBriefingDocumentId?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type CalendarEventType =
  | "hearing"
  | "meeting"
  | "deadline"
  | "limitation_date"
  | "completion"
  | "exchange"
  | "appointment"
  | "reminder"
  | "other";

interface Attendee {
  userId?: string;
  email: string;
  name?: string;
  status: "pending" | "accepted" | "declined" | "tentative";
}

interface Reminder {
  type: "email" | "push" | "sms";
  minutesBefore: number;
}

interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  until?: string;
  count?: number;
}
```

### 11. Time Entry

```typescript
interface TimeEntry {
  id: string;
  firmId: string;
  caseId: string;
  userId: string;

  // Time
  date: string;
  durationMinutes: number;

  // Description
  description: string;
  activityType?: string;

  // Billing
  billable: boolean;
  billed: boolean;
  invoiceId?: string;
  rate: Money;
  amount: Money;

  // AI
  aiGenerated: boolean;
  aiSource?: string; // e.g., "email:{emailId}"
  aiConfidence?: number;
  aiApproved: boolean;
  aiApprovedBy?: string;
  aiApprovedAt?: string;
  approvalRequestId?: string; // links to central approval queue

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### 12. Invoice

```typescript
interface Invoice {
  id: string;
  firmId: string;
  caseId: string;
  clientId: string;

  // Reference
  invoiceNumber: string;

  // Status
  status: InvoiceStatus;

  // Amounts
  subtotal: Money;
  vatAmount: Money;
  total: Money;
  paidAmount: Money;
  outstandingAmount: Money;

  // Dates
  issuedAt: string;
  dueAt: string;
  paidAt?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // VAT
  vatRate: number;
  vatNumber?: string;

  // Payment
  paymentLink?: string;
  paymentMethod?: string;

  // Documents
  documentId?: string; // Generated PDF

  // AI
  aiGeneratedNarrative?: boolean;
  aiCoverLetter?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type InvoiceStatus =
  | "draft"
  | "approved"
  | "sent"
  | "viewed"
  | "partial"
  | "paid"
  | "overdue"
  | "void"
  | "written_off";

interface InvoiceLineItem {
  id: string;
  type: "time" | "fixed" | "disbursement";
  description: string;
  quantity?: number;
  unitPrice?: Money;
  amount: Money;
  timeEntryIds?: string[];
  vatApplicable: boolean;
}
```

### 13. Payment

```typescript
interface Payment {
  id: string;
  firmId: string;
  invoiceId: string;
  clientId: string;

  // Amount
  amount: Money;

  // Method
  method: "card" | "bank_transfer" | "direct_debit" | "cash" | "cheque";

  // Provider
  provider?: "stripe" | "gocardless" | "manual";
  providerReference?: string;

  // Status
  status: "pending" | "processing" | "completed" | "failed" | "refunded";

  // Dates
  receivedAt: string;

  // Metadata
  createdAt: string;
}
```

### 14. Lead / Enquiry

```typescript
interface Lead {
  id: string;
  firmId: string;

  // Contact
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;

  // Enquiry
  practiceArea?: PracticeArea;
  description?: string;

  // Source
  source: LeadSource;

  // Status
  status: LeadStatus;

  // Assignment
  assignedTo?: string;

  // Scoring
  aiScore?: number; // 0-100, quality/urgency
  aiScoreFactors?: string[];

  // Conversion
  convertedToCaseId?: string;
  convertedToClientId?: string;

  // Quote
  quoteId?: string;

  // Follow-up
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  followUpCount: number;

  // AI
  aiSummary?: string;
  aiRecommendedActions?: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quoted"
  | "negotiating"
  | "converted"
  | "lost"
  | "unqualified";
```

### 15. Quote

```typescript
interface Quote {
  id: string;
  firmId: string;
  leadId?: string;
  clientId?: string;

  // Reference
  quoteNumber: string;

  // Practice area
  practiceArea: PracticeArea;
  matterType?: string;

  // Pricing
  lineItems: QuoteLineItem[];
  subtotal: Money;
  vatAmount: Money;
  disbursementsEstimate?: Money;
  total: Money;

  // Validity
  validUntil: string;

  // Status
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";

  // Documents
  documentId?: string;

  // Conversion
  convertedToCaseId?: string;

  // AI
  aiGenerated: boolean;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface QuoteLineItem {
  id: string;
  description: string;
  type: "fee" | "disbursement" | "vat";
  amount: Money;
  isEstimate: boolean;
}
```

### 16. Conflict Check

```typescript
interface ConflictCheck {
  id: string;
  firmId: string;

  // Search criteria
  searchTerms: string[];
  partyNames: string[];
  companyNumbers?: string[];

  // Results
  status: "pending" | "clear" | "potential_conflict" | "conflict";
  matches: ConflictMatch[];

  // Decision
  decision?: "proceed" | "decline" | "waiver_obtained";
  decisionBy?: string;
  decisionAt?: string;
  decisionNotes?: string;

  // Related
  leadId?: string;
  caseId?: string;

  // Metadata
  performedBy: string;
  performedAt: string;
}

interface ConflictMatch {
  caseId: string;
  caseReference: string;
  matchedParty: string;
  matchType: "exact" | "fuzzy" | "related";
  confidence: number;
  relationship?: string;
}
```

### 17. Audit Log

```typescript
interface AuditLog {
  id: string;
  firmId: string;

  // Actor
  actorType: "user" | "system" | "ai" | "api";
  actorId?: string;

  // Action
  action: string; // e.g., "case.create", "document.view"

  // Target
  entityType: string;
  entityId: string;

  // Change
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Context
  ipAddress?: string;
  userAgent?: string;

  // AI
  aiDecision?: {
    model: string;
    prompt?: string;
    reasoning?: string;
    confidence?: number;
  };

  // Metadata
  timestamp: string;
}
```

### 18. Holiday / Absence

```typescript
interface Holiday {
  id: string;
  firmId: string;
  userId: string;

  // Type
  type: "annual_leave" | "sick" | "personal" | "training" | "other";

  // Dates
  startDate: string;
  endDate: string;
  halfDay?: "am" | "pm";

  // Status
  status: "pending" | "approved" | "rejected" | "cancelled";

  // Approval
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Notes
  notes?: string;

  // AI
  aiCoverageWarning?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### 19. Referral Source

```typescript
interface ReferralSource {
  id: string;
  firmId: string;

  // Details
  name: string;
  type: "individual" | "company" | "marketing" | "directory" | "other";

  // Contact
  contactName?: string;
  email?: string;
  phone?: string;

  // Stats (AI-calculated)
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: Money;

  // Active
  isActive: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### 20. Template

```typescript
interface Template {
  id: string;
  firmId: string;

  // Identity
  name: string;
  description?: string;

  // Type
  type: "document" | "email" | "sms" | "letter";

  // Practice area
  practiceAreas: PracticeArea[];

  // Content
  subject?: string; // For email
  content: string; // With merge fields {{field}}

  // Merge fields
  mergeFields: MergeField[];

  // Settings
  isSystem: boolean; // System-provided template
  isActive: boolean;

  // AI
  aiEnhanced: boolean;
  aiPrompt?: string; // For AI customization

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface MergeField {
  name: string;
  description?: string;
  source: string; // e.g., "case.reference", "client.name"
  defaultValue?: string;
}
```

### 21. Signature Request

```typescript
interface SignatureRequest {
  id: string;
  firmId: string;
  caseId?: string;

  // Document
  documentId: string;

  // Status
  status: "draft" | "sent" | "viewed" | "partial" | "completed" | "declined" | "expired";

  // Provider
  provider: "docusign" | "adobe_sign" | "native";
  providerReference?: string;

  // Signers
  signers: Signer[];

  // Dates
  sentAt?: string;
  completedAt?: string;
  expiresAt?: string;

  // Result
  signedDocumentId?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Signer {
  id: string;
  order: number;
  name: string;
  email: string;
  role?: string;
  status: "pending" | "sent" | "viewed" | "signed" | "declined";
  signedAt?: string;
}
```

### 22. Notification

```typescript
interface Notification {
  id: string;
  firmId: string;
  userId: string;

  // Content
  type: NotificationType;
  title: string;
  message: string;

  // Related
  entityType?: string;
  entityId?: string;
  actionUrl?: string;

  // Priority
  priority: "low" | "medium" | "high" | "urgent";

  // Status
  read: boolean;
  readAt?: string;

  // Delivery
  channels: ("in_app" | "email" | "push" | "sms")[];
  deliveredVia: string[];

  // Metadata
  createdAt: string;
}

type NotificationType =
  | "task_assigned"
  | "task_due"
  | "deadline_approaching"
  | "email_received"
  | "document_signed"
  | "payment_received"
  | "case_update"
  | "ai_insight"
  | "system";
```

### 23. Approval Request (AI & Workflow)

AI is allowed to **propose** changes and drafts, but anything with external effect (sending comms, changing case stage/status, billing actions, etc.) must be applied via an approval request so autonomy is enforceable in backend code (not just UI).

```typescript
interface ApprovalRequest {
  id: string;
  firmId: string;

  // Origin
  sourceType: "ai" | "system" | "user";
  sourceId?: string; // userId when sourceType === 'user'

  // Proposed action
  action: string; // e.g. "email.send", "case.stage_change"
  summary: string; // human-readable, shown in approval queue
  proposedPayload?: Record<string, any>; // e.g. email body, task details, field updates

  // Target (optional for creates)
  entityType?: string; // e.g. "case", "email", "invoice"
  entityId?: string;

  // Decision
  status: ApprovalStatus;
  decidedBy?: string; // userId (or "system" for auto-approve)
  decidedAt?: string;
  decisionReason?: string;

  // Execution (optional)
  executedAt?: string;
  executionStatus?: "not_executed" | "executed" | "failed";
  executionError?: string;

  // AI metadata (when sourceType === "ai")
  ai?: {
    model: string;
    promptVersion?: string;
    reasoning?: string;
    confidence?: number; // 0-1
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";
```

---

## API Specification

### Base URL & Versioning

```
Production: https://api.legalcopilot.co.uk/v1
Staging: https://api.staging.legalcopilot.co.uk/v1
```

### Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```

Tokens obtained via OAuth 2.0 / OpenID Connect flow.

### Standard Response Format

```typescript
// Success
{
  "data": T,
  "meta": {
    "requestId": string,
    "timestamp": string
  }
}

// Error
{
  "error": {
    "code": string,
    "message": string,
    "details": object | null
  },
  "meta": {
    "requestId": string,
    "timestamp": string
  }
}

// List (page-based)
{
  "data": T[],
  "pagination": {
    "page": number,
    "pageSize": number,
    "totalItems": number,
    "totalPages": number
  },
  "meta": {...}
}

// List (cursor-based)
{
  "data": T[],
  "cursor": {
    "next": string | null,
    "prev": string | null
  },
  "meta": {...}
}
```

### Rate Limiting

```
Standard: 1000 requests/minute
Enterprise: 5000 requests/minute

Headers:
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## API Endpoints

### Authentication

```http
POST   /auth/login                     # Email/password login
POST   /auth/refresh                   # Refresh access token
POST   /auth/logout                    # Revoke tokens
POST   /auth/magic-link                # Send magic link email
GET    /auth/magic-link/{token}        # Verify magic link
POST   /auth/mfa/setup                 # Setup MFA
POST   /auth/mfa/verify                # Verify MFA code
GET    /auth/me                        # Get current user
```

### Firms

```http
GET    /firms/current                  # Get current firm
PATCH  /firms/current                  # Update firm settings
GET    /firms/current/offices          # List offices
POST   /firms/current/offices          # Create office
PATCH  /firms/current/offices/{id}     # Update office
DELETE /firms/current/offices/{id}     # Delete office
GET    /firms/current/settings         # Get all settings
PATCH  /firms/current/settings         # Update settings
GET    /firms/current/usage            # Get usage stats
```

### Users

```http
GET    /users                          # List users
POST   /users                          # Create user
GET    /users/{id}                     # Get user
PATCH  /users/{id}                     # Update user
DELETE /users/{id}                     # Deactivate user
POST   /users/{id}/invite              # Send invite email
GET    /users/{id}/permissions         # Get permissions
PATCH  /users/{id}/permissions         # Update permissions
```

### Approvals

```http
GET    /approvals                       # List approval requests (filter by status/action/entity)
GET    /approvals/{id}                  # Get approval request
POST   /approvals/{id}/approve          # Approve (and execute if applicable)
POST   /approvals/{id}/reject           # Reject
POST   /approvals/bulk/approve          # Bulk approve
POST   /approvals/bulk/reject           # Bulk reject
```

### Clients

```http
GET    /clients                        # List clients
POST   /clients                        # Create client
GET    /clients/{id}                   # Get client
PATCH  /clients/{id}                   # Update client
DELETE /clients/{id}                   # Archive client
GET    /clients/{id}/cases             # List client's cases
GET    /clients/{id}/documents         # List client's documents
GET    /clients/{id}/invoices          # List client's invoices
POST   /clients/{id}/portal/enable     # Enable portal access
POST   /clients/{id}/portal/disable    # Disable portal access
POST   /clients/{id}/aml/verify        # Trigger AML check
```

### Cases

```http
GET    /cases                          # List cases
POST   /cases                          # Create case
GET    /cases/{id}                     # Get case
PATCH  /cases/{id}                     # Update case
DELETE /cases/{id}                     # Archive case

# Parties
GET    /cases/{id}/parties             # List parties
POST   /cases/{id}/parties             # Add party
PATCH  /cases/{id}/parties/{partyId}   # Update party
DELETE /cases/{id}/parties/{partyId}   # Remove party

# Timeline
GET    /cases/{id}/timeline            # Get timeline events
POST   /cases/{id}/timeline            # Add manual event

# Documents
GET    /cases/{id}/documents           # List documents
POST   /cases/{id}/documents           # Upload document

# Emails
GET    /cases/{id}/emails              # List emails
POST   /cases/{id}/emails              # Send email

# Tasks
GET    /cases/{id}/tasks               # List tasks
POST   /cases/{id}/tasks               # Create task

# Time entries
GET    /cases/{id}/time-entries        # List time entries
POST   /cases/{id}/time-entries        # Create time entry

# Invoices
GET    /cases/{id}/invoices            # List invoices
POST   /cases/{id}/invoices            # Create invoice

# AI
GET    /cases/{id}/ai/summary          # Get AI summary
POST   /cases/{id}/ai/refresh          # Refresh AI analysis
GET    /cases/{id}/ai/insights         # Get AI insights
POST   /cases/{id}/ai/ask              # Ask question about case (returns citations)
GET    /cases/{id}/ai/similar          # Find similar cases
```

### Documents

```http
GET    /documents                      # List documents
POST   /documents                      # Upload document
GET    /documents/{id}                 # Get document metadata
GET    /documents/{id}/download        # Download file
DELETE /documents/{id}                 # Delete document
GET    /documents/{id}/versions        # List versions
POST   /documents/{id}/ai/summarize    # Generate AI summary
POST   /documents/{id}/ai/extract      # Extract data
GET    /documents/{id}/ai/search       # Semantic search within doc (returns matching chunks)

# Signatures
POST   /documents/{id}/signatures      # Request signatures
GET    /documents/{id}/signatures/{reqId} # Get signature status
```

### Emails

```http
GET    /emails                         # List emails (inbox)
GET    /emails/pending                 # Emails needing action
GET    /emails/{id}                    # Get email
POST   /emails/{id}/assign             # Assign to case
POST   /emails/{id}/draft              # Generate AI draft response
POST   /emails/{id}/send               # Send response
POST   /emails/{id}/approve            # Approve AI draft (via ApprovalRequest)
POST   /emails/compose                 # Compose new email
```

### Tasks

```http
GET    /tasks                          # List all tasks
GET    /tasks/my                       # List my tasks
POST   /tasks                          # Create task
GET    /tasks/{id}                     # Get task
PATCH  /tasks/{id}                     # Update task
DELETE /tasks/{id}                     # Delete task
POST   /tasks/{id}/complete            # Mark complete
POST   /tasks/ai/generate              # Generate tasks from context
```

### Calendar

```http
GET    /calendar/events                # List events
POST   /calendar/events                # Create event
GET    /calendar/events/{id}           # Get event
PATCH  /calendar/events/{id}           # Update event
DELETE /calendar/events/{id}           # Delete event
GET    /calendar/availability          # Get availability
POST   /calendar/sync                  # Sync with external calendar
GET    /calendar/deadlines             # List upcoming deadlines
POST   /calendar/events/{id}/ai/brief  # Generate meeting brief
```

### Time & Billing

```http
# Time entries
GET    /time-entries                   # List time entries
POST   /time-entries                   # Create time entry
GET    /time-entries/{id}              # Get time entry
PATCH  /time-entries/{id}              # Update time entry
DELETE /time-entries/{id}              # Delete time entry
GET    /time-entries/ai/suggestions    # Get AI-suggested entries
POST   /time-entries/ai/approve        # Bulk approve AI entries (via ApprovalRequest)

# Invoices
GET    /invoices                       # List invoices
POST   /invoices                       # Create invoice
GET    /invoices/{id}                  # Get invoice
PATCH  /invoices/{id}                  # Update invoice
DELETE /invoices/{id}                  # Void invoice
POST   /invoices/{id}/send             # Send invoice
POST   /invoices/{id}/remind           # Send reminder
GET    /invoices/{id}/pdf              # Download PDF

# Payments
GET    /payments                       # List payments
POST   /payments                       # Record payment
GET    /payments/{id}                  # Get payment
POST   /payments/link                  # Generate payment link
```

### Leads & CRM

```http
GET    /leads                          # List leads
POST   /leads                          # Create lead
GET    /leads/{id}                     # Get lead
PATCH  /leads/{id}                     # Update lead
DELETE /leads/{id}                     # Archive lead
POST   /leads/{id}/convert             # Convert to case
POST   /leads/{id}/ai/followup         # Generate follow-up

# Quotes
GET    /quotes                         # List quotes
POST   /quotes                         # Create quote
GET    /quotes/{id}                    # Get quote
PATCH  /quotes/{id}                    # Update quote
POST   /quotes/{id}/send               # Send quote
POST   /quotes/{id}/convert            # Convert to case
GET    /quotes/calculator              # Get quote calculator config

# Referral sources
GET    /referral-sources               # List sources
POST   /referral-sources               # Create source
GET    /referral-sources/{id}          # Get source
PATCH  /referral-sources/{id}          # Update source
GET    /referral-sources/{id}/stats    # Get source stats
```

### Conflict Checking

```http
POST   /conflicts/check                # Run conflict check
GET    /conflicts/{id}                 # Get check result
POST   /conflicts/{id}/decision        # Record decision
GET    /conflicts/history              # List past checks
```

### Compliance & Audit

```http
GET    /audit-logs                     # List audit logs
GET    /audit-logs/{entityType}/{id}   # Get entity audit trail
GET    /compliance/report              # Generate compliance report
GET    /compliance/alerts              # List compliance alerts
POST   /compliance/alerts/{id}/resolve # Resolve alert
```

### Team Management

```http
# Holidays
GET    /holidays                       # List holidays
POST   /holidays                       # Request holiday
GET    /holidays/{id}                  # Get holiday
PATCH  /holidays/{id}                  # Update holiday
POST   /holidays/{id}/approve          # Approve holiday
POST   /holidays/{id}/reject           # Reject holiday
GET    /holidays/calendar              # Get team calendar

# Workload
GET    /workload                       # Get team workload
GET    /workload/{userId}              # Get user workload
```

### Reports & Analytics

```http
GET    /reports/dashboard              # Get dashboard data
GET    /reports/cases                  # Case reports
GET    /reports/billing                # Billing reports
GET    /reports/productivity           # Productivity reports
GET    /reports/referrals              # Referral source ROI
GET    /reports/profitability          # Case profitability
POST   /reports/custom                 # Generate custom report
GET    /reports/ai/insights            # AI-generated insights
```

### Templates

```http
GET    /templates                      # List templates
POST   /templates                      # Create template
GET    /templates/{id}                 # Get template
PATCH  /templates/{id}                 # Update template
DELETE /templates/{id}                 # Delete template
POST   /templates/{id}/generate        # Generate document
GET    /templates/forms                # List legal forms
```

### Notifications

```http
GET    /notifications                  # List notifications
GET    /notifications/unread           # List unread
POST   /notifications/{id}/read        # Mark as read
POST   /notifications/read-all         # Mark all as read
GET    /notifications/settings         # Get notification settings
PATCH  /notifications/settings         # Update settings
```

### AI Endpoints

```http
# General AI
POST   /ai/chat                        # Chat with AI assistant (may include citations)
POST   /ai/summarize                   # Summarize text
POST   /ai/draft                       # Draft document/email
POST   /ai/extract                     # Extract data from text

# Morning briefing
GET    /ai/briefing                    # Get daily briefing

# Batch processing
POST   /ai/batch/emails                # Process pending emails
POST   /ai/batch/documents             # Process pending documents

# Configuration
GET    /ai/config                      # Get AI configuration
PATCH  /ai/config                      # Update AI configuration
POST   /ai/feedback                    # Submit AI feedback
```

### Practice Area Specific

```http
# Conveyancing
POST   /conveyancing/searches/order    # Order searches
GET    /conveyancing/searches/{id}     # Get search status
POST   /conveyancing/sdlt/calculate    # Calculate SDLT
POST   /conveyancing/sdlt/submit       # Submit SDLT
GET    /conveyancing/land-registry/forms # Get LR forms
POST   /conveyancing/land-registry/submit # Submit to LR
GET    /conveyancing/chain/{caseId}    # Get chain info

# Litigation
POST   /litigation/bundles             # Create bundle
GET    /litigation/bundles/{id}        # Get bundle
POST   /litigation/bundles/{id}/generate # Generate bundle PDF
GET    /litigation/limitation/calculate # Calculate limitation
GET    /litigation/court-forms         # Get court forms

# Probate
POST   /probate/iht/calculate          # Calculate IHT
GET    /probate/forms                  # Get probate forms
POST   /probate/estate-account         # Generate estate account
```

### Integrations

```http
# Microsoft 365
POST   /integrations/microsoft/connect    # Connect M365
GET    /integrations/microsoft/status     # Get connection status
POST   /integrations/microsoft/sync       # Trigger sync
DELETE /integrations/microsoft/disconnect # Disconnect

# Google Workspace
POST   /integrations/google/connect
GET    /integrations/google/status
POST   /integrations/google/sync
DELETE /integrations/google/disconnect

# Accounting (Xero, QuickBooks)
POST   /integrations/accounting/connect
GET    /integrations/accounting/status
POST   /integrations/accounting/sync
DELETE /integrations/accounting/disconnect

# Payment providers
POST   /integrations/stripe/connect
POST   /integrations/gocardless/connect

# E-signature providers
POST   /integrations/docusign/connect
POST   /integrations/adobe-sign/connect

# Conveyancing integrations
POST   /integrations/infotrack/connect
POST   /integrations/searchflow/connect
POST   /integrations/land-registry/connect
```

### Webhooks

```http
GET    /webhooks                       # List webhooks
POST   /webhooks                       # Create webhook
GET    /webhooks/{id}                  # Get webhook
PATCH  /webhooks/{id}                  # Update webhook
DELETE /webhooks/{id}                  # Delete webhook
GET    /webhooks/{id}/deliveries       # List deliveries
POST   /webhooks/{id}/test             # Test webhook
```

### Client Portal API

Separate API for client portal access:

```http
# Base: https://portal-api.legalcopilot.co.uk/v1

# Authentication (magic link only)
POST   /auth/magic-link                # Request magic link
GET    /auth/magic-link/{token}        # Verify & get token

# Cases
GET    /cases                          # List my cases
GET    /cases/{id}                     # Get case summary
GET    /cases/{id}/timeline            # Get timeline (filtered)
GET    /cases/{id}/documents           # Get shared documents
POST   /cases/{id}/documents           # Upload document

# Invoices & Payments
GET    /invoices                       # List my invoices
GET    /invoices/{id}                  # Get invoice
GET    /invoices/{id}/pay              # Get payment link

# Appointments
GET    /appointments/availability      # Get available slots
POST   /appointments                   # Book appointment

# AI Chat
POST   /chat                           # Ask question about case

# Profile
GET    /profile                        # Get my profile
PATCH  /profile                        # Update profile
```

---

## WebSocket Events

Real-time updates via WebSocket connection:

```
wss://api.legalcopilot.co.uk/ws
```

### Event Types

```typescript
// Client -> Server
{
  "type": "subscribe",
  "channel": "case:{caseId}" | "user:{userId}" | "firm"
}

{
  "type": "unsubscribe",
  "channel": string
}

// Server -> Client
{
  "type": "event",
  "channel": string,
  "event": EventType,
  "data": object
}

type EventType =
  | "email.received"
  | "email.ai_processed"
  | "document.uploaded"
  | "document.ai_processed"
  | "task.created"
  | "task.completed"
  | "case.updated"
  | "case.ai_insight"
  | "notification"
  | "ai.briefing_ready";
```

---

## Database Schema (PostgreSQL)

Use PostgreSQL from day one; keep the MVP schema minimal and add additional modules (billing, payments, etc.) once the core workflows are proven.

MVP core tables:

- `firms`, `users`, `clients`, `cases`
- `documents`, `document_chunks`
- `emails`, `timeline_events`, `tasks`
- `approval_requests`, `audit_logs`

Later modules (Phase 2+): `time_entries`, `invoices`, `payments`, `leads`, etc.

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Firms table with RLS
CREATE TABLE firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sra_number TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  plan TEXT NOT NULL DEFAULT 'starter',
  settings JSONB NOT NULL DEFAULT '{}',
  ai_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'fee_earner',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(firm_id, email)
);

CREATE INDEX idx_users_firm_id ON users(firm_id);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  type TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  aml_status TEXT NOT NULL DEFAULT 'pending',
  source JSONB,
  ai_profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_email ON clients(email);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Cases table
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  reference TEXT NOT NULL,
  practice_area TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  responsible_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'intake',
  stage TEXT NOT NULL,
  billing_model JSONB NOT NULL,
  risk_score INTEGER,
  ai_summary TEXT,
  ai_insights JSONB,
  embedding VECTOR(1536),  -- OpenAI embedding dimension
  practice_data JSONB,     -- Polymorphic practice-specific data
  tags TEXT[],
  custom_fields JSONB,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(firm_id, reference)
);

CREATE INDEX idx_cases_firm_id ON cases(firm_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_practice_area ON cases(practice_area);
-- Optional (premature on small datasets): add ANN index when you have enough rows
CREATE INDEX idx_cases_embedding ON cases USING ivfflat (embedding vector_cosine_ops);
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  case_id UUID REFERENCES cases(id),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_key TEXT NOT NULL,
  type TEXT,
  visibility TEXT NOT NULL DEFAULT 'internal',
  ai_summary TEXT,
  ai_extracted_data JSONB,
  embedding VECTOR(1536),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_firm_id ON documents(firm_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
-- Optional (premature on small datasets): add ANN index when you have enough rows
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Document chunks table (retrieval + source citations)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  case_id UUID REFERENCES cases(id),
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  char_start INTEGER,
  char_end INTEGER,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_firm_id ON document_chunks(firm_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_case_id ON document_chunks(case_id);
-- Optional (premature on small datasets): add ANN index when you have enough rows
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Emails table
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  case_id UUID REFERENCES cases(id),
  message_id TEXT NOT NULL,
  thread_id TEXT,
  direction TEXT NOT NULL,
  from_address JSONB NOT NULL,
  to_addresses JSONB NOT NULL,
  cc_addresses JSONB,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_case_match JSONB,
  ai_intent TEXT,
  ai_urgency INTEGER,
  ai_sentiment TEXT,
  ai_summary TEXT,
  ai_suggested_response TEXT,
  draft_response JSONB,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emails_firm_id ON emails(firm_id);
CREATE INDEX idx_emails_case_id ON emails(case_id);
CREATE INDEX idx_emails_message_id ON emails(message_id);
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Timeline events table
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID,
  related_entity_type TEXT,
  related_entity_id UUID,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_importance TEXT,
  visibility TEXT NOT NULL DEFAULT 'internal',
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_case_id ON timeline_events(case_id);
CREATE INDEX idx_timeline_occurred_at ON timeline_events(occurred_at);
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  case_id UUID REFERENCES cases(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES users(id),
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_firm_id ON tasks(firm_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Approval requests table (centralised human-in-the-loop)
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  source_type TEXT NOT NULL,           -- "ai" | "system" | "user"
  source_id UUID,                      -- user_id when source_type = "user"
  action TEXT NOT NULL,                -- e.g. "email.send", "case.stage_change"
  summary TEXT NOT NULL,
  proposed_payload JSONB,
  entity_type TEXT,
  entity_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  executed_at TIMESTAMPTZ,
  execution_status TEXT NOT NULL DEFAULT 'not_executed',
  execution_error TEXT,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_firm_id ON approval_requests(firm_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_action ON approval_requests(action);
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Time entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT NOT NULL,
  billable BOOLEAN NOT NULL DEFAULT TRUE,
  billed BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_id UUID,
  rate_amount INTEGER NOT NULL,
  rate_currency TEXT NOT NULL DEFAULT 'GBP',
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entries_case_id ON time_entries(case_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal_amount INTEGER NOT NULL,
  vat_amount INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  line_items JSONB NOT NULL,
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(firm_id, invoice_number)
);

CREATE INDEX idx_invoices_firm_id ON invoices(firm_id);
CREATE INDEX idx_invoices_status ON invoices(status);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  practice_area TEXT,
  description TEXT,
  source JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES users(id),
  ai_score INTEGER,
  converted_to_case_id UUID REFERENCES cases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_firm_id ON leads(firm_id);
CREATE INDEX idx_leads_status ON leads(status);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Audit logs table (append-only)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  actor_type TEXT NOT NULL,
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  ai_decision JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_firm_id ON audit_logs(firm_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Application code must set: SET LOCAL app.current_firm_id = '<firmId>' for every transaction
CREATE POLICY firm_isolation ON firms
  USING (id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON users
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON clients
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON cases
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON documents
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON document_chunks
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON approval_requests
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

CREATE POLICY firm_isolation ON audit_logs
  USING (firm_id = current_setting('app.current_firm_id')::UUID);

-- Add similar policies for all tables...
```

---

## Schema Evolution Strategy

### Start Minimal

- MVP core tables: `firms`, `users`, `clients`, `cases`, `documents`, `document_chunks`, `emails`, `tasks`, `approval_requests`, `audit_logs`
- Prefer JSONB for optional/practice-specific fields and AI outputs while requirements stabilise

### Migrations

- Use schema migrations (e.g. Drizzle) for all changes; never edit production schemas manually
- Add new columns as nullable, backfill via background jobs, then enforce constraints
- For breaking changes, dual-write + backfill + cutover (with audit logging)

### Re-chunking / Re-embedding

- Chunk + embed on ingestion and store per-document chunks for retrieval and citations
- When chunking/embedding strategies change, reprocess in the background and keep the canonical file blob unchanged (`storageKey`)

---

## AI Integration Architecture

### AI Service Interface

```typescript
interface AIService {
  // Text generation
  chat(messages: Message[], options?: ChatOptions): Promise<AIChatResponse>;

  // Summarization
  summarize(text: string, maxLength?: number): Promise<string>;

  // Classification
  classify<T>(text: string, categories: T[]): Promise<T>;

  // Extraction
  extract<T>(text: string, schema: JSONSchema): Promise<T>;

  // Embeddings
  embed(text: string): Promise<number[]>;

  // Similarity search
  findSimilar(embedding: number[], collection: string, limit: number): Promise<any[]>;
}

interface AIChatResponse {
  content: string;
  citations?: SourceCitation[]; // populated for RAG/Q&A flows
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface SourceCitation {
  documentId: string;
  documentChunkId: string;
  caseId?: string;
  pageStart?: number;
  pageEnd?: number;
  quote?: string;
  confidence?: number; // 0-1
}

type MessageRole = "system" | "user" | "assistant" | "tool";

interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

type JSONSchema = {
  $schema?: string;
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema | JSONSchema[];
  enum?: any[];
  additionalProperties?: boolean | JSONSchema;
};

interface ChatOptions {
  model?: "gpt-4" | "gpt-3.5-turbo" | "claude-3-opus" | "claude-3-haiku";
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

### Model Selection Strategy

```typescript
const MODEL_SELECTION = {
  // Complex reasoning tasks
  "email.draft_response": "gpt-4",
  "document.generate": "claude-3-opus",
  "case.analyze": "gpt-4",

  // Classification tasks (fast, cheap)
  "email.classify_intent": "gpt-3.5-turbo",
  "document.classify_type": "claude-3-haiku",
  "email.match_case": "gpt-3.5-turbo",

  // Extraction tasks
  "document.extract_data": "gpt-4",
  "email.extract_entities": "gpt-3.5-turbo",

  // Embeddings
  embedding: "text-embedding-3-small",
};
```

---

## Security Considerations

### Data Encryption

- All data encrypted at rest (AES-256)
- TLS 1.3 for all connections
- Sensitive fields additionally encrypted (bank details, passwords)

### Authentication

- OAuth 2.0 / OIDC for user authentication
- API keys for service-to-service
- Magic links for client portal

### Authorization

- Role-based access control (RBAC)
- Row-level security in PostgreSQL
- Firm isolation enforced at database level
- Firm/tenant identity derived from authenticated session (never trusted from request body/query)

### Session-Bound Tenancy Enforcement

- Derive `firmId` from the access token/session and set it server-side on every created row.
- For every DB transaction, set the tenant context once (transaction-scoped) and then run all queries in that context.
- Current implementation: `lib/db/tenant.ts` uses `set_config('app.current_firm_id', ..., true)` inside a transaction, and all API queries still include an explicit `firmId` predicate (defence-in-depth until RLS policies are enabled).
- Use `SET LOCAL` (transaction-scoped) to avoid cross-tenant leakage with connection pooling; background workers must also set `app.current_firm_id` per job before any queries.

### Audit Trail

- All changes logged to audit_logs table
- AI decisions logged with reasoning
- Immutable audit trail (append-only)

### Compliance

- GDPR: Data export, deletion, consent tracking
- SRA: Client money tracking, supervision logs
- Data retention policies enforced automatically

---

## Performance Considerations

### Caching Strategy

```
Redis for:
- Session data
- API rate limiting
- Frequently accessed firm settings
- AI response caching (with TTL)
```

### Database Optimization

- Indexes on all foreign keys and common queries
- Partitioning for large tables (audit_logs, timeline_events)
- Read replicas for reporting queries
- Connection pooling via PgBouncer

### API Performance

- Response time target: <200ms (p95)
- Use pagination for all list endpoints
- Prefer cursor-based pagination for large datasets; page-based is fine for small lists
- Background jobs for heavy processing (AI, document processing)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFlare                            │
│                    (CDN, DDoS, WAF)                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer                            │
│                    (AWS ALB / NLB)                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────┴───────┐                         ┌────────┴────────┐
│   API Servers │                         │  Worker Servers  │
│  (Next.js)    │                         │  (BullMQ)        │
│  Auto-scaling │                         │  Auto-scaling    │
└───────────────┘                         └─────────────────┘
        │                                           │
        └─────────────────────┬─────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                         Services                             │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│ PostgreSQL  │    Redis    │    MinIO    │   AI Providers   │
│ (RDS)       │ (ElastiCache│  (S3)       │ (OpenAI/Anthropic│
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

---

## Version History

| Version | Date       | Changes                 |
| ------- | ---------- | ----------------------- |
| 1.0.0   | 2024-12-17 | Initial design document |
