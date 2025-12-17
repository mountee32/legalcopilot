import type { APIRequestContext } from "@playwright/test";

type HeaderEntry = { name: string; value: string };

function cookieHeaderFromSetCookie(headers: HeaderEntry[]): string {
  const parts = headers
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value.split(";")[0])
    .filter(Boolean);

  // Best-effort: Better Auth sets multiple cookies; the request Cookie header expects only name=value pairs.
  return parts.join("; ");
}

export async function createAuthCookieHeader(request: APIRequestContext): Promise<string> {
  const email = `e2e-${Date.now()}@test.example.com`;
  const password = "e2e-password-123";

  const res = await request.post("/api/auth/sign-up/email", {
    data: { name: "E2E User", email, password },
  });

  if (!res.ok()) {
    throw new Error(`Failed to sign up e2e user: ${res.status()} ${await res.text()}`);
  }

  const cookie = cookieHeaderFromSetCookie(res.headersArray() as any);
  if (!cookie) {
    throw new Error("Auth sign-up did not return set-cookie headers");
  }

  return cookie;
}
