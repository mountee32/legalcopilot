# BUG: Lead Schema Missing Required Fields

## Summary

The `leads` table schema is missing several fields required by user stories in Epic 0 (AI-Powered Client Intake & CRM).

## Missing Fields

### 1. `enquiryType` (required)

**User Story Reference**: "capture enquiries from web forms" - needs to classify enquiry by practice area for routing.

**Suggested Implementation**:

```typescript
enquiryType: practiceAreaEnum("enquiry_type"), // or text field
```

### 2. `message` (required)

**User Story Reference**: "capture enquiries from web forms" - needs to store the actual enquiry message/details.

**Suggested Implementation**:

```typescript
message: text("message"),
```

### 3. `assignedTo` (required)

**User Story Reference**: Lead assignment for follow-up by fee earners.

**Suggested Implementation**:

```typescript
assignedTo: uuid("assigned_to").references(() => users.id),
```

## Current Schema Location

`lib/db/schema/intake.ts`

## Impact

- Cannot route leads by practice area
- Cannot store enquiry details
- Cannot assign leads to fee earners for follow-up

## Acceptance Criteria

- [ ] Add `enquiryType` field (consider using practiceAreaEnum)
- [ ] Add `message` text field
- [ ] Add `assignedTo` foreign key to users
- [ ] Update any affected API endpoints
- [ ] Add migration
