# FEAT: Frontend — Foundation (App Shell, Navigation, Auth Gates)

## Goal

Ship the core authenticated application shell (layout, navigation, routing) that all other screens plug into.

## Scope

- App shell layout (sidebar + topbar) aligned with `docs/frontend-design.md`
- Auth-gated routes for staff app (fee earner/admin/support)
- Basic responsive navigation (mobile bottom nav)
- Global UI primitives: loading/empty/error states, toasts, confirmation modal

## Dependencies

- API: auth/session (existing Better Auth), firm context, permissions/roles
- Backlog: `backlog/waiting/TASK-api-openapi-parity.md` (keep OpenAPI in sync)

## Acceptance Criteria

- Core routes render with consistent layout and navigation
- Unauthenticated users are redirected to auth flow
- Permission-denied states are handled gracefully (no blank pages)

## References

- `docs/frontend-design.md`
- `docs/ideas.md` (AI-first UX, Phase 1)

---

## Solution Design

### Architecture Overview

Use Next.js App Router route groups to separate authenticated (`(app)`) from public routes. The app shell consists of:

1. **Auth Provider** - Client-side session context using Better Auth's `useSession` hook
2. **App Shell Layout** - Sidebar + topbar wrapper for all authenticated routes
3. **Auth Gate** - HOC/component that redirects unauthenticated users
4. **Navigation Components** - Desktop sidebar, mobile bottom nav, topbar
5. **UI Primitives** - Toast provider, loading states, error boundaries

### Files to Create

```
app/
├── (app)/                          # Authenticated route group
│   ├── layout.tsx                  # App shell layout with sidebar/topbar
│   ├── page.tsx                    # Redirect to /dashboard
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard (replace existing)
│   ├── inbox/page.tsx              # AI Inbox placeholder
│   ├── matters/page.tsx            # Cases/matters placeholder
│   ├── clients/page.tsx            # Clients placeholder
│   ├── documents/page.tsx          # Documents placeholder
│   ├── tasks/page.tsx              # Tasks placeholder
│   ├── calendar/page.tsx           # Calendar placeholder
│   ├── billing/page.tsx            # Time & Billing placeholder
│   ├── reports/page.tsx            # Reports placeholder
│   ├── leads/page.tsx              # Leads placeholder
│   ├── team/page.tsx               # Team placeholder
│   └── settings/page.tsx           # Settings placeholder
│
├── (auth)/                         # Public auth routes
│   ├── layout.tsx                  # Centered auth layout
│   ├── login/page.tsx              # Login form
│   ├── register/page.tsx           # Registration form
│   └── forgot-password/page.tsx    # Password reset
│
└── (public)/                       # Public marketing routes
    ├── layout.tsx                  # Marketing layout
    └── page.tsx                    # Landing page (existing)

components/
├── app-shell/
│   ├── app-shell.tsx               # Main shell wrapper
│   ├── sidebar.tsx                 # Desktop sidebar navigation
│   ├── topbar.tsx                  # Top navigation bar
│   ├── mobile-nav.tsx              # Mobile bottom navigation
│   ├── user-menu.tsx               # User avatar dropdown
│   └── nav-item.tsx                # Reusable nav item component
│
├── providers/
│   ├── auth-provider.tsx           # Session context provider
│   └── toast-provider.tsx          # Toast notification context
│
├── ui/
│   ├── toast.tsx                   # Toast component (shadcn)
│   ├── toaster.tsx                 # Toast container
│   ├── skeleton.tsx                # Loading skeleton
│   ├── empty-state.tsx             # Empty state component
│   ├── error-boundary.tsx          # Error boundary wrapper
│   ├── confirmation-modal.tsx      # Reusable confirmation dialog
│   ├── dialog.tsx                  # Dialog component (shadcn)
│   ├── dropdown-menu.tsx           # Dropdown menu (shadcn)
│   ├── avatar.tsx                  # Avatar component (shadcn)
│   ├── separator.tsx               # Separator (shadcn)
│   └── scroll-area.tsx             # Scroll area (shadcn)
│
└── auth/
    ├── auth-gate.tsx               # Client-side auth check + redirect
    ├── login-form.tsx              # Email/password login form
    └── register-form.tsx           # Registration form

lib/
└── hooks/
    └── use-auth.ts                 # Custom auth hook wrapping Better Auth
```

### Files to Modify

- `app/layout.tsx` - Add providers (AuthProvider, ToastProvider)
- `app/globals.css` - Add CSS variables for sidebar/layout
- Move existing `app/dashboard/page.tsx` to `app/(app)/dashboard/page.tsx`

### Data Models

No new database tables required. Uses existing:

- `users` - User account with `firmId`, `roleId`
- `firms` - Tenant information
- `roles` - RBAC roles with permissions

### API Endpoints Used

- `GET /api/auth/session` - Better Auth session check (existing)
- `POST /api/auth/sign-in/email` - Email/password login (existing)
- `POST /api/auth/sign-up/email` - Registration (existing)
- `POST /api/auth/sign-out` - Logout (existing)

### UI Components Design

**Sidebar Navigation (from frontend-design.md)**

```
+------------------------+
| [Logo] Legal Copilot   |
+------------------------+
| [Home] Dashboard       |
| [Inbox] AI Inbox  (12) |
| [Folder] Cases    (3)  |
| [Users] Clients        |
| [File] Documents       |
| [Check] Tasks     (8)  |
| [Calendar] Calendar    |
| ────────────────────── |
| [Clock] Time & Billing |
| [Chart] Reports        |
| ────────────────────── |
| [Funnel] Leads    (5)  |
| [Users] Team           |
| [Gear] Settings        |
+------------------------+
| [?] Help               |
| [Avatar] User Name     |
+------------------------+
```

**Mobile Navigation**

```
+------------------------+
| [Home][Inbox][Cases][+]|
+------------------------+
```

### State Management

- **Session State**: React Context via `AuthProvider` using Better Auth's `useSession`
- **UI State**: Local component state (no global store needed for shell)
- **Notifications**: Toast context for success/error messages

### Auth Flow

1. User visits any `/(app)/*` route
2. `AuthGate` component checks session via `useSession()`
3. If no session → redirect to `/login?redirect={current_path}`
4. If session exists → render app shell with user context
5. User can logout via user menu → redirected to `/login`

### Error Handling

- **401 Unauthorized**: Redirect to login with return URL
- **403 Forbidden**: Show permission denied page (not blank)
- **Network Errors**: Toast notification + retry option
- **Component Errors**: Error boundary with fallback UI

---

## Test Strategy

### Unit Tests

- [ ] `tests/unit/components/app-shell/sidebar.test.tsx` - Sidebar renders nav items, highlights active route
- [ ] `tests/unit/components/app-shell/mobile-nav.test.tsx` - Mobile nav renders, shows on mobile viewport
- [ ] `tests/unit/components/auth/auth-gate.test.tsx` - Redirects when unauthenticated, renders children when authenticated
- [ ] `tests/unit/components/auth/login-form.test.tsx` - Form validation, submit handling
- [ ] `tests/unit/components/ui/toast.test.tsx` - Toast renders with correct variant
- [ ] `tests/unit/components/ui/empty-state.test.tsx` - Empty state renders with props
- [ ] `tests/unit/components/ui/confirmation-modal.test.tsx` - Modal opens/closes, calls callbacks
- [ ] `tests/unit/lib/hooks/use-auth.test.ts` - Hook returns session data correctly

### E2E Tests

- [ ] `tests/e2e/browser/auth-flow.spec.ts` - Login/logout flow
  - Unauthenticated user redirected to login
  - User can login with valid credentials
  - User sees dashboard after login
  - User can logout and is redirected to login

- [ ] `tests/e2e/browser/app-shell.spec.ts` - Navigation and shell
  - Sidebar shows all nav items
  - Clicking nav items navigates to correct route
  - Active route is highlighted
  - Mobile nav appears on small viewport
  - User menu shows user info and logout option

### Test Cases Summary

| Component    | Happy Path                 | Error States              | Edge Cases                 |
| ------------ | -------------------------- | ------------------------- | -------------------------- |
| AuthGate     | Renders children when auth | Redirects when no session | Handles loading state      |
| Sidebar      | Renders all nav items      | -                         | Collapsed state, badges    |
| LoginForm    | Submits valid creds        | Shows validation errors   | Loading state              |
| Toast        | Shows message              | -                         | Auto-dismiss, manual close |
| ConfirmModal | Confirm action             | Cancel action             | Escape key closes          |

---

## Implementation Notes

1. **shadcn/ui components**: Install via `npx shadcn@latest add dialog dropdown-menu avatar separator scroll-area toast`

2. **Icons**: Use Lucide React (already installed) for nav icons

3. **Responsive breakpoints**:
   - Mobile: < 768px (bottom nav)
   - Desktop: >= 768px (sidebar)

4. **CSS Variables**: Add to globals.css for sidebar width, transitions

5. **Permissions**: Auth gate checks session exists; permission checks come in future features

6. **Placeholders**: Each route page shows a basic "Coming soon" with the route name

---

## Assumptions

1. Better Auth is configured and working (verified - `lib/auth/index.ts`)
2. Users have `firmId` assigned (may be null for new users - handle gracefully)
3. No server-side rendering required for auth check (client-side `useSession` is sufficient)
4. Badge counts (e.g., "(12)" on Inbox) will be implemented in future features

---

## QA Approval

**Status: APPROVED**
**Date: 2025-12-17**

### Test Results

- Unit/Integration tests: 1197 passed
- E2E tests: 110 passed
- New tests added: 48 across 7 test files

### Coverage Verified

- [x] Sidebar renders all navigation items and highlights active route
- [x] Mobile nav renders correctly
- [x] AuthGate redirects unauthenticated users with proper return URL
- [x] Login form handles validation and submission
- [x] Toast system works correctly
- [x] Empty state and confirmation modal components tested

### Implementation Verified

- [x] Route groups properly structured ((app), (auth), (public))
- [x] Auth provider wraps entire app
- [x] App shell layout with sidebar + topbar
- [x] Responsive design (mobile bottom nav, desktop sidebar)
- [x] All placeholder pages created with EmptyState component
