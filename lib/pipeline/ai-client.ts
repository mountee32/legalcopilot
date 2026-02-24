/**
 * Centralized AI Client for Pipeline Workers
 *
 * Provides timeout enforcement, retry with backoff for transient errors,
 * concurrency-based rate limiting, and graceful degradation.
 */

// ---------------------------------------------------------------------------
// Rate limiter — simple semaphore to limit concurrent AI calls
// ---------------------------------------------------------------------------

const MAX_CONCURRENT_AI_CALLS = parseInt(process.env.PIPELINE_MAX_CONCURRENT_AI || "5");
let activeCallCount = 0;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeCallCount < MAX_CONCURRENT_AI_CALLS) {
    activeCallCount++;
    return;
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activeCallCount++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeCallCount--;
  const next = waitQueue.shift();
  if (next) next();
}

/** Visible for testing. */
export function getAiClientStats() {
  return { activeCallCount, queueLength: waitQueue.length };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiCallOptions {
  model: string;
  messages: Array<{ role: string; content: string | unknown[] }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
  /** Timeout in ms. Defaults to AI_CALL_TIMEOUT_MS env or 300_000 (5 min). */
  timeoutMs?: number;
  /** Max retries for transient errors (429, 500, 502, 503). Default 2. */
  maxRetries?: number;
  /** Base delay between retries in ms. Default 1000. */
  retryDelayMs?: number;
}

export interface AiCallResult {
  content: string;
  tokensUsed: number;
  model: string;
  /** Whether the result came from a retry attempt. */
  wasRetried: boolean;
}

// ---------------------------------------------------------------------------
// Transient error detection
// ---------------------------------------------------------------------------

const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function isTransientError(status: number): boolean {
  return TRANSIENT_STATUS_CODES.has(status);
}

// ---------------------------------------------------------------------------
// Main AI call function
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_CALL_TIMEOUT_MS || "300000");

/**
 * Make an AI API call with timeout, rate limiting, and retry.
 *
 * Throws on permanent failures. Returns result on success.
 * For transient failures, retries up to maxRetries times with exponential backoff.
 */
export async function callAi(options: AiCallOptions): Promise<AiCallResult> {
  const {
    model,
    messages,
    temperature = 0.1,
    maxTokens = 4096,
    responseFormat,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = 2,
    retryDelayMs = 1000,
  } = options;

  const baseUrl =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AiClientError("OPENROUTER_API_KEY not configured", "config_error");
  }

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= maxRetries) {
    // Rate limit: wait for available slot
    await acquireSlot();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const body: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };
      if (responseFormat) body.response_format = responseFormat;

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (isTransientError(response.status) && attempts < maxRetries) {
          // Transient — retry with backoff
          const delay = retryDelayMs * Math.pow(2, attempts);
          const retryAfter = response.headers.get("retry-after");
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          await sleep(Math.min(waitMs, 30_000));
          attempts++;
          lastError = new AiClientError(
            `AI API returned ${response.status}`,
            "transient_error",
            response.status
          );
          continue;
        }
        throw new AiClientError(
          `AI API returned ${response.status}: ${await response.text().catch(() => "unknown")}`,
          response.status === 429 ? "rate_limited" : "api_error",
          response.status
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || "";
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        model: data.model || model,
        wasRetried: attempts > 0,
      };
    } catch (err) {
      if (err instanceof AiClientError) throw err;

      // AbortController timeout
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AiClientError(`AI call timed out after ${timeoutMs}ms`, "timeout", undefined);
      }

      // Network error — may be transient
      if (attempts < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, attempts);
        await sleep(delay);
        attempts++;
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }

      throw new AiClientError(
        `AI call failed: ${err instanceof Error ? err.message : String(err)}`,
        "network_error"
      );
    } finally {
      releaseSlot();
    }
  }

  // Exhausted retries
  throw new AiClientError(
    `AI call failed after ${maxRetries + 1} attempts: ${lastError?.message || "unknown"}`,
    "retries_exhausted"
  );
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export type AiErrorKind =
  | "config_error"
  | "timeout"
  | "rate_limited"
  | "transient_error"
  | "api_error"
  | "network_error"
  | "retries_exhausted";

export class AiClientError extends Error {
  readonly kind: AiErrorKind;
  readonly statusCode?: number;

  constructor(message: string, kind: AiErrorKind, statusCode?: number) {
    super(message);
    this.name = "AiClientError";
    this.kind = kind;
    this.statusCode = statusCode;
  }

  /** Whether this error is likely to succeed on retry later. */
  get isRetryable(): boolean {
    return (
      this.kind === "transient_error" ||
      this.kind === "rate_limited" ||
      this.kind === "network_error" ||
      this.kind === "timeout"
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
