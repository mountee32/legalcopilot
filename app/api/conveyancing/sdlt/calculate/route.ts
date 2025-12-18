/**
 * POST /api/conveyancing/sdlt/calculate
 *
 * Calculate Stamp Duty Land Tax (SDLT) for property transactions.
 * Uses UK SDLT rates and thresholds as of 2024.
 */

import { NextRequest, NextResponse } from "next/server";
import { CalculateSDLTRequestSchema } from "@/lib/api/schemas/practice-modules";

/**
 * SDLT calculation logic based on UK 2024 rates.
 * https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
 */
function calculateSDLT(
  purchasePrice: number,
  propertyType: "freehold" | "leasehold" | "commonhold",
  isFirstTimeBuyer: boolean,
  isAdditionalProperty: boolean
): {
  sdltAmount: string;
  breakdown: Array<{
    band: string;
    rate: string;
    taxableAmount: string;
    sdlt: string;
  }>;
  notes?: string;
} {
  const breakdown: Array<{
    band: string;
    rate: string;
    taxableAmount: string;
    sdlt: string;
  }> = [];

  let totalSDLT = 0;
  let notes: string | undefined;

  // Additional property surcharge (3% on all bands)
  const surcharge = isAdditionalProperty ? 0.03 : 0;

  // First-time buyer relief (up to £625,000)
  if (isFirstTimeBuyer && purchasePrice <= 625000) {
    notes = "First-time buyer relief applied";
    if (purchasePrice <= 425000) {
      breakdown.push({
        band: "£0 - £425,000",
        rate: "0%",
        taxableAmount: purchasePrice.toFixed(2),
        sdlt: "0.00",
      });
      return {
        sdltAmount: "0.00",
        breakdown,
        notes: "No SDLT due - first-time buyer relief",
      };
    }
    // First-time buyer paying on amount over £425,000
    const taxable = purchasePrice - 425000;
    const sdlt = taxable * 0.05;
    totalSDLT = sdlt;
    breakdown.push({
      band: "£0 - £425,000",
      rate: "0%",
      taxableAmount: "425000.00",
      sdlt: "0.00",
    });
    breakdown.push({
      band: "£425,001 - £625,000",
      rate: "5%",
      taxableAmount: taxable.toFixed(2),
      sdlt: sdlt.toFixed(2),
    });
  } else {
    // Standard residential rates
    const bands = [
      { threshold: 250000, rate: 0.0 + surcharge, label: "£0 - £250,000" },
      { threshold: 925000, rate: 0.05 + surcharge, label: "£250,001 - £925,000" },
      { threshold: 1500000, rate: 0.1 + surcharge, label: "£925,001 - £1,500,000" },
      { threshold: Infinity, rate: 0.12 + surcharge, label: "Over £1,500,000" },
    ];

    let remaining = purchasePrice;
    let previousThreshold = 0;

    for (const band of bands) {
      if (remaining <= 0) break;

      const bandSize = Math.min(remaining, band.threshold - previousThreshold);
      const sdlt = bandSize * band.rate;
      totalSDLT += sdlt;

      breakdown.push({
        band: band.label,
        rate: `${(band.rate * 100).toFixed(1)}%`,
        taxableAmount: bandSize.toFixed(2),
        sdlt: sdlt.toFixed(2),
      });

      remaining -= bandSize;
      previousThreshold = band.threshold;
    }

    if (isAdditionalProperty) {
      notes = "Additional property surcharge (3%) applied";
    }
  }

  return {
    sdltAmount: totalSDLT.toFixed(2),
    breakdown,
    notes,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CalculateSDLTRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { purchasePrice, propertyType, isFirstTimeBuyer, isAdditionalProperty } = parsed.data;

    // Convert string money to number
    const priceNum = parseFloat(purchasePrice);

    const result = calculateSDLT(priceNum, propertyType, isFirstTimeBuyer, isAdditionalProperty);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating SDLT:", error);
    return NextResponse.json({ error: "Failed to calculate SDLT" }, { status: 500 });
  }
}
