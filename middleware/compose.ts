import { NextRequest } from "next/server";

/**
 * Type definition for route handlers
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

/**
 * Type definition for middleware functions
 * A middleware takes a handler and returns a wrapped handler
 */
export type Middleware = (handler: RouteHandler) => RouteHandler;

/**
 * Compose multiple middleware functions into a single middleware
 *
 * Middleware are executed in the order they are provided (left to right).
 * Each middleware wraps the next one, so the first middleware is the outermost
 * and executes first.
 *
 * If any middleware throws an error or returns an error response, the chain
 * is short-circuited and subsequent middleware are not executed.
 *
 * @param middlewares - Array of middleware functions to compose
 * @returns A single composed middleware function
 *
 * @example
 * ```typescript
 * import { compose } from "@/middleware/compose";
 * import { withAuth } from "@/middleware/withAuth";
 * import { withLogging } from "@/middleware/withLogging";
 * import { withErrorHandler } from "@/middleware/withErrorHandler";
 *
 * // Compose multiple middleware
 * const middleware = compose(
 *   withErrorHandler,
 *   withLogging,
 *   withAuth
 * );
 *
 * export const GET = middleware(async (request, { user }) => {
 *   return NextResponse.json({ message: `Hello ${user.user.name}` });
 * });
 * ```
 *
 * @example Order matters
 * ```typescript
 * // Error handler should be first to catch all errors
 * // Logging should be second to log all requests
 * // Auth should be last to check authentication
 * const middleware = compose(
 *   withErrorHandler,      // Wraps everything
 *   withLogging,           // Wraps auth and handler
 *   withAuth               // Wraps only the handler
 * );
 * ```
 */
export function compose(...middlewares: Middleware[]): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    // Start with the original handler
    let composedHandler = handler;

    // Apply middleware in reverse order (right to left)
    // This ensures the first middleware in the array is the outermost
    for (let i = middlewares.length - 1; i >= 0; i--) {
      composedHandler = middlewares[i](composedHandler);
    }

    return composedHandler;
  };
}

/**
 * Pipe middleware functions (alias for compose with better semantics)
 *
 * Functionally identical to compose, but may be more intuitive for some use cases.
 * Middleware are applied in order, like a Unix pipe.
 *
 * @param middlewares - Array of middleware functions to pipe
 * @returns A single composed middleware function
 *
 * @example
 * ```typescript
 * import { pipe } from "@/middleware/compose";
 *
 * const middleware = pipe(
 *   withErrorHandler,
 *   withLogging,
 *   withRateLimit({ max: 10 }),
 *   withAuth
 * );
 * ```
 */
export const pipe = compose;

/**
 * Create a reusable middleware stack
 *
 * Useful for defining common middleware combinations that you use across
 * multiple routes.
 *
 * @param middlewares - Array of middleware functions
 * @returns A function that can be used as middleware
 *
 * @example
 * ```typescript
 * import { createStack } from "@/middleware/compose";
 *
 * // Define a reusable stack for protected API routes
 * const protectedRoute = createStack(
 *   withErrorHandler,
 *   withLogging,
 *   withRateLimit({ max: 100 }),
 *   withAuth
 * );
 *
 * // Use it in multiple routes
 * export const GET = protectedRoute(async (request, { user }) => {
 *   return NextResponse.json({ data: "protected" });
 * });
 *
 * export const POST = protectedRoute(async (request, { user }) => {
 *   return NextResponse.json({ data: "also protected" });
 * });
 * ```
 */
export function createStack(...middlewares: Middleware[]): Middleware {
  return compose(...middlewares);
}

/**
 * Conditional middleware executor
 *
 * Only applies middleware if condition is true.
 *
 * @param condition - Function that returns true to apply middleware
 * @param middleware - Middleware to apply conditionally
 * @returns A middleware that may or may not execute
 *
 * @example
 * ```typescript
 * import { when } from "@/middleware/compose";
 *
 * const middleware = compose(
 *   withErrorHandler,
 *   when(
 *     (req) => req.headers.get("X-API-Version") === "v2",
 *     withRateLimit({ max: 50 })
 *   ),
 *   withAuth
 * );
 * ```
 */
export function when(
  condition: (request: NextRequest) => boolean | Promise<boolean>,
  middleware: Middleware
): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
      const shouldApply = await condition(request);

      if (shouldApply) {
        // Apply middleware
        return middleware(handler)(request, context);
      } else {
        // Skip middleware
        return handler(request, context);
      }
    };
  };
}

/**
 * Skip middleware based on condition (opposite of when)
 *
 * @param condition - Function that returns true to skip middleware
 * @param middleware - Middleware to skip conditionally
 * @returns A middleware that may or may not execute
 *
 * @example
 * ```typescript
 * import { unless } from "@/middleware/compose";
 *
 * const middleware = compose(
 *   withErrorHandler,
 *   unless(
 *     (req) => req.headers.get("X-Internal") === "true",
 *     withRateLimit({ max: 10 })
 *   )
 * );
 * ```
 */
export function unless(
  condition: (request: NextRequest) => boolean | Promise<boolean>,
  middleware: Middleware
): Middleware {
  return when(async (request) => !(await condition(request)), middleware);
}

/**
 * Apply different middleware based on HTTP method
 *
 * @param methodMap - Map of HTTP methods to middleware
 * @returns A middleware that applies different logic per method
 *
 * @example
 * ```typescript
 * import { byMethod } from "@/middleware/compose";
 *
 * const middleware = compose(
 *   withErrorHandler,
 *   byMethod({
 *     GET: withRateLimit({ max: 100 }),
 *     POST: compose(withRateLimit({ max: 10 }), withAuth),
 *     DELETE: withAuth,
 *   })
 * );
 * ```
 */
export function byMethod(methodMap: Record<string, Middleware>): Middleware {
  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
      const method = request.method;
      const middleware = methodMap[method];

      if (middleware) {
        return middleware(handler)(request, context);
      }

      // No middleware for this method, execute handler directly
      return handler(request, context);
    };
  };
}

/**
 * Sequence middleware - useful for middleware that need to run in specific order
 *
 * Unlike compose which nests middleware, sequence runs them one after another.
 * This is useful when you want each middleware to potentially modify the request
 * before the next one runs.
 *
 * @param middlewares - Array of middleware functions to run in sequence
 * @returns A single middleware function
 *
 * @example
 * ```typescript
 * import { sequence } from "@/middleware/compose";
 *
 * const middleware = sequence(
 *   addTimestamp,
 *   validateHeaders,
 *   enrichRequest
 * );
 * ```
 */
export function sequence(...middlewares: Middleware[]): Middleware {
  return compose(...middlewares);
}

/**
 * Helper to apply middleware only to specific routes
 *
 * @param pattern - URL pattern to match (can be string or RegExp)
 * @param middleware - Middleware to apply when pattern matches
 * @returns A middleware that applies conditionally based on URL
 *
 * @example
 * ```typescript
 * import { forRoute } from "@/middleware/compose";
 *
 * const middleware = compose(
 *   withErrorHandler,
 *   forRoute(/admin/, withAuth),
 *   forRoute("/api/public", withRateLimit({ max: 1000 }))
 * );
 * ```
 */
export function forRoute(pattern: string | RegExp, middleware: Middleware): Middleware {
  return when((request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (typeof pattern === "string") {
      return pathname.startsWith(pattern);
    }

    return pattern.test(pathname);
  }, middleware);
}

/**
 * Common middleware stacks for different use cases
 */
export const CommonStacks = {
  /**
   * Basic public API route
   * - Error handling
   * - Request logging
   * - Rate limiting (generous)
   */
  public:
    createStack(),
    // Add middleware here when imported

  /**
   * Protected API route
   * - Error handling
   * - Request logging
   * - Rate limiting
   * - Authentication required
   */
  protected:
    createStack(),
    // Add middleware here when imported

  /**
   * Admin API route
   * - Error handling
   * - Request logging
   * - Strict rate limiting
   * - Authentication required
   * - Admin role required (implement as needed)
   */
  admin:
    createStack(),
    // Add middleware here when imported

  /**
   * Webhook route
   * - Error handling
   * - Request logging
   * - Signature verification (implement as needed)
   */
  webhook:
    createStack(),
    // Add middleware here when imported
} as const;
