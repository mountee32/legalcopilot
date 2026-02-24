/**
 * Risk Score Engine
 *
 * Pure function that calculates a matter's risk score (0-100)
 * from aggregated pipeline findings. Used automatically after
 * pipeline completion and on-demand via the recalculate API.
 */

export interface RiskFactor {
  key: string;
  label: string;
  contribution: number;
  detail: string;
}

export interface RiskResult {
  score: number;
  factors: RiskFactor[];
}

interface FindingInput {
  status: string;
  impact: string;
  confidence: string;
}

/**
 * Calculate a risk score (0-100) from pipeline findings.
 *
 * 5 weighted factors:
 *   - Critical pending findings (weight 30)
 *   - Conflict findings (weight 25)
 *   - High-impact ratio (weight 20)
 *   - Low confidence average (weight 15)
 *   - Unresolved pending count (weight 10)
 */
export function calculateRiskScore(findings: FindingInput[]): RiskResult {
  if (findings.length === 0) {
    return { score: 0, factors: [] };
  }

  const factors: RiskFactor[] = [];

  // 1. Critical pending findings (weight 30)
  const criticalPending = findings.filter(
    (f) => f.impact === "critical" && (f.status === "pending" || f.status === "conflict")
  ).length;
  const criticalContribution = Math.min(criticalPending * 15, 30);
  if (criticalContribution > 0) {
    factors.push({
      key: "critical_pending",
      label: "Critical pending findings",
      contribution: criticalContribution,
      detail: `${criticalPending} critical finding${criticalPending !== 1 ? "s" : ""} awaiting review`,
    });
  }

  // 2. Conflict findings (weight 25)
  const conflictCount = findings.filter((f) => f.status === "conflict").length;
  const conflictContribution = Math.min(conflictCount * 12, 25);
  if (conflictContribution > 0) {
    factors.push({
      key: "conflicts",
      label: "Data conflicts",
      contribution: conflictContribution,
      detail: `${conflictCount} finding${conflictCount !== 1 ? "s" : ""} conflict with existing data`,
    });
  }

  // 3. High-impact ratio (weight 20)
  const highOrCritical = findings.filter(
    (f) => f.impact === "high" || f.impact === "critical"
  ).length;
  const highImpactRatio = highOrCritical / findings.length;
  const highImpactContribution = Math.round(highImpactRatio * 20);
  if (highImpactContribution > 0) {
    factors.push({
      key: "high_impact_ratio",
      label: "High-impact finding ratio",
      contribution: highImpactContribution,
      detail: `${highOrCritical} of ${findings.length} findings are high or critical impact`,
    });
  }

  // 4. Low confidence average (weight 15)
  const confidences = findings.map((f) => parseFloat(f.confidence) || 0);
  const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const confidenceContribution = avgConf < 0.75 ? 15 : avgConf < 0.85 ? 8 : 0;
  if (confidenceContribution > 0) {
    factors.push({
      key: "low_confidence",
      label: "Low average confidence",
      contribution: confidenceContribution,
      detail: `Average confidence ${Math.round(avgConf * 100)}% across ${findings.length} findings`,
    });
  }

  // 5. Unresolved pending (weight 10)
  const pendingCount = findings.filter((f) => f.status === "pending").length;
  const pendingContribution = Math.min(pendingCount * 2, 10);
  if (pendingContribution > 0) {
    factors.push({
      key: "unresolved_pending",
      label: "Unresolved findings",
      contribution: pendingContribution,
      detail: `${pendingCount} finding${pendingCount !== 1 ? "s" : ""} still pending review`,
    });
  }

  const score = Math.min(
    factors.reduce((sum, f) => sum + f.contribution, 0),
    100
  );

  return { score, factors };
}
