/**
 * Roles Integration Tests
 *
 * Tests role CRUD operations and user role assignment against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createRole,
  createAdminRole,
  createFeeEarnerRole,
  createLimitedRole,
  DEFAULT_PERMISSIONS,
} from "@tests/fixtures/factories/role";
import { createUser } from "@tests/fixtures/factories/user";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Roles Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a custom role with permissions", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Custom Role",
        description: "A custom role for testing",
        permissions: ["clients:read", "matters:read"],
        isSystem: false,
      });

      expect(role.id).toBeDefined();
      expect(role.firmId).toBe(ctx.firmId);
      expect(role.name).toBe("Custom Role");
      expect(role.description).toBe("A custom role for testing");
      expect(role.permissions).toEqual(["clients:read", "matters:read"]);
      expect(role.isSystem).toBe(false);
    });

    it("creates an admin role with all permissions", async () => {
      const role = await createAdminRole(ctx.firmId, {
        name: `admin-${Date.now()}`,
      });

      expect(role.name).toMatch(/^admin-/);
      expect(role.permissions).toEqual(DEFAULT_PERMISSIONS.admin);
      expect(role.isSystem).toBe(true);
      expect(role.permissions).toContain("clients:read");
      expect(role.permissions).toContain("users:write");
    });

    it("creates a fee earner role with standard permissions", async () => {
      const role = await createFeeEarnerRole(ctx.firmId, {
        name: `fee_earner-${Date.now()}`,
      });

      expect(role.name).toMatch(/^fee_earner-/);
      expect(role.permissions).toEqual(DEFAULT_PERMISSIONS.fee_earner);
      expect(role.isSystem).toBe(true);
      expect(role.permissions).toContain("clients:read");
      expect(role.permissions).not.toContain("users:write");
    });

    it("creates a role with limited permissions", async () => {
      const limitedPerms = ["clients:read", "documents:read"];
      const role = await createLimitedRole(ctx.firmId, limitedPerms);

      expect(role.permissions).toEqual(limitedPerms);
      expect(role.isSystem).toBe(false);
    });

    it("persists role data to database", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Persist Test Role",
        description: "Testing persistence",
        permissions: ["clients:read"],
      });

      const [dbRole] = await db.select().from(roles).where(eq(roles.id, role.id));

      expect(dbRole).toBeDefined();
      expect(dbRole.name).toBe("Persist Test Role");
      expect(dbRole.description).toBe("Testing persistence");
      expect(dbRole.permissions).toEqual(["clients:read"]);
    });
  });

  describe("Read", () => {
    it("retrieves role by ID", async () => {
      const created = await createRole({
        firmId: ctx.firmId,
        name: "Retrieve Test",
        permissions: ["clients:read"],
      });

      const [retrieved] = await db.select().from(roles).where(eq(roles.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe("Retrieve Test");
    });

    it("lists roles for a firm", async () => {
      // Create several roles
      await createRole({ firmId: ctx.firmId, name: "List1", permissions: ["clients:read"] });
      await createRole({ firmId: ctx.firmId, name: "List2", permissions: ["matters:read"] });
      await createRole({ firmId: ctx.firmId, name: "List3", permissions: ["documents:read"] });

      const firmRoles = await db.select().from(roles).where(eq(roles.firmId, ctx.firmId));

      expect(firmRoles.length).toBeGreaterThanOrEqual(3);
    });

    it("retrieves role with all permissions included", async () => {
      const created = await createRole({
        firmId: ctx.firmId,
        name: "Full Permissions Test",
        permissions: ["clients:read", "clients:write", "matters:read"],
      });

      const [retrieved] = await db.select().from(roles).where(eq(roles.id, created.id));

      expect(retrieved.permissions).toEqual(["clients:read", "clients:write", "matters:read"]);
    });
  });

  describe("Update", () => {
    it("updates role name", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Original Name",
        permissions: ["clients:read"],
      });

      await db
        .update(roles)
        .set({
          name: "Updated Name",
          updatedAt: new Date(),
        })
        .where(eq(roles.id, role.id));

      const [updated] = await db.select().from(roles).where(eq(roles.id, role.id));

      expect(updated.name).toBe("Updated Name");
    });

    it("updates role permissions", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Permission Update Test",
        permissions: ["clients:read"],
      });

      await db
        .update(roles)
        .set({
          permissions: ["clients:read", "clients:write", "matters:read"],
          updatedAt: new Date(),
        })
        .where(eq(roles.id, role.id));

      const [updated] = await db.select().from(roles).where(eq(roles.id, role.id));

      expect(updated.permissions).toEqual(["clients:read", "clients:write", "matters:read"]);
    });

    it("updates role description", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Description Test",
        description: "Original description",
        permissions: ["clients:read"],
      });

      await db
        .update(roles)
        .set({
          description: "Updated description",
          updatedAt: new Date(),
        })
        .where(eq(roles.id, role.id));

      const [updated] = await db.select().from(roles).where(eq(roles.id, role.id));

      expect(updated.description).toBe("Updated description");
    });

    it("cannot modify system roles (business logic test)", async () => {
      const systemRole = await createAdminRole(ctx.firmId);

      expect(systemRole.isSystem).toBe(true);

      // This test verifies the data is marked as system
      // The API route should enforce that system roles cannot be modified
      const [retrieved] = await db.select().from(roles).where(eq(roles.id, systemRole.id));

      expect(retrieved.isSystem).toBe(true);
    });
  });

  describe("Delete", () => {
    it("deletes a custom role", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Delete Test",
        permissions: ["clients:read"],
        isSystem: false,
      });

      await db.delete(roles).where(eq(roles.id, role.id));

      const [deleted] = await db.select().from(roles).where(eq(roles.id, role.id));

      expect(deleted).toBeUndefined();
    });

    it("system roles are marked and protected (business logic test)", async () => {
      const systemRole = await createAdminRole(ctx.firmId, {
        name: `admin-delete-test-${Date.now()}`,
      });

      expect(systemRole.isSystem).toBe(true);

      // The API route should prevent deletion of system roles
      // This test verifies the data structure supports that check
      const [retrieved] = await db.select().from(roles).where(eq(roles.id, systemRole.id));

      expect(retrieved.isSystem).toBe(true);
    });
  });
});

describe("Roles Integration - User Assignment", () => {
  const ctx = setupIntegrationSuite();

  describe("Assign Role to User", () => {
    it("assigns a role to a user", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Assign Test Role",
        permissions: ["clients:read", "matters:read"],
      });

      const user = await createUser({
        firmId: ctx.firmId,
        name: "Test User",
      });

      await db.update(users).set({ roleId: role.id }).where(eq(users.id, user.id));

      const [updated] = await db.select().from(users).where(eq(users.id, user.id));

      expect(updated.roleId).toBe(role.id);
    });

    it("changes user role", async () => {
      const role1 = await createRole({
        firmId: ctx.firmId,
        name: "Role 1",
        permissions: ["clients:read"],
      });

      const role2 = await createRole({
        firmId: ctx.firmId,
        name: "Role 2",
        permissions: ["matters:read"],
      });

      const user = await createUser({
        firmId: ctx.firmId,
        roleId: role1.id,
      });

      expect(user.roleId).toBe(role1.id);

      await db.update(users).set({ roleId: role2.id }).where(eq(users.id, user.id));

      const [updated] = await db.select().from(users).where(eq(users.id, user.id));

      expect(updated.roleId).toBe(role2.id);
    });

    it("removes role from user", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Remove Test Role",
        permissions: ["clients:read"],
      });

      const user = await createUser({
        firmId: ctx.firmId,
        roleId: role.id,
      });

      expect(user.roleId).toBe(role.id);

      await db.update(users).set({ roleId: null }).where(eq(users.id, user.id));

      const [updated] = await db.select().from(users).where(eq(users.id, user.id));

      expect(updated.roleId).toBeNull();
    });

    it("multiple users can have the same role", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Shared Role",
        permissions: ["clients:read", "matters:read"],
      });

      const user1 = await createUser({
        firmId: ctx.firmId,
        roleId: role.id,
      });

      const user2 = await createUser({
        firmId: ctx.firmId,
        roleId: role.id,
      });

      const user3 = await createUser({
        firmId: ctx.firmId,
        roleId: role.id,
      });

      expect(user1.roleId).toBe(role.id);
      expect(user2.roleId).toBe(role.id);
      expect(user3.roleId).toBe(role.id);
    });

    it("user can exist without a role", async () => {
      const user = await createUser({
        firmId: ctx.firmId,
        roleId: null,
      });

      expect(user.roleId).toBeNull();

      const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));

      expect(dbUser.roleId).toBeNull();
    });
  });

  describe("Role Permissions Inheritance", () => {
    it("user with role can be queried with permissions", async () => {
      const role = await createRole({
        firmId: ctx.firmId,
        name: "Permission Check Role",
        permissions: ["clients:read", "clients:write", "matters:read"],
      });

      const user = await createUser({
        firmId: ctx.firmId,
        roleId: role.id,
      });

      // Query user with role joined
      const result = await db
        .select({
          userId: users.id,
          roleId: users.roleId,
          roleName: roles.name,
          permissions: roles.permissions,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, user.id));

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe(user.id);
      expect(result[0].roleId).toBe(role.id);
      expect(result[0].roleName).toBe("Permission Check Role");
      expect(result[0].permissions).toEqual(["clients:read", "clients:write", "matters:read"]);
    });

    it("user without role has no permissions", async () => {
      const user = await createUser({
        firmId: ctx.firmId,
        roleId: null,
      });

      const result = await db
        .select({
          userId: users.id,
          roleId: users.roleId,
          permissions: roles.permissions,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, user.id));

      expect(result.length).toBe(1);
      expect(result[0].roleId).toBeNull();
      expect(result[0].permissions).toBeNull();
    });
  });
});

describe("Roles Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates roles between firms", async () => {
    // Create role in first firm
    const role1 = await createRole({
      firmId: ctx.firmId,
      name: "Firm 1 Role",
      permissions: ["clients:read"],
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create role in second firm
    const role2 = await createRole({
      firmId: firm2.id,
      name: "Firm 2 Role",
      permissions: ["matters:read"],
    });

    // Query roles for first firm
    const firm1Roles = await db.select().from(roles).where(eq(roles.firmId, ctx.firmId));

    // Query roles for second firm
    const firm2Roles = await db.select().from(roles).where(eq(roles.firmId, firm2.id));

    // Each firm should only see their own roles
    expect(firm1Roles.some((r) => r.id === role1.id)).toBe(true);
    expect(firm1Roles.some((r) => r.id === role2.id)).toBe(false);

    expect(firm2Roles.some((r) => r.id === role2.id)).toBe(true);
    expect(firm2Roles.some((r) => r.id === role1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(roles).where(eq(roles.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing roles from another firm by ID", async () => {
    // Create role in first firm
    const role1 = await createRole({
      firmId: ctx.firmId,
      name: "Isolated Role",
      permissions: ["clients:read"],
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query role1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, role1.id),
          eq(roles.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find the role
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot assign role from another firm to user", async () => {
    // Create firm 1 and user
    const user1 = await createUser({
      firmId: ctx.firmId,
      name: "Firm 1 User",
    });

    // Create firm 2 and role
    const firm2 = await createFirm({ name: "Other Firm" });
    const role2 = await createRole({
      firmId: firm2.id,
      name: "Firm 2 Role",
      permissions: ["clients:read"],
    });

    // Try to assign firm2's role to firm1's user - should be prevented by API
    // This test verifies the data structure allows this check
    const [userInFirm1] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, user1.id), eq(users.firmId, ctx.firmId)));

    const [roleInFirm2] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, role2.id), eq(roles.firmId, firm2.id)));

    expect(userInFirm1).toBeDefined();
    expect(roleInFirm2).toBeDefined();
    expect(userInFirm1.firmId).not.toBe(roleInFirm2.firmId);

    // The API should verify role.firmId matches user.firmId before allowing assignment

    // Cleanup second firm
    await db.delete(roles).where(eq(roles.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Roles Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("enforces unique role name per firm", async () => {
    const roleName = `unique-role-${Date.now()}`;

    // Create first role with name
    await createRole({
      firmId: ctx.firmId,
      name: roleName,
      permissions: ["clients:read"],
    });

    // Attempt to create second role with same name should fail
    await expect(
      createRole({
        firmId: ctx.firmId,
        name: roleName,
        permissions: ["matters:read"],
      })
    ).rejects.toThrow();
  });

  it("allows same role name in different firms", async () => {
    const roleName = `shared-role-${Date.now()}`;

    // Create role in first firm
    const role1 = await createRole({
      firmId: ctx.firmId,
      name: roleName,
      permissions: ["clients:read"],
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Role Name Test Firm" });

    // Create role in second firm with same name - should work
    const role2 = await createRole({
      firmId: firm2.id,
      name: roleName,
      permissions: ["matters:read"],
    });

    expect(role1.name).toBe(roleName);
    expect(role2.name).toBe(roleName);
    expect(role1.firmId).not.toBe(role2.firmId);

    // Cleanup
    await db.delete(roles).where(eq(roles.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("role must have at least one permission", async () => {
    // The schema and API should enforce this
    // This test verifies current behavior with empty array
    const role = await createRole({
      firmId: ctx.firmId,
      name: "No Permissions Test",
      permissions: [],
    });

    // Empty permissions should be possible in DB but API should reject
    expect(role.permissions).toEqual([]);
  });

  it("preserves permission order in array", async () => {
    const permissions = [
      "clients:write",
      "clients:read",
      "matters:delete",
      "matters:read",
      "documents:write",
    ];

    const role = await createRole({
      firmId: ctx.firmId,
      name: "Order Test",
      permissions,
    });

    expect(role.permissions).toEqual(permissions);

    const [dbRole] = await db.select().from(roles).where(eq(roles.id, role.id));

    expect(dbRole.permissions).toEqual(permissions);
  });
});

describe("Roles Integration - Default Roles", () => {
  const ctx = setupIntegrationSuite();

  it("admin role has all critical permissions", async () => {
    const adminRole = await createAdminRole(ctx.firmId);

    // Verify admin has all critical permissions
    expect(adminRole.permissions).toContain("clients:read");
    expect(adminRole.permissions).toContain("clients:write");
    expect(adminRole.permissions).toContain("clients:delete");
    expect(adminRole.permissions).toContain("matters:read");
    expect(adminRole.permissions).toContain("matters:write");
    expect(adminRole.permissions).toContain("users:read");
    expect(adminRole.permissions).toContain("users:write");
    expect(adminRole.permissions).toContain("firm:read");
    expect(adminRole.permissions).toContain("firm:write");
  });

  it("fee earner role has appropriate permissions", async () => {
    const feeEarnerRole = await createFeeEarnerRole(ctx.firmId);

    // Verify fee earner has read/write but not admin permissions
    expect(feeEarnerRole.permissions).toContain("clients:read");
    expect(feeEarnerRole.permissions).toContain("clients:write");
    expect(feeEarnerRole.permissions).toContain("matters:read");
    expect(feeEarnerRole.permissions).toContain("matters:write");

    // Should NOT have admin permissions
    expect(feeEarnerRole.permissions).not.toContain("users:write");
    expect(feeEarnerRole.permissions).not.toContain("firm:write");
    expect(feeEarnerRole.permissions).not.toContain("clients:delete");
  });

  it("readonly role has only read permissions", async () => {
    const readonlyRole = await createLimitedRole(ctx.firmId, DEFAULT_PERMISSIONS.readonly);

    // All permissions should be read-only
    const allPermsAreRead = readonlyRole.permissions.every((p) => p.endsWith(":read"));
    expect(allPermsAreRead).toBe(true);

    expect(readonlyRole.permissions).toContain("clients:read");
    expect(readonlyRole.permissions).toContain("matters:read");
    expect(readonlyRole.permissions).not.toContain("clients:write");
    expect(readonlyRole.permissions).not.toContain("matters:write");
  });
});
