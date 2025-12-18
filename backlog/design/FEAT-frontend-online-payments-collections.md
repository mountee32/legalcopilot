# FEAT: Frontend — Online Payments & Collections

## Goal

Make it easy for clients to pay and for the firm to track collections.

## Scope

- Invoice "Pay now" surfaces (portal + staff)
- Payments list/detail and basic reconciliation visibility
- Collections queue (overdue invoices + suggested actions) if supported

## Dependencies

- API: payments endpoints and invoice endpoints
- Existing: Payment link creation API (`/api/invoices/[id]/pay-link`)
- Schema: Payment/Invoice schemas in `lib/db/schema/billing.ts`

## Acceptance Criteria

- Payment status is visible and ties back to invoices
- Client payment flow is safe and clearly branded

## References

- `docs/ideas.md` (Epic 16)

---

## Design

### Analysis

**Existing Infrastructure:**

- Payment APIs: `GET/POST /api/payments`, `GET/DELETE /api/payments/[id]`
- Invoice APIs: `GET /api/invoices/[id]`, `POST /api/invoices/[id]/pay-link`
- Schema: `payments`, `invoices` tables with full payment tracking
- Billing page: `app/(app)/billing/page.tsx` with time entries & invoices tabs
- UI components: shadcn/ui (Dialog, Card, Badge, Button, Tabs, etc.)

**Missing:**

- Payment recording UI (staff side)
- Payment list/details view (staff side)
- Public payment page (client side)
- Invoice detail page with payment history
- "Pay Now" button integration

### Architecture

**1. Staff-Side UI (`app/(app)/billing/`)**

- Extend existing billing page with Payments tab
- Add payment recording dialog (similar to TimeEntryDialog pattern)
- Add invoice detail page showing payment history
- Add "Generate Payment Link" action on invoices

**2. Client-Side Payment Portal (`app/public/pay/[token]/`)**

- Standalone public page (no auth required)
- Verify payment token validity
- Display invoice details
- Stripe/GoCardless integration placeholder (Phase 2)
- Manual payment instructions (Phase 1)

**3. Components (`components/`)**

- `RecordPaymentDialog.tsx` - Staff payment recording
- `PaymentsList.tsx` - Payment history display
- `InvoiceDetail.tsx` - Full invoice view with payments
- `PublicPaymentPage.tsx` - Client-facing payment page

### Implementation Plan

#### Phase 1: Core Payment UI (Staff)

**Files to Create:**

- `components/billing/RecordPaymentDialog.tsx` - Payment recording form
- `components/billing/PaymentsList.tsx` - Payment list display
- `components/billing/InvoiceDetail.tsx` - Invoice detail with payments
- `app/(app)/billing/invoices/[id]/page.tsx` - Invoice detail page

**Files to Modify:**

- `app/(app)/billing/page.tsx` - Add Payments tab, "Pay Now" button on invoices

**Features:**

1. Payments tab on billing page (list all payments with filters)
2. Record payment dialog (amount, method, date, reference, notes)
3. Invoice detail page showing:
   - Invoice metadata (number, dates, amounts)
   - Line items breakdown
   - Payment history
   - Balance due
   - Actions: Send, Generate Payment Link, Record Payment, Void
4. Payment link generation with copy-to-clipboard

#### Phase 2: Public Payment Portal

**Files to Create:**

- `app/public/pay/[token]/page.tsx` - Public payment page
- `lib/billing/payment-providers.ts` - Stripe/GoCardless integration
- `components/public/PaymentForm.tsx` - Client payment form

**Features:**

1. Public payment page (no login required)
2. Token validation and expiry checking
3. Invoice display (firm branding, line items, amounts)
4. Payment options:
   - Card payment (Stripe)
   - Direct Debit (GoCardless)
   - Bank transfer instructions
5. Payment confirmation and receipt

#### Phase 3: Collections Queue (Optional)

**Files to Create:**

- `app/(app)/billing/collections/page.tsx` - Collections dashboard
- `components/billing/CollectionsQueue.tsx` - Overdue invoice list
- `components/billing/DunningActions.tsx` - Suggested follow-up actions

**Features:**

1. Collections dashboard showing:
   - Overdue invoices (grouped by age)
   - Total outstanding
   - AI-suggested follow-up actions
2. Bulk actions (send reminders, schedule calls)
3. Payment plan management

### Component Reuse Strategy

**Existing Patterns:**

- `TimeEntryDialog` → `RecordPaymentDialog` (form dialog pattern)
- Billing page tabs → Add Payments tab (consistent layout)
- Invoice list cards → Payment list cards (similar styling)
- shadcn/ui components: Dialog, Card, Badge, Button, Tabs, Input, Select

**Design System:**

- Dark theme with amber accents (match existing billing page)
- Serif headings, mono for numbers/dates
- Card-based layouts with hover states
- Status badges with color coding

### Data Flow

**Payment Recording:**

1. Staff clicks "Record Payment" on invoice
2. Dialog opens with invoice context pre-filled
3. Staff enters payment details (amount, method, date, reference)
4. POST `/api/payments` → Updates invoice status
5. Success toast, refresh payment list

**Payment Link Generation:**

1. Staff clicks "Generate Payment Link" on invoice
2. POST `/api/invoices/[id]/pay-link` → Returns token & URL
3. Copy URL to clipboard
4. Toast with success message
5. Link expires in 72 hours

**Client Payment Flow:**

1. Client clicks payment link → `/public/pay/[token]`
2. Verify token validity and expiry
3. Display invoice details (firm name, items, total, due date)
4. Payment options: Stripe, GoCardless, or bank transfer
5. Process payment → Record in system
6. Send confirmation email to client and firm

### Test Strategy

**Unit Tests (`tests/unit/components/`):**

- `RecordPaymentDialog.test.tsx` - Form validation, submission
- `PaymentsList.test.tsx` - Rendering, filtering
- `InvoiceDetail.test.tsx` - Payment history display

**Integration Tests (`tests/integration/`):**

- Payment recording flow (POST /api/payments)
- Payment link generation (POST /api/invoices/[id]/pay-link)
- Invoice status updates after payment

**E2E Tests (`tests/e2e/browser/`):**

- Complete staff payment workflow (record → verify → list)
- Payment link generation and copy
- Invoice detail navigation
- Public payment page access (token validation)

**Test Data:**

- Use existing `createInvoice`, `createPayment` factories
- Mock Stripe/GoCardless in tests
- Test edge cases: overpayment, expired links, invalid tokens

### Security Considerations

**Public Payment Page:**

- Token-based access (no auth required)
- Token expiry (72 hours default)
- Rate limiting on payment attempts
- HTTPS required
- No sensitive firm data exposed

**Staff Payment Recording:**

- RBAC: `billing:write` permission required
- Validate payment amount ≤ balance due
- Audit trail (recordedBy field)
- No future-dated payments (grace period: 1 minute)

### API Integration

**Existing Endpoints:**

- `GET /api/payments?invoiceId={id}` - List payments for invoice
- `POST /api/payments` - Record payment (updates invoice status)
- `GET /api/payments/[id]` - Get payment details
- `DELETE /api/payments/[id]` - Delete payment (reverses invoice status)
- `POST /api/invoices/[id]/pay-link` - Generate payment link

**Future Endpoints (Phase 2):**

- `POST /api/payments/stripe/checkout` - Create Stripe session
- `POST /api/payments/gocardless/mandate` - Setup Direct Debit
- `GET /api/public/invoices/[token]` - Public invoice view

---

## Implementation Checklist

### Phase 1: Staff Payment UI (Priority 1)

- [ ] Create `RecordPaymentDialog.tsx` component
- [ ] Create `PaymentsList.tsx` component
- [ ] Create `InvoiceDetail.tsx` component
- [ ] Create invoice detail page `app/(app)/billing/invoices/[id]/page.tsx`
- [ ] Add Payments tab to billing page
- [ ] Add "Generate Payment Link" button to invoices
- [ ] Add "Record Payment" button to invoices
- [ ] Implement payment link copy-to-clipboard
- [ ] Write component unit tests
- [ ] Write integration tests for payment APIs
- [ ] Write E2E test for payment recording flow

### Phase 2: Public Payment Portal (Priority 2)

- [ ] Create public payment page `app/public/pay/[token]/page.tsx`
- [ ] Create `PaymentForm.tsx` component
- [ ] Implement token validation and expiry checking
- [ ] Add Stripe integration
- [ ] Add GoCardless integration
- [ ] Add bank transfer instructions display
- [ ] Send payment confirmation emails
- [ ] Write E2E test for public payment flow

### Phase 3: Collections Queue (Priority 3)

- [ ] Create collections page `app/(app)/billing/collections/page.tsx`
- [ ] Create `CollectionsQueue.tsx` component
- [ ] Add AI-suggested dunning actions
- [ ] Add bulk reminder sending
- [ ] Write tests for collections features

---

## Status

**Ready for Development**

Next Steps:

1. Move to `backlog/dev/`
2. Start with Phase 1: Staff Payment UI
3. Focus on RecordPaymentDialog and InvoiceDetail first
4. Public payment portal requires Stripe/GoCardless setup (separate task)
