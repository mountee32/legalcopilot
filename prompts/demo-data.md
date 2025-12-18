# Demo Data System - Complete Guide

This document explains how to create, modify, and manage demo data for Legal Copilot, including PDF document generation and MinIO storage integration.

## Overview

The demo data system provides realistic UK legal practice data for development and testing. All demo entities use deterministic UUIDs and are prefixed with `DEMO_` for easy identification.

**Key Files:**

```
tests/fixtures/demo-data/
├── index.ts                    # Orchestrator (~100 lines)
├── ids.ts                      # DEMO_IDS constants
├── types.ts                    # SeederContext, SeedResult interfaces
├── clear.ts                    # clearDemoData function
├── demo-documents.ts           # PDF content definitions
├── pdf-generator.ts            # PDF generation functions using pdf-lib
├── verify.ts                   # Data verification script
└── seeders/                    # Individual entity seeders
    ├── firm.ts                 # Firm + 8 users
    ├── clients.ts              # 15 clients
    ├── matters.ts              # 25 matters
    ├── tasks.ts                # 40 tasks
    ├── time-entries.ts         # 50 time entries
    ├── invoices.ts             # 10 invoices + 5 payments
    ├── documents.ts            # 30 documents (12 with PDFs)
    ├── calendar-events.ts      # 15 calendar events
    ├── notifications.ts        # 20 notifications
    ├── compliance.ts           # 10 risk evaluations + 5 rules
    ├── timeline-events.ts      # 66 timeline events
    ├── emails.ts               # 18 AI inbox emails
    └── approvals.ts            # 5 approval requests
```

## Commands

```bash
# Seed demo data (safe to run multiple times - uses upsert)
npm run demo:seed

# Clear existing demo data and re-seed fresh
npm run demo:reset

# Remove all demo data without re-seeding
npm run demo:clear
```

**Required environment variables:**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/template_db
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

## UUID Convention

All demo data uses deterministic UUIDs for reproducibility:

```
de000000-0000-4000-aXXX-YYYYYYYYYYYY
                   │     └── Sequential number (000000000001, 000000000002, etc.)
                   └── Entity type code
```

**Entity Type Codes:**
| Code | Entity |
|------|--------|
| a000 | Firm |
| a001 | Users |
| a002 | Clients |
| a003 | Matters |
| a004 | Time Entries |
| a005 | Tasks |
| a006 | Invoices |
| a007 | Documents |
| a008 | Calendar Events |
| a009 | Emails |
| a00a | Approvals |
| b000 | Uploads (MinIO) |

## Demo Firm & Users

**Firm:** Harrison & Clarke Solicitors (ID: `de000000-0000-4000-a000-000000000001`)

**Users (mapped to fast-login roles):**
| Role | Character | Email | User ID |
|------|-----------|-------|---------|
| Partner | Sarah Harrison | sarah.harrison@harrisonclark.demo | de000000-...a001-...001 |
| Sr Associate | Victoria Clarke | victoria.clarke@harrisonclark.demo | de000000-...a001-...007 |
| Associate | James Clarke | james.clarke@harrisonclark.demo | de000000-...a001-...002 |
| Paralegal | Tom Richards | tom.richards@harrisonclark.demo | de000000-...a001-...005 |
| Secretary | Lucy Taylor | lucy.taylor@harrisonclark.demo | de000000-...a001-...008 |

## Adding New Entities

### 1. Add ID to `ids.ts`

Add the new ID to the appropriate section:

```typescript
export const DEMO_IDS = {
  // ... existing IDs
  newEntity: {
    item1: "de000000-0000-4000-aXXX-000000000001",
    item2: "de000000-0000-4000-aXXX-000000000002",
  },
};
```

### 2. Add to Cleanup Tables in `clear.ts`

Add your table to the cleanup list:

```typescript
const tables = [
  { name: "new_entity", table: newEntity },
  // ... other tables (order matters - delete children before parents)
];
```

### 3. Create a Seeder in `seeders/`

Create `seeders/new-entity.ts`:

```typescript
import { db } from "@/lib/db";
import { newEntity } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedNewEntity(ctx: SeederContext) {
  console.log("  Seeding new entity...");

  const data = [
    {
      id: DEMO_IDS.newEntity.item1,
      firmId: DEMO_IDS.firm,
      // ... other fields
      createdAt: ctx.now,
    },
  ];

  for (const item of data) {
    await db
      .insert(newEntity)
      .values(item)
      .onConflictDoUpdate({
        target: newEntity.id,
        set: { updatedAt: ctx.now },
      });
    console.log(`    Created: ${item.name}`);
  }
}
```

### 4. Register in `index.ts`

Import and call your seeder in the orchestrator:

```typescript
import { seedNewEntity } from "./seeders/new-entity";

// In seedDemoData():
await seedNewEntity(ctx);
```

## Creating PDF Documents

### Step 1: Add Generator Function (if needed)

In `pdf-generator.ts`, create a new generator:

```typescript
export async function generateMyDocument(params: MyDocParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Add content using page.drawText()
  page.drawText(params.title, { x: 50, y: 780, size: 16, font });

  return pdfDoc.save();
}
```

### Step 2: Define Document Content

In `demo-documents.ts`, add to `generateAllDemoDocuments()`:

```typescript
documents.push({
  id: DEMO_IDS.documents.docX,
  filename: "my-document.pdf",
  content: await generateMyDocument({
    title: "Document Title",
    // ... other params
  }),
});
```

### Step 3: Link to Matter in `seeders/documents.ts`

In the `documentsData` array:

```typescript
{
  id: DEMO_IDS.documents.docX,
  firmId: DEMO_IDS.firm,
  matterId: DEMO_IDS.matters.myMatter,  // Link to specific matter
  title: "My Document Title",
  type: "contract" as const,  // contract, letter_out, letter_in, court_form, evidence, other
  status: "approved" as const,
  filename: "my-document.pdf",
  mimeType: "application/pdf",
  fileSize: 50000,
  createdBy: DEMO_IDS.users.associate,
  documentDate: new Date("2024-11-01"),
  createdAt: now,
},
```

### Step 4: PDF Upload Happens Automatically

The seeder checks if a document ID has generated PDF content and uploads to MinIO:

```typescript
const pdfDoc = generatedDocs.find((d) => d.id === doc.id);
if (pdfDoc) {
  // Uploads to MinIO and creates upload record
}
```

## Available PDF Generators

| Function                       | Purpose                    | Key Parameters                                        |
| ------------------------------ | -------------------------- | ----------------------------------------------------- |
| `generateClientLetter()`       | Firm letterhead letters    | recipientName, subject, body[], senderName            |
| `generatePropertyContract()`   | Property sale contracts    | propertyAddress, sellerName, buyerName, purchasePrice |
| `generateParticularsOfClaim()` | Court claim documents      | caseNumber, claimant, defendant, particulars[]        |
| `generateWitnessStatement()`   | CPR-compliant statements   | witnessName, paragraphs[], caseNumber                 |
| `generateFormE()`              | Financial disclosure       | applicantName, assets[], liabilities[], income[]      |
| `generateET1Form()`            | Employment tribunal claims | claimantName, respondentName, claimDetails            |
| `generateInvoice()`            | Legal invoices             | invoiceNumber, clientName, lineItems[]                |
| `generateWill()`               | Last will and testament    | testatorName, executors[], beneficiaries[]            |

## Timeline Events

Timeline events provide case history. Add to `timelineEventsData` array:

```typescript
{
  firmId: DEMO_IDS.firm,
  matterId: DEMO_IDS.matters.myMatter,
  type: "document_uploaded" as const,  // See timeline event types below
  title: "Contract received",
  description: "Draft contract received from seller's solicitors.",
  actorType: "user" as const,  // user, system, ai
  actorId: DEMO_IDS.users.associate,  // null for system/ai
  occurredAt: daysAgo(30),  // Helper function for past dates
  metadata: { model: "gpt-4", confidence: 0.94 },  // Optional, for AI events
}
```

**Timeline Event Types:**

- `matter_created`, `matter_updated`, `matter_archived`
- `document_uploaded`, `document_summarized`, `document_extracted`
- `email_sent`, `email_received`
- `task_created`, `task_completed`
- `time_entry_submitted`, `time_entry_approved`
- `invoice_generated`, `invoice_sent`, `payment_recorded`
- `calendar_event_created`
- `conflict_check_run`, `conflict_check_cleared`
- `note_added`

## AI Inbox Emails

Add emails with AI analysis:

```typescript
{
  id: DEMO_IDS.emails.emailX,
  firmId: DEMO_IDS.firm,
  matterId: DEMO_IDS.matters.myMatter,
  direction: "inbound" as const,
  fromAddress: { email: "client@email.com", name: "Client Name" },
  toAddresses: [{ email: "james.clarke@harrisonclark.demo", name: "James Clarke" }],
  subject: "Urgent: Need update on my case",
  bodyText: "Full email body text...",
  status: "received" as const,
  aiProcessed: true,
  aiIntent: "request_update" as const,
  aiSentiment: "neutral" as const,
  aiUrgency: 65,  // 0-100 scale
  aiSummary: "Client requesting progress update on their matter.",
  aiSuggestedResponse: "Dear Client, Thank you for your email...",
  aiMatterLinkConfidence: 0.92,
  receivedAt: new Date(),
  createdAt: now,
}
```

**AI Intent Options:** `request_information`, `provide_information`, `request_action`, `status_update`, `complaint`, `deadline`, `confirmation`, `general`

**AI Sentiment Options:** `positive`, `neutral`, `negative`, `frustrated`

## Approval Requests

Add AI-proposed actions for human approval:

```typescript
{
  id: DEMO_IDS.approvals.approvalX,
  firmId: DEMO_IDS.firm,
  sourceType: "ai" as const,
  action: "email.send",  // email.send, task.create, matter.link
  summary: "AI-drafted response to client enquiry",
  proposedPayload: {
    emailId: DEMO_IDS.emails.emailX,
    to: "client@email.com",
    subject: "Re: Your enquiry",
    body: "Draft response text...",
  },
  entityType: "email",
  entityId: DEMO_IDS.emails.emailX,
  matterId: DEMO_IDS.matters.myMatter,
  status: "pending" as const,  // pending, approved, rejected
  aiMetadata: { model: "gpt-4", confidence: 0.88, reasoning: "..." },
  createdAt: now,
}
```

## Testing Demo Data

### Run Playwright Tests

```bash
# Test fast-login and demo data display
npx playwright test tests/e2e/browser/fast-login.spec.ts --project=chromium

# Test timeline events
npx playwright test tests/e2e/browser/demo-timeline.spec.ts --project=chromium

# Test documents
npx playwright test tests/e2e/browser/demo-documents.spec.ts --project=chromium
```

### Quick Database Verification

```bash
# Create a temp script to verify data
cat > /tmp/check-demo.ts << 'EOF'
import { db } from "@/lib/db";
import { matters, documents, timelineEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEMO_FIRM_ID = "de000000-0000-4000-a000-000000000001";

async function main() {
  const matterCount = await db.select().from(matters).where(eq(matters.firmId, DEMO_FIRM_ID));
  const docCount = await db.select().from(documents).where(eq(documents.firmId, DEMO_FIRM_ID));
  const timelineCount = await db.select().from(timelineEvents).where(eq(timelineEvents.firmId, DEMO_FIRM_ID));

  console.log(`Matters: ${matterCount.length}`);
  console.log(`Documents: ${docCount.length}`);
  console.log(`Timeline Events: ${timelineCount.length}`);
  process.exit(0);
}
main();
EOF

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/template_db node --import tsx /tmp/check-demo.ts
```

## Current Data Counts

| Entity            | Count | Notes                                  |
| ----------------- | ----- | -------------------------------------- |
| Users             | 8     | Partners, associates, paralegals       |
| Clients           | 15    | Individuals, companies, trusts         |
| Matters           | 25    | 8 practice areas                       |
| Time Entries      | 50    | Billable and non-billable              |
| Tasks             | 40    | Various statuses (13 for MAT-DEMO-001) |
| Invoices          | 10    | Draft, sent, paid states               |
| Payments          | 5     | BACS and card payments                 |
| Documents         | 30    | 12 with actual PDFs                    |
| Calendar Events   | 15    | Hearings, meetings, deadlines          |
| Notifications     | 20    | Task, payment, deadline notifications  |
| Timeline Events   | 66    | Case history across 9 matters          |
| Emails (AI Inbox) | 18    | With AI analysis (9 for MAT-DEMO-001)  |
| Risk Evaluations  | 10    | Low to critical risk levels            |
| Compliance Rules  | 5     | Deadline, workload, supervision rules  |
| Approval Requests | 5     | 4 pending, 1 approved                  |

## Matter Types with Full Data

These matters have comprehensive demo data (timeline, documents, time entries):

| Matter ID             | Reference    | Type                  | Client              |
| --------------------- | ------------ | --------------------- | ------------------- |
| conveyancing          | MAT-DEMO-001 | Property Purchase     | Margaret Thompson   |
| litigation            | MAT-DEMO-002 | Construction Dispute  | Apex Developments   |
| personalInjuryRTA     | MAT-DEMO-008 | RTA Injury Claim      | Robert Williams     |
| familyDivorce         | MAT-DEMO-012 | Divorce               | Jennifer Adams      |
| employmentDismissal   | MAT-DEMO-015 | Unfair Dismissal      | Michael O'Brien     |
| probateEstate         | MAT-DEMO-018 | Estate Administration | George Henderson    |
| criminalDriving       | MAT-DEMO-021 | Drink Driving         | George Henderson    |
| immigrationTier2      | MAT-DEMO-023 | Skilled Worker Visa   | Fatima Hassan       |
| commercialShareholder | MAT-DEMO-025 | Shareholder Agreement | TechStart Solutions |

## Fast-Login Integration

Fast-login users are mapped to demo data users so they see the same matters, documents, and timeline events as their demo character. This is configured in:

- `app/api/auth/fast-login/route.ts` - User ID mapping and permissions
- `components/auth/fast-login-buttons.tsx` - UI button labels

**Permissions by Role:**
| Role | Key Permissions |
|------|-----------------|
| Partner | cases:_, clients:_, documents:_, billing:_, emails:_, approvals:_ |
| Sr Associate | cases:_, clients:_, documents:_, emails:_, approvals:_ |
| Associate | cases:read/update, documents:_, emails:read |
| Paralegal | cases:read, documents:read/create, emails:read |
| Secretary | cases:read, documents:read, emails:read, calendar:\* |

## Troubleshooting

### Documents not showing PDFs

1. Check MinIO is running: `docker compose up -d`
2. Verify document ID is in `demo-documents.ts`
3. Check filename in `index.ts` matches `demo-documents.ts`

### Timeline events not appearing

1. Ensure matterId matches a valid DEMO_IDS.matters.\* entry
2. Check the API endpoint works: `GET /api/matters/{id}/timeline`
3. Verify user has `cases:read` permission

### Fast-login not seeing demo data

1. Run `npm run demo:reset` to reload data
2. Check user ID in fast-login matches DEMO_IDS.users.\*
3. Verify firmId is correctly set to DEMO_FIRM_ID

### 403 errors on API endpoints

1. Check role permissions in `ROLE_PERMISSIONS` object in `app/api/auth/fast-login/route.ts`
2. Ensure the required permission is included (e.g., `emails:read`, `emails:*`)

## Example: Adding a New Document to MAT-DEMO-001

Here's a complete example of adding a new mortgage offer PDF to the conveyancing matter:

### 1. Add document ID (`ids.ts`)

```typescript
export const DEMO_IDS = {
  documents: {
    // ... existing
    mortgageOffer: "de000000-0000-4000-a008-000000000031",
  },
};
```

### 2. Create PDF generator (if needed) or use existing

For a letter-style document, use `generateClientLetter()`.

### 3. Add to demo-documents.ts

```typescript
documents.push({
  id: DEMO_IDS.documents.mortgageOffer,
  filename: "mortgage-offer-nationwide.pdf",
  content: await generateClientLetter({
    recipientName: "Mrs Margaret Thompson",
    recipientAddress: ["42 Oak Road", "Didsbury", "Manchester", "M20 6RT"],
    subject: "Mortgage Offer - 15 Willow Lane, Richmond",
    body: [
      "We are pleased to confirm your mortgage offer as follows:",
      "Property: 15 Willow Lane, Richmond, TW9 1AA",
      "Loan Amount: £680,000",
      "Interest Rate: 4.25% fixed for 5 years",
      "Term: 25 years",
      "Monthly Payment: £3,680.45",
      "This offer is valid until 15th January 2025.",
    ],
    senderName: "Mortgage Team",
    senderTitle: "Nationwide Building Society",
    date: "15th November 2024",
    ourRef: "NW/MT/2024/123456",
  }),
});
```

### 4. Add to documentsData in `seeders/documents.ts`

```typescript
{
  id: DEMO_IDS.documents.mortgageOffer,
  firmId: DEMO_IDS.firm,
  matterId: DEMO_IDS.matters.conveyancing,
  title: "Mortgage Offer - Nationwide",
  type: "other" as const,
  status: "approved" as const,
  filename: "mortgage-offer-nationwide.pdf",
  mimeType: "application/pdf",
  fileSize: 52000,
  createdBy: DEMO_IDS.users.associate,
  documentDate: new Date("2024-11-15"),
  createdAt: ctx.now,
},
```

### 5. Add timeline event (optional) in `seeders/timeline-events.ts`

```typescript
{
  firmId: DEMO_IDS.firm,
  matterId: DEMO_IDS.matters.conveyancing,
  type: "document_uploaded" as const,
  title: "Mortgage offer received",
  description: "Nationwide mortgage offer for £680,000 at 4.25% fixed.",
  actorType: "user" as const,
  actorId: DEMO_IDS.users.associate,
  occurredAt: daysAgo(14),
},
```

### 6. Test

```bash
npm run demo:reset
npx playwright test tests/e2e/browser/demo-documents.spec.ts --project=chromium
```
