import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
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

describe("Templates API - GET /api/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of templates", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "tpl-1",
        firmId: "firm-1",
        name: "Standard Contract Template",
        type: "document",
        category: "contracts",
        content: "This is a contract template...",
        mergeFields: { client_name: "string", date: "date" },
        isActive: true,
        parentId: null,
        version: 1,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tpl-2",
        firmId: "firm-1",
        name: "Welcome Email",
        type: "email",
        category: "client_comms",
        content: "Dear {{client_name}}, welcome to our firm...",
        mergeFields: { client_name: "string" },
        isActive: true,
        parentId: null,
        version: 1,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest(
      "http://localhost/api/templates?page=1&limit=20&includeSystem=true"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.templates)).toBe(true);
    expect(json.templates.length).toBe(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expect(json.templates[0].name).toBe("Standard Contract Template");
    expect(json.templates[1].name).toBe("Welcome Email");
  });

  it("returns empty list when no templates exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates).toEqual([]);
    expect(json.pagination.total).toBe(0);
    expect(json.pagination.totalPages).toBe(1);
  });

  it("filters by type parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "tpl-1",
        firmId: "firm-1",
        name: "Contract Template",
        type: "document",
        category: "contracts",
        content: "Contract content...",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates?type=document");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates.length).toBe(1);
    expect(json.templates[0].type).toBe("document");
  });

  it("filters by activeOnly parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "tpl-1",
        firmId: "firm-1",
        name: "Active Template",
        type: "email",
        isActive: true,
        content: "Content...",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates?activeOnly=true");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates.length).toBe(1);
    expect(json.templates[0].isActive).toBe(true);
  });

  it("includes system templates when includeSystem=true", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "tpl-sys-1",
        firmId: null,
        name: "System Template",
        type: "email",
        category: "system",
        content: "System template content...",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tpl-firm-1",
        firmId: "firm-1",
        name: "Firm Template",
        type: "email",
        category: "custom",
        content: "Firm template content...",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates?includeSystem=true");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates.length).toBe(2);
  });

  it("excludes system templates when includeSystem=false", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "tpl-firm-1",
        firmId: "firm-1",
        name: "Firm Template",
        type: "email",
        content: "Firm template content...",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates?includeSystem=false");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates.length).toBe(1);
    expect(json.templates[0].firmId).toBe("firm-1");
  });

  it("handles pagination correctly with multiple pages", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: `tpl-${i}`,
        firmId: "firm-1",
        name: `Template ${i}`,
        type: "email",
        content: `Content ${i}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 50, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates?page=2&limit=10");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.total).toBe(50);
    expect(json.pagination.totalPages).toBe(5);
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });

  it("combines multiple filters correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplates = [
      {
        id: "tpl-1",
        firmId: "firm-1",
        name: "Active Email Template",
        type: "email",
        category: "client_comms",
        content: "Email content...",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockTemplates } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest(
      "http://localhost/api/templates?type=email&activeOnly=true&includeSystem=false"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.templates.length).toBe(1);
    expect(json.templates[0].type).toBe("email");
    expect(json.templates[0].isActive).toBe(true);
  });

  it("defaults to page=1 and limit=20 when not specified", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 5, rows: [] } as any);

    const { GET } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.page).toBe(1);
    expect(json.pagination.limit).toBe(20);
  });
});

describe("Templates API - POST /api/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a document template successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-tpl-1",
      firmId: "firm-1",
      name: "New Contract Template",
      type: "document",
      category: "contracts",
      content: "This contract is between {{party1}} and {{party2}}...",
      mergeFields: { party1: "string", party2: "string" },
      isActive: true,
      parentId: null,
      version: 1,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "New Contract Template",
        type: "document",
        category: "contracts",
        content: "This contract is between {{party1}} and {{party2}}...",
        mergeFields: { party1: "string", party2: "string" },
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.name).toBe("New Contract Template");
    expect(json.type).toBe("document");
    expect(json.category).toBe("contracts");
    expect(json.isActive).toBe(true);
    expect(json.version).toBe(1);
  });

  it("creates an email template successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-tpl-2",
      firmId: "firm-1",
      name: "Client Welcome Email",
      type: "email",
      category: "onboarding",
      content: "Dear {{client_name}}, welcome to our firm!",
      mergeFields: { client_name: "string" },
      isActive: true,
      parentId: null,
      version: 1,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Client Welcome Email",
        type: "email",
        category: "onboarding",
        content: "Dear {{client_name}}, welcome to our firm!",
        mergeFields: { client_name: "string" },
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.name).toBe("Client Welcome Email");
    expect(json.type).toBe("email");
  });

  it("creates template with minimal required fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-tpl-3",
      firmId: "firm-1",
      name: "Simple Template",
      type: "document",
      category: null,
      content: "Simple content",
      mergeFields: null,
      isActive: true,
      parentId: null,
      version: 1,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Simple Template",
        type: "document",
        content: "Simple content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.name).toBe("Simple Template");
    expect(json.category).toBeNull();
    expect(json.mergeFields).toBeNull();
  });

  it("creates template with isActive set to false", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-tpl-4",
      firmId: "firm-1",
      name: "Inactive Template",
      type: "email",
      content: "Draft content",
      isActive: false,
      parentId: null,
      version: 1,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Inactive Template",
        type: "email",
        content: "Draft content",
        isActive: false,
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.isActive).toBe(false);
  });

  it("creates template with complex merge fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-tpl-5",
      firmId: "firm-1",
      name: "Complex Template",
      type: "document",
      content: "Template with merge fields...",
      mergeFields: {
        client: { name: "string", email: "string" },
        matter: { reference: "string", date: "date" },
        amounts: { total: "number", currency: "string" },
      },
      isActive: true,
      parentId: null,
      version: 1,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Complex Template",
        type: "document",
        content: "Template with merge fields...",
        mergeFields: {
          client: { name: "string", email: "string" },
          matter: { reference: "string", date: "date" },
          amounts: { total: "number", currency: "string" },
        },
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.mergeFields).toBeDefined();
    expect(json.mergeFields.client).toBeDefined();
  });

  it("returns error when name is missing", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        type: "document",
        content: "Content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when type is missing", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Template Name",
        content: "Content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when content is missing", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Template Name",
        type: "document",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when name exceeds max length", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const longName = "A".repeat(201);
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: longName,
        type: "document",
        content: "Content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when name is empty string", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        type: "document",
        content: "Content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when content is empty string", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Template",
        type: "document",
        content: "",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid template type", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Template",
        type: "invalid_type",
        content: "Content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates template type enum values", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const validTypes = ["document", "email"];

    for (const type of validTypes) {
      const mockTemplate = {
        id: `tpl-${type}`,
        firmId: "firm-1",
        name: `${type} template`,
        type,
        content: "Content",
        isActive: true,
        parentId: null,
        version: 1,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

      const { POST } = await import("@/app/api/templates/route");
      const request = new NextRequest("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({
          name: `${type} template`,
          type,
          content: "Content",
        }),
      });

      const response = await POST(request as any, {} as any);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.type).toBe(type);
    }
  });

  it("defaults isActive to true when not specified", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockTemplate = {
      id: "new-tpl-6",
      firmId: "firm-1",
      name: "Default Active Template",
      type: "email",
      content: "Content",
      isActive: true,
      parentId: null,
      version: 1,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockTemplate as any);

    const { POST } = await import("@/app/api/templates/route");
    const request = new NextRequest("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "Default Active Template",
        type: "email",
        content: "Content",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.isActive).toBe(true);
  });
});
