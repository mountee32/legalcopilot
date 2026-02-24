/**
 * POST /api/real-estate/transfer-tax/calculate
 *
 * Estimate US real-estate transfer taxes using state baseline rates
 * and optional local rate overrides.
 *
 * Note: this is an estimate utility and not legal or tax advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { CalculateUsTransferTaxRequestSchema } from "@/lib/api/schemas/practice-modules";

const STATE_BASE_TRANSFER_RATES: Record<string, number> = {
  CA: 0.0011,
  FL: 0.007,
  NY: 0.004,
  TX: 0,
};

function parseMoney(value: string): number {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid money value: ${value}`);
  }
  return parsed;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatPercentFromRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CalculateUsTransferTaxRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const state = data.state.toUpperCase();
    const salePrice = parseMoney(data.salePrice);
    const stateRate = data.overrideStateRate ?? STATE_BASE_TRANSFER_RATES[state] ?? 0;
    const countyRate = data.countyRate ?? 0;
    const cityRate = data.cityRate ?? 0;

    const stateAmount = salePrice * stateRate;
    const countyAmount = salePrice * countyRate;
    const cityAmount = salePrice * cityRate;
    const total = stateAmount + countyAmount + cityAmount;
    const effectiveRate = salePrice > 0 ? total / salePrice : 0;

    const assumptions = [
      `State baseline rate for ${state}: ${formatPercentFromRate(stateRate)}`,
      `County rate input: ${formatPercentFromRate(countyRate)}`,
      `City rate input: ${formatPercentFromRate(cityRate)}`,
    ];

    if (data.overrideStateRate !== undefined) {
      assumptions.push("State rate override was applied.");
    }

    if (data.transferType !== "sale") {
      assumptions.push(
        `Transfer type is '${data.transferType}'. Exemptions and reduced rates may apply by jurisdiction.`
      );
    }

    return NextResponse.json({
      salePrice: formatMoney(salePrice),
      state,
      transferType: data.transferType,
      stateRate: formatPercentFromRate(stateRate),
      countyRate: formatPercentFromRate(countyRate),
      cityRate: formatPercentFromRate(cityRate),
      breakdown: [
        {
          jurisdiction: `${state} state`,
          rate: formatPercentFromRate(stateRate),
          amount: formatMoney(stateAmount),
        },
        {
          jurisdiction: "County",
          rate: formatPercentFromRate(countyRate),
          amount: formatMoney(countyAmount),
        },
        {
          jurisdiction: "City",
          rate: formatPercentFromRate(cityRate),
          amount: formatMoney(cityAmount),
        },
      ],
      totalTransferTax: formatMoney(total),
      effectiveRate: formatPercentFromRate(effectiveRate),
      assumptions,
      disclaimer:
        "Estimate only. Verify current transfer taxes, exemptions, and documentary requirements with local authorities.",
    });
  } catch (error) {
    console.error("Error estimating transfer tax:", error);
    return NextResponse.json({ error: "Failed to estimate transfer tax" }, { status: 500 });
  }
}
