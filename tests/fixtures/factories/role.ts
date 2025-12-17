/**
 * Role factory for creating test roles
 */
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export interface RoleFactoryOptions {
  id?: string;
  firmId: string;
  name?: string;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
}

export interface TestRole {
  id: string;
  firmId: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
}

/**
 * Default permissions for common roles
 */
export const DEFAULT_PERMISSIONS = {
  admin: [
    "clients:read",
    "clients:write",
    "clients:delete",
    "matters:read",
    "matters:write",
    "matters:delete",
    "documents:read",
    "documents:write",
    "documents:delete",
    "time_entries:read",
    "time_entries:write",
    "time_entries:approve",
    "invoices:read",
    "invoices:write",
    "invoices:send",
    "approvals:read",
    "approvals:decide",
    "users:read",
    "users:write",
    "firm:read",
    "firm:write",
  ],
  fee_earner: [
    "clients:read",
    "clients:write",
    "matters:read",
    "matters:write",
    "documents:read",
    "documents:write",
    "time_entries:read",
    "time_entries:write",
    "invoices:read",
    "approvals:read",
  ],
  readonly: [
    "clients:read",
    "matters:read",
    "documents:read",
    "time_entries:read",
    "invoices:read",
  ],
};

/**
 * Create a test role in the database
 */
export async function createRole(options: RoleFactoryOptions): Promise<TestRole> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const roleData = {
    id,
    firmId: options.firmId,
    name: options.name || `Test Role ${suffix}`,
    description: options.description ?? null,
    permissions: options.permissions || DEFAULT_PERMISSIONS.fee_earner,
    isSystem: options.isSystem ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [role] = await db.insert(roles).values(roleData).returning();

  return {
    id: role.id,
    firmId: role.firmId,
    name: role.name,
    description: role.description,
    permissions: role.permissions as string[],
    isSystem: role.isSystem,
  };
}

/**
 * Create an admin role with all permissions
 */
export async function createAdminRole(
  firmId: string,
  options: Partial<RoleFactoryOptions> = {}
): Promise<TestRole> {
  return createRole({
    ...options,
    firmId,
    name: options.name || "admin",
    permissions: DEFAULT_PERMISSIONS.admin,
    isSystem: true,
  });
}

/**
 * Create a fee earner role with standard permissions
 */
export async function createFeeEarnerRole(
  firmId: string,
  options: Partial<RoleFactoryOptions> = {}
): Promise<TestRole> {
  return createRole({
    ...options,
    firmId,
    name: options.name || "fee_earner",
    permissions: DEFAULT_PERMISSIONS.fee_earner,
    isSystem: true,
  });
}

/**
 * Create a role with specific limited permissions
 */
export async function createLimitedRole(
  firmId: string,
  permissions: string[],
  options: Partial<RoleFactoryOptions> = {}
): Promise<TestRole> {
  return createRole({
    ...options,
    firmId,
    permissions,
    isSystem: false,
  });
}
