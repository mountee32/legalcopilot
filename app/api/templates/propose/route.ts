import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, templates } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ProposeTemplateSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:use")(
      withPermission("templates:write")(async (request: NextRequest, { user }) => {
        const body = await request.json().catch(() => ({}));
        const data = ProposeTemplateSchema.parse(body);

        const firmId = await getOrCreateFirmIdForUser(user.user.id);

        const approval = await withFirmDb(firmId, async (tx) => {
          let entityId: string | null = null;
          if (data.action === "template.update") {
            if (!data.templateId)
              throw new ValidationError("templateId is required for template.update");
            const [tpl] = await tx
              .select({ id: templates.id })
              .from(templates)
              .where(and(eq(templates.id, data.templateId), eq(templates.firmId, firmId)))
              .limit(1);
            if (!tpl) throw new NotFoundError("Template not found");
            entityId = tpl.id;
          }

          if (data.action === "template.create") {
            if (!data.draft?.name || !data.draft?.type || !data.draft?.content) {
              throw new ValidationError("draft.name, draft.type and draft.content are required");
            }
          }

          const [row] = await tx
            .insert(approvalRequests)
            .values({
              firmId,
              sourceType: "ai",
              sourceId: user.user.id,
              action: data.action,
              summary:
                data.action === "template.create"
                  ? "Create template (AI proposal)"
                  : "Update template (AI proposal)",
              proposedPayload: data,
              entityType: "template",
              entityId,
              aiMetadata: { proposedBy: user.user.id },
              updatedAt: new Date(),
            })
            .returning();

          if (!row) throw new ValidationError("Failed to create approval request");
          return row;
        });

        return NextResponse.json(approval, { status: 201 });
      })
    )
  )
);
