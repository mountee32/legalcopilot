import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

/**
 * Type definition for route handlers
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   * @default 10
   */
  max?: number;

  /**
   * Time window in seconds
   * @default 60
   */
  windowSeconds?: number;

  /**
   * Custom function to generate rate limit key
   * By default uses IP address
   */
  keyGenerator?: (request: NextRequest) => string;

  /**
   * Custom message when rate limit is exceeded
   */
  message?: string;

  /**
   * Whether to include rate limit headers in the response
   * @default true
   */
  includeHeaders?: boolean;

  /**
   * Skip rate limiting based on condition
   */
  skip?: (request: NextRequest) => boolean | Promise<boolean>;
}

/**
 * Rate limiting middleware using Redis
 *
 * Implements a sliding window rate limiter using Redis.
 * Tracks requests by IP address (or custom key) and returns 429 Too Many Requests
 * when the limit is exceeded.
 *
 * Features:
 * - Sliding window algorithm
 * - Configurable limits and time windows
 * - Custom key generation (e.g., by user ID, API key)
 * - Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
 * - Skip conditions for special cases
 *
 * @param handler - The route handler to wrap
 * @param options - Rate limit configuration
 * @returns A wrapped handler with rate limiting
 *
 * @example Basic usage (10 requests per minute)
 * ```typescript
 * import { withRateLimit } from "@/middleware/withRateLimit";
 *
 * export const GET = withRateLimit(async (request) => {
 *   return NextResponse.json({ data: "example" });
 * });
 * ```
 *
 * @example Custom limits
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ success: true });
 *   },
 *   { max: 5, windowSeconds: 60 } // 5 requests per minute
 * );
 * ```
 *
 * @example User-based rate limiting
 * ```typescript
 * export const GET = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ data: "example" });
 *   },
 *   {
 *     keyGenerator: (request) => {
 *       const userId = request.headers.get("X-User-ID");
 *       return userId || getIP(request);
 *     }
 *   }
 * );
 * ```
 */
export function withRateLimit(handler: RouteHandler, options: RateLimitOptions = {}): RouteHandler {
  const {
    max = 10,
    windowSeconds = 60,
    keyGenerator = getIP,
    message = "Too many requests, please try again later",
    includeHeaders = true,
    skip,
  } = options;

  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      // Check if rate limiting should be skipped
      if (skip && (await skip(request))) {
        return handler(request, context);
      }

      // Generate rate limit key
      const identifier = keyGenerator(request);
      const key = `ratelimit:${identifier}`;

      // Current timestamp in seconds
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - windowSeconds;

      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiration
      pipeline.expire(key, windowSeconds);

      // Execute pipeline
      const results = await pipeline.exec();

      if (!results) {
        throw new Error("Redis pipeline failed");
      }

      // Get count before adding current request (index 1 in results)
      const count = (results[1][1] as number) || 0;

      // Calculate remaining requests
      const remaining = Math.max(0, max - count - 1);

      // Calculate reset time
      const resetTime = now + windowSeconds;

      // Check if rate limit exceeded
      if (count >= max) {
        const response = NextResponse.json(
          {
            error: "Too Many Requests",
            message,
            retryAfter: windowSeconds,
          },
          { status: 429 }
        );

        if (includeHeaders) {
          response.headers.set("X-RateLimit-Limit", max.toString());
          response.headers.set("X-RateLimit-Remaining", "0");
          response.headers.set("X-RateLimit-Reset", resetTime.toString());
          response.headers.set("Retry-After", windowSeconds.toString());
        }

        return response;
      }

      // Execute handler
      const response = await handler(request, context);

      // Add rate limit headers to successful response
      if (includeHeaders) {
        const headers = new Headers(response.headers);
        headers.set("X-RateLimit-Limit", max.toString());
        headers.set("X-RateLimit-Remaining", remaining.toString());
        headers.set("X-RateLimit-Reset", resetTime.toString());

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
    } catch (error) {
      // If Redis fails, log error and proceed without rate limiting
      console.error("Rate limiting error:", error);
      return handler(request, context);
    }
  };
}

/**
 * Strict rate limiter - fails closed if Redis is unavailable
 *
 * @param handler - The route handler to wrap
 * @param options - Rate limit configuration
 * @returns A wrapped handler with strict rate limiting
 *
 * @example
 * ```typescript
 * import { withStrictRateLimit } from "@/middleware/withRateLimit";
 *
 * export const POST = withStrictRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ success: true });
 *   },
 *   { max: 3, windowSeconds: 60 }
 * );
 * ```
 */
export function withStrictRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions = {}
): RouteHandler {
  const { message = "Rate limiting service unavailable" } = options;

  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      // Call the regular rate limiter
      return await withRateLimit(handler, options)(request, context);
    } catch (error) {
      // If rate limiting fails, return 503 instead of proceeding
      console.error("Strict rate limiting error:", error);
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message,
        },
        { status: 503 }
      );
    }
  };
}

/**
 * Get IP address from request
 * Checks common headers for proxy/CDN forwarded IPs
 */
function getIP(request: NextRequest): string {
  // Check common headers for real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  // Fallback to a default value
  return "unknown";
}

/**
 * Create a rate limiter with preset configurations
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes
   */
  auth: { max: 5, windowSeconds: 900 },

  /**
   * Standard rate limit for API endpoints
   * 100 requests per minute
   */
  api: { max: 100, windowSeconds: 60 },

  /**
   * Generous rate limit for read-only operations
   * 1000 requests per hour
   */
  readOnly: { max: 1000, windowSeconds: 3600 },

  /**
   * Strict rate limit for expensive operations
   * 10 requests per hour
   */
  expensive: { max: 10, windowSeconds: 3600 },

  /**
   * Very strict rate limit for public endpoints
   * 3 requests per minute
   */
  public: { max: 3, windowSeconds: 60 },
} as const;

/**
 * Helper to get rate limit info without incrementing counter
 *
 * @param request - The incoming request
 * @param options - Rate limit options
 * @returns Current rate limit status
 *
 * @example
 * ```typescript
 * const status = await getRateLimitStatus(request, { max: 10, windowSeconds: 60 });
 * console.log(`Remaining: ${status.remaining}`);
 * ```
 */
export async function getRateLimitStatus(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
  exceeded: boolean;
}> {
  const { max = 10, windowSeconds = 60, keyGenerator = getIP } = options;

  const identifier = keyGenerator(request);
  const key = `ratelimit:${identifier}`;

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    // Count requests in current window
    const count = await redis.zcount(key, windowStart, now);
    const remaining = Math.max(0, max - count);
    const reset = now + windowSeconds;

    return {
      limit: max,
      remaining,
      reset,
      exceeded: count >= max,
    };
  } catch (error) {
    console.error("Error checking rate limit status:", error);
    return {
      limit: max,
      remaining: max,
      reset: now + windowSeconds,
      exceeded: false,
    };
  }
}
