# TASK: Reporting & analytics endpoints

## Goal

Add aggregate endpoints for dashboards and reports (avoid N+1 list composition).

## Scope

- Define report metrics + dimensions (time range, practice area, fee earner, status)
- Add endpoints for:
  - firm summary metrics
  - billing/WIP/aged debt snapshots
  - lead conversion funnel metrics
- Ensure permissions and tenant scoping

## Acceptance Criteria

- Reports UI can load from a documented API contract with stable semantics
- Drilldowns link back to existing list endpoints

## References

- `docs/ideas.md` (Epic 22, 11)

## Design

### Endpoints

| Endpoint                        | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `GET /api/reports/dashboard`    | Firm KPIs (active matters, revenue, WIP, tasks)       |
| `GET /api/reports/billing`      | WIP, aged debt (0-30, 31-60, 61-90, 90+), revenue     |
| `GET /api/reports/funnel`       | Lead conversion by status, rates, avg time-to-convert |
| `GET /api/reports/productivity` | Fee earner hours, utilisation, matter counts          |
| `GET /api/reports/matters`      | Matter summary by status, practice area, risk         |

### Query Parameters

- `from`/`to` (date range)
- `practiceArea` (filter)
- `feeEarnerId` (for productivity)

### Permissions

- `reports:read` - View reports
- `reports:export` - Export data

### Data Sources

- `timeEntries` - WIP, billable hours
- `invoices` - Revenue, aged debt
- `matters` - Status distribution
- `leads` - Funnel metrics

### Test Strategy

- Unit: aggregation logic, query parsing
- Integration: verify against seeded data
- E2E: dashboard load test
