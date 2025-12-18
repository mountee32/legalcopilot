# TASK: Comprehensive Demo/Test Data System

## Status

**Mechanism: COMPLETE** - The seed/reset infrastructure is working.

```bash
npm run demo:seed   # Seed demo data
npm run demo:reset  # Clear and reseed
npm run demo:clear  # Clear demo data only
```

**Current state**: Minimal dataset (1 firm, 2 users, 2 clients, 2 matters, 4 time entries)

**Remaining**: Expand the dataset to be comprehensive.

---

## Subtasks for Expansion

Each subtask below can be done independently by a Sonnet agent. Each should:

1. Read `tests/fixtures/demo-data/index.ts` for the existing pattern
2. Add new deterministic UUIDs to `DEMO_IDS` (use `de000000-0000-4000-aXXX-YYYYYYYYYYYY` format)
3. Add seed data in the appropriate section
4. Test with `npm run demo:reset`

### SUBTASK 1: Expand Users (add 6 more)

**File**: `tests/fixtures/demo-data/index.ts`

Add users to reach the target team:

- Victoria Clarke (Senior Partner, admin) - already have 2 partners
- Emma Williams (Associate)
- David Chen (Associate)
- Priya Patel (Associate)
- Tom Richards (Paralegal)
- Sophie Brown (Paralegal)
- Lucy Taylor (Receptionist/Admin)

Pattern for new user IDs:

```typescript
users: {
  partner: "de000000-0000-4000-a001-000000000001",
  associate: "de000000-0000-4000-a001-000000000002",
  // Add: associate2, associate3, associate4, paralegal1, paralegal2, receptionist
}
```

### SUBTASK 2: Expand Clients (add 13 more)

**File**: `tests/fixtures/demo-data/index.ts`

Add clients to reach 15 total:

**Individuals (6 more)**:

- Robert Williams (PI claim)
- Jennifer Adams (Family/divorce)
- Michael O'Brien (Criminal)
- Fatima Hassan (Immigration)
- George Henderson (Probate)
- Elizabeth Carter (Wills)

**Companies (5 more)**:

- TechStart Solutions Ltd (Employment dispute)
- Northern Manufacturing plc (Commercial)
- Riverside Properties Ltd (Conveyancing)
- Global Imports Ltd (Commercial)
- Healthcare Plus Ltd (Employment)

**Trusts/Estates (2)**:

- Henderson Family Trust
- Carter Estate

Use realistic UK addresses, company numbers, contact details.

### SUBTASK 3: Expand Matters (add 23 more)

**File**: `tests/fixtures/demo-data/index.ts`

Target: 25 matters across practice areas. Add to existing 2:

| Practice Area   | Count | Titles                                                                         |
| --------------- | ----- | ------------------------------------------------------------------------------ |
| Conveyancing    | +3    | Sale of 42 Oak Road, Purchase of Flat 5 Riverside, Remortgage                  |
| Litigation      | +2    | Debt Recovery - £45k, Breach of Contract - Supply Agreement                    |
| Personal Injury | +4    | RTA Whiplash Claim, Workplace Accident, Slip & Fall, CICA Application          |
| Family          | +3    | Divorce - Financial Settlement, Child Arrangements Order, Prenuptial Agreement |
| Employment      | +3    | Unfair Dismissal Tribunal, Redundancy Consultation, Settlement Agreement       |
| Probate         | +3    | Henderson Estate Administration, Will Dispute, Grant of Probate                |
| Criminal        | +2    | Magistrates - Driving Offence, Crown Court - Fraud                             |
| Immigration     | +2    | Tier 2 Visa Application, Spouse Visa                                           |
| Commercial      | +1    | Shareholder Agreement                                                          |

Include mix of statuses: active, pending, closed.

### SUBTASK 4: Expand Time Entries (add ~100 more)

**File**: `tests/fixtures/demo-data/index.ts`

Add 4-8 time entries per matter showing realistic billing:

- Vary fee earners (assign to different users)
- Vary dates (spread over past 30 days)
- Vary durations (15 min to 3 hours)
- Mix of statuses: draft, submitted, approved, billed
- Mix of sources: manual, ai_suggested, calendar, document_activity
- Include some non-billable entries

Example descriptions:

- "Reviewing contract and advising client"
- "Telephone attendance on opponent's solicitors"
- "Preparing witness statement"
- "Court attendance - case management hearing"
- "Drafting letter before action"

### SUBTASK 5: Add Documents

**File**: `tests/fixtures/demo-data/index.ts`

Add 3-5 documents per matter:

Schema reference: `lib/db/schema/documents.ts`

- types: letter_in, letter_out, contract, court_form, evidence, note, id_document
- statuses: draft, pending_review, approved, sent, archived

Example per conveyancing matter:

- Contract for sale (contract, approved)
- Title documents (evidence, approved)
- Property information form (evidence, draft)
- Letter to lender (letter_out, sent)

### SUBTASK 6: Add Invoices and Payments

**File**: `tests/fixtures/demo-data/index.ts`

Schema reference: `lib/db/schema/billing.ts`

Add ~10 invoices across matters:

- 3 fully paid
- 2 partially paid
- 3 sent/outstanding
- 2 draft

Include invoice line items and some payment records.

### SUBTASK 7: Add Tasks

**File**: `tests/fixtures/demo-data/index.ts`

Schema reference: `lib/db/schema/tasks.ts`

Add ~30 tasks across matters:

- Mix of statuses: pending, in_progress, completed, cancelled
- Mix of priorities: low, medium, high, urgent
- Some with due dates (past, today, future)
- Assigned to various users

Example tasks:

- "Chase seller's solicitors for replies"
- "Review expert report"
- "Prepare court bundle"
- "Client meeting preparation"

### SUBTASK 8: Add Calendar Events

**File**: `tests/fixtures/demo-data/index.ts`

Schema reference: `lib/db/schema/calendar.ts`

Add ~15 calendar events:

- Court hearings (future dates)
- Client meetings
- Deadlines
- Internal reviews

### SUBTASK 9: Add Notifications

**File**: `tests/fixtures/demo-data/index.ts`

Schema reference: `lib/db/schema/notifications.ts`

Add ~20 notifications:

- Mix of read/unread
- Various types: task_due, invoice_paid, document_uploaded, ai_suggestion
- Link to relevant matters/users

### SUBTASK 10: Add Compliance Data

**File**: `tests/fixtures/demo-data/index.ts`

Schema reference: `lib/db/schema/compliance.ts`

Add risk assessments, AML records if schema supports it.

- Vary risk scores (10-90)
- Different risk factors

---

## Architecture Reference

**Current file**: `tests/fixtures/demo-data/index.ts`

**Key patterns**:

- Deterministic UUIDs in `DEMO_IDS` object
- All data uses `DEMO_FIRM_ID` for tenant isolation
- `DEMO_PREFIX` added to names for easy identification
- `onConflictDoUpdate` for idempotent seeding
- Cleanup deletes by `firmId = DEMO_FIRM_ID`

**Schema files** (read for column names and enums):

- `lib/db/schema/users.ts`
- `lib/db/schema/clients.ts`
- `lib/db/schema/matters.ts`
- `lib/db/schema/billing.ts`
- `lib/db/schema/documents.ts`
- `lib/db/schema/tasks.ts`
- `lib/db/schema/calendar.ts`
- `lib/db/schema/notifications.ts`
- `lib/db/schema/compliance.ts`

---

## Acceptance Criteria

- [x] Seed mechanism works (`npm run demo:seed`)
- [x] Reset mechanism works (`npm run demo:reset`)
- [x] Clear mechanism works (`npm run demo:clear`)
- [x] Idempotent seeding (can run multiple times)
- [ ] Full user team (8-10 users)
- [ ] 15+ clients
- [ ] 25+ matters across all practice areas
- [ ] Time entries on all matters
- [ ] Documents on key matters
- [ ] Invoices with various statuses
- [ ] Tasks with due dates
- [ ] Calendar events
- [ ] Notifications
- [ ] Compliance data

## Notes

- Single tenant (one firm) is sufficient
- Use realistic but fictional UK names, addresses, case details
- Date-relative data uses seed timestamp for "today"
