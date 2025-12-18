import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Type definition for route handlers
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> | Promise<Record<string, string>> }
) => Promise<Response> | Response;

/**
 * Type definition for session data from Better Auth
 */
export type SessionData = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Type definition for authenticated route handlers
 * Includes user session information
 */
export type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: {
    params?: Record<string, string> | Promise<Record<string, string>>;
    user: NonNullable<SessionData>;
  }
) => Promise<Response> | Response;

/**
 * Authentication middleware wrapper for protecting API routes
 *
 * Checks for a valid Better Auth session before allowing access to the route.
 * If no session exists or the session is invalid, returns a 401 Unauthorized response.
 *
 * @param handler - The route handler to protect
 * @returns A wrapped handler that includes authentication checks
 *
 * @example
 * ```typescript
 * import { withAuth } from "@/middleware/withAuth";
 *
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ message: `Hello ${user.user.name}` });
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedRouteHandler): RouteHandler {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> }
  ) => {
    try {
      // Get session from Better Auth
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // Check if session exists and user is authenticated
      if (!session || !session.user) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "You must be authenticated to access this resource",
          },
          { status: 401 }
        );
      }

      // Pass the session to the handler
      return handler(request, {
        ...context,
        user: session,
      });
    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "An error occurred while verifying your session",
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Optional authentication middleware wrapper
 *
 * Similar to withAuth but allows access even without authentication.
 * The user will be undefined if not authenticated.
 *
 * @param handler - The route handler
 * @returns A wrapped handler with optional authentication
 *
 * @example
 * ```typescript
 * import { withOptionalAuth } from "@/middleware/withAuth";
 *
 * export const GET = withOptionalAuth(async (request, { user }) => {
 *   if (user) {
 *     return NextResponse.json({ message: `Hello ${user.user.name}` });
 *   }
 *   return NextResponse.json({ message: "Hello guest" });
 * });
 * ```
 */
export function withOptionalAuth(
  handler: (
    request: NextRequest,
    context: {
      params?: Record<string, string> | Promise<Record<string, string>>;
      user?: SessionData;
    }
  ) => Promise<Response> | Response
): RouteHandler {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> }
  ) => {
    try {
      // Try to get session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // Pass session (or undefined) to handler
      return handler(request, {
        ...context,
        user: session || undefined,
      });
    } catch (error) {
      // If session check fails, proceed without user
      console.error("Optional auth error:", error);
      return handler(request, {
        ...context,
        user: undefined,
      });
    }
  };
}
