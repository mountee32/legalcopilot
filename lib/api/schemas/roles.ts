/**
 * Roles API Schemas (RBAC)
 *
 * @see lib/db/schema/roles.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema } from "./common";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const PermissionSchema = z.enum(PERMISSIONS).openapi("Permission");

export const RoleSchema = z
  .object({
    id: UuidSchema,
    name: z.string(),
    description: z.string().nullable(),
    permissions: z.array(PermissionSchema),
    isSystem: z.boolean(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Role");

export const RoleListSchema = z
  .object({
    roles: z.array(RoleSchema),
  })
  .openapi("RoleListResponse");

export const CreateRoleSchema = z
  .object({
    name: z.string().min(2).max(50),
    description: z.string().max(500).optional(),
    permissions: z.array(PermissionSchema).min(1),
  })
  .openapi("CreateRoleRequest");

export const UpdateRoleSchema = CreateRoleSchema.partial().openapi("UpdateRoleRequest");

export const AssignRoleSchema = z
  .object({
    roleId: UuidSchema,
  })
  .openapi("AssignRoleRequest");

export const AssignRoleResponseSchema = z
  .object({
    userId: UuidSchema,
    roleId: UuidSchema,
  })
  .openapi("AssignRoleResponse");

export const UserIdParamSchema = z
  .object({
    id: UuidSchema,
  })
  .openapi("UserIdParam");

export type Role = z.infer<typeof RoleSchema>;
