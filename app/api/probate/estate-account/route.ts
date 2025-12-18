/**
 * POST /api/probate/estate-account
 *
 * Generate an estate account for a probate matter.
 * Summarizes assets, liabilities, and distributions.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { GenerateEstateAccountRequestSchema } from "@/lib/api/schemas/practice-modules";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = GenerateEstateAccountRequestSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify the matter exists and is a probate matter
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) {
          throw new NotFoundError("Matter not found");
        }

        if (matter.practiceArea !== "probate") {
          throw new ValidationError(
            `Matter is not a probate matter (practiceArea: ${matter.practiceArea})`
          );
        }

        // Extract probate data
        const probateData = (matter.practiceData as any) || {};
        const assets = probateData.assets || [];
        const liabilities = probateData.liabilities || [];
        const distributions = probateData.distributions || [];

        // Calculate totals
        let estateGrossValue = 0;
        if (data.includeAssets) {
          estateGrossValue = assets.reduce((sum: number, asset: any) => {
            const value = typeof asset.value === "string" ? parseFloat(asset.value) : asset.value;
            return sum + (value || 0);
          }, 0);
        }

        let totalLiabilities = 0;
        if (data.includeLiabilities) {
          totalLiabilities = liabilities.reduce((sum: number, liability: any) => {
            const amount =
              typeof liability.amount === "string"
                ? parseFloat(liability.amount)
                : liability.amount;
            return sum + (amount || 0);
          }, 0);
        }

        const estateNetValue = estateGrossValue - totalLiabilities;

        let totalDistributions = 0;
        if (data.includeDistributions) {
          totalDistributions = distributions.reduce((sum: number, distribution: any) => {
            const amount =
              typeof distribution.amount === "string"
                ? parseFloat(distribution.amount)
                : distribution.amount;
            return sum + (amount || 0);
          }, 0);
        }

        const remainingBalance = estateNetValue - totalDistributions;

        // Generate summary
        const summaryParts = [];
        if (data.includeAssets) {
          summaryParts.push(`${assets.length} asset(s) totaling £${estateGrossValue.toFixed(2)}`);
        }
        if (data.includeLiabilities) {
          summaryParts.push(
            `${liabilities.length} liability(ies) totaling £${totalLiabilities.toFixed(2)}`
          );
        }
        summaryParts.push(`Net estate value: £${estateNetValue.toFixed(2)}`);
        if (data.includeDistributions) {
          summaryParts.push(
            `${distributions.length} distribution(s) totaling £${totalDistributions.toFixed(2)}`
          );
        }
        summaryParts.push(`Remaining balance: £${remainingBalance.toFixed(2)}`);

        const summary = summaryParts.join(". ");

        return {
          estateGrossValue: estateGrossValue.toFixed(2),
          estateNetValue: estateNetValue.toFixed(2),
          totalDistributions: totalDistributions.toFixed(2),
          remainingBalance: remainingBalance.toFixed(2),
          summary,
        };
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    })
  )
);
