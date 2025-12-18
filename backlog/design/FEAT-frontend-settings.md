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

---

## Design

### Overview

Create a comprehensive settings interface organized into tabs, following the design in `docs/frontend-design.md`. The existing `/app/(app)/settings/page.tsx` is a placeholder that needs to be expanded into a tabbed layout with three initial sections: Firm, AI Config, and Roles.

### Architecture

**Tab Structure:**

- Settings page uses tabs component for navigation between sections
- Each tab is a client component for interactivity
- Data fetching happens per-tab (no need to load everything upfront)
- Form state managed with React Hook Form + Zod validation
- Optimistic updates with React Query/SWR for better UX

### API Integration

**Existing APIs:**

- `GET/PATCH /api/firm/settings` - Firm settings (already implemented)
  - Returns `{ settings: object, updatedAt: string }`
  - PATCH accepts partial updates with deep merge
  - Protected by `firm:settings` permission

**Missing APIs (need to be created):**

- `GET /api/roles` - List all roles for the firm
- `POST /api/roles` - Create new role (admin only)
- `GET /api/roles/{id}` - Get role details
- `PATCH /api/roles/{id}` - Update role permissions
- `DELETE /api/roles/{id}` - Delete role (non-system only)
- `POST /api/users/{id}/role` - Assign role to user
- `GET /api/users` - List users (for role assignment UI)

**Schema Notes:**

- Firm settings stored in `firms.settings` JSONB column
- Roles have `permissions` JSONB array and `isSystem` boolean flag
- Default roles (admin, fee_earner) cannot be deleted
- User table has `roleId` FK to roles table

### Components to Create

**Page Structure:**

```
app/(app)/settings/
├── page.tsx                    (main settings page with tabs)
├── firm/
│   └── page.tsx               (firm settings tab - details, branding, practice areas, VAT)
├── ai/
│   └── page.tsx               (AI configuration tab - autonomy, approvals, tone)
└── roles/
    ├── page.tsx               (roles list)
    ├── [id]/
    │   └── page.tsx           (role detail/edit)
    └── new/
        └── page.tsx           (create new role)
```

**Shared Components:**

```
components/settings/
├── settings-tabs.tsx          (tab navigation component)
├── firm-details-form.tsx      (firm info fields)
├── practice-areas-selector.tsx (checkboxes for practice areas)
├── ai-autonomy-selector.tsx   (radio buttons for AI levels)
├── approval-policy-form.tsx   (approval threshold settings)
├── role-list-card.tsx         (role display card)
├── permission-checkbox-tree.tsx (hierarchical permission selector)
└── user-role-assignment.tsx   (user list with role dropdown)
```

### Data Models

**FirmSettings TypeScript Interface:**

```typescript
interface FirmSettings {
  // Firm Details
  name: string;
  sraNumber?: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };

  // Branding
  logoUrl?: string;
  primaryColor?: string;

  // Practice Areas
  practiceAreas: string[]; // e.g., ["conveyancing", "family", "wills_probate"]

  // VAT
  vatRegistered: boolean;
  vatNumber?: string;
  vatRate: number; // default 20
}
```

**AI Config:**

```typescript
interface AIConfig {
  enabled: boolean;
  autonomyLevel: "suggest" | "draft" | "auto-with-approval" | "full-auto";
  toneProfile?: string;
  approvalPolicy: {
    requireApprovalFor: string[]; // ["email.send", "case.stage_change", "invoice.send"]
    autoApproveMinConfidence: number; // 0-100
  };
  customInstructions?: string;
}
```

**Role & Permission:**

```typescript
interface Role {
  id: string;
  firmId: string;
  name: string;
  description?: string;
  permissions: string[]; // ["clients:read", "matters:*", "billing:write"]
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission format: "resource:action" or "resource:*" for all actions
// Examples: "clients:read", "clients:write", "clients:*", "firm:settings"
```

### UI Components Needed

**From shadcn/ui (already available):**

- Card, Input, Label, Button, Select, Checkbox
- Dialog (for confirmations)
- Badge (for system roles)
- Separator
- Alert (for warnings/info)

**Need to add:**

- Tabs component (from shadcn/ui)
- Switch component (for toggles)
- Textarea component (for custom instructions)
- ColorPicker or simple color input

### Page Implementations

**1. Main Settings Page (`app/(app)/settings/page.tsx`):**

- Horizontal tab navigation: Firm | AI Config | Roles | Integrations
- Tab content area loads selected tab component
- Permissions check: users without `firm:settings` see read-only or are redirected

**2. Firm Settings Tab (`app/(app)/settings/firm/page.tsx`):**

- Section 1: Firm Details (name, SRA, email, phone, address)
- Section 2: Branding (logo upload, primary color picker)
- Section 3: Practice Areas (checkboxes for each practice area)
- Section 4: VAT Settings (registered checkbox, VAT number, rate)
- Save button at bottom (PATCH to `/api/firm/settings`)
- Show success toast on save

**3. AI Config Tab (`app/(app)/settings/ai/page.tsx`):**

- Section 1: AI Autonomy Level (radio buttons with descriptions)
- Section 2: Approval Requirements (checkboxes for actions + confidence threshold slider)
- Section 3: Tone & Style (textarea for custom instructions, sample emails)
- Section 4: Client Portal AI (toggle + checkboxes for allowed topics)
- Save button (PATCH to `/api/firm/settings` with `aiConfig` key)

**4. Roles Tab (`app/(app)/settings/roles/page.tsx`):**

- List of roles as cards (name, description, user count)
- System roles show badge and no delete button
- "Create New Role" button (navigates to `/settings/roles/new`)
- Each role card has Edit/Delete actions
- Show warning: "UI is for convenience only - permissions enforced server-side"

**5. Role Detail (`app/(app)/settings/roles/[id]/page.tsx`):**

- Role name and description (read-only for system roles)
- Permission tree with checkboxes (grouped by resource)
- List of users with this role
- Save button (PATCH to `/api/roles/{id}`)
- Delete button (if not system role) with confirmation

**6. Create Role (`app/(app)/settings/roles/new/page.tsx`):**

- Name, description fields
- Permission tree selector
- "Clone from existing role" dropdown
- Create button (POST to `/api/roles`)

### Permission Structure

Permissions follow format: `resource:action`

**Resources:**

- `clients` - Client management
- `matters` - Case/matter management
- `documents` - Document access
- `billing` - Time entries, invoices, payments
- `tasks` - Task management
- `calendar` - Calendar access
- `emails` - Email access
- `reports` - Analytics and reports
- `leads` - Lead management
- `team` - User management
- `firm` - Firm settings and configuration

**Actions:**

- `read` - View only
- `write` - Create and edit
- `delete` - Delete
- `*` - All actions

**Examples:**

- `clients:read` - Can view clients
- `clients:*` - Full client access
- `matters:write` - Can create/edit matters
- `firm:settings` - Can configure firm settings
- `*:*` - Admin (all permissions)

### Validation

**Client-side (Zod schemas):**

```typescript
// Firm settings validation
const FirmDetailsSchema = z.object({
  name: z.string().min(2).max(100),
  sraNumber: z.string().optional(),
  email: z.string().email(),
  vatRegistered: z.boolean(),
  vatNumber: z.string().optional(),
  // ...
});

// AI config validation
const AIConfigSchema = z.object({
  autonomyLevel: z.enum(["suggest", "draft", "auto-with-approval", "full-auto"]),
  approvalPolicy: z.object({
    autoApproveMinConfidence: z.number().min(0).max(100),
  }),
});

// Role validation
const RoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()),
});
```

### Error Handling

- Form validation errors shown inline per field
- API errors shown in toast notification
- Optimistic updates revert on error
- Permission errors redirect to dashboard with error message
- Prevent editing system roles (admin, fee_earner)

### Test Strategy

**Unit Tests:**

- Form validation schemas (Zod)
- Permission parsing/formatting logic
- Settings merge/update logic
- Component rendering with different permission levels

**Integration Tests:**

- `GET/PATCH /api/firm/settings` with various settings payloads
- Role CRUD operations via API
- User role assignment
- Permission enforcement (users without `firm:settings` get 403)

**E2E Tests:**

- Navigate to settings, update firm details, verify persistence
- Change AI autonomy level, verify reflected in approval queue behavior
- Create custom role, assign to user, verify permissions work
- Attempt to delete system role (should fail with error)
- Test role assignment UI (dropdown in user list)

### Files to Create/Modify

**Create:**

- `/app/(app)/settings/firm/page.tsx` - Firm settings tab
- `/app/(app)/settings/ai/page.tsx` - AI config tab
- `/app/(app)/settings/roles/page.tsx` - Roles list
- `/app/(app)/settings/roles/[id]/page.tsx` - Role detail
- `/app/(app)/settings/roles/new/page.tsx` - Create role
- `/components/settings/settings-tabs.tsx` - Tab navigation
- `/components/settings/firm-details-form.tsx` - Firm form
- `/components/settings/practice-areas-selector.tsx` - Practice area checkboxes
- `/components/settings/ai-autonomy-selector.tsx` - AI level radio buttons
- `/components/settings/approval-policy-form.tsx` - Approval settings
- `/components/settings/role-list-card.tsx` - Role card component
- `/components/settings/permission-checkbox-tree.tsx` - Permission tree
- `/components/settings/user-role-assignment.tsx` - User list with roles
- `/components/ui/tabs.tsx` - Tabs component (shadcn/ui)
- `/components/ui/switch.tsx` - Switch component (shadcn/ui)
- `/components/ui/textarea.tsx` - Textarea component (shadcn/ui)
- `/app/api/roles/route.ts` - GET (list), POST (create)
- `/app/api/roles/[id]/route.ts` - GET (detail), PATCH (update), DELETE
- `/app/api/users/route.ts` - GET (list users)
- `/app/api/users/[id]/role/route.ts` - POST (assign role)
- `/lib/permissions.ts` - Permission constants and utilities
- `/lib/api/schemas/settings.ts` - Settings Zod schemas (may exist)
- `/lib/api/schemas/roles.ts` - Role/permission Zod schemas

**Modify:**

- `/app/(app)/settings/page.tsx` - Replace placeholder with tabbed layout

### Implementation Notes

1. **Settings Storage**: Firm settings use JSONB, so API supports partial updates via deep merge
2. **Role Assignment**: When assigning role to user, update `users.roleId` and clear any cached permissions
3. **System Roles**: Admin and fee_earner roles have `isSystem: true` - prevent deletion and name changes
4. **Default Permissions**: New roles start with minimal permissions (e.g., only `clients:read`)
5. **UI Disclaimer**: Settings UI must show warning that permissions are enforced server-side only
6. **Logo Upload**: Use existing MinIO storage pattern from documents
7. **Color Validation**: Validate hex colors client-side and server-side
8. **Confidence Threshold**: Display as percentage (0-100) but store as decimal (0-1) in database

### Security Considerations

- All settings endpoints require `firm:settings` permission
- Role management requires `team:*` or `firm:settings` permission
- Users can only manage roles within their own firm (tenant isolation)
- System roles cannot be modified or deleted
- Permission changes don't retroactively affect in-flight operations
- Validate all settings on server-side even if validated client-side

### Progressive Enhancement

**Phase 1 (MVP):**

- Firm details, practice areas, VAT settings
- AI autonomy level and approval threshold
- View existing roles (admin, fee_earner)

**Phase 2:**

- Full role CRUD
- Custom permission sets
- User role assignment UI

**Phase 3:**

- Custom practice area stages
- Advanced AI tone configuration
- Audit log of settings changes
