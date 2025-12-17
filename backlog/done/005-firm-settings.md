# Firm Settings - Expand Schema & API

## Priority: MEDIUM

## Summary

Expand the firms table to store comprehensive firm configuration including branding, AI settings, billing defaults, and feature toggles.

## Requirements

- Store firm branding (logo, colors, portal branding)
- AI configuration (model preferences, auto-approve thresholds)
- Billing defaults (VAT rate, payment terms, invoice templates)
- Feature toggles per firm
- Practice area configuration

## Scope

### Database Schema (expand `lib/db/schema/firms.ts`)

Add columns to `firms` table:

- settings (JSONB) containing:
  - branding: { logoUrl, primaryColor, portalName }
  - billing: { defaultVatRate, defaultPaymentTermsDays, invoicePrefix, invoiceFooter }
  - ai: { defaultModel, autoApproveThreshold, enabledFeatures }
  - features: { emailIntegration, calendarSync, clientPortal, eSignature }
  - practiceAreas: string[] (enabled practice areas)
  - workingHours: { start, end, timezone, workDays }
  - compliance: { sraNumber, icoNumber, amlPolicyUrl }

### API Routes

- `GET /api/firm/settings` - Get current firm settings
- `PATCH /api/firm/settings` - Update firm settings
- `GET /api/firm/branding` - Public endpoint for portal branding (no auth)

### API Schemas (`lib/api/schemas/firm.ts`)

- FirmSettingsSchema
- UpdateFirmSettingsSchema
- FirmBrandingSchema (public subset)

## Design

### Keep It Minimal

- Start with a single `firms.settings` JSONB blob for MVP; promote fields to first-class columns only when stable/queried frequently.

### Tenancy & Auth

- Settings read/write always apply to the authenticated user’s firm (never accept `firmId` from request).
- Use `withAuth` + `getOrCreateFirmIdForUser` + `withFirmDb`.

### API Shape

- `GET /api/firm/settings` returns a typed settings object with sensible defaults applied server-side.
- `PATCH /api/firm/settings` uses partial updates (merge into JSONB) and validates with Zod.
- “Public branding” should not be keyed by raw `firmId` in query params; prefer a signed portal token / magic link context for any unauthenticated branding needs.

### Tests

- Validate merge semantics (partial patch), firm isolation, and defaults.

## Validation Rules

- VAT rate: 0-100
- Payment terms: 1-365 days
- Working hours: valid times
- SRA number format validation

## References

- docs/backend-design.md Section 2.2 (Firm/FirmSettings entity)
