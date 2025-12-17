import type { NextRequest } from "next/server";
import type { AuthenticatedRouteHandler } from "@/middleware/withAuth";
import { ForbiddenError } from "@/middleware/withErrorHandler";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { getUserPermissions, hasPermission } from "@/lib/auth/rbac";
import type { Permission } from "@/lib/auth/permissions";

export function withPermission(required: Permission) {
  return (handler: AuthenticatedRouteHandler): AuthenticatedRouteHandler => {
    return async (request: NextRequest, context) => {
      const userId = context.user.user.id;
      const firmId = await getOrCreateFirmIdForUser(userId);
      const permissions = await getUserPermissions(userId, firmId);

      if (!hasPermission(permissions, required)) {
        throw new ForbiddenError(`Missing permission: ${required}`);
      }

      return handler(request, context);
    };
  };
}
