# Invoice Generation - API & Logic

## Priority: MEDIUM

## Summary

Implement invoice generation from approved time entries. Schema exists, need generation logic and API routes.

## Requirements

- Generate invoices from approved time entries
- Calculate VAT automatically
- Invoice numbering sequence per firm
- Mark time entries as billed
- PDF generation (optional, can be Phase 2)

## Scope

### API Routes

- `GET /api/invoices` - List invoices with filters
- `POST /api/invoices/generate` - Generate invoice from time entries
- `GET /api/invoices/[id]` - Get invoice details with line items
- `PATCH /api/invoices/[id]` - Update draft invoice
- `POST /api/invoices/[id]/send` - Mark as sent
- `POST /api/invoices/[id]/void` - Void invoice

### Generation Logic (`lib/billing/generateInvoice.ts`)

```typescript
generateInvoice({
  clientId: string,
  matterId?: string, // optional, can invoice multiple matters
  timeEntryIds: string[], // approved entries to include
  additionalItems?: { description: string, amount: number }[],
  notes?: string,
  dueDate?: Date, // default from firm settings
})
```

- Calculate subtotal from time entries + additional items
- Apply VAT from firm settings (default 20%)
- Generate invoice number: `{prefix}-{year}-{sequence}`
- Update time entries with invoiceId
- Create timeline event

### API Schemas (`lib/api/schemas/invoices.ts`)

- InvoiceSchema, InvoiceWithItemsSchema
- GenerateInvoiceSchema
- InvoiceQuerySchema, InvoiceListSchema
- UpdateInvoiceSchema

### Business Rules

- Only approved time entries can be invoiced
- Cannot modify sent invoices
- Voiding creates credit note (future)

## Design

### Tenancy & Auth

- All invoice actions are firm-scoped; derive `firmId` from session and enforce with `withFirmDb`.

### Invoice Numbering (PostgreSQL-first)

- Use a firm-scoped, transactional allocator (e.g. `invoice_sequences` table or `firms.settings.billing.invoiceSequence`) to guarantee uniqueness without race conditions.
- Keep it minimal in MVP: a single counter per firm and a unique constraint on `(firmId, number)`.

### Approval Enforcement

- Invoice generation can be user-triggered directly; “send invoice” and any client-facing comms must go through `approval_requests` (e.g. `action: "invoice.send"`).

### Consistency & Side Effects

- In one transaction: create invoice + line items, mark included time entries as billed, and emit a timeline event.

### Tests

- Cover numbering uniqueness, billing-only-approved rule, and firm isolation.

## Out of Scope (Phase 2)

- PDF generation
- Email invoice to client
- Payment reminders
- Credit notes

## References

- lib/db/schema/billing.ts (existing invoices table)
- docs/backend-design.md Section 2.14 (Invoice entity)
