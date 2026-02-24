# FEAT-us-localization-foundation

## Goal

Remove UK-coupled assumptions from active runtime and contract surfaces to establish a stable US baseline.

## Acceptance Criteria

- [ ] Runtime-critical flows no longer rely on UK-only defaults
- [x] API descriptions/examples updated for US context
- [x] Regression tests passing for touched areas

## Progress Notes

- Completed: `docs/api/openapi.yaml` regenerated after US schema/text updates.
- Completed: client API/UI now supports `postalCode` while preserving `postcode` compatibility.
- Completed: focused unit/integration suites are passing for touched localization surfaces.
- Completed: UK-only calculator endpoints return `410 ENDPOINT_RETIRED` to prevent use in US runtime paths.
- Completed: US replacement endpoints added for transfer-tax and estate-tax estimation.
