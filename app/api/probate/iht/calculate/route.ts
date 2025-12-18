/**
 * POST /api/probate/iht/calculate
 *
 * Calculate Inheritance Tax (IHT) for estates.
 * Uses UK IHT rates and nil rate band as of 2024/25.
 */

import { NextRequest, NextResponse } from "next/server";
import { CalculateIHTRequestSchema } from "@/lib/api/schemas/practice-modules";

/**
 * UK IHT calculation based on 2024/25 rates.
 * https://www.gov.uk/inheritance-tax
 *
 * Current rates:
 * - Nil rate band: £325,000
 * - Standard rate: 40% on amount above nil rate band
 * - Reduced rate: 36% if 10%+ left to charity (not implemented here)
 */
function calculateIHT(
  estateGrossValue: number,
  liabilities: number,
  exemptions: number = 0,
  reliefs: number = 0
): {
  estateNetValue: string;
  nilRateBand: string;
  taxableAmount: string;
  ihtPayable: string;
  effectiveRate: string;
  notes?: string;
} {
  // Calculate net estate value
  const netValue = estateGrossValue - liabilities;

  // Apply exemptions and reliefs
  const taxableValue = Math.max(0, netValue - exemptions - reliefs);

  // 2024/25 nil rate band
  const nilRateBand = 325000;
  const ihtRate = 0.4; // 40%

  // Calculate IHT
  let ihtPayable = 0;
  let notes: string | undefined;

  if (taxableValue > nilRateBand) {
    ihtPayable = (taxableValue - nilRateBand) * ihtRate;
    notes = `IHT charged at 40% on amount over £325,000 nil rate band`;
  } else {
    notes = "No IHT payable - estate within nil rate band";
  }

  // Calculate effective rate
  const effectiveRate = netValue > 0 ? (ihtPayable / netValue) * 100 : 0;

  return {
    estateNetValue: netValue.toFixed(2),
    nilRateBand: nilRateBand.toFixed(2),
    taxableAmount: Math.max(0, taxableValue - nilRateBand).toFixed(2),
    ihtPayable: ihtPayable.toFixed(2),
    effectiveRate: effectiveRate.toFixed(1),
    notes,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CalculateIHTRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { estateGrossValue, liabilities, exemptions, reliefs } = parsed.data;

    // Convert string money values to numbers
    const grossNum = parseFloat(estateGrossValue);
    const liabilitiesNum = parseFloat(liabilities);
    const exemptionsNum = exemptions ? parseFloat(exemptions) : 0;
    const reliefsNum = reliefs ? parseFloat(reliefs) : 0;

    const result = calculateIHT(grossNum, liabilitiesNum, exemptionsNum, reliefsNum);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating IHT:", error);
    return NextResponse.json({ error: "Failed to calculate IHT" }, { status: 500 });
  }
}
