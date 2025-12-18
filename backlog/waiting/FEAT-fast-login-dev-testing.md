# FEAT: Fast Login for Development & Testing

**Type:** Feature
**Priority:** Medium
**Effort:** Small (2-3 hours)
**Status:** Waiting

---

## Problem

Testers and developers need to quickly switch between different user roles to test features and permissions. Currently, this requires:

- Looking up test user credentials
- Manually typing usernames and passwords
- Switching between multiple accounts repeatedly
- Resetting passwords when forgotten

This slows down testing and development workflows significantly.

---

## Solution

Add "Quick Login" buttons to the login page that allow one-click authentication as predefined test users representing each key role. This feature should:

1. **Only be visible when enabled** via environment variable
2. **Show buttons for each role type** with clear labels
3. **Automatically authenticate** without requiring credentials
4. **Work in development and staging** environments only

---

## Requirements

### Environment Control

```env
# .env.local or .env.development
NEXT_PUBLIC_ENABLE_FAST_LOGIN=true
```

- Feature is **completely hidden** when env var is `false` or not set
- Should never be enabled in production
- Add safeguard: refuse to enable if `NODE_ENV=production`

### Role Coverage

Provide quick login buttons for all primary roles:

| Role                 | Description                         | Purpose                    |
| -------------------- | ----------------------------------- | -------------------------- |
| **Firm Admin**       | Full access, firm settings          | Test admin workflows       |
| **Partner**          | Senior fee earner, matter oversight | Test approval workflows    |
| **Senior Associate** | Fee earner with team supervision    | Test matter management     |
| **Associate**        | Standard fee earner                 | Test day-to-day work       |
| **Paralegal**        | Support role, limited permissions   | Test restricted access     |
| **Secretary**        | Administrative support              | Test admin-only features   |
| **Client (Portal)**  | External client access              | Test client portal         |
| **Super Admin**      | Platform admin (multi-firm)         | Test system-level features |

### UI Design

**Location:** Login page (`app/(auth)/login/page.tsx`)

**Layout:**

```
┌─────────────────────────────────────┐
│  Legal Copilot                       │
│                                      │
│  Email: [____________]               │
│  Password: [____________]            │
│  [Login]                             │
│                                      │
│  ──────── Quick Login (Dev) ────────│
│                                      │
│  [👔 Firm Admin]  [⚖️ Partner]       │
│  [👨‍💼 Sr Associate] [👩‍💼 Associate]   │
│  [📋 Paralegal]   [📝 Secretary]     │
│  [👤 Client]      [🔧 Super Admin]   │
│                                      │
│  ⚠️ Development mode only            │
└─────────────────────────────────────┘
```

**Styling:**

- Clearly separated from production login (divider, distinct styling)
- Warning badge/text indicating dev mode
- Icon + role name on each button
- Responsive grid (2 columns on mobile, 4 on desktop)

### Technical Implementation

**1. Test User Seeding**

Create/update test seed script to ensure test users exist for each role:

```typescript
// tests/fixtures/seed.ts or lib/db/seed-test-users.ts

const TEST_USERS = [
  { email: "admin@test.local", name: "Admin User", role: "firm_admin" },
  { email: "partner@test.local", name: "Pat Partner", role: "partner" },
  { email: "sr-associate@test.local", name: "Sam Senior", role: "senior_associate" },
  { email: "associate@test.local", name: "Alex Associate", role: "associate" },
  { email: "paralegal@test.local", name: "Perry Paralegal", role: "paralegal" },
  { email: "secretary@test.local", name: "Sue Secretary", role: "secretary" },
  { email: "client@test.local", name: "Chris Client", role: "client" },
  { email: "superadmin@test.local", name: "Super Admin", role: "super_admin" },
];
```

**2. API Endpoint**

Add fast login endpoint (only enabled when env var is set):

```typescript
// app/api/auth/fast-login/route.ts

export async function POST(request: Request) {
  // Guard: refuse in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  // Guard: check env var
  if (process.env.NEXT_PUBLIC_ENABLE_FAST_LOGIN !== "true") {
    return NextResponse.json({ error: "Not enabled" }, { status: 403 });
  }

  const { role } = await request.json();

  // Find test user by role
  const user = await findTestUserByRole(role);
  if (!user) {
    return NextResponse.json({ error: "Test user not found" }, { status: 404 });
  }

  // Create session (using Better-Auth or existing auth system)
  const session = await createSession(user.id);

  return NextResponse.json({ session, user });
}
```

**3. Login Page Component**

Add conditional quick login section:

```typescript
// app/(auth)/login/page.tsx

export default function LoginPage() {
  const fastLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_FAST_LOGIN === "true";

  const handleFastLogin = async (role: string) => {
    const res = await fetch("/api/auth/fast-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      router.push("/dashboard");
    }
  };

  return (
    <div>
      {/* Standard login form */}
      <LoginForm />

      {/* Quick login (dev only) */}
      {fastLoginEnabled && (
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Quick Login (Development)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <FastLoginButton role="firm_admin" icon="👔" label="Firm Admin" onClick={handleFastLogin} />
            <FastLoginButton role="partner" icon="⚖️" label="Partner" onClick={handleFastLogin} />
            {/* ... more buttons */}
          </div>
          <p className="mt-4 text-xs text-amber-600 text-center flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Development mode only
          </p>
        </div>
      )}
    </div>
  );
}
```

**4. Button Component**

```typescript
// components/auth/fast-login-button.tsx

interface FastLoginButtonProps {
  role: string;
  icon: string;
  label: string;
  onClick: (role: string) => void;
}

export function FastLoginButton({ role, icon, label, onClick }: FastLoginButtonProps) {
  return (
    <button
      onClick={() => onClick(role)}
      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
```

---

## Acceptance Criteria

- [ ] Environment variable `NEXT_PUBLIC_ENABLE_FAST_LOGIN` controls visibility
- [ ] Feature is completely hidden when env var is false/unset
- [ ] Feature refuses to work in `NODE_ENV=production`
- [ ] All 8 role types have corresponding buttons
- [ ] Buttons are visually distinct from production login
- [ ] Warning indicator shows this is dev-only
- [ ] Clicking a button immediately logs in as that role
- [ ] Test users are seeded automatically in dev/test databases
- [ ] Responsive layout (works on mobile and desktop)
- [ ] Works with existing Better-Auth session system

---

## Testing

**Manual Testing:**

1. Set `NEXT_PUBLIC_ENABLE_FAST_LOGIN=true` in `.env.local`
2. Visit login page - buttons should appear
3. Click each role button - should log in successfully
4. Verify permissions match the role
5. Unset env var - buttons should disappear
6. Set `NODE_ENV=production` - endpoint should return 404

**Automated Testing:**

```typescript
// tests/e2e/browser/fast-login.spec.ts

test.describe("Fast Login (Dev Mode)", () => {
  test("shows quick login buttons when enabled", async ({ page }) => {
    // Test with env var set
  });

  test("hides buttons when disabled", async ({ page }) => {
    // Test with env var unset
  });

  test("logs in as each role", async ({ page }) => {
    // Test each button
  });
});
```

---

## Security Considerations

1. **Production safeguard:** Hard-coded check for `NODE_ENV`
2. **Environment-based:** Feature controlled by env var
3. **Clear warnings:** Visual indicators this is dev-only
4. **Test users only:** Uses dedicated test accounts (`.local` domain)
5. **No credentials exposed:** Passwords never shown in UI
6. **Session-based:** Uses same auth system as production

---

## Related

- **Better-Auth setup:** `/lib/auth/` - session management
- **User roles:** `lib/db/schema/users.ts` - role definitions
- **Test seeding:** `tests/fixtures/seed.ts` - test data creation
- **Login page:** `app/(auth)/login/page.tsx` - UI implementation

---

## Notes

- This feature should be documented in `SETUP.md` for new developers
- Add to `README.md` under "Development Features"
- Consider adding keyboard shortcuts (e.g., `Ctrl+1` for admin, etc.)
- Could extend to remember last role used (localStorage)
- Future: Add visual indicator in app header when logged in via fast login
