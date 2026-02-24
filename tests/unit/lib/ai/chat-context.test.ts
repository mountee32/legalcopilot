import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/generation/context-builder", () => ({
  buildGenerationContext: vi.fn(),
}));

vi.mock("@/lib/ai/embeddings", () => ({
  embedTexts: vi.fn(),
}));

vi.mock("@/lib/db/schema", () => ({
  documentChunks: {
    firmId: "firmId",
    matterId: "matterId",
    embedding: "embedding",
    id: "id",
    documentId: "documentId",
    text: "text",
    createdAt: "createdAt",
  },
  timelineEvents: {
    firmId: "firmId",
    matterId: "matterId",
    type: "type",
    title: "title",
    description: "description",
    occurredAt: "occurredAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: any[]) => args),
  desc: vi.fn((col: any) => col),
  eq: vi.fn((a: any, b: any) => [a, b]),
  isNotNull: vi.fn((col: any) => col),
  sql: vi.fn(),
}));

import { buildGenerationContext } from "@/lib/generation/context-builder";
import { embedTexts } from "@/lib/ai/embeddings";
import {
  buildChatContext,
  buildChatSystemPrompt,
  formatChatHistory,
  type ChatContext,
} from "@/lib/ai/chat-context";

const mockGenerationContext = {
  matter: {
    id: "matter-1",
    reference: "MAT-001",
    title: "Smith v Jones",
    practiceArea: "litigation",
    status: "active",
    description: "Personal injury claim",
    subType: "personal_injury",
  },
  client: {
    name: "John Smith",
    firstName: "John",
    lastName: "Smith",
    companyName: null,
    type: "individual",
    email: "john@example.com",
    phone: "07700900000",
    address: "123 High Street, London, SW1A 1AA",
  },
  firm: { name: "Harrison & Clarke Solicitors" },
  feeEarner: { name: "Sarah Harrison", email: "sarah@hc.demo" },
  findings: { plaintiff_name: "John Smith", incident_date: "2024-01-15" },
  findingsByCategory: {
    claimant_info: [
      {
        id: "f-1",
        fieldKey: "plaintiff_name",
        label: "Plaintiff Name",
        value: "John Smith",
        confidence: 0.95,
        impact: "high",
        status: "accepted",
        sourceQuote: null,
        categoryKey: "claimant_info",
        pageStart: null,
        pageEnd: null,
      },
    ],
  },
  statusCounts: { pending: 0, accepted: 1, rejected: 0, auto_applied: 0, conflict: 0 },
  today: "2026-02-24",
};

function createMockTx() {
  const tx: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  return tx;
}

describe("buildChatContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildGenerationContext).mockResolvedValue(mockGenerationContext as any);
  });

  it("retrieves document chunks via RAG when embedding succeeds", async () => {
    vi.mocked(embedTexts).mockResolvedValueOnce([[0.1, 0.2, 0.3]]);

    const mockTx = createMockTx();
    // First call: RAG chunks (returns results)
    const ragChunks = [{ documentId: "doc-1", documentChunkId: "chunk-1", text: "Relevant text" }];
    mockTx.limit
      .mockResolvedValueOnce(ragChunks) // RAG query returns results
      .mockResolvedValueOnce([]); // Timeline events

    const result = await buildChatContext("firm-1", "matter-1", "What happened?", mockTx);

    expect(embedTexts).toHaveBeenCalledWith(["What happened?"]);
    expect(result.ragUsed).toBe(true);
    expect(result.chunks).toEqual(ragChunks);
    expect(result.generation).toEqual(mockGenerationContext);
  });

  it("falls back to recent chunks when embedding fails", async () => {
    vi.mocked(embedTexts).mockRejectedValueOnce(new Error("API error"));

    const recentChunks = [{ documentId: "doc-2", documentChunkId: "chunk-2", text: "Recent text" }];
    const mockTx = createMockTx();
    mockTx.limit
      .mockResolvedValueOnce(recentChunks) // Fallback recent chunks
      .mockResolvedValueOnce([]); // Timeline events

    const result = await buildChatContext("firm-1", "matter-1", "Question", mockTx);

    expect(result.ragUsed).toBe(false);
    expect(result.chunks).toEqual(recentChunks);
  });

  it("includes timeline events", async () => {
    vi.mocked(embedTexts).mockRejectedValueOnce(new Error("skip"));

    const timelineData = [
      {
        type: "document_uploaded",
        title: "Document uploaded",
        description: "Medical report",
        occurredAt: new Date("2026-02-20"),
      },
    ];
    const mockTx = createMockTx();
    mockTx.limit
      .mockResolvedValueOnce([]) // chunks
      .mockResolvedValueOnce(timelineData); // timeline

    const result = await buildChatContext("firm-1", "matter-1", "Question", mockTx);

    expect(result.timelineEvents).toHaveLength(1);
    expect(result.timelineEvents[0].type).toBe("document_uploaded");
    expect(result.timelineEvents[0].occurredAt).toBe("2026-02-20T00:00:00.000Z");
  });
});

describe("buildChatSystemPrompt", () => {
  const baseContext: ChatContext = {
    generation: mockGenerationContext as any,
    chunks: [
      { documentId: "doc-1", documentChunkId: "chunk-1", text: "Medical report content..." },
    ],
    timelineEvents: [
      {
        type: "document_uploaded",
        title: "Medical report uploaded",
        description: null,
        occurredAt: "2026-02-20T00:00:00.000Z",
      },
    ],
    ragUsed: true,
  };

  it("includes all context sections", () => {
    const prompt = buildChatSystemPrompt(baseContext);

    expect(prompt).toContain("## ROLE");
    expect(prompt).toContain("Harrison & Clarke Solicitors");
    expect(prompt).toContain("## MATTER");
    expect(prompt).toContain("MAT-001");
    expect(prompt).toContain("Smith v Jones");
    expect(prompt).toContain("## CLIENT");
    expect(prompt).toContain("John Smith");
    expect(prompt).toContain("## FEE EARNER");
    expect(prompt).toContain("Sarah Harrison");
    expect(prompt).toContain("## EXTRACTED FINDINGS");
    expect(prompt).toContain("Plaintiff Name");
    expect(prompt).toContain("## RELEVANT DOCUMENT EXCERPTS");
    expect(prompt).toContain("Medical report content...");
    expect(prompt).toContain("## RECENT TIMELINE");
    expect(prompt).toContain("document_uploaded");
    expect(prompt).toContain("## RULES");
  });

  it("handles empty findings gracefully", () => {
    const ctx: ChatContext = {
      ...baseContext,
      generation: {
        ...baseContext.generation,
        findingsByCategory: {},
      } as any,
    };

    const prompt = buildChatSystemPrompt(ctx);

    expect(prompt).toContain("## ROLE");
    expect(prompt).not.toContain("## EXTRACTED FINDINGS");
  });
});

describe("formatChatHistory", () => {
  it("converts messages to user/assistant roles", () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
      { role: "user", content: "Tell me about the case" },
    ];

    const result = formatChatHistory(messages);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ role: "user", content: "Hello" });
    expect(result[1]).toEqual({ role: "assistant", content: "Hi there" });
    expect(result[2]).toEqual({ role: "user", content: "Tell me about the case" });
  });

  it("filters out non-user/assistant messages", () => {
    const messages = [
      { role: "system", content: "System message" },
      { role: "user", content: "Hello" },
    ];

    const result = formatChatHistory(messages);

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
  });
});
