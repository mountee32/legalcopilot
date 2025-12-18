/**
 * GET /api/litigation/limitation/calculate
 *
 * Calculate limitation dates for litigation cases.
 * Uses UK limitation periods based on case type.
 */

import { NextRequest, NextResponse } from "next/server";
import { CalculateLimitationRequestSchema } from "@/lib/api/schemas/practice-modules";

/**
 * UK limitation periods by case type.
 * https://www.legislation.gov.uk/ukpga/1980/58
 */
const LIMITATION_PERIODS: Record<string, { years: number; description: string }> = {
  civil: {
    years: 6,
    description: "Contract and tort claims (Limitation Act 1980, s.5 & s.2)",
  },
  employment: {
    years: 0,
    description:
      "3 months less one day from effective date of termination (Employment Rights Act 1996)",
  },
  family: {
    years: 1,
    description: "Financial remedy applications (Matrimonial Causes Act 1973)",
  },
  immigration: {
    years: 0,
    description: "Varies by application type - typically 14 days from decision",
  },
  criminal: {
    years: 0,
    description:
      "No limitation period for indictable offences; summary offences typically 6 months",
  },
};

function calculateLimitationDate(
  caseType: string,
  incidentDate: string,
  knowledgeDate?: string
): {
  limitationDate: string;
  calculation: string;
  periodYears: number;
  notes?: string;
} {
  const period = LIMITATION_PERIODS[caseType] || LIMITATION_PERIODS.civil;
  const startDate = new Date(knowledgeDate || incidentDate);

  // Handle special cases
  if (caseType === "employment") {
    // 3 months less one day
    const limitDate = new Date(startDate);
    limitDate.setMonth(limitDate.getMonth() + 3);
    limitDate.setDate(limitDate.getDate() - 1);

    return {
      limitationDate: limitDate.toISOString().split("T")[0],
      calculation: `Incident date ${incidentDate} + 3 months - 1 day`,
      periodYears: 0,
      notes: period.description,
    };
  }

  if (caseType === "immigration" || caseType === "criminal") {
    return {
      limitationDate: incidentDate,
      calculation: "Varies by application type",
      periodYears: 0,
      notes: period.description,
    };
  }

  // Standard calculation: start date + limitation period
  const limitDate = new Date(startDate);
  limitDate.setFullYear(limitDate.getFullYear() + period.years);

  const calculation = knowledgeDate
    ? `Knowledge date ${knowledgeDate} + ${period.years} years`
    : `Incident date ${incidentDate} + ${period.years} years`;

  return {
    limitationDate: limitDate.toISOString().split("T")[0],
    calculation,
    periodYears: period.years,
    notes: period.description,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = {
      caseType: searchParams.get("caseType"),
      incidentDate: searchParams.get("incidentDate"),
      knowledgeDate: searchParams.get("knowledgeDate") || undefined,
    };

    const parsed = CalculateLimitationRequestSchema.safeParse(queryData);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { caseType, incidentDate, knowledgeDate } = parsed.data;
    const result = calculateLimitationDate(caseType, incidentDate, knowledgeDate);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating limitation date:", error);
    return NextResponse.json({ error: "Failed to calculate limitation date" }, { status: 500 });
  }
}
