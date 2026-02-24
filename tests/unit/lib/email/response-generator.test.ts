import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/pipeline/ai-client", () => ({
  callAi: vi
    .fn()
    .mockResolvedValue({
      content: "AI response text",
      tokensUsed: 150,
      model: "test",
      wasRetried: false,
    }),
}));

import {
  buildResponsePrompt,
  generateEmailResponse,
  type ResponseContext,
} from "@/lib/email/response-generator";
import { callAi } from "@/lib/pipeline/ai-client";

const fullCtx: ResponseContext = {
  email: {
    fromAddress: { email: "client@test.com", name: "Client" },
    subject: "Test Subject",
    bodyText: "Hello",
    aiIntent: "complaint",
    aiSentiment: "frustrated",
    aiUrgency: 90,
  },
  matter: {
    reference: "MAT-001",
    title: "Test Matter",
    practiceArea: "Litigation",
    status: "active",
  },
  client: { name: "Test Client", type: "individual" },
  recentFindings: [{ fieldLabel: "Injury Type", extractedValue: "Whiplash", confidence: 95 }],
  threadHistory: [
    {
      direction: "inbound",
      fromName: "Client",
      subject: "Test",
      bodyPreview: "First message",
      createdAt: "2024-01-01",
    },
  ],
  firmName: "Test Firm",
  userName: "John Doe",
};

describe("response-generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildResponsePrompt", () => {
    it("builds prompt with full context", () => {
      const prompt = buildResponsePrompt(fullCtx);

      expect(prompt).toContain("client@test.com");
      expect(prompt).toContain("Test Subject");
      expect(prompt).toContain("Hello");
      expect(prompt).toContain("complaint");
      expect(prompt).toContain("frustrated");
      expect(prompt).toContain("90");
      expect(prompt).toContain("MAT-001");
      expect(prompt).toContain("Test Matter");
      expect(prompt).toContain("Litigation");
      expect(prompt).toContain("Test Client");
      expect(prompt).toContain("Injury Type");
      expect(prompt).toContain("Whiplash");
      expect(prompt).toContain("First message");
      expect(prompt).toContain("Test Firm");
      expect(prompt).toContain("John Doe");
    });

    it("builds prompt without matter", () => {
      const ctx: ResponseContext = {
        email: {
          fromAddress: { email: "sender@test.com", name: "Sender" },
          subject: "General Inquiry",
          bodyText: "Question",
          aiIntent: null,
          aiSentiment: null,
          aiUrgency: null,
        },
        firmName: "Test Firm",
        userName: "Jane Doe",
      };

      const prompt = buildResponsePrompt(ctx);

      expect(prompt).toContain("sender@test.com");
      expect(prompt).toContain("General Inquiry");
      expect(prompt).toContain("Test Firm");
      expect(prompt).toContain("Jane Doe");
      expect(prompt).not.toContain("MAT-001");
      expect(prompt).not.toContain("FINDINGS");
    });

    it("includes thread history in prompt", () => {
      const prompt = buildResponsePrompt(fullCtx);

      expect(prompt).toMatch(/THREAD HISTORY/i);
      expect(prompt).toContain("First message");
      expect(prompt).toContain("Client");
    });

    it("limits findings to 20", () => {
      const findings = Array.from({ length: 25 }, (_, i) => ({
        fieldLabel: `Field ${i}`,
        extractedValue: `Value ${i}`,
        confidence: 80,
      }));

      const ctx: ResponseContext = {
        ...fullCtx,
        recentFindings: findings,
      };

      const prompt = buildResponsePrompt(ctx);

      expect(prompt).toContain("Field 0");
      expect(prompt).toContain("Field 19");
      expect(prompt).not.toContain("Field 20");
      expect(prompt).not.toContain("Field 24");
    });
  });

  describe("generateEmailResponse", () => {
    it("generates response via callAi", async () => {
      const result = await generateEmailResponse(fullCtx);

      expect(callAi).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(callAi).mock.calls[0];
      expect(callArgs[0]).toMatchObject({
        model: expect.stringContaining(""),
        temperature: expect.any(Number),
      });
      expect(result).toEqual({ response: "AI response text", tokensUsed: 150 });
    });

    it("handles AI error", async () => {
      vi.mocked(callAi).mockRejectedValueOnce(new Error("AI service unavailable"));

      await expect(generateEmailResponse(fullCtx)).rejects.toThrow("AI service unavailable");
    });
  });
});
