import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callAi, AiClientError, getAiClientStats } from "@/lib/pipeline/ai-client";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set required env
vi.stubEnv("OPENROUTER_API_KEY", "test-key");
vi.stubEnv("AI_CALL_TIMEOUT_MS", "5000");

function createMockResponse(content: string, tokensUsed = 100, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map([["retry-after", "1"]]),
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { total_tokens: tokensUsed },
      model: "test-model",
    }),
    text: async () => "error body",
  };
}

describe("callAi", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("makes a successful AI call and returns content", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('{"result":"ok"}', 150));

    const result = await callAi({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.content).toBe('{"result":"ok"}');
    expect(result.tokensUsed).toBe(150);
    expect(result.wasRetried).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("includes correct headers and body in request", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse("ok"));

    await callAi({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Test" },
      ],
      temperature: 0.5,
      maxTokens: 2048,
      responseFormat: { type: "json_object" },
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("openrouter.ai");
    expect(options.headers["Authorization"]).toBe("Bearer test-key");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("gpt-4");
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(2048);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("retries on transient 500 error", async () => {
    mockFetch
      .mockResolvedValueOnce(createMockResponse("", 0, 500))
      .mockResolvedValueOnce(createMockResponse("success", 100));

    const result = await callAi({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
      maxRetries: 1,
      retryDelayMs: 10, // Fast for tests
    });

    expect(result.content).toBe("success");
    expect(result.wasRetried).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 429 rate limit", async () => {
    mockFetch
      .mockResolvedValueOnce(createMockResponse("", 0, 429))
      .mockResolvedValueOnce(createMockResponse("ok", 50));

    const result = await callAi({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
      maxRetries: 1,
      retryDelayMs: 10,
    });

    expect(result.content).toBe("ok");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws AiClientError on permanent 400 error", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse("", 0, 400));

    await expect(
      callAi({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow(AiClientError);
  });

  it("throws after exhausting retries", async () => {
    mockFetch
      .mockResolvedValueOnce(createMockResponse("", 0, 500))
      .mockResolvedValueOnce(createMockResponse("", 0, 500))
      .mockResolvedValueOnce(createMockResponse("", 0, 500));

    await expect(
      callAi({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
        maxRetries: 2,
        retryDelayMs: 10,
      })
    ).rejects.toThrow(AiClientError);
  });

  it("throws config_error when API key is missing", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");

    try {
      await callAi({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AiClientError);
      expect((err as AiClientError).kind).toBe("config_error");
    }

    // Restore
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  });

  it("getAiClientStats returns current state", () => {
    const stats = getAiClientStats();
    expect(stats).toHaveProperty("activeCallCount");
    expect(stats).toHaveProperty("queueLength");
    expect(typeof stats.activeCallCount).toBe("number");
  });
});

describe("AiClientError", () => {
  it("has correct properties", () => {
    const err = new AiClientError("test error", "timeout", 408);
    expect(err.message).toBe("test error");
    expect(err.kind).toBe("timeout");
    expect(err.statusCode).toBe(408);
    expect(err.name).toBe("AiClientError");
  });

  it("isRetryable is true for transient errors", () => {
    expect(new AiClientError("", "timeout").isRetryable).toBe(true);
    expect(new AiClientError("", "rate_limited").isRetryable).toBe(true);
    expect(new AiClientError("", "network_error").isRetryable).toBe(true);
    expect(new AiClientError("", "transient_error").isRetryable).toBe(true);
  });

  it("isRetryable is false for permanent errors", () => {
    expect(new AiClientError("", "config_error").isRetryable).toBe(false);
    expect(new AiClientError("", "api_error").isRetryable).toBe(false);
  });
});
