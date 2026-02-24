# BUG: Matter Schema Missing Risk Score Field

## Summary

The `matters` table schema is missing a `riskScore` field required for the AI risk assessment feature in Epic 1 (Case Command Centre).

## Missing Field

### `riskScore` (required)

**User Story Reference**: "calculate risk score" - AI should assess and display matter risk level.

**Suggested Implementation**:

```typescript
riskScore: integer("risk_score"), // 0-100 scale
riskFactors: jsonb("risk_factors"), // Array of { factor, weight, value } for explainability
riskAssessedAt: timestamp("risk_assessed_at"), // When AI last calculated risk
```

## Current Schema Location

`lib/db/schema/matters.ts`

## Impact

- Cannot display AI-calculated risk scores
- Cannot prioritize high-risk matters
- Cannot provide risk-based supervision recommendations
- Missing key differentiator for AI-first platform

## Acceptance Criteria

- [ ] Add `riskScore` integer field (0-100)
- [ ] Add `riskFactors` jsonb for AI explainability
- [ ] Add `riskAssessedAt` timestamp
- [ ] Update matter API to calculate/return risk
- [ ] Add migration
