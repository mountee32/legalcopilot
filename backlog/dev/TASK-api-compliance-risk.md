# TASK: Compliance & risk engine APIs

## Goal

Provide the backend surface needed for compliance dashboards and proactive risk alerts.

## Scope

- Case-level risk scores, rule evaluations, and action items
- Supervision/workload signals and compliance reporting exports
- Alert generation and notification hooks

## Acceptance Criteria

- Compliance UI can query current risk state and drill into underlying evidence
- All evaluations are auditable and explainable

## References

- `docs/ideas.md` (Epic 9)

## Design

### New Schema (`lib/db/schema/compliance.ts`)

- `riskEvaluations`: AI risk assessments with evidence
- `complianceRules`: configurable rules per firm
- `complianceAlerts`: triggered when rules violated
- `supervisionMetrics`: workload tracking per user

### Endpoints

| Endpoint                                          | Purpose             |
| ------------------------------------------------- | ------------------- |
| `GET /api/compliance/risk-scores`                 | Dashboard view      |
| `GET/POST /api/compliance/risk-scores/[matterId]` | Detail/evaluate     |
| `GET /api/compliance/alerts`                      | List alerts         |
| `PATCH /api/compliance/alerts/[id]`               | Acknowledge/resolve |
| `GET/POST /api/compliance/rules`                  | Manage rules        |
| `GET /api/compliance/supervision`                 | Workload metrics    |
| `GET /api/compliance/reports/weekly`              | Compliance summary  |

### Background Jobs

- `risk-evaluation`: triggered on matter events
- `compliance-scan`: daily check all matters
- `supervision-metrics`: weekly calculation

### Test Strategy

- Unit: schema validation, permission checks
- Integration: rule CRUD, alert lifecycle
- E2E: compliance dashboard journey
