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
  EmailSchema,
  EmailListSchema,
  EmailQuerySchema,
  CreateEmailSchema,
  UpdateEmailSchema,
  EmailAIProcessResponseSchema,
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
registry.register("Email", EmailSchema);
registry.register("EmailListResponse", EmailListSchema);
registry.register("EmailQuery", EmailQuerySchema);
registry.register("CreateEmailRequest", CreateEmailSchema);
registry.register("UpdateEmailRequest", UpdateEmailSchema);
registry.register("EmailAIProcessResponse", EmailAIProcessResponseSchema);

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
    201: { description: "Created", content: { "application/json": { schema: EmailSchema } } },
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
  request: { params: registry.register("EmailIdParam", EmailSchema.pick({ id: true })) },
  responses: {
    200: { description: "Email", content: { "application/json": { schema: EmailSchema } } },
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
    params: registry.register("EmailUpdateIdParam", EmailSchema.pick({ id: true })),
    body: { content: { "application/json": { schema: UpdateEmailSchema } } },
  },
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: EmailSchema } } },
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
  request: { params: registry.register("EmailAIProcessIdParam", EmailSchema.pick({ id: true })) },
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
  ],
});

// Write to file
const outputDir = path.join(__dirname, "../docs/api");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "openapi.yaml");
fs.writeFileSync(outputPath, yaml.stringify(openApiDoc));

console.log(`OpenAPI spec generated at: ${outputPath}`);
