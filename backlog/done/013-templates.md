# Document & Email Templates - Schema & API

## Priority: LOW (Phase 2)

## Summary

Implement template system for documents and emails with merge field support.

## Requirements

- Store templates for different document/email types
- Merge fields (client name, matter ref, dates, etc.)
- Per-firm and system templates
- Template versioning

## Scope

### Database Schema

- `templates` table: firmId (null for system), name, type (document/email), category, content, mergeFields, isActive, version

### API Routes

- `/api/templates/*` - Template CRUD
- `POST /api/templates/[id]/preview` - Preview with sample data
- `POST /api/templates/[id]/generate` - Generate document from template

### Merge Fields

- `{{client.name}}`, `{{client.email}}`
- `{{matter.reference}}`, `{{matter.title}}`
- `{{fee_earner.name}}`
- `{{today}}`, `{{due_date}}`

## Design

### Tenancy & Auth

- Templates are firm-scoped with optional system templates (`firmId = null`); users can only modify firm templates for their firm.

### Rendering Approach

- Use a minimal, deterministic renderer for MVP (string replacement for a whitelisted set of merge paths); avoid executing arbitrary code in templates.
- Store `mergeFields` as JSONB metadata for UI autocomplete and validation.

### Versioning

- Treat templates as immutable versions: create a new row on update (or increment `version`) to preserve auditability and to keep past generated docs reproducible.

### AI & Approvals

- AI can propose new templates via `approval_requests` (`action: "template.create"` / `"template.update"`); writing/activating templates requires human approval.

### Tests

- Rendering correctness (missing fields, escaping), firm isolation, and version bump behavior.

## References

- docs/backend-design.md Section 2.22 (Template entity)
