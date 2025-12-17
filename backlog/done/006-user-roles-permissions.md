# User Roles & Permissions - RBAC System

## Priority: MEDIUM

## Summary

Implement role-based access control (RBAC) for granular permissions. Different user types (admin, partner, solicitor, paralegal, secretary) have different capabilities.

## Requirements

- Predefined roles with sensible defaults
- Granular permissions (cases:read, billing:write, etc.)
- Custom roles per firm
- Permission checking middleware

## Scope

### Database Schema (`lib/db/schema/roles.ts`)

- `roles` table:
  - id, firmId (null for system roles)
  - name, description
  - permissions (JSONB array of permission strings)
  - isSystem (boolean - can't be deleted)
  - createdAt, updatedAt

- Add to `users` table:
  - roleId (FK to roles)

### Default Roles (seeded)

- **admin**: Full access to everything
- **partner**: Full case access, can approve, billing access
- **solicitor**: Full case access, own time entries, limited billing
- **paralegal**: Case access, document management, no billing
- **secretary**: Limited case view, document upload, calendar management

### Permission Strings

```
cases:read, cases:write, cases:delete
clients:read, clients:write, clients:delete
documents:read, documents:write, documents:delete
billing:read, billing:write, billing:approve
time:read, time:write, time:approve
calendar:read, calendar:write
emails:read, emails:write, emails:send
approvals:view, approvals:decide
users:read, users:write, users:invite
firm:settings, firm:billing
reports:view, reports:export
ai:use, ai:configure
```

### API Routes

- `GET /api/roles` - List roles for firm
- `POST /api/roles` - Create custom role
- `PATCH /api/roles/[id]` - Update role permissions
- `DELETE /api/roles/[id]` - Delete custom role
- `PATCH /api/users/[id]/role` - Assign role to user

### Middleware

- `withPermission(permission: string)` - Check user has permission
- Update existing routes to check permissions

### API Schemas (`lib/api/schemas/roles.ts`)

- RoleSchema, CreateRoleSchema, UpdateRoleSchema
- PermissionSchema
- AssignRoleSchema

## Design

### Tenancy & Auth

- All role objects are firm-scoped (`firmId` derived from session); system roles are read-only and never writable via API.

### Data Model

- Create `lib/db/schema/roles.ts` and add `users.roleId` (nullable) for gradual rollout.
- Store permissions as a JSONB string array; keep the permission set as constants in code for validation/autocomplete.

### Authorization Enforcement

- Implement `withPermission(permission)` middleware that reads the user’s effective permissions (role + any explicit overrides if needed).
- Enforce permission checks server-side in all routes (UI is not a security boundary).

### API Shape

- Roles CRUD restricted to firm admins.
- Assign role endpoint updates `users.roleId` and records an audit/timeline event.

### Tests

- Permission middleware tests (allowed/denied), plus route-level tests for role CRUD and firm isolation.

## References

- docs/backend-design.md Section 2.2 (User entity with role field)
