import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Type definition for route handlers
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

/**
 * Configuration options for the logging middleware
 */
export interface LoggingOptions {
  /**
   * Whether to log request body (be careful with sensitive data)
   * @default false
   */
  logBody?: boolean;

  /**
   * Whether to log response body (can be verbose)
   * @default false
   */
  logResponse?: boolean;

  /**
   * Custom logger function
   * @default console.log
   */
  logger?: (message: string, data: Record<string, unknown>) => void;

  /**
   * Whether to use JSON format for logs
   * @default true
   */
  jsonFormat?: boolean;
}

/**
 * Request logging middleware for API routes
 *
 * Logs incoming requests and outgoing responses with structured data including:
 * - Request ID for tracing
 * - Method and URL
 * - Response status
 * - Duration in milliseconds
 * - Timestamp
 *
 * @param handler - The route handler to wrap
 * @param options - Configuration options for logging
 * @returns A wrapped handler with logging capabilities
 *
 * @example
 * ```typescript
 * import { withLogging } from "@/middleware/withLogging";
 *
 * export const GET = withLogging(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: "example" });
 * });
 * ```
 *
 * @example With custom options
 * ```typescript
 * export const POST = withLogging(
 *   async (request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { logBody: true, logResponse: true }
 * );
 * ```
 */
export function withLogging(handler: RouteHandler, options: LoggingOptions = {}): RouteHandler {
  const { logBody = false, logResponse = false, logger = console.log, jsonFormat = true } = options;

  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    // Generate unique request ID for tracing
    const requestId = randomUUID();
    const startTime = Date.now();

    // Extract request information
    const method = request.method;
    const url = request.url;
    const timestamp = new Date().toISOString();

    // Build log data
    const requestLog: Record<string, unknown> = {
      requestId,
      timestamp,
      method,
      url,
      headers: Object.fromEntries(request.headers.entries()),
    };

    // Optionally log request body
    if (logBody && (method === "POST" || method === "PUT" || method === "PATCH")) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        requestLog.body = body;
      } catch (error) {
        requestLog.body = "[Unable to parse body]";
      }
    }

    // Log incoming request
    if (jsonFormat) {
      logger("Incoming request", requestLog);
    } else {
      logger(`[${timestamp}] ${method} ${url} - Request ID: ${requestId}`, {});
    }

    try {
      // Execute the handler
      const response = await handler(request, context);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Build response log data
      const responseLog: Record<string, unknown> = {
        requestId,
        timestamp: new Date().toISOString(),
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
      };

      // Optionally log response body
      if (logResponse && response.body) {
        try {
          const clonedResponse = response.clone();
          const responseBody = await clonedResponse.json();
          responseLog.body = responseBody;
        } catch (error) {
          responseLog.body = "[Unable to parse response body]";
        }
      }

      // Log response
      if (jsonFormat) {
        logger("Outgoing response", responseLog);
      } else {
        logger(
          `[${responseLog.timestamp}] ${method} ${url} - ${response.status} - ${duration}ms`,
          {}
        );
      }

      // Add request ID to response headers for tracing
      const headers = new Headers(response.headers);
      headers.set("X-Request-ID", requestId);

      // Return response with additional headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // Log errors
      const duration = Date.now() - startTime;
      const errorLog = {
        requestId,
        timestamp: new Date().toISOString(),
        method,
        url,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      };

      if (jsonFormat) {
        logger("Request error", errorLog);
      } else {
        logger(`[${errorLog.timestamp}] ERROR ${method} ${url} - ${errorLog.error}`, {});
      }

      // Re-throw the error to be handled by error middleware
      throw error;
    }
  };
}

/**
 * Simple request logger that only logs method and URL
 *
 * @param handler - The route handler to wrap
 * @returns A wrapped handler with basic logging
 *
 * @example
 * ```typescript
 * import { withSimpleLogging } from "@/middleware/withLogging";
 *
 * export const GET = withSimpleLogging(async (request) => {
 *   return NextResponse.json({ data: "example" });
 * });
 * ```
 */
export function withSimpleLogging(handler: RouteHandler): RouteHandler {
  return withLogging(handler, {
    logBody: false,
    logResponse: false,
    jsonFormat: false,
  });
}
