import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientPortalSessions, clients } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * Type definition for route handlers
 */
export type PortalRouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> | Promise<Record<string, string>> }
) => Promise<Response> | Response;

/**
 * Portal session data attached to authenticated requests
 */
export interface PortalSessionData {
  sessionId: string;
  clientId: string;
  firmId: string;
  client: typeof clients.$inferSelect;
}

/**
 * Type definition for authenticated portal route handlers
 * Includes client session information
 */
export type AuthenticatedPortalRouteHandler = (
  request: NextRequest,
  context: {
    params?: Record<string, string> | Promise<Record<string, string>>;
    portalSession: PortalSessionData;
  }
) => Promise<Response> | Response;

/**
 * Authentication middleware wrapper for client portal routes
 *
 * Validates client portal sessions and enforces client-scoped data access.
 * Separate from staff authentication to prevent privilege escalation.
 *
 * Expected token format: Bearer token in Authorization header
 *
 * @param handler - The route handler to protect
 * @returns A wrapped handler that includes portal session validation
 *
 * @example
 * ```typescript
 * import { withClientPortalAuth } from "@/middleware/withClientPortalAuth";
 *
 * export const GET = withClientPortalAuth(async (request, { portalSession }) => {
 *   // portalSession.clientId is guaranteed to be authenticated
 *   const matters = await getClientMatters(portalSession.clientId);
 *   return NextResponse.json({ matters });
 * });
 * ```
 */
export function withClientPortalAuth(handler: AuthenticatedPortalRouteHandler): PortalRouteHandler {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> }
  ) => {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Missing or invalid authorization header",
          },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Look up active session
      const sessionResult = await db
        .select({
          session: clientPortalSessions,
          client: clients,
        })
        .from(clientPortalSessions)
        .innerJoin(clients, eq(clientPortalSessions.clientId, clients.id))
        .where(
          and(eq(clientPortalSessions.token, token), gt(clientPortalSessions.expiresAt, new Date()))
        )
        .limit(1);

      if (!sessionResult || sessionResult.length === 0) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid or expired session",
          },
          { status: 401 }
        );
      }

      const { session, client } = sessionResult[0];

      // Update last activity timestamp
      await db
        .update(clientPortalSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(clientPortalSessions.id, session.id));

      // Build session data
      const portalSession: PortalSessionData = {
        sessionId: session.id,
        clientId: session.clientId,
        firmId: session.firmId,
        client,
      };

      // Pass session to handler
      return handler(request, {
        ...context,
        portalSession,
      });
    } catch (error) {
      console.error("Portal authentication error:", error);
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
 * Helper function to verify client has access to a specific matter
 *
 * @param clientId - Client ID from session
 * @param matterId - Matter ID being accessed
 * @returns true if client owns the matter, false otherwise
 */
export async function verifyClientMatterAccess(
  clientId: string,
  matterId: string
): Promise<boolean> {
  const { matters } = await import("@/lib/db/schema");

  const result = await db
    .select({ id: matters.id })
    .from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.clientId, clientId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Helper function to verify client has access to a specific invoice
 *
 * @param clientId - Client ID from session
 * @param invoiceId - Invoice ID being accessed
 * @returns true if client owns the invoice, false otherwise
 */
export async function verifyClientInvoiceAccess(
  clientId: string,
  invoiceId: string
): Promise<boolean> {
  const { invoices } = await import("@/lib/db/schema");

  const result = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.clientId, clientId)))
    .limit(1);

  return result.length > 0;
}
