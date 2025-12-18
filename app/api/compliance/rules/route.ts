import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { complianceRules } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateComplianceRuleSchema, RulesQuerySchema } from "@/lib/api/schemas/compliance";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("compliance:read")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const { searchParams } = new URL(request.url);

      // Parse and validate query parameters
      const query = RulesQuerySchema.parse({
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20",
        type: searchParams.get("type") || undefined,
        isActive: searchParams.get("isActive") || undefined,
      });

      const offset = (query.page - 1) * query.limit;

      const result = await withFirmDb(firmId, async (tx) => {
        // Build filters
        const filters = [eq(complianceRules.firmId, firmId)];

        if (query.type) {
          filters.push(eq(complianceRules.type, query.type as any));
        }

        if (query.isActive !== undefined) {
          filters.push(eq(complianceRules.isActive, query.isActive));
        }

        // Get rules
        const rules = await tx
          .select()
          .from(complianceRules)
          .where(and(...filters))
          .limit(query.limit)
          .offset(offset);

        // Get total count
        const [{ count }] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(complianceRules)
          .where(and(...filters));

        const total = Number(count);
        const totalPages = Math.ceil(total / query.limit);

        return {
          rules: rules.map((r) => ({
            id: r.id,
            firmId: r.firmId,
            name: r.name,
            description: r.description,
            type: r.type,
            isActive: r.isActive,
            condition: r.condition,
            alertPriority: r.alertPriority,
            alertTemplate: r.alertTemplate,
            checkInterval: r.checkInterval,
            lastCheckedAt: r.lastCheckedAt?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            createdBy: r.createdBy,
          })),
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("compliance:write")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateComplianceRuleSchema.parse(body);

      const rule = await withFirmDb(firmId, async (tx) => {
        const [newRule] = await tx
          .insert(complianceRules)
          .values({
            firmId,
            name: data.name,
            description: data.description || null,
            type: data.type,
            isActive: data.isActive,
            condition: data.condition,
            alertPriority: data.alertPriority,
            alertTemplate: data.alertTemplate,
            checkInterval: data.checkInterval || null,
            createdBy: user.user.id,
          })
          .returning();

        return newRule;
      });

      return NextResponse.json({
        id: rule.id,
        firmId: rule.firmId,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        isActive: rule.isActive,
        condition: rule.condition,
        alertPriority: rule.alertPriority,
        alertTemplate: rule.alertTemplate,
        checkInterval: rule.checkInterval,
        lastCheckedAt: rule.lastCheckedAt?.toISOString() || null,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        createdBy: rule.createdBy,
      });
    })
  )
);
