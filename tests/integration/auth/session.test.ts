// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { setupFreshFirmPerTest } from "@tests/integration/setup";

/**
 * Extract session cookie from Better Auth's Set-Cookie header.
 * The cookie name follows the pattern: {prefix}.session_token
 */
function extractSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;

  // Parse multiple Set-Cookie values (they may be comma-separated or newline-separated)
  const cookies = setCookieHeader.split(/[,\n]/).map((c) => c.trim());

  // Find the session_token cookie
  const sessionCookie = cookies.find((c) => c.includes("session_token"));
  if (!sessionCookie) return null;

  // Extract just the name=value part (before the first semicolon)
  const nameValue = sessionCookie.split(";")[0];
  return nameValue || null;
}

/**
 * Create a Headers object with the session cookie.
 */
function cookieHeader(cookie: string): Headers {
  return new Headers({ cookie });
}

describe("Auth Integration - Session", () => {
  const ctx = setupFreshFirmPerTest();

  it("getSession returns user when valid session exists", async () => {
    // Create a user and session via Better Auth's actual API
    const email = `test-session-${randomUUID()}@example.com`;
    const password = "test-password-123";

    // Sign up creates both user and session with properly signed cookie
    const signupResponse = await auth.api.signUpEmail({
      body: { email, password, name: "Test User" },
      asResponse: true,
    });

    expect(signupResponse.status).toBe(200);

    // Extract the signed session cookie from the response
    const setCookie = signupResponse.headers.get("set-cookie");
    const sessionCookie = extractSessionCookie(setCookie);
    expect(sessionCookie).toBeTruthy();

    // Now verify getSession works with the signed cookie
    const session = await auth.api.getSession({
      headers: cookieHeader(sessionCookie!),
    });

    expect(session).not.toBeNull();
    expect(session?.user?.email).toBe(email);
  });

  it("getSession returns null for invalid/malformed cookie", async () => {
    // Use a random invalid cookie value
    const invalidCookie = `template.session_token=invalid-token-${randomUUID()}`;

    const session = await auth.api.getSession({
      headers: cookieHeader(invalidCookie),
    });

    expect(session).toBeNull();
  });

  it("getSession returns null when no cookie provided", async () => {
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    expect(session).toBeNull();
  });
});
