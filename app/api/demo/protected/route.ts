import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/withAuth";
import { withLogging } from "@/middleware/withLogging";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";

/**
 * Example: Simple protected route with authentication
 *
 * This route demonstrates:
 * - Authentication protection using withAuth
 * - Access to user session data
 */
export const GET = withAuth(async (request, { user }) => {
  return NextResponse.json({
    message: "This is a protected route",
    user: {
      id: user.user.id,
      email: user.user.email,
      name: user.user.name,
    },
  });
});

/**
 * Example: Protected route with full middleware stack
 *
 * This route demonstrates:
 * - Error handling (catches all errors)
 * - Request logging (logs request and response)
 * - Rate limiting (5 requests per 15 minutes for auth endpoints)
 * - Authentication (requires valid session)
 *
 * Middleware are applied in order:
 * 1. Error handler (outermost - catches everything)
 * 2. Logging (logs all requests/responses)
 * 3. Rate limiting (checks request limits)
 * 4. Authentication (checks user session)
 */
export const POST = withErrorHandler(
  withLogging(
    withRateLimit(
      withAuth(async (request, { user }) => {
        const body = await request.json();

        return NextResponse.json({
          message: "Data processed successfully",
          data: body,
          user: {
            id: user.user.id,
            email: user.user.email,
          },
          timestamp: new Date().toISOString(),
        });
      }),
      RateLimitPresets.auth
    )
  )
);

/**
 * Example: Protected DELETE with custom rate limit
 *
 * This route demonstrates:
 * - Custom rate limiting configuration
 * - DELETE operation protection
 */
export const DELETE = withErrorHandler(
  withRateLimit(
    withAuth(async (request, { user }) => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "ID parameter is required",
          },
          { status: 400 }
        );
      }

      // Simulate deletion
      return NextResponse.json({
        message: "Resource deleted successfully",
        id,
        deletedBy: user.user.id,
        timestamp: new Date().toISOString(),
      });
    }),
    { max: 3, windowSeconds: 60 }
  )
);
