# FEAT: Case Type Task Templates

## Summary

Enable task templates per practice area and sub-type that can be applied when creating a matter and accessed mid-case to add additional template tasks. Staff can customise which optional tasks to include and edit task details before creation.

## User Stories

**As a fee earner**, I want mandatory tasks auto-created when I open a new matter so I don't forget regulatory requirements.

**As a paralegal**, I want to select optional tasks from a template when creating a case so I can tailor the checklist to the specific matter.

**As a fee earner mid-case**, I want to access the original template and add tasks I initially skipped, so I can respond to changing case requirements.

**As a firm admin**, I want to define firm-specific task templates so our internal policies are consistently applied.

---

## Practice Area Sub-Types (Fixed Enum)

Each practice area has a fixed set of sub-types:

```typescript
const practiceAreaSubTypes = {
  conveyancing: [
    "freehold_purchase",
    "freehold_sale",
    "leasehold_purchase",
    "leasehold_sale",
    "remortgage",
    "transfer_of_equity",
    "new_build",
    "auction_purchase",
    "commercial_purchase",
    "commercial_sale",
    "commercial_lease",
  ],

  litigation: [
    "contract_dispute",
    "debt_recovery",
    "professional_negligence",
    "property_dispute",
    "inheritance_dispute",
    "judicial_review",
    "defamation",
    "injunction",
  ],

  family: [
    "divorce_petition",
    "financial_settlement",
    "child_arrangements",
    "domestic_abuse",
    "prenuptial_agreement",
    "cohabitation_dispute",
    "adoption",
    "child_abduction",
  ],

  probate: [
    "grant_of_probate",
    "letters_of_administration",
    "estate_administration",
    "will_drafting",
    "intestacy",
    "trust_administration",
    "estate_dispute",
  ],

  employment: [
    "unfair_dismissal",
    "discrimination",
    "redundancy",
    "settlement_agreement",
    "tribunal_claim",
    "contract_dispute",
    "whistleblowing",
  ],

  immigration: [
    "skilled_worker_visa",
    "family_visa",
    "student_visa",
    "indefinite_leave",
    "naturalisation",
    "asylum",
    "deportation_appeal",
    "sponsor_licence",
  ],

  personal_injury: [
    "road_traffic_accident",
    "employer_liability",
    "public_liability",
    "clinical_negligence",
    "industrial_disease",
    "occupiers_liability",
  ],

  commercial: [
    "company_formation",
    "shareholder_agreement",
    "asset_purchase",
    "share_purchase",
    "joint_venture",
    "commercial_contract",
    "terms_and_conditions",
    "gdpr_compliance",
  ],

  criminal: [
    "magistrates_court",
    "crown_court",
    "motoring_offence",
    "fraud",
    "regulatory_prosecution",
    "appeal",
  ],

  ip: [
    "trademark_registration",
    "trademark_dispute",
    "patent_application",
    "copyright_infringement",
    "licensing_agreement",
  ],

  insolvency: [
    "creditor_voluntary_liquidation",
    "compulsory_liquidation",
    "administration",
    "individual_voluntary_arrangement",
    "bankruptcy",
    "debt_restructuring",
  ],

  other: ["general"],
} as const;
```

---

## Task Categories

| Category        | Description                                            | Editable by Firm   |
| --------------- | ------------------------------------------------------ | ------------------ |
| `regulatory`    | SRA/legal requirements (AML, conflict checks)          | No - system locked |
| `legal`         | Court/statutory requirements (limitation dates, forms) | No - system locked |
| `firm_policy`   | Firm's internal policies (supervisor sign-off)         | Yes                |
| `best_practice` | Recommended steps (client updates)                     | Yes                |

---

## Data Model

### New Tables

```typescript
// Template definitions (firm-level or system-level)
export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),
  // NULL firmId = system template (regulatory/legal)

  name: text("name").notNull(), // "Freehold Purchase - Standard"
  description: text("description"),

  practiceArea: practiceAreaEnum("practice_area").notNull(),
  subType: text("sub_type").notNull(), // from fixed enum above

  isDefault: boolean("is_default").notNull().default(false),
  // If true, auto-suggested when subType matches

  isActive: boolean("is_active").notNull().default(true),

  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Individual tasks within a template
export const taskTemplateItems = pgTable("task_template_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => taskTemplates.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description"),

  mandatory: boolean("mandatory").notNull().default(false),
  category: text("category").notNull(), // regulatory, legal, firm_policy, best_practice

  defaultPriority: taskPriorityEnum("default_priority").notNull().default("medium"),

  // Relative due date calculation
  relativeDueDays: integer("relative_due_days"), // Days from anchor
  dueDateAnchor: text("due_date_anchor"), // matter_opened, key_deadline

  // Default assignee by role (resolved at creation time)
  assigneeRole: text("assignee_role"), // fee_earner, supervisor, paralegal, secretary

  checklistItems: jsonb("checklist_items"), // Sub-task checklist

  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Track template applications to matters
export const matterTemplateApplications = pgTable("matter_template_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id")
    .notNull()
    .references(() => matters.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => taskTemplates.id),

  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  appliedById: uuid("applied_by_id").references(() => users.id),

  // Record exactly what was created (for mid-case comparison)
  itemsApplied: jsonb("items_applied").notNull(),
  // Array of { templateItemId, taskId, wasModified, wasSkipped }
});
```

### Extend Matters Table

```typescript
// Add to matters table
subType: text("sub_type"), // from practiceAreaSubTypes enum
```

### Extend Tasks Table

```typescript
// Add to tasks table
templateItemId: uuid("template_item_id")
  .references(() => taskTemplateItems.id, { onDelete: "set null" }),
// Links task back to template item it was created from
```

---

## UI/UX Flow

### 1. Matter Creation Flow

```
Step 1: Select Practice Area
        [Conveyancing ▼]

Step 2: Select Sub-Type
        [Freehold Purchase ▼]

Step 3: Template Preview (auto-loaded if default template exists)
┌──────────────────────────────────────────────────────────────┐
│ 📋 Template: Freehold Purchase - Standard                    │
│                                                              │
│ MANDATORY TASKS (will be created):                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ✓ AML/Source of Funds verification      [Regulatory] 🔒  │ │
│ │ ✓ Conflict check                        [Regulatory] 🔒  │ │
│ │ ✓ ID verification                       [Regulatory] 🔒  │ │
│ │ ✓ Review title documents                [Firm Policy]    │ │
│ │ ✓ Raise enquiries                       [Best Practice]  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ OPTIONAL TASKS (select to include):                          │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ☑ Order local authority searches        [Best Practice]  │ │
│ │ ☑ Order environmental search            [Best Practice]  │ │
│ │ ☐ Chancel liability check               [Best Practice]  │ │
│ │ ☐ Coal mining search                    [Best Practice]  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add custom task]                                          │
│                                                              │
│ [Edit tasks before creating...]                              │
└──────────────────────────────────────────────────────────────┘
```

### 2. Mid-Case Template Access

On Matter Detail page, Tasks tab:

```
┌─────────────────────────────────────────────────────────────┐
│ Tasks (12)                          [+ Add Task ▼]          │
│                                     ├─ New custom task      │
│                                     ├─ From template...     │
│                                     └─ AI suggest tasks     │
├─────────────────────────────────────────────────────────────┤
│ Template applied: Freehold Purchase - Standard              │
│ Applied on: 15 Jan 2025 by Sarah Harrison                   │
│ [View template] [Add skipped tasks]                         │
└─────────────────────────────────────────────────────────────┘
```

"Add skipped tasks" shows:

```
┌─────────────────────────────────────────────────────────────┐
│ Tasks not added from template:                              │
│                                                             │
│ ☐ Chancel liability check              [+ Add to matter]   │
│ ☐ Coal mining search                   [+ Add to matter]   │
│                                                             │
│ Or choose from another template:                            │
│ [Select different template ▼]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Integration

When AI analyses documents or generates task suggestions, the system prompt should include matter context when available:

```typescript
const buildTaskSuggestionPrompt = (matter: Matter) => {
  let context = `PRACTICE_AREA: ${matter.practiceArea}`;

  if (matter.subType) {
    context += `\nSUB_TYPE: ${matter.subType}`;
    context += `\nThis is a ${formatSubType(matter.subType)} matter.`;
  }

  // Include template context if applied
  if (matter.templateApplied) {
    context += `\nTEMPLATE_APPLIED: ${matter.templateApplied.name}`;
    context += `\nEXISTING_TASKS: ${matter.tasks.map((t) => t.title).join(", ")}`;
  }

  return context;
};
```

**Note**: Matter sub-type may not be known when AI first analyses a document (e.g., email comes in before case is created). AI should infer sub-type where possible and suggest it.

---

## API Endpoints

```
GET    /api/task-templates
       ?practiceArea=conveyancing&subType=freehold_purchase
       List templates (system + firm)

POST   /api/task-templates
       Create firm template

GET    /api/task-templates/:id
       Get template with items

PUT    /api/task-templates/:id
       Update template

DELETE /api/task-templates/:id
       Delete firm template (not system templates)

GET    /api/task-templates/:id/items
       List template items

POST   /api/task-templates/:id/items
       Add item to template

PUT    /api/task-templates/:id/items/:itemId
       Update template item

DELETE /api/task-templates/:id/items/:itemId
       Remove item from template

POST   /api/matters/:id/apply-template
       Apply template to existing matter
       Body: { templateId, selectedItemIds, modifications }

GET    /api/matters/:id/template-status
       Get applied template and skipped items
```

---

## System Templates (Seed Data)

Provide default system templates for common scenarios:

```typescript
const systemTemplates = [
  {
    practiceArea: "conveyancing",
    subType: "freehold_purchase",
    name: "Freehold Purchase - Standard",
    items: [
      { title: "Complete AML/Source of Funds checks", mandatory: true, category: "regulatory" },
      { title: "Run conflict check", mandatory: true, category: "regulatory" },
      { title: "Verify client identity", mandatory: true, category: "regulatory" },
      { title: "Review title register", mandatory: true, category: "legal" },
      { title: "Raise pre-contract enquiries", mandatory: false, category: "best_practice" },
      { title: "Order local authority searches", mandatory: false, category: "best_practice" },
      { title: "Order environmental search", mandatory: false, category: "best_practice" },
      { title: "Review mortgage offer", mandatory: false, category: "best_practice" },
      { title: "Report on title to lender", mandatory: false, category: "legal" },
      { title: "Prepare completion statement", mandatory: false, category: "best_practice" },
      {
        title: "Submit SDLT return",
        mandatory: true,
        category: "legal",
        relativeDueDays: 14,
        dueDateAnchor: "completion",
      },
      {
        title: "Register with Land Registry",
        mandatory: true,
        category: "legal",
        relativeDueDays: 30,
        dueDateAnchor: "completion",
      },
    ],
  },
  // ... more templates
];
```

---

## Acceptance Criteria

- [ ] Sub-type enum added to matters table and creation form
- [ ] Task template tables created with proper constraints
- [ ] System templates seeded for all practice areas
- [ ] Template preview shown during matter creation
- [ ] Mandatory tasks auto-created, optional tasks selectable
- [ ] Staff can edit task details before creation
- [ ] Mid-case template access via Tasks tab
- [ ] "Add skipped tasks" functionality works
- [ ] Template application history tracked
- [ ] AI prompts include sub-type when available
- [ ] Firm admins can create/edit firm-level templates
- [ ] System templates are read-only for firms

---

## Out of Scope (Separate Tickets)

- Compliance dashboard for overdue mandatory tasks → See `FEAT-compliance-task-dashboard.md`
- Template versioning and update notifications
- Task dependencies (blocking/sequential)
- Stage-gated tasks (only appear at certain case stages)

---

## Solution Design

### Existing Code to Reuse

| File                       | Reuse                               |
| -------------------------- | ----------------------------------- |
| `lib/db/schema/tasks.ts`   | Extend with `templateItemId` column |
| `lib/db/schema/matters.ts` | Extend with `subType` column        |
| `lib/api/schemas/tasks.ts` | Pattern for new template schemas    |
| `app/api/tasks/route.ts`   | Pattern for template CRUD endpoints |
| `tests/helpers/mocks.ts`   | Use existing mock utilities         |

### Files to Create

#### Database Schema

- `lib/db/schema/task-templates.ts` — New tables: `taskTemplates`, `taskTemplateItems`, `matterTemplateApplications`
- `lib/constants/practice-sub-types.ts` — Fixed enum of sub-types per practice area

#### API Schemas

- `lib/api/schemas/task-templates.ts` — Zod schemas for template CRUD

#### API Endpoints

- `app/api/task-templates/route.ts` — GET (list), POST (create)
- `app/api/task-templates/[id]/route.ts` — GET, PUT, DELETE
- `app/api/task-templates/[id]/items/route.ts` — GET (list items), POST (add item)
- `app/api/task-templates/[id]/items/[itemId]/route.ts` — PUT, DELETE
- `app/api/matters/[id]/apply-template/route.ts` — POST (apply template to matter)
- `app/api/matters/[id]/template-status/route.ts` — GET (template application history)

#### UI Components

- `components/task-templates/template-preview.tsx` — Preview template items (mandatory/optional)
- `components/task-templates/template-selector.tsx` — Select template for practice area/sub-type
- `components/task-templates/skipped-tasks-dialog.tsx` — Add skipped tasks mid-case

#### Demo Data

- `tests/fixtures/demo-data/seeders/task-templates.ts` — System templates seeder

### Files to Modify

| File                                | Change                                   |
| ----------------------------------- | ---------------------------------------- |
| `lib/db/schema/matters.ts`          | Add `subType: text("sub_type")` column   |
| `lib/db/schema/tasks.ts`            | Add `templateItemId` FK column           |
| `lib/db/schema/index.ts`            | Export new task-templates schema         |
| `lib/api/schemas/matters.ts`        | Add `subType` to CreateMatterSchema      |
| `lib/api/schemas/index.ts`          | Export task-template schemas             |
| `app/api/matters/route.ts`          | Include `subType` in POST                |
| `app/(app)/matters/new/page.tsx`    | Add sub-type selector, template preview  |
| `app/(app)/matters/[id]/page.tsx`   | Add template status section in Tasks tab |
| `tests/fixtures/demo-data/index.ts` | Include task-templates seeder            |

### Implementation Order

1. **Phase 1: Schema & Constants**
   - Create `lib/constants/practice-sub-types.ts`
   - Create `lib/db/schema/task-templates.ts`
   - Extend matters and tasks schemas
   - Run `npm run db:push`

2. **Phase 2: API Endpoints**
   - Create Zod schemas for templates
   - Implement template CRUD endpoints
   - Implement apply-template endpoint
   - Implement template-status endpoint

3. **Phase 3: Demo Data**
   - Create system templates seeder
   - Seed regulatory/legal templates for each practice area

4. **Phase 4: UI Components**
   - Template selector component
   - Template preview component
   - Update matter creation flow
   - Add mid-case template access

---

## Test Strategy

### Unit Tests

#### Template CRUD API

- [ ] `tests/unit/app/api/task-templates/route.test.ts`
  - GET returns list of templates (system + firm)
  - GET filters by practiceArea and subType
  - POST creates firm template
  - POST rejects system template creation (firmId=null)
  - POST validates required fields
  - POST validates practiceArea/subType enum values

- [ ] `tests/unit/app/api/task-templates/[id]/route.test.ts`
  - GET returns template with items
  - GET returns 404 for non-existent template
  - PUT updates firm template
  - PUT rejects update of system template
  - DELETE removes firm template
  - DELETE rejects delete of system template

- [ ] `tests/unit/app/api/task-templates/[id]/items/route.test.ts`
  - GET returns template items sorted by sortOrder
  - POST adds item to template
  - POST validates category enum
  - POST validates priority enum

- [ ] `tests/unit/app/api/task-templates/[id]/items/[itemId]/route.test.ts`
  - PUT updates template item
  - DELETE removes template item

#### Apply Template API

- [ ] `tests/unit/app/api/matters/[id]/apply-template/route.test.ts`
  - POST applies template and creates tasks
  - POST creates only selected optional items
  - POST records application in matterTemplateApplications
  - POST calculates relative due dates correctly
  - POST resolves assigneeRole to actual user
  - POST returns 404 for non-existent matter
  - POST returns 404 for non-existent template

#### Template Status API

- [ ] `tests/unit/app/api/matters/[id]/template-status/route.test.ts`
  - GET returns applied template info
  - GET returns skipped items
  - GET returns empty when no template applied

#### Schema Validation

- [ ] `tests/unit/lib/api/schemas/task-templates.test.ts`
  - Validates template creation schema
  - Validates template item schema
  - Validates apply-template request schema

#### Constants

- [ ] `tests/unit/lib/constants/practice-sub-types.test.ts`
  - All practice areas have sub-types
  - Sub-types are valid strings

### Mock Pattern Reminder

Use `mockImplementation` for withFirmDb:

```typescript
vi.mocked(withFirmDb).mockImplementation(
  mockWithFirmDbSuccess({ id: "template-1", name: "Test Template" })
);
```

### Integration Tests (Optional - if time permits)

- [ ] `tests/integration/task-templates/crud.test.ts`
  - Create, read, update, delete templates with real DB
  - Verify cascade delete of items

- [ ] `tests/integration/task-templates/apply.test.ts`
  - Apply template creates correct tasks
  - Application history is recorded

### E2E Tests (Playwright)

- [ ] `tests/e2e/browser/matter-creation-template.spec.ts`
  - Create matter with template selection
  - Verify mandatory tasks created
  - Verify optional tasks selectable

- [ ] `tests/e2e/browser/mid-case-template.spec.ts`
  - View applied template on matter
  - Add skipped tasks from template

### Test Data

Add to demo data seeder:

```typescript
// tests/fixtures/demo-data/seeders/task-templates.ts
export const SYSTEM_TEMPLATES = [
  {
    id: DEMO_IDS.TASK_TEMPLATE_FREEHOLD_PURCHASE,
    firmId: null, // System template
    name: "Freehold Purchase - Standard",
    practiceArea: "conveyancing",
    subType: "freehold_purchase",
    isDefault: true,
    items: [
      { title: "Complete AML/Source of Funds checks", mandatory: true, category: "regulatory" },
      { title: "Run conflict check", mandatory: true, category: "regulatory" },
      // ... more items
    ],
  },
];
```
