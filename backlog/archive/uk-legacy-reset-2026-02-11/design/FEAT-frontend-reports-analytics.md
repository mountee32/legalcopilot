# FEAT: Frontend — Reports & Analytics (MVP)

## Goal

Provide initial reporting pages that are accurate and drillable.

## Scope

- Firm dashboard metrics (WIP, revenue, collections, matters, conversion)
- Basic breakdowns by practice area / fee earner / status
- Export (CSV) if supported

## Dependencies

- **Backend APIs**: Already implemented
  - `/api/reports/dashboard` - firm-wide KPIs
  - `/api/reports/billing` - WIP, aged debt, revenue breakdowns
  - `/api/reports/funnel` - leads pipeline metrics
  - `/api/reports/matters` - matter analytics by practice area
  - `/api/reports/productivity` - fee earner performance

## Acceptance Criteria

- Metrics are sourced from a single, documented API contract
- Users can click through from summary to underlying records

## References

- `docs/frontend-design.md` (Reports & Analytics, Section 10)
- `docs/ideas.md` (Epic 22, 11)

---

## Design

### Architecture

**Page Structure:**

- Main page: `/app/(app)/reports/page.tsx`
- Tab-based layout with 5 views:
  1. Dashboard (overview)
  2. Billing (WIP/aged debt)
  3. Cases (matter analytics)
  4. Productivity (fee earner performance)
  5. Funnel (lead conversion)

**Component Hierarchy:**

```
reports/page.tsx (main container)
├── components/reports/
│   ├── ReportHeader.tsx (period selector, export)
│   ├── MetricCard.tsx (KPI card with trend)
│   ├── ReportChart.tsx (wrapper for chart types)
│   ├── BreakdownTable.tsx (drillable data table)
│   ├── charts/
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── LineChart.tsx
│   │   └── AgedDebtChart.tsx (specialized)
│   └── tabs/
│       ├── DashboardTab.tsx
│       ├── BillingTab.tsx
│       ├── CasesTab.tsx
│       ├── ProductivityTab.tsx
│       └── FunnelTab.tsx
```

### API Integration

All endpoints accept query params:

- `from` (ISO date)
- `to` (ISO date)
- `practiceArea` (optional filter)
- `feeEarnerId` (optional filter)

**Response Schemas:**

- Dashboard: `{ activeMatters, totalRevenue, totalWip, pendingTasks, overdueTasks, outstandingInvoices, overdueDebt }`
- Billing: `{ wip: {...}, agedDebt: {...}, revenue: {...} }`
- Funnel: `{ pipeline stages, conversion rates, avg times }`
- Matters: `{ breakdown by practice area/status }`
- Productivity: `{ per fee earner metrics }`

### UI Features

**Period Selector:**

- Quick filters: "This Week", "This Month", "Last Month", "Quarter", "Year", "Custom"
- Date range picker for custom periods
- Comparison mode: compare with previous period

**Metric Cards:**

- Display: value, trend (+/- %), comparison badge
- Click-through to detailed view
- Color coding: green (good), yellow (warning), red (alert)

**Charts:**

- Use Recharts library (already in frontend stack)
- Interactive: hover tooltips, legend toggle
- Responsive: adapt to mobile/desktop
- Export as image option

**Tables:**

- Sortable columns
- Click row to navigate to entity (matter, client, invoice)
- Export to CSV
- Pagination for large datasets

**Drilldown Pattern:**

- Card/chart click → filtered table view
- Table row click → navigate to entity detail page
- Breadcrumb trail showing filter path

### Data Visualization Strategy

**Dashboard Tab:**

- 4 KPI cards (top row): Active Matters, Revenue MTD, WIP Total, Overdue Debt
- 2 charts: Revenue by Practice Area (pie), Cases by Status (bar)
- Recent Collections table (last 10)

**Billing Tab:**

- WIP breakdown cards: Draft, Submitted, Approved, Total
- Aged debt chart (stacked bar: 0-30, 31-60, 61-90, 90+ days)
- Revenue metrics: Total Billed, Paid, Outstanding
- Drillable invoices table

**Cases Tab:**

- Matter count by practice area (bar chart)
- Matter count by status (pie chart)
- Average matter duration by practice area (line chart)
- Risk score distribution

**Productivity Tab:**

- Fee earner utilization % (horizontal bar chart)
- Time entries by activity code (pie chart)
- Top performers table (hours, revenue, matters)

**Funnel Tab:**

- Pipeline visualization (stages with counts)
- Conversion rate by stage
- Average time in stage
- Lead source breakdown

### State Management

- Use React Query for data fetching, caching
- Local state for filters (period, practice area)
- Sync filters to URL query params for shareable links
- Cache responses for 5 minutes

### Error Handling

- Loading skeletons for all metric cards/charts
- Empty states: "No data for this period"
- Error states: "Failed to load report" with retry
- Graceful degradation: show partial data if some APIs fail

### Accessibility

- Keyboard navigation through tabs, cards, tables
- Screen reader labels on charts (data tables as fallback)
- High contrast mode support
- Focus indicators

### Mobile Considerations

- Stack cards vertically on mobile
- Horizontal scroll for tables
- Touch-friendly chart interactions
- Simplified chart types (bars preferred over complex visualizations)

---

## Implementation Plan

### Phase 1: Foundation (1-2 days)

1. Create page structure with tab navigation
2. Build ReportHeader component (period selector)
3. Build MetricCard component
4. Set up React Query hooks for all 5 API endpoints
5. Add loading/error states

### Phase 2: Dashboard & Billing Tabs (2-3 days)

1. Implement DashboardTab with KPI cards
2. Add revenue pie chart (by practice area)
3. Add cases bar chart (by status)
4. Implement BillingTab with WIP breakdown
5. Add aged debt visualization
6. Add revenue metrics

### Phase 3: Cases & Productivity Tabs (2-3 days)

1. Implement CasesTab with practice area charts
2. Add matter status breakdown
3. Implement ProductivityTab with fee earner charts
4. Add utilization bars
5. Add top performers table

### Phase 4: Funnel & Drilldown (2 days)

1. Implement FunnelTab with pipeline visualization
2. Add conversion rate metrics
3. Implement BreakdownTable with click-through
4. Connect drilldown to entity pages (matters, clients, invoices)

### Phase 5: Polish & Export (1-2 days)

1. Add CSV export functionality
2. Add comparison mode (period-over-period)
3. Add URL query param sync
4. Mobile responsive polish
5. Accessibility audit

---

## Files to Create

### Pages

- `app/(app)/reports/page.tsx` (main reports page - replace empty state)

### Components

- `components/reports/ReportHeader.tsx`
- `components/reports/MetricCard.tsx`
- `components/reports/ReportChart.tsx`
- `components/reports/BreakdownTable.tsx`
- `components/reports/PeriodSelector.tsx`
- `components/reports/ExportButton.tsx`

### Chart Components

- `components/reports/charts/BarChart.tsx`
- `components/reports/charts/PieChart.tsx`
- `components/reports/charts/LineChart.tsx`
- `components/reports/charts/AgedDebtChart.tsx`

### Tab Components

- `components/reports/tabs/DashboardTab.tsx`
- `components/reports/tabs/BillingTab.tsx`
- `components/reports/tabs/CasesTab.tsx`
- `components/reports/tabs/ProductivityTab.tsx`
- `components/reports/tabs/FunnelTab.tsx`

### Hooks

- `lib/hooks/useReportData.ts` (React Query wrapper for all report APIs)
- `lib/hooks/useReportFilters.ts` (period/filter state management)
- `lib/hooks/useReportExport.ts` (CSV export logic)

### Utils

- `lib/utils/reportFormatters.ts` (currency, percentage, trend formatters)
- `lib/utils/chartConfig.ts` (Recharts theme/colors)

### Types

- `types/reports.ts` (TypeScript interfaces for all report data)

---

## Test Strategy

### Unit Tests

- MetricCard: renders value, trend, handles click
- PeriodSelector: date range selection, quick filters
- Chart components: data transformation, empty states
- Formatters: currency, percentage formatting

### Integration Tests

- Full page render with mock API responses
- Tab navigation
- Filter changes trigger API refetch
- Drilldown navigation

### E2E Tests

- Load reports page → verify all tabs render
- Change period → verify data updates
- Click metric card → verify filtered view
- Export to CSV → verify file download
- Click table row → verify navigation to entity

### Test Data

- Use `tests/fixtures/demo-data/` for realistic report data
- Mock API responses with known values for assertions
- Test edge cases: zero data, negative trends, missing fields

---

## Dependencies

**Libraries to Add:**

- `recharts` - charting library (may need to install)
- `date-fns` - date manipulation (already in use)
- `@tanstack/react-query` - data fetching (likely already in use)
- `react-csv` or `papaparse` - CSV export

**Existing Dependencies:**

- shadcn/ui components: Card, Tabs, Button, Select, Badge
- Tailwind CSS for styling
- Lucide icons for visual elements

---

## Open Questions

1. **Chart Library**: Confirm Recharts is preferred (lightweight, good for MVP). Alternative: Chart.js, Victory.
2. **Export Format**: CSV only, or also PDF reports? (MVP: CSV only)
3. **Permissions**: All users with `reports:view` see all data? Or filter by assigned matters?
4. **Real-time Updates**: Polling interval for live data? (MVP: manual refresh)
5. **Caching Strategy**: How long to cache report data? (Proposed: 5 min)

---

## Success Metrics

- Reports page loads in <2s with all data
- Users can drill down from summary to detail in <3 clicks
- Export generates correct CSV in <5s
- Mobile responsive on iPhone SE and up
- Accessibility score 90+ (Lighthouse)
- Zero errors in Sentry for reports page (first week)
