/**
 * POST /api/probate/estate-tax/calculate
 *
 * Estimate US federal/state estate tax exposure for probate planning workflows.
 *
 * Note: this is an estimate utility and not legal or tax advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { CalculateUsEstateTaxRequestSchema } from "@/lib/api/schemas/practice-modules";

const FALLBACK_FEDERAL_EXEMPTION = 13610000;

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

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function getDefaultFederalExemption(): number {
  const configured = process.env.US_FEDERAL_ESTATE_TAX_EXEMPTION;
  if (!configured) return FALLBACK_FEDERAL_EXEMPTION;
  const parsed = Number.parseFloat(configured);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : FALLBACK_FEDERAL_EXEMPTION;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CalculateUsEstateTaxRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const grossEstateValue = parseMoney(data.estateGrossValue);
    const liabilities = parseMoney(data.liabilities ?? "0.00");
    const deductions = parseMoney(data.deductions ?? "0.00");
    const taxableLifetimeGifts = parseMoney(data.taxableLifetimeGifts ?? "0.00");
    const federalExemption = parseMoney(
      data.federalExemption ?? formatMoney(getDefaultFederalExemption())
    );
    const federalRate = data.federalRate ?? 0.4;
    const stateExemption = parseMoney(data.stateExemption ?? "0.00");
    const stateRate = data.stateRate ?? 0;

    const estateNetValue = Math.max(0, grossEstateValue - liabilities);
    const adjustedTaxBase = Math.max(0, estateNetValue - deductions + taxableLifetimeGifts);
    const federalTaxableAmount = Math.max(0, adjustedTaxBase - federalExemption);
    const federalEstateTax = federalTaxableAmount * federalRate;

    const stateTaxableAmount = Math.max(0, adjustedTaxBase - stateExemption);
    const stateEstateTax = stateTaxableAmount * stateRate;

    const totalEstimatedTax = federalEstateTax + stateEstateTax;
    const effectiveRate = grossEstateValue > 0 ? totalEstimatedTax / grossEstateValue : 0;

    const assumptions = [
      `Federal exemption used: $${formatMoney(federalExemption)}`,
      `Federal rate used: ${formatPercent(federalRate)}`,
      `State rate used: ${formatPercent(stateRate)}`,
      `State exemption used: $${formatMoney(stateExemption)}`,
    ];

    if (data.state) {
      assumptions.push(`State context provided: ${data.state.toUpperCase()}`);
    }

    assumptions.push(
      "Deductions and taxable lifetime gifts are simplified inputs and should be reviewed by counsel."
    );

    return NextResponse.json({
      estateNetValue: formatMoney(estateNetValue),
      adjustedTaxBase: formatMoney(adjustedTaxBase),
      federalTaxableAmount: formatMoney(federalTaxableAmount),
      federalEstateTax: formatMoney(federalEstateTax),
      stateTaxableAmount: formatMoney(stateTaxableAmount),
      stateEstateTax: formatMoney(stateEstateTax),
      totalEstimatedTax: formatMoney(totalEstimatedTax),
      effectiveRate: formatPercent(effectiveRate),
      assumptions,
      disclaimer:
        "Estimate only. Federal and state estate tax outcomes vary by jurisdiction, elections, and filing year.",
    });
  } catch (error) {
    console.error("Error estimating estate tax:", error);
    return NextResponse.json({ error: "Failed to estimate estate tax" }, { status: 500 });
  }
}
