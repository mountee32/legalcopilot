/**
 * OpenAPI Specification Generator
 *
 * Generates OpenAPI 3.0 spec from Zod schemas.
 * Run with: npm run docs:api
 *
 * Output: docs/api/openapi.yaml
 */

import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { z } from "zod";

// Import all API schemas
import {
  // Common
  ErrorResponseSchema,
  SuccessResponseSchema,
  PaginationSchema,
  // Approvals
  ApprovalRequestSchema,
  ApprovalListSchema,
  ApprovalQuerySchema,
  ApproveRequestSchema,
  BulkApproveRequestSchema,
  BulkApproveResponseSchema,
  // Clients
  ClientSchema,
  CreateClientSchema,
  UpdateClientSchema,
  ClientListSchema,
  ClientQuerySchema,
  // Matters
  MatterSchema,
  CreateMatterSchema,
  UpdateMatterSchema,
  MatterListSchema,
  MatterQuerySchema,
  // Documents
  DocumentSchema,
  DocumentListSchema,
  CreateDocumentSchema,
  AskMatterSchema,
  AskMatterResponseSchema,
  DocumentChunkListSchema,
  ChunkDocumentRequestSchema,
  ChunkDocumentResponseSchema,
  DocumentJobAcceptedResponseSchema,
  ExtractDocumentRequestSchema,
  ExtractDocumentResponseSchema,
  SummarizeDocumentResponseSchema,
  DocumentEntitiesResponseSchema,
  FirmSettingsResponseSchema,
  UpdateFirmSettingsSchema,
  RoleSchema,
  RoleListSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  AssignRoleSchema,
  AssignRoleResponseSchema,
  UserIdParamSchema,
  TimelineEventSchema,
  TimelineListSchema,
  TimelineQuerySchema,
  CreateTimelineEventSchema,
  NotificationSchema,
  NotificationListSchema,
  NotificationQuerySchema,
  NotificationPreferencesResponseSchema,
  UpdateNotificationPreferencesSchema,
  TaskSchema,
  TaskListSchema,
  TaskQuerySchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  GenerateTasksSchema,
  EmailMessageSchema,
  EmailListSchema,
  EmailQuerySchema,
  CreateEmailSchema,
  UpdateEmailSchema,
  EmailAIProcessResponseSchema,
  // Time entries
  TimeEntrySchema,
  TimeEntryListSchema,
  TimeEntryQuerySchema,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
  BulkSubmitTimeEntriesSchema,
  BulkSubmitTimeEntriesResponseSchema,
  // Invoices
  InvoiceSchema,
  InvoiceWithItemsSchema,
  InvoiceListSchema,
  InvoiceQuerySchema,
  GenerateInvoiceSchema,
  UpdateInvoiceSchema,
  // Payments
  PaymentSchema,
  PaymentListSchema,
  PaymentQuerySchema,
  CreatePaymentSchema,
  // Calendar
  CalendarEventSchema,
  CalendarListSchema,
  CalendarQuerySchema,
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  UpcomingCalendarQuerySchema,
  UpcomingEventsSchema,
  CalendarAISuggestRequestSchema,
  // Templates
  TemplateSchema,
  TemplateListSchema,
  TemplateQuerySchema,
  CreateTemplateSchema,
  UpdateTemplateSchema,
  PreviewTemplateSchema,
  PreviewTemplateResponseSchema,
  GenerateTemplateResponseSchema,
  ProposeTemplateSchema,
  // Intake
  LeadSchema,
  LeadListSchema,
  LeadQuerySchema,
  CreateLeadSchema,
  UpdateLeadSchema,
  ConvertLeadSchema,
  ConvertLeadResponseSchema,
  QuoteSchema,
  QuoteListSchema,
  QuoteQuerySchema,
  CreateQuoteSchema,
  UpdateQuoteSchema,
  // Conflicts
  ConflictCheckSchema,
  ConflictSearchRequestSchema,
  ConflictSearchResponseSchema,
  ConflictDecisionRequestSchema,
  // Integrations
  EmailAccountSchema,
  EmailAccountWithSecretSchema,
  EmailAccountListSchema,
  EmailAccountQuerySchema,
  CreateEmailAccountSchema,
  EmailAccountCreateResponseSchema,
  CalendarAccountSchema,
  CalendarAccountWithSecretSchema,
  CalendarAccountListSchema,
  CalendarAccountQuerySchema,
  CreateCalendarAccountSchema,
  CalendarAccountCreateResponseSchema,
  PaymentProviderAccountSchema,
  PaymentProviderAccountWithSecretSchema,
  PaymentProviderAccountListSchema,
  CreatePaymentProviderAccountSchema,
  PaymentProviderAccountCreateResponseSchema,
  AccountingConnectionSchema,
  AccountingConnectionWithSecretSchema,
  AccountingConnectionListSchema,
  CreateAccountingConnectionSchema,
  AccountingConnectionCreateResponseSchema,
  SignatureRequestSchema,
  SignatureRequestListSchema,
  SignatureRequestQuerySchema,
  CreateSignatureRequestSchema,
  CreateSignatureRequestResponseSchema,
  // Search
  SemanticSearchRequestSchema,
  SemanticSearchResponseSchema,
  MatterSemanticSearchQuerySchema,
} from "../lib/api/schemas";

// Create registry
const registry = new OpenAPIRegistry();

// Register common schemas
registry.register("ErrorResponse", ErrorResponseSchema);
registry.register("SuccessResponse", SuccessResponseSchema);
registry.register("Pagination", PaginationSchema);

// Register Approval schemas
registry.register("ApprovalRequest", ApprovalRequestSchema);
registry.register("ApprovalListResponse", ApprovalListSchema);
registry.register("ApprovalQuery", ApprovalQuerySchema);
registry.register("ApproveRequest", ApproveRequestSchema);
registry.register("BulkApproveRequest", BulkApproveRequestSchema);
registry.register("BulkApproveResponse", BulkApproveResponseSchema);

// Register Client schemas
registry.register("Client", ClientSchema);
registry.register("CreateClientRequest", CreateClientSchema);
registry.register("UpdateClientRequest", UpdateClientSchema);
registry.register("ClientListResponse", ClientListSchema);
registry.register("ClientQuery", ClientQuerySchema);

// Register Matter schemas
registry.register("Matter", MatterSchema);
registry.register("CreateMatterRequest", CreateMatterSchema);
registry.register("UpdateMatterRequest", UpdateMatterSchema);
registry.register("MatterListResponse", MatterListSchema);
registry.register("MatterQuery", MatterQuerySchema);

// Register Document schemas
registry.register("Document", DocumentSchema);
registry.register("DocumentListResponse", DocumentListSchema);
registry.register("CreateDocumentRequest", CreateDocumentSchema);
registry.register("AskMatterRequest", AskMatterSchema);
registry.register("AskMatterResponse", AskMatterResponseSchema);
registry.register("DocumentChunkListResponse", DocumentChunkListSchema);
registry.register("ChunkDocumentRequest", ChunkDocumentRequestSchema);
registry.register("ChunkDocumentResponse", ChunkDocumentResponseSchema);
registry.register("DocumentJobAcceptedResponse", DocumentJobAcceptedResponseSchema);
registry.register("ExtractDocumentRequest", ExtractDocumentRequestSchema);
registry.register("ExtractDocumentResponse", ExtractDocumentResponseSchema);
registry.register("SummarizeDocumentResponse", SummarizeDocumentResponseSchema);
registry.register("DocumentEntitiesResponse", DocumentEntitiesResponseSchema);
registry.register("FirmSettingsResponse", FirmSettingsResponseSchema);
registry.register("UpdateFirmSettingsRequest", UpdateFirmSettingsSchema);
registry.register("Role", RoleSchema);
registry.register("RoleListResponse", RoleListSchema);
registry.register("CreateRoleRequest", CreateRoleSchema);
registry.register("UpdateRoleRequest", UpdateRoleSchema);
registry.register("AssignRoleRequest", AssignRoleSchema);
registry.register("AssignRoleResponse", AssignRoleResponseSchema);
registry.register("UserIdParam", UserIdParamSchema);
registry.register("TimelineEvent", TimelineEventSchema);
registry.register("TimelineListResponse", TimelineListSchema);
registry.register("TimelineQuery", TimelineQuerySchema);
registry.register("CreateTimelineEventRequest", CreateTimelineEventSchema);
registry.register("Notification", NotificationSchema);
registry.register("NotificationListResponse", NotificationListSchema);
registry.register("NotificationQuery", NotificationQuerySchema);
registry.register("NotificationPreferencesResponse", NotificationPreferencesResponseSchema);
registry.register("UpdateNotificationPreferencesRequest", UpdateNotificationPreferencesSchema);
registry.register("Task", TaskSchema);
registry.register("TaskListResponse", TaskListSchema);
registry.register("TaskQuery", TaskQuerySchema);
registry.register("CreateTaskRequest", CreateTaskSchema);
registry.register("UpdateTaskRequest", UpdateTaskSchema);
registry.register("GenerateTasksRequest", GenerateTasksSchema);
registry.register("Email", EmailMessageSchema);
registry.register("EmailListResponse", EmailListSchema);
registry.register("EmailQuery", EmailQuerySchema);
registry.register("CreateEmailRequest", CreateEmailSchema);
registry.register("UpdateEmailRequest", UpdateEmailSchema);
registry.register("EmailAIProcessResponse", EmailAIProcessResponseSchema);
registry.register("TimeEntry", TimeEntrySchema);
registry.register("TimeEntryListResponse", TimeEntryListSchema);
registry.register("TimeEntryQuery", TimeEntryQuerySchema);
registry.register("CreateTimeEntryRequest", CreateTimeEntrySchema);
registry.register("UpdateTimeEntryRequest", UpdateTimeEntrySchema);
registry.register("BulkSubmitTimeEntriesRequest", BulkSubmitTimeEntriesSchema);
registry.register("BulkSubmitTimeEntriesResponse", BulkSubmitTimeEntriesResponseSchema);
registry.register("Invoice", InvoiceSchema);
registry.register("InvoiceWithItemsResponse", InvoiceWithItemsSchema);
registry.register("InvoiceListResponse", InvoiceListSchema);
registry.register("InvoiceQuery", InvoiceQuerySchema);
registry.register("GenerateInvoiceRequest", GenerateInvoiceSchema);
registry.register("UpdateInvoiceRequest", UpdateInvoiceSchema);
registry.register("Payment", PaymentSchema);
registry.register("PaymentListResponse", PaymentListSchema);
registry.register("PaymentQuery", PaymentQuerySchema);
registry.register("CreatePaymentRequest", CreatePaymentSchema);
registry.register("CalendarEvent", CalendarEventSchema);
registry.register("CalendarListResponse", CalendarListSchema);
registry.register("CalendarQuery", CalendarQuerySchema);
registry.register("CreateCalendarEventRequest", CreateCalendarEventSchema);
registry.register("UpdateCalendarEventRequest", UpdateCalendarEventSchema);
registry.register("UpcomingCalendarQuery", UpcomingCalendarQuerySchema);
registry.register("UpcomingEventsResponse", UpcomingEventsSchema);
registry.register("CalendarAISuggestRequest", CalendarAISuggestRequestSchema);
registry.register("Template", TemplateSchema);
registry.register("TemplateListResponse", TemplateListSchema);
registry.register("TemplateQuery", TemplateQuerySchema);
registry.register("CreateTemplateRequest", CreateTemplateSchema);
registry.register("UpdateTemplateRequest", UpdateTemplateSchema);
registry.register("PreviewTemplateRequest", PreviewTemplateSchema);
registry.register("PreviewTemplateResponse", PreviewTemplateResponseSchema);
registry.register("GenerateTemplateResponse", GenerateTemplateResponseSchema);
registry.register("ProposeTemplateRequest", ProposeTemplateSchema);
registry.register("Lead", LeadSchema);
registry.register("LeadListResponse", LeadListSchema);
registry.register("LeadQuery", LeadQuerySchema);
registry.register("CreateLeadRequest", CreateLeadSchema);
registry.register("UpdateLeadRequest", UpdateLeadSchema);
registry.register("ConvertLeadRequest", ConvertLeadSchema);
registry.register("ConvertLeadResponse", ConvertLeadResponseSchema);
registry.register("Quote", QuoteSchema);
registry.register("QuoteListResponse", QuoteListSchema);
registry.register("QuoteQuery", QuoteQuerySchema);
registry.register("CreateQuoteRequest", CreateQuoteSchema);
registry.register("UpdateQuoteRequest", UpdateQuoteSchema);
registry.register("ConflictCheck", ConflictCheckSchema);
registry.register("ConflictSearchRequest", ConflictSearchRequestSchema);
registry.register("ConflictSearchResponse", ConflictSearchResponseSchema);
registry.register("ConflictDecisionRequest", ConflictDecisionRequestSchema);
registry.register("EmailAccount", EmailAccountSchema);
registry.register("EmailAccountListResponse", EmailAccountListSchema);
registry.register("EmailAccountQuery", EmailAccountQuerySchema);
registry.register("CreateEmailAccountRequest", CreateEmailAccountSchema);
registry.register("EmailAccountCreateResponse", EmailAccountCreateResponseSchema);
registry.register("CalendarAccount", CalendarAccountSchema);
registry.register("CalendarAccountListResponse", CalendarAccountListSchema);
registry.register("CalendarAccountQuery", CalendarAccountQuerySchema);
registry.register("CreateCalendarAccountRequest", CreateCalendarAccountSchema);
registry.register("CalendarAccountCreateResponse", CalendarAccountCreateResponseSchema);
registry.register("PaymentProviderAccount", PaymentProviderAccountSchema);
registry.register("PaymentProviderAccountListResponse", PaymentProviderAccountListSchema);
registry.register("CreatePaymentProviderAccountRequest", CreatePaymentProviderAccountSchema);
registry.register(
  "PaymentProviderAccountCreateResponse",
  PaymentProviderAccountCreateResponseSchema
);
registry.register("AccountingConnection", AccountingConnectionSchema);
registry.register("AccountingConnectionListResponse", AccountingConnectionListSchema);
registry.register("CreateAccountingConnectionRequest", CreateAccountingConnectionSchema);
registry.register("AccountingConnectionCreateResponse", AccountingConnectionCreateResponseSchema);
registry.register("SignatureRequest", SignatureRequestSchema);
registry.register("SignatureRequestListResponse", SignatureRequestListSchema);
registry.register("SignatureRequestQuery", SignatureRequestQuerySchema);
registry.register("CreateSignatureRequestRequest", CreateSignatureRequestSchema);
registry.register("CreateSignatureRequestResponse", CreateSignatureRequestResponseSchema);
registry.register("SemanticSearchRequest", SemanticSearchRequestSchema);
registry.register("SemanticSearchResponse", SemanticSearchResponseSchema);
registry.register("MatterSemanticSearchQuery", MatterSemanticSearchQuerySchema);

// Define API paths

// Approvals
registry.registerPath({
  method: "get",
  path: "/api/approvals",
  summary: "List approval requests",
  description: "Retrieve a paginated list of approval requests",
  tags: ["Approvals"],
  request: { query: ApprovalQuerySchema },
  responses: {
    200: {
      description: "List of approval requests",
      content: { "application/json": { schema: ApprovalListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/approvals/{id}",
  summary: "Get approval request",
  description: "Retrieve a single approval request by ID",
  tags: ["Approvals"],
  request: {
    params: registry.register("ApprovalIdParam", ApprovalRequestSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Approval request",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/approvals/{id}/approve",
  summary: "Approve request",
  description: "Approve an approval request",
  tags: ["Approvals"],
  request: {
    params: registry.register("ApprovalApproveIdParam", ApprovalRequestSchema.pick({ id: true })),
    body: {
      content: { "application/json": { schema: ApproveRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated approval request",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/approvals/{id}/reject",
  summary: "Reject request",
  description: "Reject an approval request",
  tags: ["Approvals"],
  request: {
    params: registry.register("ApprovalRejectIdParam", ApprovalRequestSchema.pick({ id: true })),
    body: {
      content: { "application/json": { schema: ApproveRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated approval request",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/approvals/bulk/approve",
  summary: "Bulk approve",
  description: "Bulk approve multiple approval requests",
  tags: ["Approvals"],
  request: {
    body: {
      content: { "application/json": { schema: BulkApproveRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated approval requests",
      content: { "application/json": { schema: BulkApproveResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/approvals/bulk/reject",
  summary: "Bulk reject",
  description: "Bulk reject multiple approval requests",
  tags: ["Approvals"],
  request: {
    body: {
      content: { "application/json": { schema: BulkApproveRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated approval requests",
      content: { "application/json": { schema: BulkApproveResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Clients
registry.registerPath({
  method: "get",
  path: "/api/clients",
  summary: "List clients",
  description: "Retrieve a paginated list of clients",
  tags: ["Clients"],
  request: {
    query: ClientQuerySchema,
  },
  responses: {
    200: {
      description: "List of clients",
      content: {
        "application/json": {
          schema: ClientListSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/clients",
  summary: "Create client",
  description: "Create a new client record",
  tags: ["Clients"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateClientSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Client created",
      content: {
        "application/json": {
          schema: ClientSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/clients/{id}",
  summary: "Get client",
  description: "Retrieve a single client by ID",
  tags: ["Clients"],
  request: {
    params: registry.register("ClientIdParam", ClientSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Client details",
      content: {
        "application/json": {
          schema: ClientSchema,
        },
      },
    },
    404: {
      description: "Client not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/clients/{id}",
  summary: "Update client",
  description: "Update a client's details",
  tags: ["Clients"],
  request: {
    params: registry.register("ClientUpdateIdParam", ClientSchema.pick({ id: true })),
    body: {
      content: {
        "application/json": {
          schema: UpdateClientSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Client updated",
      content: {
        "application/json": {
          schema: ClientSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Client not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/clients/{id}",
  summary: "Archive client",
  description: "Archive a client (soft delete)",
  tags: ["Clients"],
  request: {
    params: registry.register("ClientDeleteIdParam", ClientSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Client archived",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    404: {
      description: "Client not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Matters
registry.registerPath({
  method: "get",
  path: "/api/matters",
  summary: "List matters",
  description: "Retrieve a paginated list of matters",
  tags: ["Matters"],
  request: {
    query: MatterQuerySchema,
  },
  responses: {
    200: {
      description: "List of matters",
      content: {
        "application/json": {
          schema: MatterListSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/matters",
  summary: "Create matter",
  description: "Create a new matter/case",
  tags: ["Matters"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateMatterSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Matter created",
      content: {
        "application/json": {
          schema: MatterSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/matters/{id}",
  summary: "Get matter",
  description: "Retrieve a single matter by ID",
  tags: ["Matters"],
  request: {
    params: registry.register("MatterIdParam", MatterSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Matter details",
      content: {
        "application/json": {
          schema: MatterSchema,
        },
      },
    },
    404: {
      description: "Matter not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/matters/{id}",
  summary: "Update matter",
  description: "Update a matter's details",
  tags: ["Matters"],
  request: {
    params: registry.register("MatterUpdateIdParam", MatterSchema.pick({ id: true })),
    body: {
      content: {
        "application/json": {
          schema: UpdateMatterSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Matter updated",
      content: {
        "application/json": {
          schema: MatterSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Matter not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/matters/{id}",
  summary: "Archive matter",
  description: "Archive a matter (soft delete)",
  tags: ["Matters"],
  request: {
    params: registry.register("MatterDeleteIdParam", MatterSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Matter archived",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    404: {
      description: "Matter not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Documents
registry.registerPath({
  method: "get",
  path: "/api/documents",
  summary: "List documents",
  description: "Retrieve documents, optionally filtered by matterId",
  tags: ["Documents"],
  responses: {
    200: {
      description: "List of documents",
      content: { "application/json": { schema: DocumentListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/documents",
  summary: "Create document",
  description: "Create a new document record for a matter",
  tags: ["Documents"],
  request: {
    body: { content: { "application/json": { schema: CreateDocumentSchema } } },
  },
  responses: {
    201: {
      description: "Document created",
      content: { "application/json": { schema: DocumentSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/documents/{id}/chunks",
  summary: "List document chunks",
  description: "Retrieve chunks for a document",
  tags: ["Documents"],
  request: {
    params: registry.register("DocumentIdParam", DocumentSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Document chunks",
      content: { "application/json": { schema: DocumentChunkListSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/documents/{id}/chunks",
  summary: "Generate document chunks",
  description: "Chunk the document's extracted text for retrieval and citations",
  tags: ["Documents"],
  request: {
    params: registry.register("DocumentChunkIdParam", DocumentSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: ChunkDocumentRequestSchema } } },
  },
  responses: {
    200: {
      description: "Chunking result",
      content: { "application/json": { schema: ChunkDocumentResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/documents/{id}/extract",
  summary: "Extract document text",
  description: "Extract text from the stored upload and persist on the document",
  tags: ["Documents"],
  request: {
    params: registry.register("DocumentExtractIdParam", DocumentSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: ExtractDocumentRequestSchema } } },
  },
  responses: {
    200: {
      description: "Extraction result",
      content: { "application/json": { schema: ExtractDocumentResponseSchema } },
    },
    202: {
      description: "Job accepted",
      content: { "application/json": { schema: DocumentJobAcceptedResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/documents/{id}/summarize",
  summary: "Summarize document",
  description: "Generate and persist an AI summary for a document",
  tags: ["Documents"],
  request: {
    params: registry.register("DocumentSummarizeIdParam", DocumentSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Summarization result",
      content: { "application/json": { schema: SummarizeDocumentResponseSchema } },
    },
    202: {
      description: "Job accepted",
      content: { "application/json": { schema: DocumentJobAcceptedResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/documents/{id}/entities",
  summary: "Extract document entities",
  description: "Extract and persist structured entities on the document metadata",
  tags: ["Documents"],
  request: {
    params: registry.register("DocumentEntitiesIdParam", DocumentSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Entities result",
      content: { "application/json": { schema: DocumentEntitiesResponseSchema } },
    },
    202: {
      description: "Job accepted",
      content: { "application/json": { schema: DocumentJobAcceptedResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/documents/{id}/download",
  summary: "Download document file",
  description: "Download the original document file from storage",
  tags: ["Documents"],
  request: {
    params: registry.register("DocumentDownloadIdParam", DocumentSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "File download",
      content: {
        "application/octet-stream": {
          schema: z.object({
            file: z.any().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/matters/{id}/ai/ask",
  summary: "Ask matter with citations",
  description: "Ask a question about a matter; response includes citations to document chunks",
  tags: ["Matters"],
  request: {
    params: registry.register("AskMatterIdParam", MatterSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: AskMatterSchema } } },
  },
  responses: {
    200: {
      description: "Answer with citations",
      content: { "application/json": { schema: AskMatterResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Firm settings
registry.registerPath({
  method: "get",
  path: "/api/firm/settings",
  summary: "Get firm settings",
  description: "Retrieve settings for the authenticated user's firm",
  tags: ["Firms"],
  responses: {
    200: {
      description: "Firm settings",
      content: { "application/json": { schema: FirmSettingsResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/firm/settings",
  summary: "Update firm settings",
  description: "Patch settings for the authenticated user's firm",
  tags: ["Firms"],
  request: {
    body: { content: { "application/json": { schema: UpdateFirmSettingsSchema } } },
  },
  responses: {
    200: {
      description: "Updated firm settings",
      content: { "application/json": { schema: FirmSettingsResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Roles
registry.registerPath({
  method: "get",
  path: "/api/roles",
  summary: "List roles",
  description: "Retrieve firm roles (RBAC)",
  tags: ["Roles"],
  responses: {
    200: { description: "Roles", content: { "application/json": { schema: RoleListSchema } } },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/roles",
  summary: "Create role",
  description: "Create a custom role for the firm",
  tags: ["Roles"],
  request: { body: { content: { "application/json": { schema: CreateRoleSchema } } } },
  responses: {
    201: { description: "Role created", content: { "application/json": { schema: RoleSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/roles/{id}",
  summary: "Update role",
  description: "Update a custom role for the firm",
  tags: ["Roles"],
  request: {
    params: registry.register("RoleIdParam", RoleSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateRoleSchema } } },
  },
  responses: {
    200: { description: "Role updated", content: { "application/json": { schema: RoleSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/roles/{id}",
  summary: "Delete role",
  description: "Delete a custom role for the firm",
  tags: ["Roles"],
  request: {
    params: registry.register("RoleDeleteIdParam", RoleSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/users/{id}/role",
  summary: "Assign role",
  description: "Assign a role to a user within the firm",
  tags: ["Users"],
  request: {
    params: registry.register("UserRoleAssignIdParam", UserIdParamSchema),
    body: { content: { "application/json": { schema: AssignRoleSchema } } },
  },
  responses: {
    200: {
      description: "Role assigned",
      content: { "application/json": { schema: AssignRoleResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Timeline
registry.registerPath({
  method: "get",
  path: "/api/matters/{id}/timeline",
  summary: "List timeline events",
  description: "Retrieve timeline events for a matter",
  tags: ["Timeline"],
  request: {
    params: registry.register("TimelineMatterIdParam", MatterSchema.pick({ id: true })),
    query: TimelineQuerySchema,
  },
  responses: {
    200: {
      description: "Timeline events",
      content: { "application/json": { schema: TimelineListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/matters/{id}/timeline",
  summary: "Create timeline event",
  description: "Create a manual timeline event for a matter",
  tags: ["Timeline"],
  request: {
    params: registry.register("TimelineMatterIdParamPost", MatterSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: CreateTimelineEventSchema } } },
  },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: TimelineEventSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Notifications
registry.registerPath({
  method: "get",
  path: "/api/notifications",
  summary: "List notifications",
  description: "List notifications for the authenticated user",
  tags: ["Notifications"],
  request: { query: NotificationQuerySchema },
  responses: {
    200: {
      description: "Notifications",
      content: { "application/json": { schema: NotificationListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/notifications/{id}/read",
  summary: "Mark notification read",
  description: "Mark a single notification as read",
  tags: ["Notifications"],
  request: {
    params: registry.register("NotificationIdParam", NotificationSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Marked read",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/notifications/read-all",
  summary: "Mark all notifications read",
  description: "Mark all notifications as read for the authenticated user",
  tags: ["Notifications"],
  responses: {
    200: {
      description: "Marked read",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/notifications/preferences",
  summary: "Get notification preferences",
  description: "Retrieve notification preferences for the authenticated user",
  tags: ["Notifications"],
  responses: {
    200: {
      description: "Preferences",
      content: { "application/json": { schema: NotificationPreferencesResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/notifications/preferences",
  summary: "Update notification preferences",
  description: "Patch notification preferences for the authenticated user",
  tags: ["Notifications"],
  request: {
    body: { content: { "application/json": { schema: UpdateNotificationPreferencesSchema } } },
  },
  responses: {
    200: {
      description: "Updated preferences",
      content: { "application/json": { schema: NotificationPreferencesResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Tasks
registry.registerPath({
  method: "get",
  path: "/api/tasks",
  summary: "List tasks",
  description: "Retrieve firm tasks with filters",
  tags: ["Tasks"],
  request: { query: TaskQuerySchema },
  responses: {
    200: { description: "Tasks", content: { "application/json": { schema: TaskListSchema } } },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/tasks",
  summary: "Create task",
  description: "Create a new task for a matter",
  tags: ["Tasks"],
  request: { body: { content: { "application/json": { schema: CreateTaskSchema } } } },
  responses: {
    201: { description: "Task created", content: { "application/json": { schema: TaskSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/tasks/{id}",
  summary: "Get task",
  description: "Retrieve a task by ID",
  tags: ["Tasks"],
  request: { params: registry.register("TaskIdParam", TaskSchema.pick({ id: true })) },
  responses: {
    200: { description: "Task", content: { "application/json": { schema: TaskSchema } } },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/tasks/{id}",
  summary: "Update task",
  description: "Update a task by ID",
  tags: ["Tasks"],
  request: {
    params: registry.register("TaskUpdateIdParam", TaskSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateTaskSchema } } },
  },
  responses: {
    200: { description: "Task updated", content: { "application/json": { schema: TaskSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/tasks/{id}/complete",
  summary: "Complete task",
  description: "Mark a task complete",
  tags: ["Tasks"],
  request: { params: registry.register("TaskCompleteIdParam", TaskSchema.pick({ id: true })) },
  responses: {
    200: { description: "Task completed", content: { "application/json": { schema: TaskSchema } } },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/matters/{id}/ai/generate-tasks",
  summary: "Generate tasks (approval required)",
  description: "Generate AI-proposed tasks for a matter; returns an approval request",
  tags: ["Matters"],
  request: {
    params: registry.register("GenerateTasksMatterIdParam", MatterSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: GenerateTasksSchema } } },
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Emails
registry.registerPath({
  method: "get",
  path: "/api/emails",
  summary: "List emails",
  description: "Retrieve firm emails with filters",
  tags: ["Emails"],
  request: { query: EmailQuerySchema },
  responses: {
    200: { description: "Emails", content: { "application/json": { schema: EmailListSchema } } },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/emails",
  summary: "Create email",
  description: "Create an email record",
  tags: ["Emails"],
  request: { body: { content: { "application/json": { schema: CreateEmailSchema } } } },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: EmailMessageSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/emails/{id}",
  summary: "Get email",
  description: "Retrieve a single email by ID",
  tags: ["Emails"],
  request: { params: registry.register("EmailIdParam", EmailMessageSchema.pick({ id: true })) },
  responses: {
    200: { description: "Email", content: { "application/json": { schema: EmailMessageSchema } } },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/emails/{id}",
  summary: "Update email",
  description: "Update an email record",
  tags: ["Emails"],
  request: {
    params: registry.register("EmailUpdateIdParam", EmailMessageSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateEmailSchema } } },
  },
  responses: {
    200: {
      description: "Updated",
      content: { "application/json": { schema: EmailMessageSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/emails/{id}/ai/process",
  summary: "AI process email",
  description: "Analyze an email for intent/sentiment/urgency and propose matter matching",
  tags: ["Emails"],
  request: {
    params: registry.register("EmailAIProcessIdParam", EmailMessageSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "AI processing result",
      content: { "application/json": { schema: EmailAIProcessResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/emails/{id}/attachments",
  summary: "Get email attachments",
  description: "List all attachments for an email",
  tags: ["Emails"],
  request: {
    params: registry.register("EmailAttachmentsIdParam", EmailMessageSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "List of attachments",
      content: {
        "application/json": {
          schema: registry.register(
            "EmailAttachmentsResponse",
            z.object({
              attachments: z.array(
                z.object({
                  id: z.string().uuid(),
                  filename: z.string(),
                  mimeType: z.string(),
                  size: z.number(),
                  url: z.string().url(),
                })
              ),
            })
          ),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/emails/{id}/send",
  summary: "Send email (approval required)",
  description: "Create approval request to send email",
  tags: ["Emails", "Approvals"],
  request: {
    params: registry.register("EmailSendIdParam", EmailMessageSchema.pick({ id: true })),
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Time entries
registry.registerPath({
  method: "get",
  path: "/api/time-entries",
  summary: "List time entries",
  description: "Retrieve firm time entries with filters",
  tags: ["Time Entries"],
  request: { query: TimeEntryQuerySchema },
  responses: {
    200: {
      description: "Time entries",
      content: { "application/json": { schema: TimeEntryListSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/time-entries",
  summary: "Create time entry",
  description: "Create a draft time entry",
  tags: ["Time Entries"],
  request: { body: { content: { "application/json": { schema: CreateTimeEntrySchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: TimeEntrySchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/time-entries/{id}",
  summary: "Get time entry",
  description: "Retrieve a single time entry",
  tags: ["Time Entries"],
  request: { params: registry.register("TimeEntryIdParam", TimeEntrySchema.pick({ id: true })) },
  responses: {
    200: {
      description: "Time entry",
      content: { "application/json": { schema: TimeEntrySchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/time-entries/{id}",
  summary: "Update time entry",
  description: "Update a draft time entry",
  tags: ["Time Entries"],
  request: {
    params: registry.register("TimeEntryUpdateIdParam", TimeEntrySchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateTimeEntrySchema } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: TimeEntrySchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/time-entries/{id}",
  summary: "Delete time entry",
  description: "Delete a draft time entry",
  tags: ["Time Entries"],
  request: {
    params: registry.register("TimeEntryDeleteIdParam", TimeEntrySchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/time-entries/{id}/submit",
  summary: "Submit time entry",
  description: "Submit a draft time entry for approval (creates an approval request)",
  tags: ["Time Entries", "Approvals"],
  request: {
    params: registry.register("TimeEntrySubmitIdParam", TimeEntrySchema.pick({ id: true })),
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/time-entries/bulk/submit",
  summary: "Bulk submit time entries",
  description: "Bulk submit draft time entries for approval",
  tags: ["Time Entries", "Approvals"],
  request: { body: { content: { "application/json": { schema: BulkSubmitTimeEntriesSchema } } } },
  responses: {
    201: {
      description: "Submitted",
      content: { "application/json": { schema: BulkSubmitTimeEntriesResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Invoices
registry.registerPath({
  method: "get",
  path: "/api/invoices",
  summary: "List invoices",
  description: "Retrieve firm invoices with filters",
  tags: ["Invoices"],
  request: { query: InvoiceQuerySchema },
  responses: {
    200: {
      description: "Invoices",
      content: { "application/json": { schema: InvoiceListSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/invoices/generate",
  summary: "Generate invoice",
  description: "Generate an invoice from approved time entries",
  tags: ["Invoices"],
  request: { body: { content: { "application/json": { schema: GenerateInvoiceSchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: InvoiceSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/invoices/{id}",
  summary: "Get invoice",
  description: "Retrieve invoice details including line items",
  tags: ["Invoices"],
  request: { params: registry.register("InvoiceIdParam", InvoiceSchema.pick({ id: true })) },
  responses: {
    200: {
      description: "Invoice details",
      content: { "application/json": { schema: InvoiceWithItemsSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/invoices/{id}",
  summary: "Update invoice",
  description: "Update draft invoice fields",
  tags: ["Invoices"],
  request: {
    params: registry.register("InvoiceUpdateIdParam", InvoiceSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateInvoiceSchema } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: InvoiceSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/invoices/{id}/send",
  summary: "Send invoice (approval required)",
  description: "Create an approval request to send an invoice",
  tags: ["Invoices", "Approvals"],
  request: { params: registry.register("InvoiceSendIdParam", InvoiceSchema.pick({ id: true })) },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/invoices/{id}/void",
  summary: "Void invoice",
  description: "Void a draft invoice (marks written off)",
  tags: ["Invoices"],
  request: { params: registry.register("InvoiceVoidIdParam", InvoiceSchema.pick({ id: true })) },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: InvoiceSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/invoices/{id}/pay-link",
  summary: "Generate payment link",
  description: "Generate a secure payment link for an invoice",
  tags: ["Invoices"],
  request: {
    params: registry.register("InvoicePayLinkIdParam", InvoiceSchema.pick({ id: true })),
  },
  responses: {
    201: {
      description: "Payment link generated",
      content: {
        "application/json": {
          schema: registry.register(
            "PaymentLinkResponse",
            z.object({
              paymentUrl: z.string().url(),
              token: z.string(),
              expiresAt: z.date(),
            })
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Payments
registry.registerPath({
  method: "get",
  path: "/api/payments",
  summary: "List payments",
  description: "Retrieve firm payments with filters",
  tags: ["Payments"],
  request: { query: PaymentQuerySchema },
  responses: {
    200: {
      description: "Payments",
      content: { "application/json": { schema: PaymentListSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/payments",
  summary: "Record payment",
  description: "Record a payment against an invoice",
  tags: ["Payments"],
  request: { body: { content: { "application/json": { schema: CreatePaymentSchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: PaymentSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/payments/{id}",
  summary: "Get payment",
  description: "Retrieve a payment record",
  tags: ["Payments"],
  request: { params: registry.register("PaymentIdParam", PaymentSchema.pick({ id: true })) },
  responses: {
    200: { description: "Payment", content: { "application/json": { schema: PaymentSchema } } },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/payments/{id}",
  summary: "Delete payment",
  description: "Delete a payment and recalculate invoice totals",
  tags: ["Payments"],
  request: { params: registry.register("PaymentDeleteIdParam", PaymentSchema.pick({ id: true })) },
  responses: {
    200: {
      description: "Deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Calendar
registry.registerPath({
  method: "get",
  path: "/api/calendar",
  summary: "List calendar events",
  description: "List calendar events in a date range",
  tags: ["Calendar"],
  request: { query: CalendarQuerySchema },
  responses: {
    200: { description: "Events", content: { "application/json": { schema: CalendarListSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/calendar",
  summary: "Create calendar event",
  description: "Create a calendar event (human-created)",
  tags: ["Calendar"],
  request: { body: { content: { "application/json": { schema: CreateCalendarEventSchema } } } },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: CalendarEventSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/calendar/{id}",
  summary: "Get calendar event",
  description: "Retrieve a calendar event",
  tags: ["Calendar"],
  request: {
    params: registry.register("CalendarEventIdParam", CalendarEventSchema.pick({ id: true })),
  },
  responses: {
    200: { description: "Event", content: { "application/json": { schema: CalendarEventSchema } } },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/calendar/{id}",
  summary: "Update calendar event",
  description: "Update a calendar event",
  tags: ["Calendar"],
  request: {
    params: registry.register("CalendarEventUpdateIdParam", CalendarEventSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateCalendarEventSchema } } },
  },
  responses: {
    200: {
      description: "Updated",
      content: { "application/json": { schema: CalendarEventSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/calendar/{id}",
  summary: "Delete calendar event",
  description: "Delete a calendar event",
  tags: ["Calendar"],
  request: {
    params: registry.register("CalendarEventDeleteIdParam", CalendarEventSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/calendar/upcoming",
  summary: "Upcoming calendar events",
  description: "Convenience endpoint for upcoming events",
  tags: ["Calendar"],
  request: { query: UpcomingCalendarQuerySchema },
  responses: {
    200: {
      description: "Upcoming events",
      content: { "application/json": { schema: UpcomingEventsSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/matters/{id}/ai/suggest-calendar",
  summary: "Suggest calendar events (approval required)",
  description: "Generate AI-proposed calendar events for a matter; returns an approval request",
  tags: ["Matters", "Calendar", "Approvals"],
  request: {
    params: registry.register("SuggestCalendarMatterIdParam", MatterSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: CalendarAISuggestRequestSchema } } },
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Templates
registry.registerPath({
  method: "get",
  path: "/api/templates",
  summary: "List templates",
  description: "List templates (firm + optionally system)",
  tags: ["Templates"],
  request: { query: TemplateQuerySchema },
  responses: {
    200: {
      description: "Templates",
      content: { "application/json": { schema: TemplateListSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/templates",
  summary: "Create template",
  description: "Create a firm template",
  tags: ["Templates"],
  request: { body: { content: { "application/json": { schema: CreateTemplateSchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: TemplateSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/templates/{id}",
  summary: "Get template",
  description: "Retrieve a template by id",
  tags: ["Templates"],
  request: { params: registry.register("TemplateIdParam", TemplateSchema.pick({ id: true })) },
  responses: {
    200: { description: "Template", content: { "application/json": { schema: TemplateSchema } } },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/templates/{id}",
  summary: "Update template",
  description: "Update a firm template (creates a new version)",
  tags: ["Templates"],
  request: {
    params: registry.register("TemplateUpdateIdParam", TemplateSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateTemplateSchema } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: TemplateSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/templates/{id}/preview",
  summary: "Preview template",
  description: "Render a template with provided data",
  tags: ["Templates"],
  request: {
    params: registry.register("TemplatePreviewIdParam", TemplateSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: PreviewTemplateSchema } } },
  },
  responses: {
    200: {
      description: "Rendered",
      content: { "application/json": { schema: PreviewTemplateResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/templates/{id}/generate",
  summary: "Generate from template",
  description: "Render a template (MVP returns rendered content)",
  tags: ["Templates"],
  request: {
    params: registry.register("TemplateGenerateIdParam", TemplateSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: PreviewTemplateSchema } } },
  },
  responses: {
    200: {
      description: "Rendered",
      content: { "application/json": { schema: GenerateTemplateResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/templates/propose",
  summary: "Propose template (approval required)",
  description: "Create an approval request for an AI-proposed template create/update",
  tags: ["Templates", "Approvals"],
  request: { body: { content: { "application/json": { schema: ProposeTemplateSchema } } } },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Intake: leads + quotes
registry.registerPath({
  method: "get",
  path: "/api/leads",
  summary: "List leads",
  description: "List firm leads",
  tags: ["Intake"],
  request: { query: LeadQuerySchema },
  responses: {
    200: { description: "Leads", content: { "application/json": { schema: LeadListSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/leads",
  summary: "Create lead",
  description: "Create a lead/enquiry",
  tags: ["Intake"],
  request: { body: { content: { "application/json": { schema: CreateLeadSchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: LeadSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/leads/{id}",
  summary: "Get lead",
  description: "Retrieve a lead by id",
  tags: ["Intake"],
  request: { params: registry.register("LeadIdParam", LeadSchema.pick({ id: true })) },
  responses: {
    200: { description: "Lead", content: { "application/json": { schema: LeadSchema } } },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/leads/{id}",
  summary: "Update lead",
  description: "Update a lead",
  tags: ["Intake"],
  request: {
    params: registry.register("LeadUpdateIdParam", LeadSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateLeadSchema } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: LeadSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/leads/{id}/convert",
  summary: "Convert lead",
  description: "Convert lead into a client and a matter",
  tags: ["Intake", "Matters", "Clients"],
  request: {
    params: registry.register("LeadConvertIdParam", LeadSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: ConvertLeadSchema } } },
  },
  responses: {
    200: {
      description: "Converted",
      content: { "application/json": { schema: ConvertLeadResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/quotes",
  summary: "List quotes",
  description: "List firm quotes",
  tags: ["Intake"],
  request: { query: QuoteQuerySchema },
  responses: {
    200: { description: "Quotes", content: { "application/json": { schema: QuoteListSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/quotes",
  summary: "Create quote",
  description: "Create a quote for a lead",
  tags: ["Intake"],
  request: { body: { content: { "application/json": { schema: CreateQuoteSchema } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: QuoteSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/quotes/{id}",
  summary: "Get quote",
  description: "Retrieve a quote",
  tags: ["Intake"],
  request: { params: registry.register("QuoteIdParam", QuoteSchema.pick({ id: true })) },
  responses: {
    200: { description: "Quote", content: { "application/json": { schema: QuoteSchema } } },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/quotes/{id}",
  summary: "Update quote",
  description: "Update a quote",
  tags: ["Intake"],
  request: {
    params: registry.register("QuoteUpdateIdParam", QuoteSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateQuoteSchema } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: QuoteSchema } } },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Conflicts
registry.registerPath({
  method: "post",
  path: "/api/conflicts/search",
  summary: "Run conflict search",
  description: "Run a conflict search and persist results",
  tags: ["Conflicts"],
  request: { body: { content: { "application/json": { schema: ConflictSearchRequestSchema } } } },
  responses: {
    200: {
      description: "Results",
      content: { "application/json": { schema: ConflictSearchResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/conflicts/by-matter/{matterId}",
  summary: "Get conflict check by matter",
  description: "Retrieve conflict check for a matter",
  tags: ["Conflicts"],
  request: {
    params: registry.register(
      "ConflictMatterIdParam",
      ConflictCheckSchema.pick({ matterId: true })
    ),
  },
  responses: {
    200: {
      description: "Conflict check",
      content: { "application/json": { schema: ConflictCheckSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/conflicts/{id}/clear",
  summary: "Clear conflict check (approval required)",
  description: "Create an approval request to clear a conflict check",
  tags: ["Conflicts", "Approvals"],
  request: {
    params: registry.register("ConflictClearIdParam", ConflictCheckSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: ConflictDecisionRequestSchema } } },
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/conflicts/{id}/waive",
  summary: "Waive conflict check (approval required)",
  description: "Create an approval request to waive a conflict check",
  tags: ["Conflicts", "Approvals"],
  request: {
    params: registry.register("ConflictWaiveIdParam", ConflictCheckSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: ConflictDecisionRequestSchema } } },
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Integrations
registry.registerPath({
  method: "get",
  path: "/api/integrations/email/accounts",
  summary: "List email accounts",
  description: "List connected email provider accounts for the firm",
  tags: ["Integrations"],
  request: { query: EmailAccountQuerySchema },
  responses: {
    200: {
      description: "List",
      content: { "application/json": { schema: EmailAccountListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/email/accounts",
  summary: "Connect email account",
  description: "Create an email provider connection (MVP token capture)",
  tags: ["Integrations"],
  request: { body: { content: { "application/json": { schema: CreateEmailAccountSchema } } } },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: EmailAccountCreateResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/calendar/accounts",
  summary: "List calendar accounts",
  description: "List connected calendar provider accounts for the firm",
  tags: ["Integrations"],
  request: { query: CalendarAccountQuerySchema },
  responses: {
    200: {
      description: "List",
      content: { "application/json": { schema: CalendarAccountListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/calendar/accounts",
  summary: "Connect calendar account",
  description: "Create a calendar provider connection (MVP token capture)",
  tags: ["Integrations"],
  request: { body: { content: { "application/json": { schema: CreateCalendarAccountSchema } } } },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: CalendarAccountCreateResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/payments/accounts",
  summary: "List payment provider accounts",
  description: "List connected payment provider accounts for the firm",
  tags: ["Integrations"],
  responses: {
    200: {
      description: "List",
      content: { "application/json": { schema: PaymentProviderAccountListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/payments/accounts",
  summary: "Connect payment provider",
  description: "Create a payment provider account (webhook setup)",
  tags: ["Integrations"],
  request: {
    body: { content: { "application/json": { schema: CreatePaymentProviderAccountSchema } } },
  },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: PaymentProviderAccountCreateResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/accounting/connections",
  summary: "List accounting connections",
  description: "List connected accounting provider connections for the firm",
  tags: ["Integrations"],
  responses: {
    200: {
      description: "List",
      content: { "application/json": { schema: AccountingConnectionListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/accounting/connections",
  summary: "Connect accounting provider",
  description: "Create an accounting provider connection (MVP token capture)",
  tags: ["Integrations"],
  request: {
    body: { content: { "application/json": { schema: CreateAccountingConnectionSchema } } },
  },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: AccountingConnectionCreateResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Integration account detail routes
registry.registerPath({
  method: "get",
  path: "/api/integrations/email/accounts/{id}",
  summary: "Get email account details",
  description: "Retrieve email account with webhook configuration",
  tags: ["Integrations"],
  request: {
    params: registry.register("EmailAccountIdParam", EmailAccountSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Email account details",
      content: { "application/json": { schema: EmailAccountWithSecretSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/integrations/email/accounts/{id}",
  summary: "Disconnect email account",
  description: "Revoke email account connection",
  tags: ["Integrations"],
  request: {
    params: registry.register("EmailAccountDeleteIdParam", EmailAccountSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Account disconnected",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/email/accounts/{id}/health",
  summary: "Check email account health",
  description: "Get email account connection status and health",
  tags: ["Integrations"],
  request: {
    params: registry.register("EmailAccountHealthIdParam", EmailAccountSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Health status",
      content: {
        "application/json": {
          schema: registry.register(
            "EmailAccountHealthResponse",
            z.object({
              status: z.string(),
              lastSyncAt: z.string().nullable(),
              webhookActive: z.boolean(),
            })
          ),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/email/accounts/{id}/reconnect",
  summary: "Reconnect email account",
  description: "Update email account tokens and reconnect",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "EmailAccountReconnectIdParam",
      EmailAccountSchema.pick({ id: true })
    ),
    body: {
      content: {
        "application/json": {
          schema: registry.register(
            "ReconnectAccountRequest",
            z.object({
              tokens: z.record(z.unknown()),
            })
          ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Account reconnected",
      content: {
        "application/json": {
          schema: registry.register(
            "ReconnectAccountResponse",
            z.object({
              id: z.string().uuid(),
              status: z.string(),
              updatedAt: z.date(),
            })
          ),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/calendar/accounts/{id}",
  summary: "Get calendar account details",
  description: "Retrieve calendar account with webhook configuration",
  tags: ["Integrations"],
  request: {
    params: registry.register("CalendarAccountIdParam", CalendarAccountSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Calendar account details",
      content: { "application/json": { schema: CalendarAccountWithSecretSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/integrations/calendar/accounts/{id}",
  summary: "Disconnect calendar account",
  description: "Revoke calendar account connection",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "CalendarAccountDeleteIdParam",
      CalendarAccountSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Account disconnected",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/calendar/accounts/{id}/health",
  summary: "Check calendar account health",
  description: "Get calendar account connection status and health",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "CalendarAccountHealthIdParam",
      CalendarAccountSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Health status",
      content: {
        "application/json": {
          schema: registry.register(
            "CalendarAccountHealthResponse",
            z.object({
              status: z.string(),
              lastSyncAt: z.string().nullable(),
              webhookActive: z.boolean(),
            })
          ),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/calendar/accounts/{id}/reconnect",
  summary: "Reconnect calendar account",
  description: "Update calendar account tokens and reconnect",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "CalendarAccountReconnectIdParam",
      CalendarAccountSchema.pick({ id: true })
    ),
    body: {
      content: { "application/json": { schema: z.object({ tokens: z.record(z.unknown()) }) } },
    },
  },
  responses: {
    200: {
      description: "Account reconnected",
      content: {
        "application/json": {
          schema: z.object({ id: z.string().uuid(), status: z.string(), updatedAt: z.date() }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/payments/accounts/{id}",
  summary: "Get payment account details",
  description: "Retrieve payment provider account with webhook configuration",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "PaymentProviderAccountIdParam",
      PaymentProviderAccountSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Payment account details",
      content: { "application/json": { schema: PaymentProviderAccountWithSecretSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/integrations/payments/accounts/{id}",
  summary: "Disconnect payment account",
  description: "Revoke payment provider account connection",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "PaymentProviderAccountDeleteIdParam",
      PaymentProviderAccountSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Account disconnected",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/payments/accounts/{id}/health",
  summary: "Check payment account health",
  description: "Get payment account connection status and health",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "PaymentProviderAccountHealthIdParam",
      PaymentProviderAccountSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Health status",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            lastSyncAt: z.string().nullable(),
            webhookActive: z.boolean(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/payments/accounts/{id}/reconnect",
  summary: "Reconnect payment account",
  description: "Update payment account tokens and reconnect",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "PaymentProviderAccountReconnectIdParam",
      PaymentProviderAccountSchema.pick({ id: true })
    ),
    body: {
      content: { "application/json": { schema: z.object({ tokens: z.record(z.unknown()) }) } },
    },
  },
  responses: {
    200: {
      description: "Account reconnected",
      content: {
        "application/json": {
          schema: z.object({ id: z.string().uuid(), status: z.string(), updatedAt: z.date() }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/accounting/connections/{id}",
  summary: "Get accounting connection details",
  description: "Retrieve accounting provider connection with webhook configuration",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "AccountingConnectionIdParam",
      AccountingConnectionSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Accounting connection details",
      content: { "application/json": { schema: AccountingConnectionWithSecretSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/integrations/accounting/connections/{id}",
  summary: "Disconnect accounting connection",
  description: "Revoke accounting provider connection",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "AccountingConnectionDeleteIdParam",
      AccountingConnectionSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Connection disconnected",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/integrations/accounting/connections/{id}/health",
  summary: "Check accounting connection health",
  description: "Get accounting connection status and health",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "AccountingConnectionHealthIdParam",
      AccountingConnectionSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Health status",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            lastSyncAt: z.string().nullable(),
            webhookActive: z.boolean(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/integrations/accounting/connections/{id}/reconnect",
  summary: "Reconnect accounting connection",
  description: "Update accounting connection tokens and reconnect",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "AccountingConnectionReconnectIdParam",
      AccountingConnectionSchema.pick({ id: true })
    ),
    body: {
      content: { "application/json": { schema: z.object({ tokens: z.record(z.unknown()) }) } },
    },
  },
  responses: {
    200: {
      description: "Connection reconnected",
      content: {
        "application/json": {
          schema: z.object({ id: z.string().uuid(), status: z.string(), updatedAt: z.date() }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Webhook endpoints
registry.registerPath({
  method: "post",
  path: "/api/webhooks/email/{firmId}/{accountId}",
  summary: "Email provider webhook",
  description: "Webhook endpoint for email provider events",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "EmailWebhookParams",
      z.object({
        firmId: z.string().uuid(),
        accountId: z.string().uuid(),
      })
    ),
    headers: registry.register(
      "WebhookHeaders",
      z.object({
        "x-webhook-secret": z.string(),
        "x-event-id": z.string().optional(),
      })
    ),
    body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
  },
  responses: {
    200: {
      description: "Event accepted",
      content: {
        "application/json": {
          schema: z.object({ accepted: z.boolean(), provider: z.string() }),
        },
      },
    },
    400: {
      description: "Invalid webhook",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/webhooks/calendar/{firmId}/{accountId}",
  summary: "Calendar provider webhook",
  description: "Webhook endpoint for calendar provider events",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "CalendarWebhookParams",
      z.object({
        firmId: z.string().uuid(),
        accountId: z.string().uuid(),
      })
    ),
    headers: z.object({
      "x-webhook-secret": z.string(),
      "x-event-id": z.string().optional(),
    }),
    body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
  },
  responses: {
    200: {
      description: "Event accepted",
      content: {
        "application/json": {
          schema: z.object({ accepted: z.boolean(), provider: z.string() }),
        },
      },
    },
    400: {
      description: "Invalid webhook",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/webhooks/payments/{firmId}/{accountId}",
  summary: "Payment provider webhook",
  description: "Webhook endpoint for payment provider events",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "PaymentWebhookParams",
      z.object({
        firmId: z.string().uuid(),
        accountId: z.string().uuid(),
      })
    ),
    headers: z.object({
      "x-webhook-secret": z.string(),
      "x-event-id": z.string().optional(),
    }),
    body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
  },
  responses: {
    200: {
      description: "Event accepted",
      content: {
        "application/json": {
          schema: z.object({ accepted: z.boolean(), provider: z.string() }),
        },
      },
    },
    400: {
      description: "Invalid webhook",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/webhooks/accounting/{firmId}/{connectionId}",
  summary: "Accounting provider webhook",
  description: "Webhook endpoint for accounting provider events",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "AccountingWebhookParams",
      z.object({
        firmId: z.string().uuid(),
        connectionId: z.string().uuid(),
      })
    ),
    headers: z.object({
      "x-webhook-secret": z.string(),
      "x-event-id": z.string().optional(),
    }),
    body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
  },
  responses: {
    200: {
      description: "Event accepted",
      content: {
        "application/json": {
          schema: z.object({ accepted: z.boolean(), provider: z.string() }),
        },
      },
    },
    400: {
      description: "Invalid webhook",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/webhooks/esignature/{firmId}/{requestId}",
  summary: "E-signature provider webhook",
  description: "Webhook endpoint for e-signature provider events",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "EsignatureWebhookParams",
      z.object({
        firmId: z.string().uuid(),
        requestId: z.string().uuid(),
      })
    ),
    headers: z.object({
      "x-webhook-secret": z.string(),
      "x-event-id": z.string().optional(),
    }),
    body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
  },
  responses: {
    200: {
      description: "Event accepted",
      content: {
        "application/json": {
          schema: z.object({ accepted: z.boolean(), provider: z.string() }),
        },
      },
    },
    400: {
      description: "Invalid webhook",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// E-signature
registry.registerPath({
  method: "get",
  path: "/api/signature-requests",
  summary: "List signature requests",
  description: "List signature requests for the firm",
  tags: ["Integrations"],
  request: { query: SignatureRequestQuerySchema },
  responses: {
    200: {
      description: "List",
      content: { "application/json": { schema: SignatureRequestListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/signature-requests",
  summary: "Create signature request (approval required)",
  description: "Create a signature request and an approval item to send it",
  tags: ["Integrations", "Approvals"],
  request: { body: { content: { "application/json": { schema: CreateSignatureRequestSchema } } } },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: CreateSignatureRequestResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/signature-requests/{id}",
  summary: "Get signature request",
  description: "Retrieve a signature request by ID",
  tags: ["Integrations"],
  request: {
    params: registry.register("SignatureRequestIdParam", SignatureRequestSchema.pick({ id: true })),
  },
  responses: {
    200: {
      description: "Signature request",
      content: { "application/json": { schema: SignatureRequestSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/signature-requests/{id}/send",
  summary: "Send signature request (approval required)",
  description: "Create approval request to send signature request to signers",
  tags: ["Integrations", "Approvals"],
  request: {
    params: registry.register(
      "SignatureRequestSendIdParam",
      SignatureRequestSchema.pick({ id: true })
    ),
  },
  responses: {
    201: {
      description: "Approval request created",
      content: { "application/json": { schema: ApprovalRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/signature-requests/{id}/remind",
  summary: "Send reminder for signature request",
  description: "Send reminder to signers who haven't signed yet",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "SignatureRequestRemindIdParam",
      SignatureRequestSchema.pick({ id: true })
    ),
  },
  responses: {
    200: {
      description: "Reminder sent",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/signature-requests/{id}/void",
  summary: "Void signature request",
  description: "Cancel signature request and mark as void",
  tags: ["Integrations"],
  request: {
    params: registry.register(
      "SignatureRequestVoidIdParam",
      SignatureRequestSchema.pick({ id: true })
    ),
    body: {
      content: {
        "application/json": {
          schema: registry.register(
            "VoidSignatureRequestRequest",
            z.object({
              reason: z.string().min(1).max(500),
            })
          ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signature request voided",
      content: { "application/json": { schema: SignatureRequestSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Semantic search
registry.registerPath({
  method: "post",
  path: "/api/search/semantic",
  summary: "Semantic search",
  description: "Semantic search over document chunks (pgvector)",
  tags: ["Search"],
  request: { body: { content: { "application/json": { schema: SemanticSearchRequestSchema } } } },
  responses: {
    200: {
      description: "Results",
      content: { "application/json": { schema: SemanticSearchResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/matters/{id}/search",
  summary: "Semantic search within matter",
  description: "Semantic search over a matter's document chunks (pgvector)",
  tags: ["Search"],
  request: {
    params: registry.register("MatterSearchIdParam", MatterSchema.pick({ id: true })),
    query: MatterSemanticSearchQuerySchema,
  },
  responses: {
    200: {
      description: "Results",
      content: { "application/json": { schema: SemanticSearchResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Storage
registry.registerPath({
  method: "post",
  path: "/api/storage/upload",
  summary: "Upload file",
  description: "Upload a file to MinIO storage",
  tags: ["Storage"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: registry.register(
            "FileUploadRequest",
            z.object({
              file: z.any().openapi({ type: "string", format: "binary" }),
              firmId: z.string().uuid(),
              description: z.string().optional(),
              tags: z.string().optional(),
            })
          ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "File uploaded",
      content: {
        "application/json": {
          schema: registry.register(
            "FileUploadResponse",
            z.object({
              success: z.boolean(),
              upload: z.object({
                id: z.string().uuid(),
                url: z.string().url(),
                filename: z.string(),
                originalName: z.string(),
                size: z.number(),
                mimeType: z.string(),
                metadata: z.record(z.unknown()).optional(),
              }),
            })
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Health check
registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Health check",
  description: "Check system health (PostgreSQL, Redis, MinIO)",
  tags: ["System"],
  responses: {
    200: {
      description: "System healthy",
      content: {
        "application/json": {
          schema: registry.register(
            "HealthCheckResponse",
            z.object({
              status: z.enum(["healthy", "degraded"]),
              timestamp: z.string(),
              services: z.object({
                postgres: z.boolean(),
                redis: z.boolean(),
                minio: z.boolean(),
                app: z.boolean(),
              }),
              details: z.record(z.string()),
            })
          ),
        },
      },
    },
    503: {
      description: "System degraded",
      content: {
        "application/json": {
          schema: registry.register(
            "HealthCheckDegradedResponse",
            z.object({
              status: z.enum(["healthy", "degraded"]),
              timestamp: z.string(),
              services: z.object({
                postgres: z.boolean(),
                redis: z.boolean(),
                minio: z.boolean(),
                app: z.boolean(),
              }),
              details: z.record(z.string()),
            })
          ),
        },
      },
    },
  },
});

// AI chat
registry.registerPath({
  method: "post",
  path: "/api/ai/chat",
  summary: "AI chat (streaming)",
  description: "Stream AI responses via OpenRouter",
  tags: ["AI"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registry.register(
            "ChatRequest",
            z.object({
              message: z.string().min(1).max(5000),
              model: z.string().optional(),
            })
          ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Streaming response",
      content: {
        "text/event-stream": {
          schema: z.object({
            data: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Jobs
registry.registerPath({
  method: "post",
  path: "/api/jobs/create",
  summary: "Create background job",
  description: "Add a job to the BullMQ queue",
  tags: ["Jobs"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registry.register(
            "CreateJobRequest",
            z.object({
              type: z.enum(["email", "generic"]),
              data: z.record(z.unknown()),
            })
          ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Job created",
      content: {
        "application/json": {
          schema: registry.register(
            "CreateJobResponse",
            z.object({
              success: z.boolean(),
              job: z.object({
                id: z.string(),
                name: z.string(),
                data: z.record(z.unknown()),
              }),
            })
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDoc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Legal Copilot API",
    version: "1.0.0",
    description: `
AI-first practice management API for UK law firms.

## Authentication
All endpoints require authentication via Bearer token.

## Rate Limiting
API requests are rate limited to 100 requests per minute.

## Pagination
List endpoints support pagination via \`page\` and \`limit\` query parameters.
    `.trim(),
    contact: {
      name: "Legal Copilot Support",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Clients", description: "Client management endpoints" },
    { name: "Matters", description: "Matter/case management endpoints" },
    { name: "Documents", description: "Document management endpoints" },
    { name: "Billing", description: "Time tracking and invoicing endpoints" },
    { name: "Approvals", description: "Human approval queue endpoints" },
    { name: "Calendar", description: "Calendar endpoints" },
    { name: "Emails", description: "Email endpoints" },
    { name: "Tasks", description: "Task management endpoints" },
    { name: "Notifications", description: "Notification endpoints" },
    { name: "Templates", description: "Template endpoints" },
    { name: "Intake", description: "Leads and quotes endpoints" },
    { name: "Conflicts", description: "Conflict checking endpoints" },
    { name: "Integrations", description: "External provider connections & webhooks" },
    { name: "Search", description: "Semantic search endpoints" },
    { name: "Storage", description: "File upload and storage endpoints" },
    { name: "System", description: "System health and monitoring endpoints" },
    { name: "AI", description: "AI and ML endpoints" },
    { name: "Jobs", description: "Background job queue endpoints" },
  ],
});

// Write to file
const outputDir = path.join(__dirname, "../docs/api");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "openapi.yaml");
fs.writeFileSync(outputPath, yaml.stringify(openApiDoc));

console.log(`OpenAPI spec generated at: ${outputPath}`);
