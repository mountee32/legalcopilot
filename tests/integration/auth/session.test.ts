// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { setupFreshFirmPerTest } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";

function cookieHeader(sessionToken: string): Headers {
  return new Headers({ cookie: `template.session_token=${sessionToken}` });
}

describe("Auth Integration - Session", () => {
  const ctx = setupFreshFirmPerTest();

  it("getSession returns user when valid cookie present", async () => {
    const user = await createUser({ firmId: ctx.firmId });
    const token = `tok_${randomUUID()}`;

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60_000),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    const session = await auth.api.getSession({ headers: cookieHeader(token) });
    expect(session?.user?.id).toBe(user.id);
  });

  it("getSession returns null when token is expired", async () => {
    const user = await createUser({ firmId: ctx.firmId });
    const token = `tok_${randomUUID()}`;

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() - 60_000),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    const session = await auth.api.getSession({ headers: cookieHeader(token) });
    expect(session).toBeNull();
  });

  it("getSession returns null for unknown token", async () => {
    const session = await auth.api.getSession({ headers: cookieHeader(`tok_${randomUUID()}`) });
    expect(session).toBeNull();
  });
});
