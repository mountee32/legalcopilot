/**
 * Taxonomy Pack Categories API
 *
 * POST /api/taxonomy/packs/:packId/categories - Create a category in a firm-owned pack.
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { taxonomyPacks, taxonomyCategories } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTaxonomyCategorySchema } from "@/lib/api/schemas/taxonomy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, ForbiddenError, NotFoundError } from "@/middleware/withErrorHandler";

type RouteContext = {
  params: Promise<{ packId: string }>;
};

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:configure")(async (request: NextRequest, context) => {
      const { user, ...rest } = context as { user: any } & RouteContext;
      const { packId } = await rest.params;
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaxonomyCategorySchema.parse(body);

      const category = await withFirmDb(firmId, async (tx) => {
        const [pack] = await tx
          .select()
          .from(taxonomyPacks)
          .where(eq(taxonomyPacks.id, packId))
          .limit(1);

        if (!pack) throw new NotFoundError("Taxonomy pack not found");

        if (pack.firmId !== firmId) {
          if (pack.firmId === null) {
            throw new ForbiddenError("Cannot modify system taxonomy packs; fork a pack first");
          }
          throw new NotFoundError("Taxonomy pack not found");
        }

        const [created] = await tx
          .insert(taxonomyCategories)
          .values({
            packId,
            key: data.key,
            label: data.label,
            description: data.description ?? null,
            icon: data.icon ?? null,
            color: data.color ?? null,
            sortOrder: data.sortOrder ?? 0,
          })
          .returning();

        return created;
      });

      return NextResponse.json(category, { status: 201 });
    })
  )
);
