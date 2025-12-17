/**
 * Middleware Patterns for Next.js 15 App Router
 *
 * This module provides reusable middleware patterns for API routes including:
 * - Authentication protection
 * - Request logging
 * - Error handling
 * - Rate limiting
 * - Middleware composition
 */

// Authentication middleware
export {
  withAuth,
  withOptionalAuth,
  type RouteHandler as AuthRouteHandler,
  type AuthenticatedRouteHandler,
} from "./withAuth";

// Logging middleware
export {
  withLogging,
  withSimpleLogging,
  type RouteHandler as LoggingRouteHandler,
  type LoggingOptions,
} from "./withLogging";

// Error handling middleware
export {
  withErrorHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  createErrorResponse,
  type RouteHandler as ErrorRouteHandler,
  type ErrorHandlerOptions,
  type ErrorResponse,
} from "./withErrorHandler";

// Rate limiting middleware
export {
  withRateLimit,
  withStrictRateLimit,
  getRateLimitStatus,
  RateLimitPresets,
  type RouteHandler as RateLimitRouteHandler,
  type RateLimitOptions,
} from "./withRateLimit";

// Composition helpers
export {
  compose,
  pipe,
  createStack,
  when,
  unless,
  byMethod,
  sequence,
  forRoute,
  CommonStacks,
  type Middleware,
  type RouteHandler as ComposeRouteHandler,
} from "./compose";
