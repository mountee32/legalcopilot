import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { templates } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { PreviewTemplateSchema } from "@/lib/api/schemas";
import { renderTemplate } from "@/lib/templates/render";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("templates:read")(async (request: NextRequest, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Template not found");

      const body = await request.json().catch(() => ({}));
      const data = PreviewTemplateSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const tpl = await withFirmDb(firmId, async (tx) => {
        const [tpl] = await tx
          .select({ content: templates.content })
          .from(templates)
          .where(
            and(eq(templates.id, id), or(eq(templates.firmId, firmId), isNull(templates.firmId))!)
          )
          .limit(1);
        return tpl ?? null;
      });

      if (!tpl) throw new NotFoundError("Template not found");

      const rendered = renderTemplate(tpl.content, data.data);
      return NextResponse.json({ success: true, rendered });
    })
  )
);
