/**
 * Unit tests for document analysis module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyzeDocument, buildAnalyzePrompt, getConfidenceLevel } from "@/lib/documents/analyze";

describe("getConfidenceLevel", () => {
  it("returns green for confidence >= 80", () => {
    expect(getConfidenceLevel(80)).toBe("green");
    expect(getConfidenceLevel(85)).toBe("green");
    expect(getConfidenceLevel(100)).toBe("green");
  });

  it("returns amber for confidence 50-79", () => {
    expect(getConfidenceLevel(50)).toBe("amber");
    expect(getConfidenceLevel(65)).toBe("amber");
    expect(getConfidenceLevel(79)).toBe("amber");
  });

  it("returns red for confidence < 50", () => {
    expect(getConfidenceLevel(0)).toBe("red");
    expect(getConfidenceLevel(25)).toBe("red");
    expect(getConfidenceLevel(49)).toBe("red");
  });
});

describe("buildAnalyzePrompt", () => {
  it("constructs prompt with JSON schema", () => {
    const prompt = buildAnalyzePrompt();

    expect(prompt).toContain("legal document analyzer");
    expect(prompt).toContain("UK law firm");
    expect(prompt).toContain("suggestedTitle");
    expect(prompt).toContain("documentType");
    expect(prompt).toContain("parties");
    expect(prompt).toContain("keyDates");
    expect(prompt).toContain("summary");
    expect(prompt).toContain("confidence");
    expect(prompt).toContain("valid JSON only");
  });

  it("includes all valid document types", () => {
    const prompt = buildAnalyzePrompt();

    expect(prompt).toContain("letter_in");
    expect(prompt).toContain("letter_out");
    expect(prompt).toContain("contract");
    expect(prompt).toContain("court_form");
    expect(prompt).toContain("evidence");
    expect(prompt).toContain("financial");
    expect(prompt).toContain("other");
  });
});

describe("analyzeDocument", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Helper to create a mock fetch response
   */
  function mockFetchResponse(responseData: object, status = 200) {
    const mockResponse = {
      ok: status >= 200 && status < 300,
      status,
      json: vi.fn().mockResolvedValue(responseData),
      text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);
    return global.fetch as ReturnType<typeof vi.fn>;
  }

  /**
   * Helper to create OpenRouter API response structure
   */
  function createOpenRouterResponse(content: string, totalTokens = 1500) {
    return {
      id: "gen-123",
      choices: [
        {
          message: {
            content,
          },
        },
      ],
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: totalTokens,
      },
    };
  }

  it("throws error when OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;

    await expect(analyzeDocument(Buffer.from("test"))).rejects.toThrow(
      "OPENROUTER_API_KEY is not configured"
    );
  });

  it("throws error for empty PDF buffer", async () => {
    await expect(analyzeDocument(Buffer.alloc(0))).rejects.toThrow("PDF buffer is empty");
  });

  it("returns analysis result for valid response", async () => {
    const mockAnalysis = {
      suggestedTitle: "Contract for Sale - 15 Willow Lane",
      documentType: "contract",
      documentDate: "2024-11-15",
      parties: [
        { name: "Margaret Thompson", role: "Buyer" },
        { name: "David Davidson", role: "Seller" },
      ],
      keyDates: [
        { label: "Completion Date", date: "2024-12-20" },
        { label: "Contract Date", date: "2024-11-15" },
      ],
      summary: "Standard contract for sale of freehold property.",
      confidence: 92,
    };

    mockFetchResponse(createOpenRouterResponse(JSON.stringify(mockAnalysis)));

    const pdfBuffer = Buffer.from("mock PDF content");
    const result = await analyzeDocument(pdfBuffer);

    expect(result.suggestedTitle).toBe("Contract for Sale - 15 Willow Lane");
    expect(result.documentType).toBe("contract");
    expect(result.documentDate).toBe("2024-11-15");
    expect(result.parties).toHaveLength(2);
    expect(result.parties[0].name).toBe("Margaret Thompson");
    expect(result.keyDates).toHaveLength(2);
    expect(result.summary).toBe("Standard contract for sale of freehold property.");
    expect(result.confidence).toBe(92);
    expect(result.confidenceLevel).toBe("green");
    expect(result.tokensUsed).toBe(1500);
    expect(result.model).toBe("google/gemini-3-flash-preview");
  });

  it("sends correct request to OpenRouter API", async () => {
    const mockAnalysis = {
      suggestedTitle: "Test",
      documentType: "other",
      documentDate: null,
      parties: [],
      keyDates: [],
      summary: "Test",
      confidence: 50,
    };

    const fetchMock = mockFetchResponse(createOpenRouterResponse(JSON.stringify(mockAnalysis)));

    const pdfBuffer = Buffer.from("mock PDF content");
    await analyzeDocument(pdfBuffer);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe("Bearer test-key");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("google/gemini-3-flash-preview");
    expect(body.messages[0].content).toHaveLength(2);
    expect(body.messages[0].content[0].type).toBe("text");
    expect(body.messages[0].content[1].type).toBe("file");
    expect(body.messages[0].content[1].file.filename).toBe("document.pdf");
    expect(body.messages[0].content[1].file.file_data).toContain("data:application/pdf;base64,");
  });

  it("handles response wrapped in markdown code blocks", async () => {
    const mockAnalysis = {
      suggestedTitle: "Test Document",
      documentType: "letter_out",
      documentDate: null,
      parties: [],
      keyDates: [],
      summary: "A test document.",
      confidence: 75,
    };

    mockFetchResponse(
      createOpenRouterResponse("```json\n" + JSON.stringify(mockAnalysis) + "\n```", 500)
    );

    const result = await analyzeDocument(Buffer.from("test"));

    expect(result.suggestedTitle).toBe("Test Document");
    expect(result.documentType).toBe("letter_out");
    expect(result.confidenceLevel).toBe("amber");
  });

  it("throws error for invalid JSON response", async () => {
    mockFetchResponse(createOpenRouterResponse("This is not valid JSON"));

    await expect(analyzeDocument(Buffer.from("test"))).rejects.toThrow(
      "AI model did not return valid JSON"
    );
  });

  it("throws error for response missing required fields", async () => {
    mockFetchResponse(createOpenRouterResponse(JSON.stringify({ suggestedTitle: "Incomplete" })));

    await expect(analyzeDocument(Buffer.from("test"))).rejects.toThrow(
      "AI response validation failed"
    );
  });

  it("throws error for invalid document type", async () => {
    const mockAnalysis = {
      suggestedTitle: "Test",
      documentType: "invalid_type",
      documentDate: null,
      parties: [],
      keyDates: [],
      summary: "Test",
      confidence: 50,
    };

    mockFetchResponse(createOpenRouterResponse(JSON.stringify(mockAnalysis)));

    await expect(analyzeDocument(Buffer.from("test"))).rejects.toThrow(
      "AI response validation failed"
    );
  });

  it("handles zero token usage gracefully", async () => {
    const mockAnalysis = {
      suggestedTitle: "Test",
      documentType: "other",
      documentDate: null,
      parties: [],
      keyDates: [],
      summary: "Test",
      confidence: 50,
    };

    mockFetchResponse({
      id: "gen-123",
      choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
      // No usage field
    });

    const result = await analyzeDocument(Buffer.from("test"));

    expect(result.tokensUsed).toBe(0);
  });

  it("maps low confidence to red level", async () => {
    const mockAnalysis = {
      suggestedTitle: "Unclear Document",
      documentType: "other",
      documentDate: null,
      parties: [],
      keyDates: [],
      summary: "Unable to determine document contents clearly.",
      confidence: 35,
    };

    mockFetchResponse(createOpenRouterResponse(JSON.stringify(mockAnalysis), 200));

    const result = await analyzeDocument(Buffer.from("test"));

    expect(result.confidence).toBe(35);
    expect(result.confidenceLevel).toBe("red");
  });

  it("throws error when OpenRouter returns non-200 status", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: "Internal Server Error" }),
      text: vi.fn().mockResolvedValue('{"error":"Internal Server Error"}'),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(analyzeDocument(Buffer.from("test"))).rejects.toThrow(
      "OpenRouter API error (500)"
    );
  });

  it("throws error when OpenRouter returns empty choices", async () => {
    mockFetchResponse({
      id: "gen-123",
      choices: [],
    });

    await expect(analyzeDocument(Buffer.from("test"))).rejects.toThrow(
      "OpenRouter returned no choices"
    );
  });
});
