import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Type definition for route handlers
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> | Promise<Record<string, string>> }
) => Promise<Response> | Response;

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  requestId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Configuration options for error handling middleware
 */
export interface ErrorHandlerOptions {
  /**
   * Whether to include stack traces in error responses
   * Should be false in production
   * @default process.env.NODE_ENV === 'development'
   */
  includeStack?: boolean;

  /**
   * Whether to send errors to Sentry
   * @default true
   */
  sendToSentry?: boolean;

  /**
   * Custom error handler function
   */
  customErrorHandler?: (error: Error, request: NextRequest) => ErrorResponse | null;

  /**
   * Whether to log errors to console
   * @default true
   */
  logToConsole?: boolean;
}

/**
 * Error handling middleware for API routes
 *
 * Catches all errors thrown in route handlers and returns consistent error responses.
 * Features:
 * - Consistent error response format
 * - Automatic Sentry error reporting
 * - Stack trace hiding in production
 * - Request ID tracking
 *
 * @param handler - The route handler to wrap
 * @param options - Configuration options
 * @returns A wrapped handler with error handling
 *
 * @example
 * ```typescript
 * import { withErrorHandler } from "@/middleware/withErrorHandler";
 *
 * export const GET = withErrorHandler(async (request) => {
 *   // If this throws an error, it will be caught and formatted
 *   const data = await riskyOperation();
 *   return NextResponse.json({ data });
 * });
 * ```
 *
 * @example With custom options
 * ```typescript
 * export const POST = withErrorHandler(
 *   async (request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   {
 *     includeStack: true,
 *     sendToSentry: false,
 *   }
 * );
 * ```
 */
export function withErrorHandler(
  handler: RouteHandler,
  options: ErrorHandlerOptions = {}
): RouteHandler {
  const {
    includeStack = process.env.NODE_ENV === "development",
    sendToSentry = true,
    customErrorHandler,
    logToConsole = true,
  } = options;

  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> | Promise<Record<string, string>> }
  ) => {
    try {
      // Execute the handler
      return await handler(request, context);
    } catch (error) {
      // Extract request ID from headers if available
      const requestId = request.headers.get("X-Request-ID") || undefined;

      // Build base error response
      let errorResponse: ErrorResponse = {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        requestId,
        timestamp: new Date().toISOString(),
      };

      // Determine error type and build appropriate response
      if (error instanceof Error) {
        // Known error types
        errorResponse.message = error.message;

        if (error.name === "ZodError") {
          errorResponse.error = "Validation Error";
          errorResponse.details = { issues: (error as any).issues ?? (error as any).errors };
        }

        if (includeStack) {
          errorResponse.stack = error.stack;
        }

        // Check for specific error types
        if (error.name === "ValidationError" || error.name === "ZodError") {
          errorResponse.error = "Validation Error";
        } else if (error.name === "UnauthorizedError") {
          errorResponse.error = "Unauthorized";
        } else if (error.name === "NotFoundError") {
          errorResponse.error = "Not Found";
        } else if (error.name === "ForbiddenError") {
          errorResponse.error = "Forbidden";
        }

        // Add error details if available
        if ("details" in error && typeof error.details === "object") {
          errorResponse.details = error.details as Record<string, unknown>;
        }
      } else {
        // Unknown error type
        errorResponse.message = String(error);
      }

      // Use custom error handler if provided
      if (customErrorHandler && error instanceof Error) {
        const customResponse = customErrorHandler(error, request);
        if (customResponse) {
          errorResponse = customResponse;
        }
      }

      // Log to console in development or if explicitly enabled
      if (logToConsole) {
        console.error("API Error:", {
          requestId,
          url: request.url,
          method: request.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }

      // Send to Sentry if enabled and DSN is configured
      if (sendToSentry && process.env.SENTRY_DSN) {
        try {
          Sentry.captureException(error, {
            contexts: {
              request: {
                url: request.url,
                method: request.method,
                headers: Object.fromEntries(request.headers.entries()),
              },
            },
            tags: {
              requestId,
            },
          });
        } catch (sentryError) {
          // Silently fail if Sentry is not configured
          console.error("Failed to send error to Sentry:", sentryError);
        }
      }

      // Determine HTTP status code
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.name === "ZodError") statusCode = 400;
        if (error.name === "ValidationError") statusCode = 400;
        if (error.name === "UnauthorizedError") statusCode = 401;
        if (error.name === "ForbiddenError") statusCode = 403;
        if (error.name === "NotFoundError") statusCode = 404;
        if ("statusCode" in error && typeof error.statusCode === "number") {
          statusCode = error.statusCode;
        }
      }

      // Return formatted error response
      return NextResponse.json(errorResponse, { status: statusCode });
    }
  };
}

/**
 * Custom error classes for common HTTP errors
 */

export class ValidationError extends Error {
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Helper function to create standardized error responses
 *
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 * @returns NextResponse with error
 *
 * @example
 * ```typescript
 * if (!user) {
 *   return createErrorResponse("User not found", 404);
 * }
 * ```
 */
export function createErrorResponse(
  message: string,
  statusCode = 500,
  details?: Record<string, unknown>
): NextResponse {
  const errorResponse: ErrorResponse = {
    error: getErrorNameFromStatusCode(statusCode),
    message,
    timestamp: new Date().toISOString(),
    details,
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Helper to get error name from status code
 */
function getErrorNameFromStatusCode(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };

  return errorNames[statusCode] || "Error";
}
