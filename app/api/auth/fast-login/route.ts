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

// Test users configuration
const TEST_USERS = [
  { email: "admin@test.local", name: "Admin User", roleName: "firm_admin" },
  { email: "partner@test.local", name: "Pat Partner", roleName: "partner" },
  { email: "sr-associate@test.local", name: "Sam Senior", roleName: "senior_associate" },
  { email: "associate@test.local", name: "Alex Associate", roleName: "associate" },
  { email: "paralegal@test.local", name: "Perry Paralegal", roleName: "paralegal" },
  { email: "secretary@test.local", name: "Sue Secretary", roleName: "secretary" },
  { email: "client@test.local", name: "Chris Client", roleName: "client" },
  { email: "superadmin@test.local", name: "Super Admin", roleName: "super_admin" },
] as const;

type RoleName = (typeof TEST_USERS)[number]["roleName"];

// Default permissions by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  firm_admin: ["*"],
  partner: [
    "matters:*",
    "clients:*",
    "documents:*",
    "billing:*",
    "approvals:*",
    "team:read",
    "reports:*",
  ],
  senior_associate: [
    "matters:*",
    "clients:*",
    "documents:*",
    "billing:create",
    "billing:read",
    "billing:update",
    "approvals:create",
  ],
  associate: [
    "matters:read",
    "matters:update",
    "clients:read",
    "documents:*",
    "billing:create",
    "billing:read",
  ],
  paralegal: ["matters:read", "clients:read", "documents:read", "documents:create"],
  secretary: ["matters:read", "clients:read", "documents:read", "calendar:*"],
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

    // Ensure test firm exists
    let testFirm = await db
      .select()
      .from(firms)
      .where(eq(firms.name, "Test Firm (Dev)"))
      .limit(1)
      .then((r) => r[0]);

    if (!testFirm) {
      [testFirm] = await db
        .insert(firms)
        .values({
          name: "Test Firm (Dev)",
          sraNumber: "DEV000000",
          status: "active",
          plan: "enterprise",
          email: "dev@test.local",
        })
        .returning();
    }

    // Ensure role exists for this firm
    let dbRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.firmId, testFirm.id), eq(roles.name, testUserConfig.roleName)))
      .limit(1)
      .then((r) => r[0]);

    if (!dbRole) {
      [dbRole] = await db
        .insert(roles)
        .values({
          firmId: testFirm.id,
          name: testUserConfig.roleName,
          description: `Test role for ${testUserConfig.roleName}`,
          permissions: ROLE_PERMISSIONS[testUserConfig.roleName] || [],
          isSystem: true,
        })
        .returning();
    }

    // Find or create the test user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, testUserConfig.email))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      // Create user
      [user] = await db
        .insert(users)
        .values({
          email: testUserConfig.email,
          name: testUserConfig.name,
          firmId: testFirm.id,
          roleId: dbRole.id,
          emailVerified: true,
        })
        .returning();

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
      if (user.firmId !== testFirm.id || user.roleId !== dbRole.id) {
        await db
          .update(users)
          .set({ firmId: testFirm.id, roleId: dbRole.id, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      // Ensure the account has the correct password format (Better-Auth uses salt:key, not bcrypt)
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
        .limit(1)
        .then((r) => r[0]);

      if (existingAccount) {
        // Check if password is in Better-Auth format (contains colon)
        if (!existingAccount.password?.includes(":")) {
          const hashedPassword = await hashPasswordBetterAuth("testpass123");
          await db
            .update(accounts)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(accounts.id, existingAccount.id));
        }
      }
    }

    // Use Better-Auth's sign-in endpoint via internal fetch
    // This ensures proper session creation with correct cookie format
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const signInResponse = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    const setCookie = signInResponse.headers.get("set-cookie");

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

    // Forward the session cookie from Better-Auth
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
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
