import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { DEFAULT_ROLE_PERMISSIONS, type Permission } from "@/lib/auth/permissions";

export type RoleName = "admin" | "fee_earner";

async function ensureDefaultRolesForFirmTx(
  tx: typeof db,
  firmId: string
): Promise<{ adminRoleId: string; feeEarnerRoleId: string }> {
  const existing = await tx
    .select({
      id: roles.id,
      name: roles.name,
      permissions: roles.permissions,
      isSystem: roles.isSystem,
    })
    .from(roles)
    .where(and(eq(roles.firmId, firmId), inArray(roles.name, ["admin", "fee_earner"])));

  const byName = new Map(existing.map((r) => [r.name, r.id]));
  const toInsert: { name: RoleName; permissions: Permission[] }[] = [];

  if (!byName.has("admin")) {
    toInsert.push({ name: "admin", permissions: DEFAULT_ROLE_PERMISSIONS.admin });
  }
  if (!byName.has("fee_earner")) {
    toInsert.push({ name: "fee_earner", permissions: DEFAULT_ROLE_PERMISSIONS.fee_earner });
  }

  if (toInsert.length > 0) {
    const inserted = await tx
      .insert(roles)
      .values(
        toInsert.map((r) => ({
          firmId,
          name: r.name,
          description: r.name === "admin" ? "Firm administrator" : "Fee earner",
          permissions: r.permissions,
          isSystem: true,
        }))
      )
      .onConflictDoNothing({ target: [roles.firmId, roles.name] })
      .returning({ id: roles.id, name: roles.name });

    for (const r of inserted) byName.set(r.name as RoleName, r.id);
  }

  const adminRoleId = byName.get("admin");
  const feeEarnerRoleId = byName.get("fee_earner");
  if (!adminRoleId || !feeEarnerRoleId) {
    throw new Error("Failed to ensure default roles");
  }

  const existingByName = new Map(existing.map((r) => [r.name as RoleName, r]));
  const desiredByName: Record<RoleName, Permission[]> = {
    admin: DEFAULT_ROLE_PERMISSIONS.admin,
    fee_earner: DEFAULT_ROLE_PERMISSIONS.fee_earner,
  };

  for (const name of ["admin", "fee_earner"] as const) {
    const row = existingByName.get(name);
    if (!row?.isSystem) continue;

    const current = row.permissions as unknown;
    const desired = desiredByName[name];

    const currentSet = new Set(
      (Array.isArray(current) ? current : []).filter((p) => typeof p === "string")
    );
    const desiredSet = new Set(desired);

    let differs = currentSet.size !== desiredSet.size;
    if (!differs) {
      for (const p of desiredSet) {
        if (!currentSet.has(p)) {
          differs = true;
          break;
        }
      }
    }

    if (differs) {
      await tx
        .update(roles)
        .set({ permissions: desired, updatedAt: new Date() })
        .where(and(eq(roles.id, row.id), eq(roles.firmId, firmId)));
    }
  }

  return { adminRoleId, feeEarnerRoleId };
}

export async function ensureDefaultRoleForUser(
  userId: string,
  firmId: string
): Promise<{ roleId: string; roleName: RoleName }> {
  return db.transaction(async (tx) => {
    const { adminRoleId, feeEarnerRoleId } = await ensureDefaultRolesForFirmTx(
      tx as typeof db,
      firmId
    );

    const [user] = await tx
      .select({ id: users.id, roleId: users.roleId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.firmId, firmId)))
      .limit(1);

    if (!user) throw new Error("Authenticated user not found in firm");
    if (user.roleId) {
      const [role] = await tx
        .select({ name: roles.name })
        .from(roles)
        .where(and(eq(roles.id, user.roleId), eq(roles.firmId, firmId)))
        .limit(1);

      const roleName = (role?.name ?? "fee_earner") as RoleName;
      return { roleId: user.roleId, roleName };
    }

    const [first] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firmId, firmId))
      .orderBy(users.createdAt)
      .limit(1);

    const isFirstUser = first?.id === userId;
    const roleId = isFirstUser ? adminRoleId : feeEarnerRoleId;
    const roleName: RoleName = isFirstUser ? "admin" : "fee_earner";

    await tx.update(users).set({ roleId }).where(eq(users.id, userId));
    return { roleId, roleName };
  });
}

export async function getUserPermissions(userId: string, firmId: string): Promise<Permission[]> {
  const [row] = await db
    .select({
      permissions: roles.permissions,
    })
    .from(users)
    .innerJoin(roles, and(eq(users.roleId, roles.id), eq(roles.firmId, firmId)))
    .where(and(eq(users.id, userId), eq(users.firmId, firmId)))
    .limit(1);

  const raw = (row?.permissions ?? []) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Permission => typeof p === "string") as Permission[];
}

export function hasPermission(userPermissions: readonly string[], required: Permission): boolean {
  return userPermissions.includes(required);
}

export async function ensureDefaultRolesAndUserRole(userId: string, firmId: string): Promise<void> {
  await ensureDefaultRoleForUser(userId, firmId);
}
