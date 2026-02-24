# TASK: Practice module APIs (conveyancing, litigation bundles, probate)

## Goal

Define and implement the minimal domain APIs needed for Phase 4 module UIs.

## Scope

- Conveyancing workflows (search ordering, milestones, SDLT/LR)
- Litigation bundle assembly (ordering, pagination, index generation)
- Probate estate administration (assets/liabilities, IHT, milestones)

## Acceptance Criteria

- Each module has a documented, testable API surface before UI implementation
- All writes are auditable and approval-gated where high risk

## References

- `docs/ideas.md` (Epics 21, 23, 24)

## Design

### Data Model

Use existing `matters.practiceData` JSONB column for module-specific data.
Types already defined in backend-design.md: `ConveyancingData`, `LitigationData`, `ProbateData`

### Conveyancing Endpoints (`/api/conveyancing/`)

- `POST /searches/order` - Order property searches
- `POST /sdlt/calculate` - Calculate SDLT
- `POST /sdlt/submit` - Submit to HMRC (approval-gated)
- `POST /land-registry/submit` - Submit to LR (approval-gated)
- `PATCH /api/matters/[id]/conveyancing` - Update practice data

### Litigation Endpoints (`/api/litigation/`)

- `POST /bundles` - Create bundle from documents
- `POST /bundles/[id]/generate` - Generate paginated PDF
- `GET /limitation/calculate` - Calculate dates
- `PATCH /api/matters/[id]/litigation` - Update practice data

### Probate Endpoints (`/api/probate/`)

- `POST /iht/calculate` - Calculate IHT
- `GET /forms` - Available probate forms
- `POST /estate-account` - Generate estate account
- `PATCH /api/matters/[id]/probate` - Update practice data

### Test Strategy

- Unit: calculation logic (SDLT, IHT, limitation)
- Integration: CRUD on practice data
- E2E: complete workflows per module
