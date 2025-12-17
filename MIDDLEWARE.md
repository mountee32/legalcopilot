# Middleware Patterns Guide

This guide provides detailed documentation on the middleware patterns available in this Next.js template.

## Table of Contents

- [Overview](#overview)
- [Available Middleware](#available-middleware)
- [Composition](#composition)
- [Examples](#examples)
- [Creating Custom Middleware](#creating-custom-middleware)
- [Best Practices](#best-practices)

## Overview

Middleware in this template are higher-order functions that wrap route handlers to add cross-cutting functionality like authentication, logging, error handling, and rate limiting.

### Key Concepts

1. **Route Handler**: A function that handles HTTP requests
2. **Middleware**: A function that wraps a route handler to add functionality
3. **Composition**: Combining multiple middleware into a single middleware

### Basic Structure

```typescript
type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

type Middleware = (handler: RouteHandler) => RouteHandler;
```

## Available Middleware

### 1. Authentication Middleware

**File**: `middleware/withAuth.ts`

Protects routes by requiring a valid Better Auth session.

#### Basic Usage

```typescript
import { withAuth } from "@/middleware/withAuth";

export const GET = withAuth(async (request, { user }) => {
  // user.user.id, user.user.email, user.user.name are available
  return NextResponse.json({ userId: user.user.id });
});
```

#### Optional Authentication

```typescript
import { withOptionalAuth } from "@/middleware/withAuth";

export const GET = withOptionalAuth(async (request, { user }) => {
  if (user) {
    return NextResponse.json({ message: `Hello ${user.user.name}` });
  }
  return NextResponse.json({ message: "Hello guest" });
});
```

#### Response

- **Success**: Proceeds to handler with user session
- **Failure**: Returns 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "You must be authenticated to access this resource"
}
```

### 2. Request Logging Middleware

**File**: `middleware/withLogging.ts`

Logs incoming requests and outgoing responses with structured data.

#### Basic Usage

```typescript
import { withLogging } from "@/middleware/withLogging";

export const GET = withLogging(async (request) => {
  return NextResponse.json({ data: "example" });
});
```

#### Advanced Configuration

```typescript
import { withLogging } from "@/middleware/withLogging";

export const POST = withLogging(
  async (request) => {
    const body = await request.json();
    return NextResponse.json({ received: body });
  },
  {
    logBody: true, // Log request body
    logResponse: true, // Log response body
    jsonFormat: true, // Use JSON format
    logger: customLogger, // Custom logger function
  }
);
```

#### Simple Logging

```typescript
import { withSimpleLogging } from "@/middleware/withLogging";

export const GET = withSimpleLogging(async (request) => {
  return NextResponse.json({ data: "example" });
});
```

#### Log Format

**JSON Format** (default):

```json
{
  "requestId": "uuid",
  "timestamp": "2025-11-10T...",
  "method": "GET",
  "url": "http://...",
  "status": 200,
  "duration": "45ms"
}
```

**Simple Format**:

```
[2025-11-10T...] GET /api/endpoint - 200 - 45ms
```

#### Response Headers

Adds `X-Request-ID` header to all responses for request tracing.

### 3. Error Handling Middleware

**File**: `middleware/withErrorHandler.ts`

Catches all errors and returns consistent error responses.

#### Basic Usage

```typescript
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(async (request) => {
  // Any error thrown here will be caught
  throw new Error("Something went wrong");
});
```

#### Custom Error Classes

```typescript
import {
  withErrorHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(async (request) => {
  const body = await request.json();

  if (!body.email) {
    throw new ValidationError("Email is required", {
      field: "email",
      reason: "Field is required",
    });
  }

  const user = await findUser(body.email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return NextResponse.json({ user });
});
```

#### Configuration Options

```typescript
export const GET = withErrorHandler(
  async (request) => {
    // Handler logic
  },
  {
    includeStack: true, // Include stack traces (dev only)
    sendToSentry: true, // Send errors to Sentry
    logToConsole: true, // Log to console
    customErrorHandler: (error, request) => {
      // Custom error processing
      return null; // Return null to use default handling
    },
  }
);
```

#### Error Response Format

```json
{
  "error": "Error Name",
  "message": "Error message",
  "requestId": "uuid",
  "timestamp": "2025-11-10T...",
  "details": { "field": "email", "reason": "..." },
  "stack": "Error stack (dev only)"
}
```

#### HTTP Status Codes

- `ValidationError` → 400 Bad Request
- `UnauthorizedError` → 401 Unauthorized
- `ForbiddenError` → 403 Forbidden
- `NotFoundError` → 404 Not Found
- Generic `Error` → 500 Internal Server Error

### 4. Rate Limiting Middleware

**File**: `middleware/withRateLimit.ts`

Limits requests using Redis-based sliding window algorithm.

#### Basic Usage

```typescript
import { withRateLimit } from "@/middleware/withRateLimit";

// Default: 10 requests per 60 seconds
export const GET = withRateLimit(async (request) => {
  return NextResponse.json({ data: "example" });
});
```

#### Custom Configuration

```typescript
import { withRateLimit } from "@/middleware/withRateLimit";

export const POST = withRateLimit(
  async (request) => {
    return NextResponse.json({ success: true });
  },
  {
    max: 5, // Max requests
    windowSeconds: 60, // Time window
    message: "Custom message", // Error message
    includeHeaders: true, // Add rate limit headers
    keyGenerator: (req) => {
      // Custom key
      return req.headers.get("X-User-ID") || "anonymous";
    },
    skip: (req) => {
      // Skip condition
      return req.headers.get("X-Internal") === "true";
    },
  }
);
```

#### Using Presets

```typescript
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";

// Auth endpoints: 5 requests per 15 minutes
export const POST = withRateLimit(handler, RateLimitPresets.auth);

// API endpoints: 100 requests per minute
export const GET = withRateLimit(handler, RateLimitPresets.api);

// Read-only: 1000 requests per hour
export const GET = withRateLimit(handler, RateLimitPresets.readOnly);

// Expensive operations: 10 requests per hour
export const POST = withRateLimit(handler, RateLimitPresets.expensive);

// Public endpoints: 3 requests per minute
export const GET = withRateLimit(handler, RateLimitPresets.public);
```

#### Strict Rate Limiting

Fails closed if Redis is unavailable:

```typescript
import { withStrictRateLimit } from "@/middleware/withRateLimit";

export const POST = withStrictRateLimit(handler, { max: 5, windowSeconds: 60 });
```

#### Response Headers

When rate limiting is active, the following headers are included:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds to wait (when limit exceeded)

#### Rate Limit Exceeded Response

```json
{
  "error": "Too Many Requests",
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

HTTP Status: 429 Too Many Requests

#### Check Rate Limit Status

```typescript
import { getRateLimitStatus } from "@/middleware/withRateLimit";

const status = await getRateLimitStatus(request, {
  max: 10,
  windowSeconds: 60,
});

console.log(status);
// {
//   limit: 10,
//   remaining: 7,
//   reset: 1699630000,
//   exceeded: false
// }
```

## Composition

**File**: `middleware/compose.ts`

Combine multiple middleware into a single middleware.

### Basic Composition

```typescript
import { compose } from "@/middleware/compose";
import { withAuth, withLogging, withErrorHandler } from "@/middleware";

const middleware = compose(
  withErrorHandler, // First: catches all errors
  withLogging, // Second: logs requests
  withAuth // Third: checks authentication
);

export const GET = middleware(async (request, { user }) => {
  return NextResponse.json({ data: "example" });
});
```

### Composition Helpers

#### `when()` - Conditional Middleware

Apply middleware only when condition is true:

```typescript
import { compose, when } from "@/middleware/compose";

const middleware = compose(
  withErrorHandler,
  when((req) => req.headers.get("X-API-Version") === "v2", withRateLimit({ max: 50 }))
);
```

#### `unless()` - Inverse Conditional

Skip middleware when condition is true:

```typescript
import { unless } from "@/middleware/compose";

const middleware = unless(
  (req) => req.headers.get("X-Internal") === "true",
  withRateLimit({ max: 10 })
);
```

#### `byMethod()` - Method-Specific Middleware

Apply different middleware based on HTTP method:

```typescript
import { byMethod } from "@/middleware/compose";

const middleware = byMethod({
  GET: withRateLimit({ max: 100 }),
  POST: compose(withRateLimit({ max: 10 }), withAuth),
  DELETE: withAuth,
});

export const GET = middleware(handler);
export const POST = middleware(handler);
export const DELETE = middleware(handler);
```

#### `forRoute()` - Route-Specific Middleware

Apply middleware only to specific routes:

```typescript
import { forRoute } from "@/middleware/compose";

const middleware = compose(
  withErrorHandler,
  forRoute(/\/admin\/.*/, withAuth),
  forRoute("/api/public", withRateLimit({ max: 1000 }))
);
```

### Reusable Stacks

Create reusable middleware stacks:

```typescript
import { createStack } from "@/middleware/compose";

// Define once
const protectedRoute = createStack(
  withErrorHandler,
  withLogging,
  withRateLimit({ max: 100 }),
  withAuth
);

// Use in multiple routes
export const GET = protectedRoute(async (request, { user }) => {
  return NextResponse.json({ data: "protected" });
});

export const POST = protectedRoute(async (request, { user }) => {
  return NextResponse.json({ data: "also protected" });
});
```

## Examples

### Example 1: Public API Endpoint

```typescript
import { compose, withErrorHandler, withLogging, withRateLimit } from "@/middleware";

const middleware = compose(
  withErrorHandler,
  withLogging,
  withRateLimit({ max: 100, windowSeconds: 60 })
);

export const GET = middleware(async (request) => {
  return NextResponse.json({ data: "public data" });
});
```

### Example 2: Protected API Endpoint

```typescript
import {
  compose,
  withErrorHandler,
  withLogging,
  withRateLimit,
  withAuth,
  RateLimitPresets,
} from "@/middleware";

const middleware = compose(
  withErrorHandler,
  withLogging,
  withRateLimit(RateLimitPresets.api),
  withAuth
);

export const GET = middleware(async (request, { user }) => {
  return NextResponse.json({
    message: `Hello ${user.user.name}`,
    data: "protected data",
  });
});
```

### Example 3: Admin Endpoint with Strict Limits

```typescript
import {
  compose,
  withErrorHandler,
  withLogging,
  withRateLimit,
  withAuth,
  RateLimitPresets,
  ForbiddenError,
} from "@/middleware";

const middleware = compose(
  withErrorHandler,
  withLogging,
  withRateLimit(RateLimitPresets.auth),
  withAuth
);

export const DELETE = middleware(async (request, { user }) => {
  // Check if user is admin
  if (user.user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  // Perform admin action
  return NextResponse.json({ success: true });
});
```

### Example 4: Different Limits per Method

```typescript
import { compose, withErrorHandler, byMethod, withRateLimit } from "@/middleware";

const middleware = compose(
  withErrorHandler,
  byMethod({
    GET: withRateLimit({ max: 100, windowSeconds: 60 }),
    POST: withRateLimit({ max: 10, windowSeconds: 60 }),
    DELETE: withRateLimit({ max: 5, windowSeconds: 60 }),
  })
);

export const GET = middleware(handler);
export const POST = middleware(handler);
export const DELETE = middleware(handler);
```

### Example 5: User-Based Rate Limiting

```typescript
import { compose, withErrorHandler, withRateLimit, withAuth } from "@/middleware";

const middleware = compose(
  withErrorHandler,
  withAuth,
  withRateLimit({
    max: 50,
    windowSeconds: 60,
    keyGenerator: (request) => {
      // Rate limit per user instead of per IP
      const userId = request.headers.get("X-User-ID");
      return `user:${userId}`;
    },
  })
);

export const POST = middleware(async (request, { user }) => {
  return NextResponse.json({ success: true });
});
```

## Creating Custom Middleware

### Basic Template

```typescript
import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

export function withCustomMiddleware(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    // 1. Pre-processing
    console.log("Before handler executes");

    // 2. Execute the handler
    const response = await handler(request, context);

    // 3. Post-processing
    console.log("After handler executes");

    // 4. Return response (potentially modified)
    return response;
  };
}
```

### Example: Add Custom Header

```typescript
export function withCustomHeader(headerName: string, headerValue: string) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const response = await handler(request, context);

      const headers = new Headers(response.headers);
      headers.set(headerName, headerValue);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  };
}

// Usage
export const GET = withCustomHeader(
  "X-Powered-By",
  "My API"
)(async (request) => {
  return NextResponse.json({ data: "example" });
});
```

### Example: Request Timing

```typescript
export function withTiming(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const start = Date.now();

    const response = await handler(request, context);

    const duration = Date.now() - start;
    const headers = new Headers(response.headers);
    headers.set("X-Response-Time", `${duration}ms`);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
```

### Example: Request Validation

```typescript
import { z } from "zod";

export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (request: NextRequest, body: T) => Promise<Response>): RouteHandler => {
    return async (request, context) => {
      try {
        const body = await request.json();
        const validated = schema.parse(body);
        return handler(request, validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: "Validation Error",
              issues: error.issues,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    };
  };
}

// Usage
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export const POST = withValidation(schema)(async (request, body) => {
  // body is typed and validated
  return NextResponse.json({ received: body });
});
```

## Best Practices

### 1. Middleware Order

Always apply middleware in the correct order:

```typescript
const middleware = compose(
  withErrorHandler, // 1st: Catches all errors
  withLogging, // 2nd: Logs all requests
  withRateLimit, // 3rd: Checks rate limits
  withAuth // 4th: Checks authentication
);
```

**Why this order?**

- Error handler must be outermost to catch errors from all other middleware
- Logging should capture all requests including rate-limited and auth-failed ones
- Rate limiting before auth prevents auth overhead on rate-limited requests
- Auth is innermost as it only runs if other checks pass

### 2. Reuse Middleware Stacks

Create reusable stacks for common patterns:

```typescript
// Define common stacks
const publicRoute = createStack(withErrorHandler, withLogging, withRateLimit({ max: 100 }));

const protectedRoute = createStack(
  withErrorHandler,
  withLogging,
  withRateLimit({ max: 50 }),
  withAuth
);

// Use throughout your app
export const GET = publicRoute(handler);
export const POST = protectedRoute(handler);
```

### 3. Environment-Specific Configuration

Adjust middleware behavior based on environment:

```typescript
const middleware = compose(
  withErrorHandler({
    includeStack: process.env.NODE_ENV === "development",
    sendToSentry: process.env.NODE_ENV === "production",
  }),
  withLogging({
    logBody: process.env.NODE_ENV === "development",
    jsonFormat: process.env.NODE_ENV === "production",
  })
);
```

### 4. Fail Gracefully

Handle middleware failures gracefully:

```typescript
// Rate limiting that proceeds on Redis failure
export const GET = withRateLimit(handler, { max: 10 });

// Strict rate limiting that fails on Redis failure
export const POST = withStrictRateLimit(handler, { max: 10 });
```

### 5. Custom Key Generation

Use custom keys for rate limiting based on your needs:

```typescript
// By IP (default)
withRateLimit(handler);

// By user ID
withRateLimit(handler, {
  keyGenerator: (req) => req.headers.get("X-User-ID") || "anonymous",
});

// By API key
withRateLimit(handler, {
  keyGenerator: (req) => req.headers.get("X-API-Key") || "no-key",
});

// By tenant
withRateLimit(handler, {
  keyGenerator: (req) => {
    const tenant = req.headers.get("X-Tenant-ID");
    return `tenant:${tenant}`;
  },
});
```

### 6. Type Safety

Leverage TypeScript for type-safe middleware:

```typescript
// Middleware that adds typed context
type UserContext = {
  user: { id: string; email: string };
};

export function withAuth(
  handler: (request: NextRequest, context: UserContext) => Promise<Response>
): RouteHandler {
  return async (request) => {
    const user = await getUser(request);
    return handler(request, { user });
  };
}

// Handler has typed user context
export const GET = withAuth(async (request, { user }) => {
  // user.id and user.email are typed
  return NextResponse.json({ userId: user.id });
});
```

### 7. Testing

Test middleware independently:

```typescript
import { describe, it, expect, vi } from "vitest";
import { withAuth } from "@/middleware/withAuth";

describe("withAuth", () => {
  it("should return 401 if not authenticated", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const request = new NextRequest("http://localhost/api/test");
    const response = await wrapped(request);

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
```

### 8. Documentation

Document your middleware with JSDoc comments:

````typescript
/**
 * Custom middleware description
 *
 * @param handler - The route handler to wrap
 * @param options - Configuration options
 * @returns A wrapped handler
 *
 * @example
 * ```typescript
 * export const GET = withCustom(handler, { option: true });
 * ```
 */
export function withCustom(handler: RouteHandler, options: Options): RouteHandler {
  // Implementation
}
````

## Performance Considerations

### 1. Minimize Middleware Overhead

- Keep middleware logic simple and fast
- Avoid expensive operations in middleware
- Use caching where appropriate

### 2. Redis Connection Pooling

Rate limiting uses Redis connection pooling automatically. Ensure your Redis client is configured properly:

```typescript
// lib/redis.ts
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});
```

### 3. Async Operations

Middleware can perform async operations efficiently:

```typescript
export function withAsync(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    // These run in parallel
    const [result1, result2] = await Promise.all([asyncOperation1(), asyncOperation2()]);

    return handler(request, context);
  };
}
```

## Troubleshooting

### Issue: Rate Limiting Not Working

**Possible causes:**

- Redis is not running
- Redis connection URL is incorrect
- Rate limit key is changing between requests

**Solution:**

```bash
# Check Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping

# Check rate limit keys
docker compose exec redis redis-cli KEYS "ratelimit:*"
```

### Issue: Authentication Always Fails

**Possible causes:**

- Session cookie not being sent
- Better Auth not configured correctly
- Session expired

**Solution:**

```typescript
// Check session in handler
const session = await auth.api.getSession({ headers: request.headers });
console.log("Session:", session);
```

### Issue: Errors Not Being Caught

**Possible causes:**

- Error handler not first in middleware chain
- Async errors not being awaited

**Solution:**

```typescript
// Ensure error handler is first
const middleware = compose(
  withErrorHandler, // Must be first
  withLogging,
  withAuth
);
```

## Additional Resources

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Redis Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiter/)
- [Sentry Error Tracking](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review the example routes in `app/api/demo/`
