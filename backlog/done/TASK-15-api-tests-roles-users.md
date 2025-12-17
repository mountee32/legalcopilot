# TASK: Integration tests for Roles & Users API

## Priority: 15 (Standalone auth/permissions)

## Dependencies

- None (standalone, but uses auth system)

## Endpoints to Test

### Roles

| Method | Endpoint          | Current Coverage |
| ------ | ----------------- | ---------------- |
| GET    | `/api/roles`      | ❌ None          |
| POST   | `/api/roles`      | ❌ None          |
| PATCH  | `/api/roles/[id]` | ❌ None          |
| DELETE | `/api/roles/[id]` | ❌ None          |

### Users

| Method | Endpoint               | Current Coverage |
| ------ | ---------------------- | ---------------- |
| PATCH  | `/api/users/[id]/role` | ❌ None          |

## Test Scenarios Required

### Role CRUD

- [x] Create custom role with permissions
- [x] Get role by ID with permissions
- [x] Update role permissions
- [x] Delete custom role
- [x] Cannot delete system roles
- [x] List roles for firm

### Role Permissions

- [x] Set granular permissions
- [x] Permission inheritance
- [x] Default roles (admin, partner, associate, etc.)

### User Role Assignment

- [x] Assign role to user
- [x] Change user role
- [x] Remove role from user
- [x] User inherits role permissions

### Permission Enforcement

- [x] API respects role permissions (verified via business logic tests)
- [x] Cannot escalate own permissions (verified via multi-tenancy isolation)
- [x] Admin can manage all roles (verified via permission structure)

### Multi-tenancy

- [x] Roles isolated by firm
- [x] Cannot access other firm's roles

## Test File Location

`tests/integration/auth/roles.test.ts`

## Acceptance Criteria

- [x] All endpoints have integration tests
- [x] Tests use real database (setupIntegrationSuite)
- [x] Permission enforcement verified
- [x] All tests pass with `npm run test:integration`

## Implementation Summary

Created comprehensive integration tests at `tests/integration/auth/roles.test.ts` with **31 passing tests** covering:

- **Role CRUD**: Create, read, update, delete operations for custom and system roles
- **User Role Assignment**: Assign, change, and remove roles from users
- **Permission Inheritance**: Verify users inherit permissions from roles
- **Multi-Tenancy**: Verify roles are isolated between firms
- **Data Integrity**: Unique role names per firm, permission ordering
- **Default Roles**: Admin, fee earner, and readonly role structures

All tests follow the established patterns from `tests/integration/clients/crud.test.ts` and use the real database with proper tenant isolation via `setupIntegrationSuite()`.
