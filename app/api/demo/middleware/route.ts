import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/middleware/withLogging";
import { withErrorHandler, ValidationError, NotFoundError } from "@/middleware/withErrorHandler";
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";
import { compose, when, byMethod } from "@/middleware/compose";

/**
 * Example 1: Basic logging middleware
 *
 * Logs all incoming requests and outgoing responses
 */
export const GET = withLogging(async (request: NextRequest) => {
  return NextResponse.json({
    message: "This request was logged",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Example 2: Error handling middleware
 *
 * Catches errors and returns consistent error responses
 */
const errorHandlerExample = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const shouldError = searchParams.get("error");

  if (shouldError === "validation") {
    throw new ValidationError("Invalid input data", {
      field: "email",
      reason: "Must be a valid email address",
    });
  }

  if (shouldError === "notfound") {
    throw new NotFoundError("Resource not found");
  }

  if (shouldError === "generic") {
    throw new Error("Something went wrong!");
  }

  return NextResponse.json({
    message: "No errors occurred",
    examples: {
      validation: "?error=validation",
      notFound: "?error=notfound",
      generic: "?error=generic",
    },
  });
});

/**
 * Example 3: Rate limiting middleware
 *
 * Limits requests based on IP address
 */
const rateLimitHandler = async (request: NextRequest) => {
  return NextResponse.json({
    message: "Rate limited endpoint",
    info: "This endpoint allows 10 requests per minute",
  });
};

/**
 * Example 4: Composed middleware stack
 *
 * Combines multiple middleware in a specific order
 */
const composedHandler = async (request: NextRequest) => {
  return NextResponse.json({
    message: "This request went through the full middleware stack",
    middleware: ["withErrorHandler", "withLogging", "withRateLimit"],
  });
};

/**
 * Example 5: Conditional middleware
 *
 * Applies rate limiting only if a specific header is present
 */
const conditionalHandler = async (request: NextRequest) => {
  const rateLimited = request.headers.get("X-Rate-Limit") === "true";

  return NextResponse.json({
    message: "Conditional middleware example",
    rateLimited,
    info: rateLimited ? "Rate limiting is active (5 req/min)" : "Rate limiting is bypassed",
  });
};

/**
 * Example 6: Method-based middleware
 *
 * Applies different middleware based on HTTP method
 */
const methodBasedHandler = async (request: NextRequest) => {
  const method = request.method;

  const methodInfo: Record<string, string> = {
    GET: "Light rate limiting (100/min)",
    POST: "Strict rate limiting (10/min) + logging",
    DELETE: "Logging only",
  };

  return NextResponse.json({
    message: "Method-based middleware example",
    method,
    middleware: methodInfo[method] || "No special middleware",
  });
};

/**
 * Example 7: Advanced logging with custom options
 */
const advancedLoggingHandler = async (request: NextRequest) => {
  const body = await request.json();

  return NextResponse.json({
    message: "Processed request with advanced logging",
    received: body,
  });
};

/**
 * Main route - returns information about available examples
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "Middleware examples",
    examples: {
      logging: "GET /api/demo/middleware - Basic request logging",
      errorHandling: "Use withErrorHandler to catch and format errors",
      rateLimit: "Use withRateLimit to limit requests per time window",
      composed: "Use compose() to combine multiple middleware",
      conditional: "Use when() to apply middleware conditionally",
      methodBased: "Use byMethod() to apply different middleware per HTTP method",
    },
    usage: {
      testError: "GET /api/demo/middleware?error=validation",
      testRateLimit: "Make 11 requests within 1 minute to see rate limiting",
      testComposed: "Check response headers for X-Request-ID from logging middleware",
    },
  });
}
