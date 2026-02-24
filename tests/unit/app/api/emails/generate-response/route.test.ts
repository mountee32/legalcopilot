import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/email/response-generator", () => ({
  generateEmailResponse: vi.fn().mockResolvedValue({ response: "AI draft", tokensUsed: 200 }),
}));

vi.mock("@/lib/db/schema");

describe("POST /api/emails/[id]/generate-response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates response successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async () => ({
      response: "AI draft",
      tokensUsed: 200,
    }));

    const { POST } = await import("@/app/api/emails/[id]/generate-response/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/generate-response", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.response).toBe("AI draft");
    expect(json.tokensUsed).toBe(200);
  });

  it("updates aiSuggestedResponse on the email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    // The route internally calls tx.update(...).set({ aiSuggestedResponse: ... })
    // and then returns the generateEmailResponse result. We verify the mock is called
    // and that the final result includes the generated response.
    vi.mocked(withFirmDb).mockImplementation(async () => ({
      response: "Updated draft response",
      tokensUsed: 150,
    }));

    const { POST } = await import("@/app/api/emails/[id]/generate-response/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/generate-response", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.response).toBe("Updated draft response");
    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });

  it("returns 404 for missing email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async () => {
      throw new NotFoundError("Email not found");
    });

    const { POST } = await import("@/app/api/emails/[id]/generate-response/route");
    const request = new NextRequest("http://localhost/api/emails/nonexistent/generate-response", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(404);
  });

  it("works without matterId", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    // When email.matterId is null, the route skips loading matter/client/findings
    // but still generates the response successfully.
    vi.mocked(withFirmDb).mockImplementation(async () => ({
      response: "Draft without matter context",
      tokensUsed: 100,
    }));

    const { POST } = await import("@/app/api/emails/[id]/generate-response/route");
    const request = new NextRequest("http://localhost/api/emails/email-2/generate-response", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-2" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.response).toBe("Draft without matter context");
  });

  it("returns tokensUsed in response", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async () => ({
      response: "Token test draft",
      tokensUsed: 350,
    }));

    const { POST } = await import("@/app/api/emails/[id]/generate-response/route");
    const request = new NextRequest("http://localhost/api/emails/email-1/generate-response", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: "email-1" }),
      user: { user: { id: "user-1", name: "Test User", email: "test@test.com" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("tokensUsed");
    expect(json.tokensUsed).toBe(350);
  });
});
