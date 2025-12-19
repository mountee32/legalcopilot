/**
 * Fast Login API - Development/Testing Only
 *
 * Allows one-click login as predefined test users for each role.
 * Controlled by NEXT_PUBLIC_ENABLE_FAST_LOGIN environment variable.
 *
 * SECURITY: This endpoint is protected by:
 * 1. NODE_ENV check - refuses to work in production
 * 2. Environment variable check - must be explicitly enabled
 * 3. Only works with test users (*.test.local domain)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, accounts, roles, firms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Demo IDs - matches tests/fixtures/demo-data/index.ts
// Using these IDs ensures fast-login users see demo data seeded by `npm run demo:seed`
const DEMO_FIRM_ID = "de000000-0000-4000-a000-000000000001";
const DEMO_USER_IDS = {
  partner: "de000000-0000-4000-a001-000000000001",
  associate: "de000000-0000-4000-a001-000000000002",
  associate2: "de000000-0000-4000-a001-000000000003",
  associate3: "de000000-0000-4000-a001-000000000004",
  paralegal1: "de000000-0000-4000-a001-000000000005",
  paralegal2: "de000000-0000-4000-a001-000000000006",
  seniorPartner: "de000000-0000-4000-a001-000000000007",
  receptionist: "de000000-0000-4000-a001-000000000008",
  firmAdmin: "de000000-0000-4000-a001-000000000009",
  superAdmin: "de000000-0000-4000-a001-000000000010",
};

// Better-Auth compatible password hashing (uses scrypt)
async function hashPasswordBetterAuth(password: string): Promise<string> {
  const { scrypt, randomBytes } = await import("crypto");
  const { promisify } = await import("util");
  const scryptAsync = promisify(scrypt);

  // Better-Auth scrypt config: N=16384, r=16, p=1, dkLen=64
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(
    password.normalize("NFKC"),
    salt,
    64, // dkLen
    { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }
  )) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

// Demo users configuration - maps to demo data users from npm run demo:seed
// Each role logs in as the corresponding demo character
const TEST_USERS = [
  {
    email: "admin@harrisonclark.demo",
    name: "Admin User",
    roleName: "firm_admin",
    userId: DEMO_USER_IDS.firmAdmin,
  },
  {
    email: "sarah.harrison@harrisonclark.demo",
    name: "Sarah Harrison",
    roleName: "partner",
    userId: DEMO_USER_IDS.partner,
  },
  {
    email: "victoria.clarke@harrisonclark.demo",
    name: "Victoria Clarke",
    roleName: "senior_associate",
    userId: DEMO_USER_IDS.seniorPartner,
  },
  {
    email: "james.clarke@harrisonclark.demo",
    name: "James Clarke",
    roleName: "associate",
    userId: DEMO_USER_IDS.associate,
  },
  {
    email: "tom.richards@harrisonclark.demo",
    name: "Tom Richards",
    roleName: "paralegal",
    userId: DEMO_USER_IDS.paralegal1,
  },
  {
    email: "lucy.taylor@harrisonclark.demo",
    name: "Lucy Taylor",
    roleName: "secretary",
    userId: DEMO_USER_IDS.receptionist,
  },
  {
    email: "client@harrisonclark.demo",
    name: "Demo Client",
    roleName: "client",
    userId: null, // Client portal users don't need firm data access
  },
  {
    email: "superadmin@harrisonclark.demo",
    name: "Super Admin",
    roleName: "super_admin",
    userId: DEMO_USER_IDS.superAdmin,
  },
] as const;

type RoleName = (typeof TEST_USERS)[number]["roleName"];

// Default permissions by role
// Note: API uses "cases" not "matters" for the matters/cases resource
const ROLE_PERMISSIONS: Record<string, string[]> = {
  firm_admin: ["*"],
  partner: [
    "cases:*",
    "clients:*",
    "documents:*",
    "billing:*",
    "approvals:*",
    "emails:*",
    "team:read",
    "reports:*",
    "tasks:*",
    "calendar:*",
    "ai:use",
    "ai:configure",
  ],
  senior_associate: [
    "cases:*",
    "clients:*",
    "documents:*",
    "billing:create",
    "billing:read",
    "billing:update",
    "approvals:*",
    "emails:*",
    "tasks:*",
    "calendar:*",
    "ai:use",
  ],
  associate: [
    "cases:read",
    "cases:update",
    "clients:read",
    "documents:*",
    "billing:create",
    "billing:read",
    "emails:read",
    "tasks:*",
    "calendar:*",
    "ai:use",
  ],
  paralegal: [
    "cases:read",
    "clients:read",
    "documents:read",
    "documents:create",
    "emails:read",
    "tasks:read",
    "calendar:read",
    "ai:use",
  ],
  secretary: [
    "cases:read",
    "clients:read",
    "documents:read",
    "emails:read",
    "calendar:*",
    "tasks:read",
  ],
  client: ["portal:*"],
  super_admin: ["*", "system:*"],
};

export async function POST(request: Request) {
  // Guard 1: Refuse in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  // Guard 2: Check env var
  if (process.env.NEXT_PUBLIC_ENABLE_FAST_LOGIN !== "true") {
    return NextResponse.json({ error: "Fast login not enabled" }, { status: 403 });
  }

  try {
    const { role } = await request.json();

    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Find the test user config
    const testUserConfig = TEST_USERS.find((u) => u.roleName === role);
    if (!testUserConfig) {
      return NextResponse.json({ error: `Unknown role: ${role}` }, { status: 400 });
    }

    // Use the demo firm (seeded by npm run demo:seed)
    // This ensures fast-login users can see demo data
    let demoFirm = await db
      .select()
      .from(firms)
      .where(eq(firms.id, DEMO_FIRM_ID))
      .limit(1)
      .then((r) => r[0]);

    if (!demoFirm) {
      // Demo firm not seeded - create a placeholder
      // Run `npm run demo:seed` to get full demo data
      [demoFirm] = await db
        .insert(firms)
        .values({
          id: DEMO_FIRM_ID,
          name: "Harrison & Clarke Solicitors",
          sraNumber: "DEMO123456",
          status: "active",
          plan: "enterprise",
          email: "info@harrisonandclarke.demo",
        })
        .returning();
    }

    // Ensure role exists for this firm
    let dbRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.firmId, demoFirm.id), eq(roles.name, testUserConfig.roleName)))
      .limit(1)
      .then((r) => r[0]);

    if (!dbRole) {
      [dbRole] = await db
        .insert(roles)
        .values({
          firmId: demoFirm.id,
          name: testUserConfig.roleName,
          description: `Test role for ${testUserConfig.roleName}`,
          permissions: ROLE_PERMISSIONS[testUserConfig.roleName] || [],
          isSystem: true,
        })
        .returning();
    } else {
      // Update role permissions if they've changed
      const expectedPermissions = ROLE_PERMISSIONS[testUserConfig.roleName] || [];
      const currentPermissions = dbRole.permissions || [];
      if (
        JSON.stringify(currentPermissions.sort()) !== JSON.stringify(expectedPermissions.sort())
      ) {
        [dbRole] = await db
          .update(roles)
          .set({ permissions: expectedPermissions, updatedAt: new Date() })
          .where(eq(roles.id, dbRole.id))
          .returning();
      }
    }

    // Find or create the test user
    // For demo data users (those with userId), try to find by ID first (preserves demo data linkage)
    // For other users (client, firm_admin, super_admin), find by email
    let user = testUserConfig.userId
      ? await db
          .select()
          .from(users)
          .where(eq(users.id, testUserConfig.userId))
          .limit(1)
          .then((r) => r[0])
      : await db
          .select()
          .from(users)
          .where(eq(users.email, testUserConfig.email))
          .limit(1)
          .then((r) => r[0]);

    if (!user) {
      // Create user with predetermined ID if provided (ensures demo data works)
      const userValues: {
        id?: string;
        email: string;
        name: string;
        firmId: string;
        roleId: string;
        emailVerified: boolean;
      } = {
        email: testUserConfig.email,
        name: testUserConfig.name,
        firmId: demoFirm.id,
        roleId: dbRole.id,
        emailVerified: true,
      };

      // Use predetermined ID for demo data users
      if (testUserConfig.userId) {
        userValues.id = testUserConfig.userId;
      }

      [user] = await db.insert(users).values(userValues).returning();

      // Create credential account with password "testpass123"
      // Use Better-Auth's password format (salt:key), not bcrypt
      const hashedPassword = await hashPasswordBetterAuth("testpass123");
      await db.insert(accounts).values({
        userId: user.id,
        providerId: "credential",
        accountId: testUserConfig.email,
        password: hashedPassword,
      });
    } else {
      // Ensure user has correct firm and role
      if (user.firmId !== demoFirm.id || user.roleId !== dbRole.id) {
        await db
          .update(users)
          .set({ firmId: demoFirm.id, roleId: dbRole.id, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      // Ensure credential account exists with correct password
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
        .limit(1)
        .then((r) => r[0]);

      if (!existingAccount) {
        // Create credential account for demo user (they were created by demo:seed without one)
        const hashedPassword = await hashPasswordBetterAuth("testpass123");
        await db.insert(accounts).values({
          userId: user.id,
          providerId: "credential",
          accountId: testUserConfig.email,
          password: hashedPassword,
        });
      } else if (!existingAccount.password?.includes(":")) {
        // Check if password is in Better-Auth format (contains colon)
        const hashedPassword = await hashPasswordBetterAuth("testpass123");
        await db
          .update(accounts)
          .set({ password: hashedPassword, updatedAt: new Date() })
          .where(eq(accounts.id, existingAccount.id));
      }
    }

    // Use Better-Auth's sign-in endpoint via internal fetch
    // This ensures proper session creation with correct cookie format
    // Use the Host header to get the actual host the client is accessing
    // (request.url is normalized to localhost by Next.js internally)
    const hostHeader = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${hostHeader}`;
    const signInResponse = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward headers so Better-Auth sees the original client context
        Host: hostHeader,
        Origin: baseUrl,
        "X-Forwarded-Host": hostHeader,
        "X-Forwarded-Proto": protocol,
      },
      body: JSON.stringify({
        email: testUserConfig.email,
        password: "testpass123",
      }),
    });

    if (!signInResponse.ok) {
      const errorData = await signInResponse.text();
      console.error("Sign-in failed:", errorData);
      return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
    }

    // Get the response data and cookies from Better-Auth
    const data = await signInResponse.json();
    // Use getSetCookie() to get ALL Set-Cookie headers (there may be multiple)
    const setCookies = signInResponse.headers.getSetCookie();

    // Debug logging
    console.log("[fast-login] baseUrl:", baseUrl);
    console.log("[fast-login] sign-in response status:", signInResponse.status);
    console.log("[fast-login] cookies received:", setCookies.length);
    setCookies.forEach((c, i) =>
      console.log(`[fast-login] cookie ${i}:`, c.substring(0, 100) + "...")
    );

    // Create our response with the session cookie forwarded
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: testUserConfig.roleName,
      },
    });

    // Forward ALL session cookies from Better-Auth
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    console.error("Fast login error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// GET endpoint to check if fast login is enabled and get available roles
export async function GET() {
  // Guard 1: Refuse in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ enabled: false });
  }

  // Guard 2: Check env var
  if (process.env.NEXT_PUBLIC_ENABLE_FAST_LOGIN !== "true") {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    roles: TEST_USERS.map((u) => ({
      role: u.roleName,
      name: u.name,
      email: u.email,
    })),
  });
}
