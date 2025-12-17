// @vitest-environment node
import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { clients, roles, sessions, users } from "@/lib/db/schema";
import { ensureDefaultRoleForUser, getUserPermissions } from "@/lib/auth/rbac";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";
import { createFirm } from "@tests/fixtures/factories/firm";
import { cleanupTestFirm } from "@tests/helpers/db";

describe("Auth Integration - RBAC", () => {
  const ctx = setupIntegrationSuite();

  it("assigns default roles per firm and grants permissions", async () => {
    const u1 = await createUser({ firmId: ctx.firmId });
    const u2 = await createUser({ firmId: ctx.firmId });

    const r1 = await ensureDefaultRoleForUser(u1.id, ctx.firmId);
    const r2 = await ensureDefaultRoleForUser(u2.id, ctx.firmId);

    expect(["admin", "fee_earner"]).toContain(r1.roleName);
    expect(["admin", "fee_earner"]).toContain(r2.roleName);

    const p1 = await getUserPermissions(u1.id, ctx.firmId);
    const p2 = await getUserPermissions(u2.id, ctx.firmId);

    expect(p1.length).toBeGreaterThan(0);
    expect(p2.length).toBeGreaterThan(0);
    expect(p1).toContain("clients:read");
  });

  it("revokes access when user role is removed", async () => {
    const u = await createUser({ firmId: ctx.firmId });
    await ensureDefaultRoleForUser(u.id, ctx.firmId);

    const before = await getUserPermissions(u.id, ctx.firmId);
    expect(before.length).toBeGreaterThan(0);

    await db.update(users).set({ roleId: null }).where(eq(users.id, u.id));

    const after = await getUserPermissions(u.id, ctx.firmId);
    expect(after).toEqual([]);
  });

  it("returns 403 for missing permission at route boundary", async () => {
    const [role] = await db
      .insert(roles)
      .values({
        firmId: ctx.firmId,
        name: `limited-${Date.now()}`,
        permissions: ["cases:read"],
        isSystem: false,
      })
      .returning({ id: roles.id });

    const u = await createUser({ firmId: ctx.firmId, roleId: role.id });
    const token = `tok_${randomUUID()}`;
    await db.insert(sessions).values({
      userId: u.id,
      token,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const { GET } = await import("@/app/api/clients/route");
    const req = new NextRequest("http://localhost/api/clients", {
      headers: new Headers({ cookie: `template.session_token=${token}` }),
    });

    const res = await GET(req as any, {} as any);
    expect(res.status).toBe(403);
  });

  it("prevents cross-firm resource access (404)", async () => {
    const firm2 = await createFirm({ name: `Other Firm ${Date.now()}` });
    try {
      const u = await createUser({ firmId: ctx.firmId });
      await ensureDefaultRoleForUser(u.id, ctx.firmId);

      const token = `tok_${randomUUID()}`;
      await db.insert(sessions).values({
        userId: u.id,
        token,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const [otherClient] = await db
        .insert(clients)
        .values({
          firmId: firm2.id,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: "Other",
          lastName: "Firm",
        })
        .returning({ id: clients.id });

      const { GET } = await import("@/app/api/clients/[id]/route");
      const req = new NextRequest(`http://localhost/api/clients/${otherClient.id}`, {
        headers: new Headers({ cookie: `template.session_token=${token}` }),
      });

      const res = await GET(req as any, { params: { id: otherClient.id } } as any);
      expect(res.status).toBe(404);
    } finally {
      await cleanupTestFirm(firm2.id);
    }
  });
});
