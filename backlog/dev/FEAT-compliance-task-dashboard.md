# FEAT: Compliance Task Dashboard

## Summary

Dashboard view showing compliance status of mandatory template tasks across all active matters. Enables supervisors and compliance officers to identify overdue regulatory tasks and take action.

## Depends On

- `task-casetype-templates.md` (task templates with mandatory/category fields)

## User Stories

**As a supervising partner**, I want to see which matters have overdue mandatory tasks so I can intervene before compliance issues arise.

**As a compliance officer**, I want to filter by task category (regulatory vs firm policy) so I can prioritise SRA-critical items.

**As a firm admin**, I want weekly compliance reports emailed to supervisors so issues don't go unnoticed.

---

## Key Features

- Dashboard showing all matters with overdue mandatory tasks
- Filter by: practice area, fee earner, task category, days overdue
- Sort by: severity (days overdue), matter value, client
- Drill-down to matter detail
- Bulk actions: reassign, send reminder, escalate
- Scheduled email reports to supervisors
- Compliance score per fee earner (% mandatory tasks on time)

---

## Scope TBD

- Exact metrics and scoring methodology
- Report frequency and recipients
- Integration with existing reports module
- Audit trail requirements
