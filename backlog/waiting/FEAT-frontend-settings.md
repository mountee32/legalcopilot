# FEAT: Frontend — Settings (Firm, AI Policy, Roles)

## Goal

Make firm configuration, AI autonomy controls, and RBAC manageable in-product.

## Scope

- Firm settings (details, branding, practice areas, VAT)
- AI configuration (autonomy levels, approval requirements, tone/style)
- Roles/permissions and user role assignment UI (minimal)

## Dependencies

- API: `GET/PATCH /api/firm/settings`, roles endpoints, user role assignment endpoint

## Acceptance Criteria

- Settings changes persist and are reflected in UI behavior (e.g., approval gating)
- RBAC screens never imply security; server enforcement remains source of truth

## References

- `docs/frontend-design.md` (Settings)
- `docs/ideas.md` (Epic 10)
